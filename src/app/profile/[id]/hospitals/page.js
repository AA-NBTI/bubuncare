'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Trash2, Hospital, Plus, ChevronDown, ChevronUp, Pill, Activity, Calendar, ReceiptText } from 'lucide-react';
import Link from 'next/link';

export default function HospitalList() {
  const router = useRouter();
  const { id: profileId } = useParams();
  const [loading, setLoading] = useState(true);
  const [hospitals, setHospitals] = useState([]);
  const [meds, setMeds] = useState([]);
  const [expandedHosp, setExpandedHosp] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    // 1. 병원 정보 로드
    const { data: hData } = await supabase.from('hospital_cards').select('*').eq('profile_id', profileId).order('next_appointment', { ascending: true });
    // 2. 관련 약품 정보 로드 (그룹화용)
    const { data: mData } = await supabase.from('medications').select('*').eq('profile_id', profileId);
    
    setHospitals(hData || []);
    setMeds(mData || []);
    if (hData?.length > 0) setExpandedHosp(hData[0].id);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profileId]);

  const handleDelete = async (id, name, e) => {
    e.stopPropagation();
    if (!confirm(`'${name}' 정보를 삭제하시겠습니까?`)) return;
    const { error } = await supabase.from('hospital_cards').delete().eq('id', id);
    if (!error) fetchData();
  };

  const getDDay = (dateStr) => {
    if (!dateStr) return null;
    const diff = Math.ceil((new Date(dateStr) - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
    return diff === 0 ? '오늘 예약' : diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>부모님 병원 데이터 분석 중...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', padding: '10px', borderRadius: '12px', color: '#1D9E75' }}><ArrowLeft size={20} /></button>
          <h1 style={{ fontSize: '20px', fontWeight: '900', margin: 0 }}>기관별 관리 내역</h1>
        </div>
        <button onClick={() => router.push(`/profile/${profileId}/hospitals/new`)} style={{ background: '#1D9E75', color: '#fff', padding: '10px 18px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}><Plus size={18}/> 추가</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {hospitals.length === 0 ? (
          <div style={{ padding: '80px 24px', textAlign: 'center', background: '#fff', borderRadius: '24px', border: '1px dashed #cbd5e1' }}>
            <Hospital size={48} color="#94a3b8" style={{ marginBottom: '16px' }} />
            <div style={{ fontSize: '17px', fontWeight: '800', color: '#1a222d', marginBottom: '8px' }}>병원을 등록해 주세요</div>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>병원과 약물을 연결하면 스마트한 중복 검사와<br/>지출 분석이 시작됩니다.</p>
          </div>
        ) : (
          hospitals.map(h => {
            const hMeds = meds.filter(m => m.hospital_name === h.hospital_name);
            const isExp = expandedHosp === h.id;
            const ddayLabel = getDDay(h.next_appointment);

            return (
              <div key={h.id} style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', transition: 'all 0.2s ease' }}>
                <div onClick={() => setExpandedHosp(isExp ? null : h.id)} style={{ padding: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isExp ? '#F0F9F6' : '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', background: isExp ? '#fff' : '#F0F9F6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Hospital size={20} color="#1D9E75" />
                    </div>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: '#1a1a1a' }}>{h.hospital_name}</div>
                      <div style={{ fontSize: '12px', color: '#888', fontWeight: 'bold' }}>{h.department || '일반진료'} · {h.doctor_name || '원장'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {ddayLabel && <span style={{ fontSize: '11px', fontWeight: '900', padding: '4px 8px', borderRadius: '6px', background: ddayLabel.includes('+') ? '#f1f5f9' : '#fff1f0', color: ddayLabel.includes('+') ? '#64748b' : '#ff4d4f' }}>{ddayLabel}</span>}
                    {isExp ? <ChevronUp size={20} color="#1D9E75"/> : <ChevronDown size={20} color="#ccc"/>}
                  </div>
                </div>

                {isExp && (
                  <div style={{ padding: '0 20px 24px', borderTop: '1px solid #f1f5f9' }}>
                    {/* 데이터 기반 진료 요약 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '16px 0' }}>
                      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Activity size={12}/> 주요 진단</div>
                        <div style={{ fontSize: '14px', fontWeight: '800' }}>{h.main_diagnosis || '일반검진'}</div>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><ReceiptText size={12}/> 본인실부담</div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#1D9E75' }}>{Number(h.visit_cost || 0).toLocaleString()}원</div>
                      </div>
                    </div>

                    {/* 연결된 약물 정보 (고밀도 매핑) */}
                    <div style={{ marginTop: '4px' }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '800', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                         <span>연동된 약품 ({hMeds.length})</span>
                         <button onClick={(e) => handleDelete(h.id, h.hospital_name, e)} style={{ background: 'none', border: 'none', color: '#ff4d4f', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}><Trash2 size={12}/> 기록삭제</button>
                      </div>
                      {hMeds.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {hMeds.map(m => (
                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '8px 12px', borderRadius: '10px' }}>
                              <Pill size={14} color="#378ADD" />
                              <span style={{ fontSize: '13px', fontWeight: '800', color: '#1a222d' }}>{m.drug_name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: '#cbd5e1', padding: '10px', textAlign: 'center', border: '1px dashed #e2e8f0', borderRadius: '10px' }}>이 병원에서 처방받은 약물이 없습니다.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
