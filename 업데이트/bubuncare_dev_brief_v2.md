# bubuncare.com — 복약·병원 관리 모듈 개발 브리프 v2

**작성자:** 박팀장 (이젠)
**수신:** 안프로 (Antigravity)
**작성일:** 2026-04-10
**도메인:** bubuncare.com
**스택:** Next.js 14 App Router + Supabase + Vercel

---

## 1. 이번 브리프 범위

v1 전체 브리프에서 **복약·병원 관리 모듈**을 우선 구현합니다.
자녀가 부모님의 약 정보를 처음 등록하고, 언제 어느 병원에서 무슨 병으로 어떤 약을 먹는지 한눈에 파악할 수 있는 화면이 목표입니다.

---

## 2. 핵심 UX 흐름 (자녀 기준)

```
부모님 프로필 생성
      ↓
병원 카드 등록 (병원명·진료과·증상·예약일)
      ↓
복약 마스터 등록 (약이름·용량·복용시간·병원 연결·주의메모)
      ↓
대시보드에서 요약 확인
(등록병원 수 / 복용약 수 / 일일복용횟수 / D-day 배지)
```

---

## 3. DB 스키마

### 3-1. care_profiles (부모님 프로필)
```sql
create table care_profiles (
  id uuid primary key default gen_random_uuid(),
  child_user_id uuid references auth.users not null,
  name text not null,
  birth_date date,
  address text,
  photo_url text,
  created_at timestamptz default now()
);
```

### 3-2. hospital_cards (병원 카드) ← v2 항목 추가
```sql
create table hospital_cards (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references care_profiles not null,
  hospital_name text not null,
  department text,
  doctor_name text,
  visit_cycle text,
  next_appointment date,
  main_diagnosis text,        -- ← NEW: 주요 증상·병명 (예: "고혈압, 당뇨 2형")
  pre_visit_check text,       -- ← NEW: 방문 전 준비사항 (예: "공복 혈당·혈압 측정")
  special_notes text,         -- ← NEW: 특이사항 (예: "X-ray 재촬영 예정")
  color_hex text,             -- ← NEW: 병원 식별 컬러 (자동 배정 또는 선택)
  created_at timestamptz default now()
);
```

### 3-3. medications (복약 마스터) ← v2 항목 추가
```sql
create table medications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references care_profiles not null,
  hospital_id uuid references hospital_cards,  -- 병원 연결 FK
  drug_name text not null,
  dosage text,
  morning bool default false,
  afternoon bool default false,
  evening bool default false,
  bedtime bool default false,
  timing_condition text,      -- ← NEW: "식후 30분" / "식사 중" / "식전" / "취침 전" / "증상시만"
  symptom_tag text,           -- ← NEW: 증상 태그 (예: "고혈압", "당뇨", "관절염")
  take_condition text,        -- ← NEW: "상시" / "증상시만" / "기간처방"
  caution_memo text,          -- ← NEW: 주의 메모 (예: "공복 복용 시 속쓰림")
  photo_url text,             -- 약봉투 사진
  created_at timestamptz default now()
);
```

### 3-4. medication_logs (일일 복약 체크 — 케어파트너 기록)
```sql
create table medication_logs (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references visit_records,
  medication_id uuid references medications,
  morning_taken bool,
  afternoon_taken bool,
  evening_taken bool,
  bedtime_taken bool,
  remaining_count int,
  notes text,
  logged_at timestamptz default now()
);
```

### 3-5. notifications (알림)
```sql
create table notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references care_profiles,
  type text check (type in ('med_miss','low_stock','appointment','visit_done')),
  message text,
  sent_at timestamptz default now(),
  read bool default false
);
```

### RLS 정책
```sql
-- care_profiles: 본인만 접근
alter table care_profiles enable row level security;
create policy "owner_only" on care_profiles
  using (child_user_id = auth.uid());

-- hospital_cards: 프로필 소유자만 접근
alter table hospital_cards enable row level security;
create policy "profile_owner" on hospital_cards
  using (profile_id in (
    select id from care_profiles where child_user_id = auth.uid()
  ));

-- medications: 프로필 소유자만 접근
alter table medications enable row level security;
create policy "profile_owner" on medications
  using (profile_id in (
    select id from care_profiles where child_user_id = auth.uid()
  ));
```

---

## 4. 페이지 구조 (이번 브리프 범위)

```
/dashboard                        자녀 대시보드 (요약 카드)
/profile/[id]                     부모님 프로필 상세
/profile/[id]/hospitals           병원 카드 목록 + 등록
/profile/[id]/hospitals/new       병원 카드 신규 등록 폼
/profile/[id]/hospitals/[hid]     병원 카드 수정
/profile/[id]/medications         복약 마스터 목록
/profile/[id]/medications/new     복약 신규 등록 폼
/profile/[id]/medications/[mid]   복약 수정
```

---

## 5. 화면별 구현 스펙

### 5-1. 대시보드 (/dashboard)

**상단 요약 카드 3개 (가로 배열)**
- 등록 병원 수
- 복용 중인 약 수
- 일일 복용 횟수 (아침+점심+저녁+취침 합산)

**병원 D-day 배지**
- 각 병원 카드에 next_appointment 기준 D-day 자동 계산
- D-3 이하: 빨간 배지 / D-7 이하: 주황 배지 / 그 외: 파란 배지

**오늘 복용 일정 요약**
- 아침 / 점심 / 저녁 / 취침 시간대별 복용약 종수 표시

---

### 5-2. 병원 카드 등록 폼 (/profile/[id]/hospitals/new)

**필수 입력 항목**
| 필드 | 타입 | 설명 |
|------|------|------|
| hospital_name | text | 병원명 |
| department | text | 진료과 |
| doctor_name | text | 담당의 |
| main_diagnosis | text | 주요 증상·병명 |
| visit_cycle | select | 매주/격주/매월/필요시 |
| next_appointment | date | 다음 예약일 |
| pre_visit_check | text | 방문 전 준비 (공복측정 등) |
| special_notes | textarea | 특이사항 |
| color_hex | color picker | 병원 식별 컬러 (6가지 중 선택) |

**컬러 선택 옵션 6가지 (고정)**
- #378ADD (파랑)
- #1D9E75 (초록)
- #D85A30 (주황)
- #7F77DD (보라)
- #D4537E (핑크)
- #888780 (회색)

---

### 5-3. 복약 마스터 등록 폼 (/profile/[id]/medications/new)

**필수 입력 항목**
| 필드 | 타입 | 설명 |
|------|------|------|
| drug_name | text | 약 이름 |
| dosage | text | 용량 (예: 5mg, 1정) |
| hospital_id | select | 처방 병원 연결 (등록된 병원 목록) |
| symptom_tag | text | 증상 태그 (예: 고혈압) |
| morning | checkbox | 아침 복용 여부 |
| afternoon | checkbox | 점심 복용 여부 |
| evening | checkbox | 저녁 복용 여부 |
| bedtime | checkbox | 취침 전 복용 여부 |
| timing_condition | select | 식후 30분 / 식사 중 / 식전 / 취침 전 / 증상시만 |
| take_condition | select | 상시 / 증상시만 / 기간처방 |
| caution_memo | textarea | 주의 메모 |
| photo_url | file upload | 약봉투 사진 (Supabase Storage) |

---

### 5-4. 복약 목록 화면 (/profile/[id]/medications)

**표시 요소**
- 약 이름 + 용량
- 증상 태그 배지
- 병원 연결 컬러 도트 (hospital_id → color_hex)
- 복용 타이밍 pill 표시 (아침·점심·저녁·취침 on/off)
- timing_condition 텍스트 (식후 30분 등)
- caution_memo 있을 경우 주황 하이라이트 박스로 표시
- take_condition이 "증상시만"이면 회색 pill로 구분

**정렬 기준**
- 병원별 그룹핑 → 그룹 내 아침약 먼저

---

## 6. 알림 로직 (Supabase Edge Function)

```
매일 오전 8시 cron 실행:
1. next_appointment - today <= 3 → type: 'appointment' 알림 생성
2. 복약 누락 2회 연속 감지 → type: 'med_miss' 알림 생성
3. remaining_count <= 7 → type: 'low_stock' 알림 생성
```

---

## 7. 모바일 우선 UI 가이드

- 케어파트너가 현장 스마트폰으로 사용 → 터치 타겟 최소 44px
- 복약 체크는 큰 체크박스 또는 토글 버튼 사용
- 병원 컬러 도트로 약과 병원 시각적 연결 유지
- caution_memo는 반드시 눈에 띄는 색상 박스로 강조
- 폰트: Noto Sans KR 사용 권장

---

## 8. 개발 순서 권장

1. DB 스키마 생성 + RLS 적용
2. /profile/[id]/hospitals — 병원 카드 CRUD
3. /profile/[id]/medications — 복약 마스터 CRUD (병원 연결 포함)
4. /dashboard — 요약 카드 + D-day 배지 + 오늘 복용 일정
5. 알림 Edge Function

---

## 9. 참고 — 목업 기준 데이터 구조 예시

```json
{
  "hospital": {
    "name": "부산성모병원",
    "department": "내과",
    "main_diagnosis": "고혈압, 당뇨 2형",
    "next_appointment": "2026-04-18",
    "color_hex": "#378ADD",
    "pre_visit_check": "공복 혈당·혈압 측정"
  },
  "medications": [
    {
      "drug_name": "암로디핀",
      "dosage": "5mg 1정",
      "symptom_tag": "고혈압",
      "morning": true,
      "afternoon": false,
      "evening": false,
      "bedtime": false,
      "timing_condition": "식후 30분",
      "take_condition": "상시",
      "caution_memo": null
    },
    {
      "drug_name": "메트포르민",
      "dosage": "500mg 1정",
      "symptom_tag": "당뇨",
      "morning": true,
      "afternoon": true,
      "evening": true,
      "bedtime": false,
      "timing_condition": "식사 중",
      "take_condition": "상시",
      "caution_memo": "공복 복용 시 속쓰림 — 반드시 식사 중 복용"
    }
  ]
}
```

---

## 10. 안프로에게

안녕하세요 안프로, 박팀장입니다.

bubuncare.com 프로젝트 복약·병원 관리 모듈 개발을 시작해주세요.
위 스펙 기준으로 **섹션 3 DB 스키마 → 섹션 5 페이지 구현 → 섹션 6 알림 로직** 순서로 진행 부탁드립니다.

특히 아래 3가지를 반드시 지켜주세요:

1. 병원 카드와 복약 마스터는 반드시 hospital_id FK로 연결 — 색상 도트로 시각적 연결 유지
2. caution_memo 필드는 값이 있을 경우 반드시 주황 하이라이트 박스로 강조 표시
3. 다음 예약일 D-day 배지는 D-3 이하 빨강 / D-7 이하 주황 / 그 외 파랑으로 자동 구분

궁금한 점은 박팀장에게 확인 후 진행해 주세요.
감사합니다.
