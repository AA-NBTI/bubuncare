'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Pill, PlusCircle, Camera, ScanLine, X, CheckCircle, Loader } from 'lucide-react';

// 약봉투 OCR 텍스트 파싱 함수
function parseMedicationText(text) {
  const result = {
    drug_name: '',
    dosage: '',
    morning: false,
    afternoon: false,
    evening: false,
    bedtime: false,
    caution_memo: '',
    symptom_tag: '',
  };

  if (!text) return result;

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const fullText = text.toLowerCase();

  // 1. 약 이름 추출 (한국 약봉투 전용 로직 강화)
  const drugKeywords = ['약품명', '제품명', '처방의약품', '약　명', '처방약'];
  
  for (const line of lines) {
    if (result.drug_name) break;
    
    // 키워드 기반 추출 (예: "약품명: 타이레놀 500mg")
    for (const kw of drugKeywords) {
      if (line.includes(kw)) {
        const cleaned = line.split(kw)[1].replace(/[:：\s]/g, '').trim();
        // 단위가 포함된 패턴으로 다시 매칭
        const match = cleaned.match(/^([가-힣a-zA-Z0-9\s]+(?:\d+(?:mg|정|캡슐|ml|g|Tab|Cap|알)))/i);
        if (match) {
          result.drug_name = match[1];
        } else if (cleaned.length >= 2 && cleaned.length <= 15) {
          result.drug_name = cleaned;
        }
        break;
      }
    }

    if (result.drug_name) break;

    // 불필요한 라인 스킵
    if (/병원|약국|환자|성명|일자|주소|전화|처방|복용|횟수|보험|금액/.test(line)) continue;

    // 패턴 1: 한글/영문 + 단위(mg, 정, 알...)
    const drugMatch = line.match(/^([가-힣a-zA-Z\s0-9]+(?:\d+(?:mg|정|캡슐|ml|g|Tab|Cap|알|캡)))/i);
    if (drugMatch) {
      result.drug_name = drugMatch[1].trim();
      continue;
    }

    // 패턴 2: 특정 단어 형태 (2-12자 한글/영문)
    if (line.length >= 2 && line.length <= 12 && /^[가-힣a-zA-Z0-9\s]+$/.test(line)) {
      // 숫자가 너무 많으면 제외
      if ((line.match(/\d/g) || []).length < 5) {
        result.drug_name = line;
      }
    }
  }

  // 2. 용량 추출 (다양한 단위 추가)
  const dosageMatch = text.match(/(\d+\s*(?:mg|ml|g|정|캡슐|알|ea|tab|cap))/i);
  if (dosageMatch) result.dosage = dosageMatch[1];

  // 3. 복용 시간 파싱 (키워드 확장)
  if (/아침|조식|오전|상(?!태)|매일\s*아침/.test(fullText)) result.morning = true;
  if (/점심|중식|오후|중(?!앙)/.test(fullText)) result.afternoon = true;
  if (/저녁|석식|하(?!루)/.test(fullText)) result.evening = true;
  if (/취침|자기전|잠들기|취(?!수)/.test(fullText)) result.bedtime = true;

  // 4. 복용 횟수로 시간 추정
  const timeChecked = result.morning || result.afternoon || result.evening || result.bedtime;
  if (!timeChecked) {
    if (/1일\s*3회|하루\s*3번|3x1|t\.i\.d/i.test(fullText)) {
      result.morning = true; result.afternoon = true; result.evening = true;
    } else if (/1일\s*2회|하루\s*2번|2x1|b\.i\.d/i.test(fullText)) {
      result.morning = true; result.evening = true;
    } else if (/1일\s*1회|하루\s*1번|1x1|q\.d/i.test(fullText)) {
      result.morning = true;
    }
  }

  // 5. 주의사항 및 태그
  const cautionMatch = text.match(/(?:주의|메모|참고)[:\s]*(.+)/);
  if (cautionMatch) result.caution_memo = cautionMatch[1].trim();
  
  const symptomMatch = text.match(/(?:증상|목적)[:\s]*(.+)/);
  if (symptomMatch) result.symptom_tag = symptomMatch[1].trim();

  return result;
}

export default function NewMedication() {
  const router = useRouter();
  const { id: profileId } = useParams();
  const [loading, setLoading] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [ocrState, setOcrState] = useState('idle'); // idle | scanning | done | error
  const [ocrText, setOcrText] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function fetchHospitals() {
      const { data } = await supabase.from('hospital_cards').select('id, hospital_name').eq('profile_id', profileId);
      if (data) setHospitals(data);
    }
    fetchHospitals();
  }, [profileId]);

  const [formData, setFormData] = useState({
    drug_name: '',
    morning: false,
    afternoon: false,
    evening: false,
    bedtime: false,
    caution_memo: '',
    purchase_type: 'hospital',
    hospital_id: '',
    dosage: '',
    symptom_tag: '',
    cost: '',
    purchase_date: new Date().toISOString().split('T')[0]
  });

  // OCR 실행
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setOcrState('scanning');
    setOcrText('엔진 초기화 중...');

    try {
      // Tesseract.js v7 권장 로직
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('kor+eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrText(`글자 분석 중... (${Math.round(m.progress * 100)}%)`);
          }
        },
      });

      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      if (!text || text.trim().length < 5) {
        throw new Error('인식된 텍스트가 너무 적습니다.');
      }

      setOcrText(text);
      setOcrState('done');

      // 파싱 결과를 폼에 자동 입력
      applyParsedResults(text);

    } catch (err) {
      console.error('OCR Error:', err);
      setOcrState('error');
    }
  };

  // 분석 결과 적용 로직 (재사용 가능하게 분리)
    if (!parsed.drug_name) {
       console.log('Name not found in OCR, keeping previous or empty');
    }

    setFormData(prev => ({
      ...prev,
      ...updates,
      morning: parsed.morning,
      afternoon: parsed.afternoon,
      evening: parsed.evening,
      bedtime: parsed.bedtime,
    }));

    // 살짝 알림 표시
    if (!parsed.drug_name) {
      alert("약 이름을 찾지 못했습니다. 수동으로 입력해 주세요.");
    } else {
      alert(`복약 정보 분석 완료: ${parsed.drug_name}`);
    }
  };

  const resetOcr = () => {
    setOcrState('idle');
    setPreviewUrl(null);
    setOcrText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.drug_name) {
      alert('약 이름을 입력해 주세요.');
      return;
    }

    setLoading(true);
    
    // 인식된 텍스트가 있다면 메모에 기록으로 남김
    const finalMemo = ocrText 
      ? `[OCR 인식 기록]: ${ocrText.substring(0, 100)}${ocrText.length > 100 ? '...' : ''}\n${formData.caution_memo}`
      : formData.caution_memo;

    // 데이터 타입 정제
    const cleanCost = String(formData.cost).replace(/,/g, '');
    const submissionData = { 
      ...formData, 
      caution_memo: finalMemo,
      profile_id: profileId,
      // 숫자로 변환 (빈 문자열이면 null)
      cost: cleanCost === '' ? null : parseInt(cleanCost, 10),
      // 빈 문자열인 hospital_id는 null로 처리
      hospital_id: formData.hospital_id === '' ? null : formData.hospital_id
    };
    
    // 병원 처방이 아니거나 병원이 선택되지 않은 경우 hospital_id 제거/null
    if (formData.purchase_type !== 'hospital') {
      submissionData.hospital_id = null;
    }

    try {
      console.log('Submitting Data:', submissionData);
      const { data, error } = await supabase.from('medications').insert([submissionData]).select();
      
      if (error) {
        console.error('Supabase Insert Error Detail:', error);
        throw new Error(error.message || '데이터베이스 저장 실패');
      }
      
      console.log('Insert Success:', data);
      router.push(`/profile/${profileId}/medications`);
    } catch (err) {
      console.error('Save Error:', err);
      alert('저장 실패: ' + (err.message || '알 수 없는 오류가 발생했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    border: '1px solid #ddd',
    boxSizing: 'border-box',
    fontSize: '15px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '700',
    marginBottom: '10px',
    color: '#1a222d',
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button onClick={() => router.back()} style={{ background: '#fff', border: '1px solid #e1e8ef', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#666' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>복약 정보 등록</h1>
      </div>

      {/* OCR 스캔 영역 */}
      <div style={{ background: '#fff', border: '1px solid #e1e8ef', borderRadius: '20px', padding: '28px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <ScanLine size={20} color="#1D9E75" />
          <span style={{ fontSize: '16px', fontWeight: '800', color: '#1a222d' }}>약봉투 자동 스캔 (OCR)</span>
          <span style={{ fontSize: '12px', background: '#e8f5f0', color: '#1D9E75', padding: '3px 10px', borderRadius: '20px', fontWeight: '700' }}>BETA</span>
        </div>

        {ocrState === 'idle' && (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed #c8e6da',
              borderRadius: '16px',
              padding: '40px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: '#f8fffe',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#edfaf5'}
            onMouseLeave={e => e.currentTarget.style.background = '#f8fffe'}
          >
            <Camera size={40} color="#1D9E75" style={{ marginBottom: '12px' }} />
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#1a222d', marginBottom: '6px' }}>약봉투 사진 선택하기</div>
            <div style={{ fontSize: '13px', color: '#888' }}>직접 촬영하거나 앨범에서 선택하세요</div>
            <div style={{ fontSize: '12px', color: '#aaa', marginTop: '8px' }}>선명한 사진일수록 정확하게 인식됩니다</div>
          </div>
        )}

        {ocrState === 'scanning' && (
          <div style={{ border: '2px solid #eef3ff', borderRadius: '16px', padding: '40px 24px', textAlign: 'center', background: '#f8faff' }}>
            {previewUrl && (
              <img src={previewUrl} alt="약봉투" style={{ maxHeight: '160px', borderRadius: '10px', marginBottom: '20px', objectFit: 'contain' }} />
            )}
            <Loader size={32} color="#378ADD" style={{ marginBottom: '12px', animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#378ADD' }}>약봉투 분석 중...</div>
            <div style={{ fontSize: '13px', color: '#888', marginTop: '6px' }}>한국어 텍스트를 인식하고 있습니다</div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {ocrState === 'done' && (
          <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1.5px solid #e2e8f0', background: '#fff' }}>
            {/* 1. 상단: 원본 사진 영역 */}
            <div style={{ background: '#f8fafc', padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Camera size={14} /> 원본 사진 (대조용)
              </div>
              {previewUrl && (
                <div style={{ width: '100%', maxHeight: '250px', overflow: 'hidden', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <img src={previewUrl} alt="원본" style={{ width: '100%', height: 'auto', display: 'block' }} />
                </div>
              )}
            </div>

            {/* 2. 하단: 인식된 텍스트 편집 영역 */}
            <div style={{ padding: '20px', background: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <CheckCircle size={18} color="#1D9E75" />
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#1a222d' }}>실시간 인식 데이터</span>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px', lineHeight: '1.5' }}>
                사진 속 글자와 다른 부분이 있다면 아래 박스에서 직접 수정해 주세요.
              </p>
              <textarea 
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                style={{ 
                  width: '100%', minHeight: '120px', padding: '16px', borderRadius: '16px', 
                  border: '1.5px solid #1D9E75', fontSize: '14px', color: '#1a222d', 
                  lineHeight: '1.6', background: '#f8fffe', outline: 'none', resize: 'vertical',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                }}
              />
            </div>

            {/* 3. 액션 버튼 영역 */}
            <div style={{ padding: '16px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                onClick={() => applyParsedResults(ocrText)} 
                style={{ 
                  background: '#1D9E75', border: 'none', color: '#fff', borderRadius: '10px', 
                  padding: '12px 20px', fontWeight: '800', cursor: 'pointer', fontSize: '14px',
                  boxShadow: '0 4px 10px rgba(29, 158, 117, 0.2)'
                }}
              >
                 수정 내용으로 폼 자동입력
              </button>
              <button onClick={resetOcr} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '11px 16px', cursor: 'pointer', fontSize: '14px', color: '#64748b', fontWeight: '700' }}>
                <X size={16} /> 새로 스캔
              </button>
            </div>
          </div>
        )}

        {ocrState === 'error' && (
          <div style={{ border: '1.5px solid #ffccc7', borderRadius: '16px', padding: '20px', background: '#fff1f0', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#cf1322', marginBottom: '8px' }}>인식에 실패했습니다</div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>이미지가 선명한지 확인하고 다시 시도해주세요.</div>
            <button onClick={resetOcr} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px' }}>
              다시 시도
            </button>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
      </div>

      {/* 등록 폼 */}
      <div style={{ background: '#fff', border: '1px solid #e1e8ef', borderRadius: '20px', padding: '40px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={labelStyle}>약 이름 *</label>
              <input type="text" required placeholder="품명 입력" style={inputStyle} value={formData.drug_name} onChange={(e) => setFormData({ ...formData, drug_name: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>구매일 *</label>
              <input type="date" style={inputStyle} value={formData.purchase_date} onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>복용 시간 설정 *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {['morning', 'afternoon', 'evening', 'bedtime'].map(time => (
                <label key={time} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', borderRadius: '12px', cursor: 'pointer', background: formData[time] ? '#eef3ff' : '#fff', border: formData[time] ? '1.5px solid #378ADD' : '1px solid #ddd' }}>
                  <input type="checkbox" checked={formData[time]} onChange={(e) => setFormData({ ...formData, [time]: e.target.checked })} />
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>
                    {time === 'morning' ? '아침' : time === 'afternoon' ? '점심' : time === 'evening' ? '저녁' : '취침전'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>구매 경로</label>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              {[{ id: 'hospital', label: '병원 처방' }, { id: 'pharmacy', label: '약국 구매' }, { id: 'online', label: '온라인 구매' }].map(v => (
                <button key={v.id} type="button" onClick={() => setFormData({ ...formData, purchase_type: v.id })} style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid #ddd', background: formData.purchase_type === v.id ? '#1a222d' : '#fff', color: formData.purchase_type === v.id ? '#fff' : '#666', fontWeight: 'bold', cursor: 'pointer' }}>
                  {v.label}
                </button>
              ))}
            </div>
            
            {formData.purchase_type === 'hospital' && (
              <div style={{ marginTop: '12px', padding: '16px', background: '#f8faff', borderRadius: '12px', border: '1px solid #eef3ff' }}>
                <label style={{ ...labelStyle, fontSize: '13px', color: '#378ADD' }}>연결할 병원 선택</label>
                {hospitals.length > 0 ? (
                  <select 
                    style={inputStyle} 
                    value={formData.hospital_id} 
                    onChange={(e) => setFormData({ ...formData, hospital_id: e.target.value })}
                  >
                    <option value="">병원을 선택해 주세요 (선택 사항)</option>
                    {hospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.hospital_name}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    등록된 병원이 없습니다. <br/>
                    <button type="button" onClick={() => router.push(`/profile/${profileId}/hospitals/new`)} style={{ color: '#378ADD', background: 'none', border: 'none', padding: 0, fontWeight: '700', cursor: 'pointer', marginTop: '5px' }}>
                      + 병원 먼저 등록하기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={labelStyle}>용량</label>
              <input type="text" placeholder="예: 500mg, 1정" style={inputStyle} value={formData.dosage} onChange={(e) => setFormData({ ...formData, dosage: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>금액 (원)</label>
              <input type="number" placeholder="지출 비용" style={inputStyle} value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={labelStyle}>증상 태그</label>
              <input type="text" placeholder="고혈압, 영양제 등" style={inputStyle} value={formData.symptom_tag} onChange={(e) => setFormData({ ...formData, symptom_tag: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>주의사항 메모</label>
              <input type="text" placeholder="식후 30분, 금주 등" style={inputStyle} value={formData.caution_memo} onChange={(e) => setFormData({ ...formData, caution_memo: e.target.value })} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '20px', borderRadius: '12px', background: '#378ADD', color: '#fff', fontWeight: '800', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '16px' }}>
            <PlusCircle size={20} /> {loading ? '처리 중...' : '복약 정보 시스템 저장'}
          </button>
        </form>
      </div>
    </div>
  );
}
