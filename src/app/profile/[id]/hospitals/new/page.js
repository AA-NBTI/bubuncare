'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Hospital, Wallet, Calendar } from 'lucide-react';

export default function NewHospital() {
  const router = useRouter();
  const { id: profileId } = useParams();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    hospital_name: '',
    department: '',
    doctor_name: '',
    main_diagnosis: '',
    visit_cycle: '1개월',
    next_appointment: '',
    pre_visit_check: '',
    special_notes: '',
    color_hex: '#378ADD',
    visit_cost: '',
    last_visit_date: new Date().toISOString().split('T')[0]
  });

  const colors = [
    { name: 'Blue', hex: '#378ADD' },
    { name: 'Red', hex: '#D85A30' },
    { name: 'Green', hex: '#1D9E75' },
    { name: 'Purple', hex: '#8B5CF6' },
    { name: 'Orange', hex: '#F59E0B' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('hospital_cards')
      .insert([{ ...formData, profile_id: profileId }]);

    if (error) {
      alert('저장 실패: ' + error.message);
    } else {
      router.push(`/profile/${profileId}/hospitals`);
    }
    setLoading(false);
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>새 병원 카드 등록</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>병원 이름 *</label>
          <input 
            type="text" required placeholder="병원 이름을 입력하세요"
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
            value={formData.hospital_name}
            onChange={(e) => setFormData({...formData, hospital_name: e.target.value})}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>진료과 *</label>
            <input 
              type="text" required placeholder="예: 내과, 정형외과"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>담당의</label>
            <input 
              type="text" placeholder="담당의 성함"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
              value={formData.doctor_name}
              onChange={(e) => setFormData({...formData, doctor_name: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>다음 예약일 *</label>
          <input 
            type="date" required
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
            value={formData.next_appointment}
            onChange={(e) => setFormData({...formData, next_appointment: e.target.value})}
          />
        </div>

        <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '12px', display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
              <Wallet size={16} /> 진료비
            </label>
            <input 
              type="number" placeholder="회당 진료비"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
              value={formData.visit_cost}
              onChange={(e) => setFormData({...formData, visit_cost: e.target.value})}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
              <Calendar size={16} /> 최근 진료일
            </label>
            <input 
              type="date"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
              value={formData.last_visit_date}
              onChange={(e) => setFormData({...formData, last_visit_date: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '8px' }}>식별 컬러 (도트 구분)</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {colors.map(c => (
              <button
                key={c.hex} type="button"
                onClick={() => setFormData({...formData, color_hex: c.hex})}
                style={{ 
                  width: '32px', height: '32px', borderRadius: '50%', backgroundColor: c.hex,
                  border: formData.color_hex === c.hex ? '3px solid #000' : 'none'
                }}
              />
            ))}
          </div>
        </div>

        <button 
          type="submit" disabled={loading}
          style={{ 
            width: '100%', padding: '18px', borderRadius: '12px', 
            background: '#1a1a1a', color: '#fff', fontWeight: '700', border: 'none'
          }}
        >
          {loading ? '저장 중...' : '병원 카드 및 진료비 저장'}
        </button>
      </form>
    </div>
  );
}
