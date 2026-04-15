'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditProfile() {
  const router = useRouter();
  const { id: profileId } = useParams();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true' || profileId === 'demo-id';
  
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    birth_date: '',
    main_condition: '',
  });

  useEffect(() => {
    async function fetchProfile() {
      if (isDemo) {
        // [데모용 데이터 주입]
        setFormData({
          name: '이순자',
          relationship: '어머님',
          birth_date: '520512',
          main_condition: '고혈압, 당뇨, 초기 백내장 관리 중',
        });
      } else {
        const { data } = await supabase.from('care_profiles').select('*').eq('id', profileId).single();
        if (data) {
          setFormData({
            name: data.name || '',
            relationship: data.relationship || '',
            birth_date: data.birth_date || '',
            main_condition: data.main_condition || '',
          });
        }
      }
      setLoading(false);
    }
    fetchProfile();
  }, [isDemo, profileId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDemo) {
      alert('데모 버전에서는 이용자 정보수정이 시뮬레이션됩니다.');
      router.push('/demo');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('care_profiles').update(formData).eq('id', profileId);
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
        <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>이용자수정</h1>
        {isDemo && <span style={{ background: '#1D9E75', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>데모</span>}
      </div>

      <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', border: '1px solid #e1e8ef' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>이용자성함</label>
            <input 
              type="text" required
              style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box' }}
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>관계</label>
              <input 
                type="text"
                style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                value={formData.relationship}
                onChange={(e) => setFormData({...formData, relationship: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>생년월일(6자리)</label>
              <input 
                type="text" maxLength={6} placeholder="예: 550101"
                style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                value={formData.birth_date}
                onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>주요병력</label>
            <textarea 
              style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', minHeight: '100px', boxSizing: 'border-box' }}
              value={formData.main_condition}
              onChange={(e) => setFormData({...formData, main_condition: e.target.value})}
            />
          </div>

          <button 
            type="submit" disabled={loading}
            style={{ 
              width: '100%', padding: '18px', borderRadius: '14px', 
              background: '#1D9E75', color: '#fff', fontWeight: '800', border: 'none',
              fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
            }}
          >
            <Save size={20} /> 이용자수정완료
          </button>
        </form>
      </div>
    </div>
  );
}
