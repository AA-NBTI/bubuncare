'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditGuardian() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';
  
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    relation_to_user: '자녀',
  });

  useEffect(() => {
    async function fetchGuardian() {
      if (isDemo) {
        // [데모용 데이터 주입]
        setFormData({
          name: '데모보호자',
          phone: '010-1234-5678',
          relation_to_user: '자녀',
        });
      } else {
        const { data } = await supabase.from('guardian_profiles').select('*').limit(1).maybeSingle();
        if (data) setFormData(data);
      }
      setLoading(false);
    }
    fetchGuardian();
  }, [isDemo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDemo) {
      alert('데모 버전에서는 저장이 시뮬레이션됩니다.');
      router.push('/demo');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('guardian_profiles').upsert([formData], { onConflict: 'user_id' });
    if (error) alert('오류: ' + error.message);
    else router.push('/dashboard');
    setLoading(false);
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>데이터로딩중</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button onClick={() => router.back()} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>보호자수정</h1>
        {isDemo && <span style={{ background: '#378ADD', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>데모</span>}
      </div>

      <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', border: '1px solid #e1e8ef' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>보호자성함</label>
            <input 
              type="text" required
              style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box' }}
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>연락처</label>
              <input 
                type="text"
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
                <option value="기타">기타</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            style={{ 
              width: '100%', padding: '18px', borderRadius: '14px', 
              background: '#378ADD', color: '#fff', fontWeight: '800', border: 'none',
              fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
            }}
          >
            <Save size={20} /> 보호자수정완료
          </button>
        </form>
      </div>
    </div>
  );
}
