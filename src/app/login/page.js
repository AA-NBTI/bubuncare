'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Mail, Lock, ArrowRight, Github } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    // 실제 인증 로직은 추후 Supabase Auth와 연결 가능합니다.
    // 현재는 대시보드 진입을 위한 흐름만 구축합니다.
    setTimeout(() => {
      router.push('/dashboard');
      setLoading(false);
    }, 800);
  };

  return (
    <div style={{ 
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #F0F9F6 0%, #FFFFFF 100%)', padding: '20px'
    }}>
      <div style={{ 
        width: '100%', maxWidth: '420px', background: '#fff', padding: '48px 40px',
        borderRadius: '32px', boxShadow: '0 20px 40px rgba(29, 158, 117, 0.08)',
        border: '1px solid #E1F5EE'
      }}>
        {/* 로고 영역 */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '36px', height: '36px', background: '#1D9E75', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={22} fill="#fff" color="#fff" />
            </div>
            <span style={{ fontSize: '24px', fontWeight: '900', color: '#1D9E75', letterSpacing: '-0.5px' }}>부분케어</span>
          </Link>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>다시 만나서 반가워요!</h2>
          <p style={{ fontSize: '14px', color: '#888', marginTop: '6px' }}>부모님 건강 관리를 계속해 보세요.</p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={18} color="#999" style={{ position: 'absolute', left: '14px', top: '15px' }} />
            <input 
              type="email" required placeholder="이메일 주소"
              style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '15px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={18} color="#999" style={{ position: 'absolute', left: '14px', top: '15px' }} />
            <input 
              type="password" required placeholder="비밀번호"
              style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '15px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" style={{ background: 'none', border: 'none', color: '#999', fontSize: '13px', cursor: 'pointer' }}>비밀번호를 잊으셨나요?</button>
          </div>

          <button 
            type="submit" disabled={loading}
            style={{ 
              width: '100%', padding: '16px', borderRadius: '14px', 
              background: '#1D9E75', color: '#fff', fontWeight: '800', border: 'none',
              fontSize: '16px', cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            {loading ? '인증 중...' : '확인하고 시작하기'} <ArrowRight size={18} />
          </button>
        </form>

        {/* 간편 로그인 구분선 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '32px 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#eee' }}></div>
          <span style={{ fontSize: '12px', color: '#ccc' }}>간편하게 시작하기</span>
          <div style={{ flex: 1, height: '1px', background: '#eee' }}></div>
        </div>

        {/* 소셜 로그인 버튼들 */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '13px' }}>
             <img src="https://upload.wikimedia.org/wikipedia/commons/e/e3/KakaoTalk_logo.svg" width="16" alt="kakao" /> 카카오
          </button>
          <button style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '13px' }}>
             <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/Naver_Logotype.svg" width="16" alt="naver" /> 네이버
          </button>
        </div>

        <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
          아직 회원이 아니신가요? 
          <Link href="/signup" style={{ marginLeft: '8px', color: '#1D9E75', fontWeight: 'bold', textDecoration: 'none' }}>지금 가입하기</Link>
        </div>
      </div>
    </div>
  );
}
