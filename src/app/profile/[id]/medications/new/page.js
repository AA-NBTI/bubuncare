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

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const fullText = text.toLowerCase();

  // 약 이름 추출 (한글 약품명 패턴)
  for (const line of lines) {
    // 일반적인 약품명 패턴: 한글+숫자+mg/정/캡슐
    const drugMatch = line.match(/([가-힣a-zA-Z]+(?:\s*\d+\s*)?(?:mg|정|캡슐|ml|g|Tab|Cap)?)/i);
    if (drugMatch && line.length < 40 && !line.includes('병원') && !line.includes('약국') && !line.includes('환자')) {
      if (!result.drug_name && drugMatch[1].length > 1) {
        result.drug_name = drugMatch[1].trim();
      }
    }
  }

  // 용량 추출
  const dosageMatch = text.match(/(\d+\s*mg|\d+\s*ml|\d+\s*g|\d+정|\d+캡슐)/i);
  if (dosageMatch) result.dosage = dosageMatch[1];

  // 복용 시간 파싱
  if (/아침|조식|오전/.test(fullText)) result.morning = true;
  if (/점심|중식|오후/.test(fullText)) result.afternoon = true;
  if (/저녁|석식/.test(fullText)) result.evening = true;
  if (/취침|자기전|잠들기/.test(fullText)) result.bedtime = true;

  // 복용 횟수로 시간 추정 (발견된 시간이 없을 때)
  if (!result.morning && !result.afternoon && !result.evening) {
    if (/1일\s*3회|하루\s*3번/.test(fullText)) {
      result.morning = true;
      result.afternoon = true;
      result.evening = true;
    } else if (/1일\s*2회|하루\s*2번/.test(fullText)) {
      result.morning = true;
      result.evening = true;
    } else if (/1일\s*1회|하루\s*1번/.test(fullText)) {
      result.morning = true;
    }
  }

  // 주의사항
  const cautionMatch = text.match(/주의[사항]*[:\s](.+)/);
  if (cautionMatch) result.caution_memo = cautionMatch[1].trim();

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
  const applyParsedResults = (text) => {
    const parsed = parseMedicationText(text);
    setFormData(prev => ({
      ...prev,
      drug_name: parsed.drug_name || prev.drug_name,
      dosage: parsed.dosage || prev.dosage,
      morning: parsed.morning,
      afternoon: parsed.afternoon,
      evening: parsed.evening,
      bedtime: parsed.bedtime,
      caution_memo: parsed.caution_memo || prev.caution_memo,
      symptom_tag: parsed.symptom_tag || prev.symptom_tag,
    }));
  };

  const resetOcr = () => {
    setOcrState('idle');
    setPreviewUrl(null);
    setOcrText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // 인식된 텍스트가 있다면 메모에 기록으로 남김
    const finalMemo = ocrText 
      ? `[OCR 인식 기록]: ${ocrText.substring(0, 100)}${ocrText.length > 100 ? '...' : ''}\n${formData.caution_memo}`
      : formData.caution_memo;

    const submissionData = { 
      ...formData, 
      caution_memo: finalMemo,
      profile_id: profileId 
    };
    
    if (formData.purchase_type !== 'hospital') delete submissionData.hospital_id;
    const { error } = await supabase.from('medications').insert([submissionData]);
    if (error) alert('저장 실패: ' + error.message);
    else router.push(`/profile/${profileId}/medications`);
    setLoading(false);
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
          <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1.5px solid #c8e6da' }}>
            <div style={{ display: 'flex', gap: '16px', padding: '16px', background: '#f0faf6', borderBottom: '1px solid #c8e6da' }}>
              {previewUrl && (
                <img src={previewUrl} alt="약봉투" style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <CheckCircle size={16} color="#1D9E75" />
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#1D9E75' }}>스캔 완료 — 결과가 다르다면 아래 텍스트를 직접 수정해보세요</span>
                </div>
                <textarea 
                  value={ocrText}
                  onChange={(e) => setOcrText(e.target.value)}
                  style={{ 
                    width: '100%', minHeight: '100px', padding: '12px', borderRadius: '12px', 
                    border: '1.5px solid #c8e6da', fontSize: '13px', color: '#333', 
                    lineHeight: '1.6', background: '#fff', outline: 'none', resize: 'vertical'
                  }}
                />
              </div>
            </div>
            <div style={{ padding: '12px 16px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => applyParsedResults(ocrText)} style={{ background: '#1D9E75', border: 'none', color: '#fff', borderRadius: '8px', padding: '8px 16px', fontWeight: '800', cursor: 'pointer', fontSize: '13px' }}>
                 수정된 내용으로 다시 분석
              </button>
              <button onClick={resetOcr} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid #ddd', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px', color: '#666' }}>
                <X size={14} /> 새로 스캔
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
            <div style={{ display: 'flex', gap: '12px' }}>
              {[{ id: 'hospital', label: '병원 처방' }, { id: 'pharmacy', label: '약국 구매' }, { id: 'online', label: '온라인 구매' }].map(v => (
                <button key={v.id} type="button" onClick={() => setFormData({ ...formData, purchase_type: v.id })} style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid #ddd', background: formData.purchase_type === v.id ? '#1a222d' : '#fff', color: formData.purchase_type === v.id ? '#fff' : '#666', fontWeight: 'bold', cursor: 'pointer' }}>
                  {v.label}
                </button>
              ))}
            </div>
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
