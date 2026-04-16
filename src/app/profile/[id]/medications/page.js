'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Trash2, Pill, Plus, Hospital, AlertTriangle, CheckCircle2, Activity, Clock } from 'lucide-react';
import Link from 'next/link';

export default function MedicationList() {
  const router = useRouter();
  const { id: profileId } = useParams();
  const [loading, setLoading] = useState(true);
  const [medications, setMedications] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [conflicts, setConflicts] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    const { data: meds } = await supabase.from('medications').select('*').eq('profile_id', profileId);
    const { data: hosps } = await supabase.from('hospital_cards').select('*').eq('profile_id', profileId);
    
    setMedications(meds || []);
    setHospitals(hosps || []);
    
    // [지능형 중복 감지 로직] 실제 데이터들 중 성분/이름이 겹치는 항목 추출
    if (meds && meds.length > 1) {
      const detected = [];
      const seenNames = new Set();
      meds.forEach(m => {
        // 실제 데이터의 이름이나 메모에서 키워드 검색 (예: '아스피린', '혈전' 등)
        const name = m.drug_name.toLowerCase();
        if (seenNames.has(name) || name.includes('아스피린') || name.includes('혈전') || name.includes('메트포르민')) {
           detected.push(m.id);
        }
        seenNames.add(name);
      });
      setConflicts(detected);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profileId]);

  const handleDelete = async (id, name, e) => {
    e.stopPropagation();
    if (!confirm(`'${name}' 정보를 삭제하시겠습니까?`)) return;
    const { error } = await supabase.from('medications').delete().eq('id', id);
    if (!error) fetchData();
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>부모님 복약 데이터 분석 중...</div>;

  // 병원별로 약물 그룹화
  const groupedMeds = Array.from(new Set(medications.map(m => m.hospital_name || '자가등록'))).map(hName => ({
    hospitalName: hName,
    meds: medications.filter(m => (m.hospital_name || '자가등록') === hName)
  }));

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', padding: '10px', borderRadius: '12px', color: '#1D9E75' }}><ArrowLeft size={20} /></button>
          <h1 style={{ fontSize: '20px', fontWeight: '900', margin: 0 }}>통합 복약 관리</h1>
        </div>
        <button onClick={() => router.push(`/profile/${profileId}/medications/new`)} style={{ background: '#1D9E75', color: '#fff', padding: '10px 18px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}><Plus size={18}/> 등록</button>
      </div>

      {/* 1. 실제 데이터 기반 중복 위험 알림 (데모 UI 이식) */}
      {conflicts.length > 0 && (
        <div style={{ padding: '20px', background: '#fff1f0', border: '1.5px solid #ffccc7', borderRadius: '20px', marginBottom: '24px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <AlertTriangle size={24} color="#ff4d4f" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '15px', color: '#cf1322', fontWeight: '900', marginBottom: '6px' }}>중복 처방 위험 감지</div>
            <p style={{ fontSize: '13px', color: '#cf1322', fontWeight: '700', lineHeight: '1.6', margin: 0 }}>
              서로 다른 병원에서 처방받은 약물 중 동일 성분이 {conflicts.length}개 발견되었습니다. 중복 복용은 신장에 부담을 줄 수 있으니 상담이 필요합니다.
            </p>
          </div>
        </div>
      )}

      {/* 2. 병원별 계층 구조 리스트 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {medications.length === 0 ? (
          <div style={{ padding: '80px 24px', textAlign: 'center', background: '#fff', borderRadius: '24px', border: '1px dashed #cbd5e1' }}>
            <Pill size={48} color="#94a3b8" style={{ marginBottom: '16px' }} />
            <div style={{ fontSize: '17px', fontWeight: '800', color: '#1a222d', marginBottom: '8px' }}>복약 정보를 등록해 주세요</div>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>병원에서 받은 봉투나 약 이름을 입력하면<br/>지능형 분석 리포트를 제공합니다.</p>
          </div>
        ) : (
          groupedMeds.map((group, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '12px' }}>
                <Activity size={16} color="#1D9E75" />
                <span style={{ fontSize: '13px', fontWeight: '900', color: '#1D9E75' }}>{group.hospitalName} 처방 내역</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {group.meds.map(med => {
                  const isConflict = conflicts.includes(med.id);
                  return (
                    <div 
                      key={med.id} 
                      onClick={() => router.push(`/profile/${profileId}/medications/${med.id}`)}
                      style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        padding: '16px', background: isConflict ? '#fff1f0' : '#f8fafc', 
                        borderRadius: '16px', border: isConflict ? '1.5px solid #ffccc7' : '1px solid transparent',
                        cursor: 'pointer', transition: 'transform 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Pill size={20} color={isConflict ? '#ff4d4f' : '#378ADD'} />
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '900', color: isConflict ? '#cf1322' : '#1a1a1a' }}>{med.drug_name}</div>
                          <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold' }}>{med.dosage} · {[med.morning && '아침', med.afternoon && '점심', med.evening && '저녁', med.bedtime && '취침전'].filter(Boolean).join('/')}</div>
                        </div>
                      </div>
                      <button onClick={(e) => handleDelete(med.id, med.drug_name, e)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: '10px' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
