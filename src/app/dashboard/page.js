'use client';
import { useState, useEffect } from 'react';
import { Pill, Hospital, Calendar, Bell, ChevronDown, ChevronUp, TrendingUp, Wallet, Activity, Clock, CheckCircle2, Heart, BarChart3, PieChart, ArrowLeft, MapPin, ReceiptText, ShieldAlert, AlertTriangle, Coins, Zap, ArrowDownCircle, Target, Sparkles, FileText, Database, ShieldCheck, Settings, UserPlus, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [medications, setMedications] = useState([]);
  const [expandedHospital, setExpandedHospital] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      setLoading(true);
      localStorage.setItem('isLoggedIn', 'true');
      
      const { data: { session } } = await supabase.auth.getSession();
      // 1. 프로필 로드
      const { data: profileData } = await supabase.from('care_profiles').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
      
      if (profileData) {
        setProfile(profileData);
        // 2. 병원 및 약물 데이터 로드
        const { data: hospData } = await supabase.from('hospital_cards').select('*').eq('profile_id', profileData.id);
        const { data: medData } = await supabase.from('medications').select('*').eq('profile_id', profileData.id);
        
        setHospitals(hospData || []);
        setMedications(medData || []);
        if (hospData?.length > 0) setExpandedHospital(hospData[0].hospital_name);
      }
      setLoading(false);
    };

    checkAuthAndFetch();
  }, [router]);

  // --- 실제 데이터 기반 통계 계산 ---
  const totalCost = () => {
    const mCost = medications.reduce((acc, cur) => acc + Number(cur.cost || 0), 0);
    const hCost = hospitals.reduce((acc, cur) => acc + Number(cur.visit_cost || 0), 0);
    return mCost + hCost;
  };

  const timeSlots = [
    { label: '아침', key: 'morning', color: '#1D9E75' },
    { label: '점심', key: 'afternoon', color: '#378ADD' },
    { label: '저녁', key: 'evening', color: '#F59E0B' },
    { label: '취침전', key: 'bedtime', color: '#8B5CF6' }
  ];

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{profile?.name || '부모님'} 데이터 분석 중...</div>;
  
  if (!profile) return (
    <div style={{ padding: '40px', background: '#fff', borderRadius: '32px', border: '1px solid #e1e8ef', textAlign: 'center' }}>
      <div style={{ width: '80px', height: '80px', background: '#F0F9F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
        <UserPlus size={40} color="#1D9E75" />
      </div>
      <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '16px' }}>첫 이용자 등록</h2>
      <p style={{ color: '#666', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto 40px' }}>의료 정보의 자산화를 시작해 보세요. 병원과 약물을 등록하면 데모에서 보신 스마트 통계를 즉시 제공합니다.</p>
      <Link href="/profile/new" style={{ display: 'inline-flex', padding: '20px 48px', background: '#1D9E75', color: '#fff', borderRadius: '16px', fontWeight: '800', textDecoration: 'none', fontSize: '18px' }}>등록하기</Link>
    </div>
  );

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. 상단 타이틀 & 행동 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '900', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {profile.name} 건강 분석 <Link href={`/profile/${profile.id}/edit`} style={{ color: '#ccc' }}><Settings size={18}/></Link>
          </h2>
          <p style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>실시간으로 업데이트되는 데이터입니다.</p>
        </div>
        <Link href={`/profile/${profile.id}/medications/new`} style={{ padding: '12px 20px', background: '#1D9E75', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontWeight: '800', fontSize: '14px' }}>+ 정보 추가</Link>
      </div>

      {/* 2. 통계 요약 카드 (데모 UI 이식) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>실부담 지출액</div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#1a1a1a' }}>{(totalCost() / 10000).toFixed(1)}만</div>
        </div>
        <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>연결된 전문기관</div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#1D9E75' }}>{hospitals.length}소</div>
        </div>
      </div>

      {/* 3. 스마트 케어 종합 리포트 (데이터 기반 생성) */}
      <div style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #085041 100%)', padding: '24px', borderRadius: '24px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <ShieldCheck size={80} style={{ position: 'absolute', bottom: '-20px', right: '-10px', opacity: 0.1 }} />
        <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Sparkles size={20}/> 지능형 통합 리포트</h3>
        <p style={{ fontSize: '14px', lineHeight: '1.6', opacity: 0.9, margin: 0 }}>
          {hospitals.length > 0 ? (
            `${profile.name}님은 현재 ${hospitals.length}개의 전문 의료기관과 연결되어 있습니다. ${medications.length}종의 약물 데이터를 분석한 결과, 계층화된 정보 관리가 원활히 이루어지고 있습니다.`
          ) : (
             "아직 등록된 병원 정보가 없습니다. 병원 방문 기록이나 처방전을 등록하시면 이곳에서 모바일 최적화 분석을 시작합니다."
          )}
        </p>
      </div>

      {/* 4. 시간대별 복약 현황 (간소화) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {timeSlots.map(slot => {
          const list = medications.filter(m => m[slot.key]);
          return (
            <div key={slot.key} onClick={() => list.length > 0 && setSelectedTime({ ...slot, list })} style={{ background: '#fff', padding: '16px 8px', borderRadius: '16px', border: list.length > 0 ? `2px solid ${slot.color}` : '1px solid #eee', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: list.length > 0 ? slot.color : '#999', marginBottom: '4px' }}>{slot.label}</div>
              <div style={{ fontSize: '18px', fontWeight: '900' }}>{list.length}종</div>
            </div>
          );
        })}
      </div>

      {/* 5. 실제 계층형 병원관리 리스트 (데모 UI 이식) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>기관별 관리 내역</h3>
          <Link href={`/profile/${profile.id}/hospitals`} style={{ fontSize: '12px', color: '#1D9E75', textDecoration: 'none', fontWeight: '800' }}>전체 분석 보기</Link>
        </div>
        
        {hospitals.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', borderRadius: '20px', border: '1px dashed #ccc', color: '#999', fontSize: '14px' }}>첫 번째 병원 정보를 등록해 주세요.</div>
        ) : (
          hospitals.map(h => {
             const hMeds = medications.filter(m => m.hospital_name === h.hospital_name);
             const isExpanded = expandedHospital === h.hospital_name;
             return (
              <div key={h.id} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div onClick={() => setExpandedHospital(isExpanded ? null : h.hospital_name)} style={{ padding: '18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isExpanded ? '#F0F9F6' : '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Hospital size={18} color="#1D9E75" />
                    <span style={{ fontSize: '15px', fontWeight: '900' }}>{h.hospital_name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#378ADD' }}>{Number(h.visit_cost || 0).toLocaleString()}원</span>
                    {isExpanded ? <ChevronUp size={18} color="#1D9E75"/> : <ChevronDown size={18} color="#ccc"/>}
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ padding: '0 18px 18px', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ padding: '16px 0', borderBottom: hMeds.length > 0 ? '1px solid #f8fafc' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b' }}>최근 진료</span>
                        <span style={{ fontSize: '13px', fontWeight: '900' }}>{h.diagnosis || '정기검진'}</span>
                      </div>
                      <div style={{ height: '6px', background: '#eee', borderRadius: '3px', overflow: 'hidden', display: 'flex', marginBottom: '4px' }}>
                         <div style={{ width: '70%', background: '#378ADD' }}></div>
                         <div style={{ width: '30%', background: '#1D9E75' }}></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>
                        <span>공단지원비 포함</span>
                        <span style={{ color: '#1D9E75' }}>실부담 {Number(h.visit_cost || 0).toLocaleString()}원</span>
                      </div>
                    </div>
                    {hMeds.length > 0 && (
                      <div style={{ paddingTop: '12px' }}>
                        <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '8px' }}>처방 약물 {hMeds.length}종</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {hMeds.map(m => (
                            <span 
                              key={m.id} 
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/profile/${profile.id}/medications/${m.id}`);
                              }}
                              style={{ 
                                background: '#f1f5f9', padding: '6px 12px', borderRadius: '10px', 
                                fontSize: '12px', fontWeight: '700', color: '#1a222d',
                                cursor: 'pointer', border: '1px solid #e2e8f0'
                              }}
                            >
                              {m.drug_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
             );
          })
        )}
      </div>

      {/* 6. 시간대별 복약 팝업 (실데이터 매핑) */}
      {selectedTime && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedTime(null)}>
          <div style={{ width: '90%', maxWidth: '400px', background: '#fff', borderRadius: '24px', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{selectedTime.label} 복용 목록</h3>
              <button onClick={() => setSelectedTime(null)} style={{ background: 'none', border: 'none', color: '#999' }}><X size={24}/></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '60vh', overflowY: 'auto' }}>
              {selectedTime.list.map(m => (
                <div 
                  key={m.id} 
                  onClick={() => router.push(`/profile/${profile.id}/medications/${m.id}`)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', 
                    background: '#f8fafc', borderRadius: '16px', cursor: 'pointer',
                    border: '1px solid transparent', transition: 'border-color 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = selectedTime.color}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                >
                  <Pill size={20} color={selectedTime.color} />
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '900' }}>{m.drug_name}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{m.dosage} · {m.hospital_name || '자가등록'}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedTime(null)} style={{ width: '100%', marginTop: '24px', padding: '18px', borderRadius: '16px', background: '#1D9E75', color: '#fff', fontWeight: '900', border: 'none' }}>확인 완료</button>
          </div>
        </div>
      )}
    </div>
  );
}
