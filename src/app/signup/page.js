'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, UserCheck, ShieldCheck, Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // [핵심] 브라우저에 로그인 상태 저장
    localStorage.setItem('isLoggedIn', 'true');
    
    setTimeout(() => {
      if (role === 'guardian') router.push('/profile/new');
      else router.push('/guardian/new');
      setLoading(false);
    }, 800);
  };

  return (
    <div style={{ 
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #F0F9F6 0%, #FFFFFF 100%)', padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '500px', background: '#fff', padding: '48px 40px', borderRadius: '32px', boxShadow: '0 20px 40px rgba(29, 158, 117, 0.08)', border: '1px solid #E1F5EE' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '36px', height: '36px', background: '#1D9E75', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Heart size={22} fill="#fff" color="#fff" /></div>
            <span style={{ fontSize: '24px', fontWeight: '900', color: '#1D9E75' }}>부분케어</span>
          </Link>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>{step === 1 ? '가입 유형 선택' : '회원정보 입력'}</h2>
        </div>

        {step === 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button onClick={() => { setRole('guardian'); setStep(2); }} style={{ padding: '24px', borderRadius: '20px', border: '2px solid #eee', background: '#fff', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '56px', height: '56px', background: '#E1F5EE', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D9E75' }}><ShieldCheck size={32} /></div>
              <div><div style={{ fontSize: '17px', fontWeight: 'bold' }}>보호자</div><div style={{ fontSize: '13px', color: '#777' }}>부모님 건강 지표 관리</div></div>
              <ArrowRight size={20} color="#ccc" style={{ marginLeft: 'auto' }} />
            </button>
            <button onClick={() => { setRole('user'); setStep(2); }} style={{ padding: '24px', borderRadius: '20px', border: '2px solid #eee', background: '#fff', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '56px', height: '56px', background: '#F0F7FF', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#378ADD' }}><UserCheck size={32} /></div>
              <div><div style={{ fontSize: '17px', fontWeight: 'bold' }}>이용자</div><div style={{ fontSize: '13px', color: '#777' }}>건강 데이터 기록 및 공유</div></div>
              <ArrowRight size={20} color="#ccc" style={{ marginLeft: 'auto' }} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <input type="text" required placeholder="성함" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #ddd' }} />
            <input type="email" required placeholder="이메일" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #ddd' }} />
            <input type="password" required placeholder="비밀번호" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #ddd' }} />
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: '16px', borderRadius: '14px', border: '1px solid #ddd', background: '#fff' }}>이전</button>
              <button type="submit" disabled={loading} style={{ flex: 2, padding: '16px', borderRadius: '14px', background: role === 'guardian' ? '#1D9E75' : '#378ADD', color: '#fff', fontWeight: '800' }}>{loading ? '처리 중' : '가입 완료'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
