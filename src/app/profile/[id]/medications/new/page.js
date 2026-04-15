'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Pill, Wallet, Calendar, PlusCircle } from 'lucide-react';

export default function NewMedication() {
  const router = useRouter();
  const { id: profileId } = useParams();
  const [loading, setLoading] = useState(false);
  const [hospitals, setHospitals] = useState([]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const submissionData = { ...formData, profile_id: profileId };
    if (formData.purchase_type !== 'hospital') delete submissionData.hospital_id;
    const { error } = await supabase.from('medications').insert([submissionData]);
    if (error) alert('저장 실패: ' + error.message);
    else router.push(`/profile/${profileId}/medications`);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button onClick={() => router.back()} style={{ background: '#fff', border: '1px solid #e1e8ef', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#666' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>복약 정보 등록</h1>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e1e8ef', borderRadius: '20px', padding: '40px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>약 이름 *</label>
              <input type="text" required placeholder="품명 입력" style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box' }} value={formData.drug_name} onChange={(e) => setFormData({...formData, drug_name: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>구매일 *</label>
              <input type="date" style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box' }} value={formData.purchase_date} onChange={(e) => setFormData({...formData, purchase_date: e.target.value})} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>복용 시간 설정 *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {['morning', 'afternoon', 'evening', 'bedtime'].map(time => (
                <label key={time} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', border: '1px solid #ddd', borderRadius: '12px', cursor: 'pointer', background: formData[time] ? '#eef3ff' : '#fff', border: formData[time] ? '1.5px solid #378ADD' : '1px solid #ddd' }}>
                  <input type="checkbox" checked={formData[time]} onChange={(e) => setFormData({...formData, [time]: e.target.checked})} />
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{time === 'morning' ? '아침' : time === 'afternoon' ? '점심' : time === 'evening' ? '저녁' : '취침전'}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>구매 경로</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[{ id: 'hospital', label: '병원 처방' }, { id: 'pharmacy', label: '약국 구매' }, { id: 'online', label: '온라인 구매' }].map(v => (
                <button key={v.id} type="button" onClick={() => setFormData({...formData, purchase_type: v.id})} style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid #ddd', background: formData.purchase_type === v.id ? '#1a222d' : '#fff', color: formData.purchase_type === v.id ? '#fff' : '#666', fontWeight: 'bold', cursor: 'pointer' }}>{v.label}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>금액 (원)</label>
              <input type="number" placeholder="지출 비용" style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box' }} value={formData.cost} onChange={(e) => setFormData({...formData, cost: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>증상 태그</label>
              <input type="text" placeholder="고혈압, 영양제 등" style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box' }} value={formData.symptom_tag} onChange={(e) => setFormData({...formData, symptom_tag: e.target.value})} />
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
