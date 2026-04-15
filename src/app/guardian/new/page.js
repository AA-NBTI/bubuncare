'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, Save, ArrowLeft, UserCircle } from 'lucide-react';

export default function NewGuardian() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    relation_to_user: '자녀',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('guardian_profiles')
      .insert([formData]);

    if (error) {
      alert('등록 오류: ' + error.message);
    } else {
      alert('보호자 등록 완료');
      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ width: '64px', height: '64px', background: '#F0F7FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#378ADD' }}>
          <ShieldCheck size={36} />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px' }}>보호자 등록</h1>
        <p style={{ color: '#666', fontSize: '15px' }}>위급 상황 및 건강 상태 모니터링을 위한<br/>보호자 정보를 등록해 주세요.</p>
      </div>

      <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', border: '1px solid #e1e8ef' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>보호자 성함</label>
            <input 
              type="text" required
              style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box' }}
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>보호자 연락처</label>
            <input 
              type="text" required
              style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box' }}
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>관계</label>
            <select 
              style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', background: '#fff' }}
              value={formData.relation_to_user}
              onChange={(e) => setFormData({...formData, relation_to_user: e.target.value})}
            >
              <option value="자녀">자녀</option>
              <option value="배우자">배우자</option>
              <option value="사회복지사">사회복지사</option>
              <option value="기타">기타</option>
            </select>
          </div>

          <button 
            type="submit" disabled={loading}
            style={{ 
              width: '100%', padding: '18px', borderRadius: '14px', 
              background: '#378ADD', color: '#fff', fontWeight: '800', border: 'none',
              fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              marginTop: '10px'
            }}
          >
            <Save size={20} /> {loading ? '등록 중' : '보호자 등록 완료'}
          </button>
        </form>
      </div>
    </div>
  );
}
