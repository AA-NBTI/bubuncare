'use client';
import { useState, useEffect } from 'react';
import { Pill, Hospital, Calendar, Bell, ChevronDown, ChevronUp, TrendingUp, Wallet, Activity, Clock, CheckCircle2, Heart, BarChart3, PieChart, ArrowLeft, MapPin, ReceiptText, ShieldAlert, AlertTriangle, Coins, Zap, ArrowDownCircle, Target, Sparkles, FileText, Database, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function DemoDashboard() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'dashboard';
  const [loading, setLoading] = useState(true);
  const [expandedHospital, setExpandedHospital] = useState('서울내과');

  // --- [복구 완료] 13건의 풍부한 실무형 데이터셋 ---
  const hierarchicalExpenses = [
    {
      id: 'h1', hospital: '서울내과', total: 125400, local_avg: 135000,
      details: [
        { date: '2026.04.15', condition: '고혈압/당뇨', detail: '정기검진 및 혈액검사', cost: 15400, type: '급여', nhis: 35900 },
        { date: '2026.03.15', condition: '고혈압', detail: '정밀 초음파', cost: 42000, type: '급여', nhis: 98000 },
        { date: '2026.02.10', condition: '당뇨관리', detail: '반기 집중 점검', cost: 68000, type: '급여', nhis: 154000 },
      ]
    },
    {
      id: 'h2', hospital: '밝은안과', total: 42800, local_avg: 45000,
      details: [
        { date: '2026.04.22', condition: '경증 백내장', detail: '안압 체크 및 약물 처방', cost: 12800, type: '급여', nhis: 29000 },
        { date: '2026.01.15', condition: '결막염', detail: '세균성 감염 치료', cost: 30000, type: '비급여', nhis: 0 },
      ]
    },
    {
      id: 'h3', hospital: '우리정형외과', total: 115000, local_avg: 128000,
      details: [
        { date: '2026.05.10', condition: '퇴행성 관절염', detail: '물리치료 및 약침', cost: 45000, type: '비급여', nhis: 15000 },
        { date: '2026.04.28', condition: '손목 염좌', detail: 'X-ray 및 고정치료', cost: 35000, type: '급여', nhis: 42000 },
        { date: '2026.03.05', condition: '퇴행성 관절염', detail: '통증 완화 주사', cost: 35000, type: '비급여', nhis: 0 },
      ]
    },
    {
      id: 'h4', hospital: '행복치과', total: 85000, local_avg: 92000,
      details: [
        { date: '2026.02.20', condition: '잇몸 질환', detail: '스케일링 및 잇몸 치료', cost: 25000, type: '급여', nhis: 45000 },
        { date: '2026.01.10', condition: '충치 관리', detail: '정기 레진 치료', cost: 60000, type: '비급여', nhis: 0 },
      ]
    },
    {
      id: 'h5', hospital: '종로온누리약국', total: 54000, local_avg: 60000,
      details: [
        { date: '2026.04.15', condition: '처방조제', detail: '내과 처방전 조제', cost: 18500, type: '급여', nhis: 42000 },
        { date: '2026.03.15', condition: '처방조제', detail: '내과 처방전 조제', cost: 18500, type: '급여', nhis: 42000 },
        { date: '2026.02.10', condition: '처방조제', detail: '내과 처방전 조제', cost: 17000, type: '급여', nhis: 38000 },
      ]
    }
  ];

  const hierarchicalMeds = [
    { hospital: '서울내과', condition: '고혈압/당뇨', meds: [{ n: '아모디핀 5mg', t: '아침', d: '1정' }, { n: '다이아벡스정', t: '저녁', d: '1정' }, { n: '아스피린Pro', t: '아침', d: '1정', w: true }] },
    { hospital: '밝은안과', condition: '혈류관리', meds: [{ n: '혈턴 방지제', t: '아침', d: '1정', w: true }, { n: '히알룸프레쉬', t: '수시', d: '점안' }] },
    { hospital: '우리정형외과', condition: '통증완화', meds: [{ n: '쎄레브렉스', t: '아침/저녁', d: '1정' }, { n: '무코스타 (위점막)', t: '아침/저녁', d: '1정' }] },
  ];

  useEffect(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 300);
  }, [tab]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>데이터를 정밀 복구 중...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0', boxSizing: 'border-box' }}>
      
      {/* --- 1. 대시보드 홈 (12개 데이터 기반 통계) --- */}
      {tab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>복약 준수율</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#1D9E75' }}>98.2%</div>
            </div>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>최근 3개월 지출</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#1a1a1a' }}>21.6만</div>
            </div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #085041 100%)', padding: '24px', borderRadius: '24px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
             <ShieldCheck size={80} style={{ position: 'absolute', bottom: '-15px', right: '-10px', opacity: 0.1 }} />
             <h3 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Sparkles size={18}/> 스마트 케어 종합 진단</h3>
             <p style={{ fontSize: '14px', lineHeight: '1.6', opacity: 0.9, margin: 0 }}>현재 관리 중인 13건의 의료 기록 중 10건이 정부 지원 혜택을 받고 있습니다. 분석 결과, 지역 평균 대비 약 12%의 비용 절감 효과를 거두고 계십니다.</p>
          </div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '800', margin: '0 0 12px 0', color: '#64748b' }}>최근 핵심 행동 알림</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px' }}>
                <div style={{ width: '8px', height: '8px', background: '#378ADD', borderRadius: '50%' }}></div>
                <span>정형외과 진료비가 지역평균보다 <span style={{ fontWeight: '800', color: '#378ADD' }}>1.3만원 절감</span>되었습니다.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px' }}>
                <div style={{ width: '8px', height: '8px', background: '#EF4444', borderRadius: '50%' }}></div>
                <span>복약 매칭 결과 2개의 약물이 <span style={{ fontWeight: '800', color: '#EF4444' }}>중복 처방</span> 위험이 있습니다.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 2. 진료/지출 통합 리스트 --- */}
      {(tab === 'hospitals' || tab === 'costs') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {hierarchicalExpenses.map(h => (
            <div key={h.id} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div 
                onClick={() => setExpandedHospital(expandedHospital === h.hospital ? '' : h.hospital)}
                style={{ cursor: 'pointer', padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedHospital === h.hospital ? '#F0F9F6' : '#fff' }}
              >
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Hospital size={18} color="#1D9E75"/> {h.hospital}
                  </div>
                  {tab === 'costs' && (
                    <div style={{ fontSize: '11px', color: '#059669', fontWeight: '800', marginTop: '4px' }}>
                      지역 평균 대비 합리적 지출 수준 유지 중
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: '900' }}>{h.total.toLocaleString()}원</div>
                    <div style={{ fontSize: '10px', color: '#999' }}>{h.details.length}건의 기록</div>
                  </div>
                  {expandedHospital === h.hospital ? <ChevronUp size={20} color="#1D9E75"/> : <ChevronDown size={20} color="#ccc"/>}
                </div>
              </div>
              
              {expandedHospital === h.hospital && (
                <div style={{ padding: '0 18px 18px', borderTop: '1px solid #f1f5f9' }}>
                  {h.details.map((d, i) => (
                    <div key={i} style={{ padding: '16px 0', borderBottom: i === h.details.length - 1 ? 'none' : '1px solid #f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b' }}>{d.date}</span>
                          <span style={{ fontSize: '14px', fontWeight: '900' }}>{d.condition}</span>
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: '900' }}>{d.cost.toLocaleString()}원</div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>{d.detail}</div>
                      {tab === 'costs' && (
                        <div>
                          <div style={{ height: '6px', background: '#eee', borderRadius: '3px', overflow: 'hidden', display: 'flex', marginBottom: '6px' }}>
                            <div style={{ width: `${(d.nhis / (d.nhis + d.cost)) * 100}%`, background: '#378ADD' }}></div>
                            <div style={{ width: `${(d.cost / (d.nhis + d.cost)) * 100}%`, background: '#1D9E75' }}></div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>
                            <span>공단지원 ₩{d.nhis.toLocaleString()}</span>
                            <span style={{ color: '#1D9E75' }}>실부담 ₩{d.cost.toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* --- 3. 복약관리 리포트 --- */}
      {tab === 'medications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '16px', background: '#fff1f0', border: '1.5px solid #ffccc7', borderRadius: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <AlertTriangle size={24} color="#ff4d4f" />
            <div style={{ fontSize: '13px', color: '#cf1322', fontWeight: '800', lineHeight: '1.5' }}>
              [중복 처방 주의] '서울내과'와 '밝은안과'에서 처방된 약물 중 성분이 겹치는 항목이 감지되었습니다.
            </div>
          </div>
          {hierarchicalMeds.map((g, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: '900', color: '#1D9E75', marginBottom: '16px', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={14}/> {g.hospital} | {g.condition}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {g.meds.map((m, mi) => (
                  <div key={mi} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: m.w ? '#fff1f0' : '#f8fafc', borderRadius: '12px', border: m.w ? '1px solid #ffccc7' : '1px solid transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Pill size={18} color={m.w ? '#ff4d4f' : '#378ADD'} />
                      <div style={{ fontSize: '15px', fontWeight: '900', color: m.w ? '#cf1322' : '#1a1a1a' }}>{m.n}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>{m.d} · <span style={{ color: '#1D9E75' }}>{m.t}</span></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div style={{ marginTop: '40px' }}>
        <Link href="/signup" style={{ display: 'block', width: '100%', padding: '16px', background: '#1D9E75', color: '#fff', borderRadius: '16px', textDecoration: 'none', fontWeight: '900', textAlign: 'center', fontSize: '15px', boxShadow: '0 4px 12px rgba(29, 158, 117, 0.2)' }}>
          지금 바로 우리 가족 데이터로 체험하기
        </Link>
      </div>
    </div>
  );
}
