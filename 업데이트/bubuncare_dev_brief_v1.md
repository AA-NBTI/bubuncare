# 케어노트 (CareNote) — 개발 브리프 v1.0

**작성자:** 박팀장 (이젠)  
**수신:** 안프로 (Antigravity)  
**작성일:** 2026-04-10  
**스택:** Next.js 14 + Supabase + Vercel

---

## 1. 서비스 개요

**서비스명:** 케어노트 (CareNote)  
**도메인:** carenote.kr (예정)  
**한 줄 정의:** 방문 케어 매니저가 노인 부모님의 생활 상태를 체크하고, 자녀에게 리포트로 전달하는 구독형 부분케어 플랫폼

**핵심 가치:**
- 매주 2~3회 방문 / 회당 1~2시간 부분 집중 케어
- 방문 시 체크리스트 기록 → 자녀 앱 리포트 자동 전송
- 요양원은 아직 이른 40~55세 자녀 세대 타겟
- 완전 요양보호가 아닌 "부분 집중 케어 + 데이터화" 차별화 모델

---

## 2. 사용자 구조 (3개 역할)

| 역할 | 설명 | 주요 기능 |
|------|------|----------|
| **Admin** | 박팀장 운영 계정 | 전체 관리, 케어파트너 승인, 통계 |
| **케어파트너** | 방문 케어 매니저 | 체크리스트 작성, 방문 인증, 특이사항 기록 |
| **자녀(보호자)** | 서비스 구독 결제자 | 리포트 열람, 부모 정보 등록, 알림 수신 |

---

## 3. 핵심 기능 목록

### 3-1. 부모님 프로필 등록 (자녀가 최초 등록)
- 기본정보: 이름, 생년월일, 주소, 사진
- 병원 등록 카드 (다중): 병원명, 진료과, 담당의, 진료주기, 다음예약일
- 복약 마스터 테이블: 약이름, 용량, 복용시간(아침/점심/저녁/취침전), 식전후, 담당병원

### 3-2. 방문 체크리스트 (케어파트너 작성)
총 10개 카테고리, 앱에서 항목별 체크 후 제출

**카테고리:**
1. 신체 상태 (혈압, 체온, 산소포화도, 부종, 피부, 보행, 낙상흔적)
2. 식사·영양 (끼니여부, 식사량, 냉장고상태, 수분섭취)
3. 복약 관리 (잔량확인, 복용여부, 보관상태, 재방문필요)
4. 위생·청결 (세면, 구강, 의복, 기저귀)
5. 주거 환경 (청소항목, 환기, 온습도, 낙상위험, 가스전기)
6. 정서·인지 (표정, 대화반응, 날짜인지, 외로움표현)
7. 사회·활동 (외출여부, 가족연락, 일상활동)
8. 안전 (현관잠금, 화재감지기, 비상연락처, 응급약품)
9. 케어 완료 항목 (청소구역, 식사준비내용, 빨래, 심부름)
10. 종합 소견 (전반상태 신호등 3단계, 자녀전달메모, 차회중점, 연계필요)

**필수 10개 고정 + 선택항목 구조로 UX 설계**

### 3-3. 자녀 리포트 자동 생성
- 방문 완료 시 자동 푸시알림 + 리포트 생성
- 신호등 요약 (좋음🟢 / 주의🟡 / 위험🔴)
- 복약 누락 2회 연속 → 즉시 알림
- 약 잔량 7일치 이하 → 구매 알림
- 병원 예약일 3일 전 → 예약 알림
- 월간 트렌드 그래프 (수면, 식사, 외출 빈도)

### 3-4. 방문 인증
- 케어파트너 GPS 인증 (실제 방문 여부 자동 기록)
- 사진 타임스탬프 (냉장고 내부, 식사량, 주거상태 주 1회)
- 방문 시작/종료 시각 자동 기록

### 3-5. 구독 티어 (자녀 결제)

| 티어 | 방문횟수 | 월 요금(예시) |
|------|---------|-------------|
| Basic | 월 8회 | 150,000원 |
| Standard | 월 12회 | 200,000원 |
| Premium | 월 16회 | 250,000원 |

---

## 4. DB 스키마 (Supabase)

```sql
-- 부모님 프로필
create table care_profiles (
  id uuid primary key default gen_random_uuid(),
  child_user_id uuid references auth.users,
  name text not null,
  birth_date date,
  address text,
  photo_url text,
  created_at timestamptz default now()
);

-- 병원 카드
create table hospital_cards (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references care_profiles,
  hospital_name text,
  department text,
  doctor_name text,
  visit_cycle text,
  next_appointment date,
  notes text
);

-- 복약 마스터
create table medications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references care_profiles,
  hospital_id uuid references hospital_cards,
  drug_name text,
  dosage text,
  morning bool default false,
  afternoon bool default false,
  evening bool default false,
  bedtime bool default false,
  before_meal bool default false,
  notes text
);

-- 방문 기록
create table visit_records (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references care_profiles,
  partner_id uuid references auth.users,
  visited_at timestamptz,
  gps_lat float,
  gps_lng float,
  duration_minutes int,
  overall_status text check (overall_status in ('good','caution','danger')),
  notes text,
  created_at timestamptz default now()
);

-- 체크리스트 항목
create table checklist_items (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references visit_records,
  category text,
  item_key text,
  item_value text,
  checked bool default false
);

-- 복약 일일 체크
create table medication_logs (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references visit_records,
  medication_id uuid references medications,
  morning_taken bool,
  afternoon_taken bool,
  evening_taken bool,
  bedtime_taken bool,
  remaining_count int,
  notes text
);

-- 알림 로그
create table notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references care_profiles,
  type text, -- 'med_miss' | 'low_stock' | 'appointment' | 'visit_done'
  message text,
  sent_at timestamptz default now(),
  read bool default false
);
```

---

## 5. 페이지 구조

```
/                          → 랜딩 페이지
/login                     → 로그인 (자녀/케어파트너 구분)
/dashboard                 → 자녀 대시보드 (부모 상태 요약)
/profile/[id]              → 부모님 프로필 상세
/profile/[id]/hospitals    → 병원 카드 관리
/profile/[id]/medications  → 복약 마스터 관리
/profile/[id]/reports      → 방문 리포트 목록
/profile/[id]/reports/[vid]→ 방문 리포트 상세
/partner                   → 케어파트너 대시보드
/partner/visit/[id]        → 방문 체크리스트 작성
/partner/visit/[id]/done   → 방문 완료 처리
/admin                     → 어드민 관리자
```

---

## 6. 개발 우선순위

**MVP (1순위):**
1. 부모님 프로필 등록 (자녀)
2. 복약 마스터 + 병원카드 등록
3. 방문 체크리스트 작성 (케어파트너)
4. 자녀 리포트 자동 생성
5. 복약 누락 알림

**2차:**
1. GPS 방문 인증
2. 사진 업로드 (Supabase Storage)
3. 월간 트렌드 그래프
4. 구독 결제 연동 (포트원 or 토스페이먼츠)

---

## 7. 개발 프롬프트 (안프로 전달용)

---

### [안프로에게]

안녕하세요 안프로, 박팀장입니다.

새 프로젝트 **케어노트(CareNote)** MVP 개발을 시작해주세요.
스택은 기존과 동일하게 **Next.js 14 App Router + Supabase + Vercel** 로 진행합니다.

---

**1단계: DB 스키마 생성**

위 스키마 6개 테이블을 Supabase에 생성해 주세요.
- care_profiles
- hospital_cards
- medications
- visit_records
- checklist_items
- medication_logs
- notifications

각 테이블에 RLS 정책 적용:
- care_profiles: child_user_id = auth.uid() 본인만 조회/수정
- visit_records: partner_id = auth.uid() 인 케어파트너 + profile의 child_user_id 자녀 조회 가능
- 나머지 테이블: 상위 테이블 owner 기준 접근 제어

---

**2단계: 페이지 생성 순서**

아래 순서로 페이지를 구현해 주세요.

1. `/profile/[id]/medications` — 복약 마스터 CRUD
   - 약이름, 용량, 아침/점심/저녁/취침전 체크박스, 식전/식후 선택, 담당병원 연결
   - 약봉투 사진 업로드 필드 포함 (OCR은 2차)

2. `/profile/[id]/hospitals` — 병원 카드 CRUD
   - 병원명, 진료과, 담당의, 진료주기, 다음예약일, 메모

3. `/partner/visit/[id]` — 방문 체크리스트 작성 페이지
   - 10개 카테고리 섹션별 accordion UI
   - 필수 항목 10개는 항상 표시, 나머지 선택 항목 토글
   - 종합소견: 신호등(good/caution/danger) 선택 + 자유 메모
   - 제출 시 visit_records + checklist_items 동시 저장

4. `/dashboard` — 자녀 대시보드
   - 부모님 오늘 상태 신호등 카드
   - 최근 방문 리포트 3개 미리보기
   - 복약 오늘 현황
   - 다음 병원 예약일 D-day

5. `/profile/[id]/reports/[vid]` — 방문 리포트 상세
   - 카테고리별 체크결과 표시
   - 케어파트너 메모 표시
   - 복약 로그 표시

---

**3단계: 알림 로직**

Supabase Edge Function 또는 cron으로:
- 복약 2회 연속 누락 감지 → notifications 테이블 insert
- 병원 예약일 3일 전 → notifications insert
- 약 잔량 7일치 이하 → notifications insert

---

**참고사항:**
- 체크리스트 카테고리/항목 목록은 별도 seed 데이터로 관리
- 신호등 3단계: `good` / `caution` / `danger`
- 모바일 우선 UI (케어파트너가 현장에서 스마트폰으로 작성)
- 색상 포인트: 케어·헬스 느낌의 민트/그린 계열 권장

궁금한 점은 박팀장에게 확인 후 진행해 주세요.
감사합니다.
