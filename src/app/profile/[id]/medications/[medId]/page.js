'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Pill, Save, Trash2, Hospital, Clock, Tag, FileText, AlertCircle } from 'lucide-react';

export default function MedicationDetail() {
  const router = useRouter();
  const { id: profileId, medId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // 1. 복약 상세 정보 로드
      const { data: med, error } = await supabase
        .from('medications')
        .select('*')
        .eq('id', medId)
        .single();
      
      if (error) {
        console.error('Error fetching medication:', error);
        alert('정보를 불러올 수 없습니다.');
        router.push(`/profile/${profileId}/medications`);
        return;
      }

      setFormData(med);

      // 2. 선택 가능한 병원 목록 로드
      const { data: hosps } = await supabase
        .from('hospital_cards')
        .select('id, hospital_name')
        .eq('profile_id', profileId);
      
      setHospitals(hosps || []);
      setLoading(false);
    }
    fetchData();
  }, [profileId, medId, router]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const submissionData = {
      ...formData,
      cost: formData.cost === '' ? null : parseInt(formData.cost, 10),
      hospital_id: formData.hospital_id === '' ? null : formData.hospital_id
    };

    if (formData.purchase_type !== 'hospital') {
      submissionData.hospital_id = null;
    }

    const { error } = await supabase
      .from('medications')
      .update(submissionData)
      .eq('id', medId);

    if (error) {
      alert('수정 실패: ' + error.message);
    } else {
      alert('정보가 수정되었습니다.');
      router.push(`/profile/${profileId}/medications`);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('medications').delete().eq('id', medId);
    if (!error) {
      router.push(`/profile/${profileId}/medications`);
    } else {
      alert('삭제 실패: ' + error.message);
    }
  };

  if (loading || !formData) return <div style={{ padding: '2rem', textAlign: 'center' }}>데이터 로드 중...</div>;

  const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '15px',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#475569',
    marginBottom: '8px'
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.back()} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', padding: '10px', borderRadius: '12px', color: '#64748b' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: '900', margin: 0 }}>복약 상세 정보</h1>
        </div>
        <button onClick={handleDelete} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
          삭제
        </button>
      </div>

      <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 기본 정보 */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}><Pill size={16} /> 약 이름</label>
            <input 
              type="text" required value={formData.drug_name} 
              style={inputStyle} onChange={(e) => setFormData({ ...formData, drug_name: e.target.value })} 
            />
          </div>
          <div>
            <label style={labelStyle}><Tag size={16} /> 용량 (예: 500mg, 1정)</label>
            <input 
              type="text" value={formData.dosage || ''} 
              style={inputStyle} onChange={(e) => setFormData({ ...formData, dosage: e.target.value })} 
            />
          </div>
        </div>

        {/* 복용 시간 */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
          <label style={labelStyle}><Clock size={16} /> 복용 시간</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '12px' }}>
            {[
              { id: 'morning', label: '아침' },
              { id: 'afternoon', label: '점심' },
              { id: 'evening', label: '저녁' },
              { id: 'bedtime', label: '취침전' }
            ].map(time => (
              <label key={time.id} style={{ 
                display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', borderRadius: '16px', 
                border: formData[time.id] ? '2px solid #378ADD' : '1px solid #e2e8f0', 
                background: formData[time.id] ? '#f0f7ff' : '#fff', cursor: 'pointer'
              }}>
                <input 
                  type="checkbox" checked={formData[time.id]} 
                  onChange={(e) => setFormData({ ...formData, [time.id]: e.target.checked })} 
                />
                <span style={{ fontSize: '14px', fontWeight: '700', color: formData[time.id] ? '#378ADD' : '#64748b' }}>{time.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 구매 정보 */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>구매 경로</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['hospital', 'pharmacy', 'online'].map(type => (
                <button 
                  key={type} type="button" 
                  onClick={() => setFormData({ ...formData, purchase_type: type })}
                  style={{ 
                    flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0',
                    background: formData.purchase_type === type ? '#1e293b' : '#fff',
                    color: formData.purchase_type === type ? '#fff' : '#64748b',
                    fontWeight: '700', fontSize: '13px', cursor: 'pointer'
                  }}
                >
                  {type === 'hospital' ? '병원' : type === 'pharmacy' ? '약국' : '기타'}
                </button>
              ))}
            </div>
          </div>

          {formData.purchase_type === 'hospital' && (
            <div>
              <label style={labelStyle}><Hospital size={16} /> 연결된 병원</label>
              <select 
                style={inputStyle} value={formData.hospital_id || ''} 
                onChange={(e) => setFormData({ ...formData, hospital_id: e.target.value })}
              >
                <option value="">연결된 병원 없음</option>
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>{h.hospital_name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={labelStyle}>지출 금액 (원)</label>
            <input 
              type="number" value={formData.cost || ''} 
              style={inputStyle} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} 
            />
          </div>
        </div>

        {/* 기타 메모 */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}><FileText size={16} /> 주의사항 및 메모</label>
            <textarea 
              style={{ ...inputStyle, minHeight: '100px', resize: 'none' }} 
              value={formData.caution_memo || ''} 
              onChange={(e) => setFormData({ ...formData, caution_memo: e.target.value })}
            />
          </div>
        </div>

        {/* OCR 기록 안내 (읽기 전용 스타일) */}
        {formData.caution_memo && formData.caution_memo.includes('[OCR 인식 기록]') && (
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: '#64748b', marginBottom: '8px' }}>
              <AlertCircle size={14} /> 스캔 인식 기록
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>
              최초 스캔 시 인식된 텍스트 데이터가 메모 하단에 포함되어 있습니다.
            </p>
          </div>
        )}

        <button 
          type="submit" disabled={saving}
          style={{ 
            width: '100%', padding: '20px', borderRadius: '16px', 
            background: '#1D9E75', color: '#fff', fontWeight: '900', border: 'none',
            fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: '0 4px 12px rgba(29, 158, 117, 0.2)'
          }}
        >
          <Save size={20} /> {saving ? '저장 중...' : '상세 정보 수정 완료'}
        </button>
      </form>
    </div>
  );
}
