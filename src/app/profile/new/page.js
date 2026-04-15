'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';

export default function NewProfile() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    relationship: '어머님',
    birth_date: '',
    main_condition: '',
  });

  const fillDemoData = () => {
    setFormData({
      name: '김말순',
      relationship: '어머님',
      birth_date: '541015',
      main_condition: '당뇨 조절 중, 무릎 관절염 치료 이력 있음',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDemo) {
      alert('데모 저장 완료! 새로운 이용자가 가상의 리스트에 추가되었습니다.');
      router.push('/demo');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('care_profiles').insert([{ ...formData, child_user_id: 'c3b8a1e2-0000-0000-0000-000000000000' }]);
    if (error) alert('오류: ' + error.message);
    else router.push('/dashboard');
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.back()} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: '800' }}>이용자등록</h1>
        </div>
        {isDemo && (
          <button onClick={fillDemoData} style={{ background: '#F0F9F6', color: '#1D9E75', border: '1px solid #1D9E75', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} /> 데모데이터 채우기
          </button>
        )}
      </div>

      <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', border: '1px solid #e1e8ef' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>이용자성함</label>
            <input 
              type="text" required placeholder="성함입력"
              style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box' }}
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>관계</label>
              <select 
                style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', background: '#fff' }}
                value={formData.relationship}
                onChange={(e) => setFormData({...formData, relationship: e.target.value})}
              >
                <option value="어머님">어머님</option>
                <option value="아버님">아버님</option>
                <option value="기타">기타</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>생년월일(6자리)</label>
              <input 
                type="text" required maxLength={6} placeholder="예: 550101"
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
            <Save size={20} /> {loading ? '등록중' : '이용자등록완료'}
          </button>
        </form>
      </div>
    </div>
  );
}
