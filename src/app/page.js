'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Heart } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    // [보안 및 상태 체크 최우선 실행]
    const syncAuthState = async () => {
      // 1. 브라우저 마크 체크 (대시보드에서 새긴 값)
      const localStatus = localStorage.getItem('isLoggedIn') === 'true';
      
      // 2. 서버 세션 체크
      const { data: { session } } = await supabase.auth.getSession();
      
      // 둘 중 하나라도 참이면 로그인으로 간주
      setIsLoggedIn(localStatus || !!session);
    };

    syncAuthState();

    // 실시간 변화 감지 (로그아웃 등)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        localStorage.setItem('isLoggedIn', 'true');
        setIsLoggedIn(true);
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('isLoggedIn');
        setIsLoggedIn(false);
      }
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  const navLinks = [
    { name: '서비스 소개', href: '#features' },
    { name: '이용 방법', href: '#how-it-works' },
    { name: '요금제', href: '#pricing' },
  ];

  return (
    <div style={{ background: '#fff', color: '#1a1a1a', scrollBehavior: 'smooth' }}>
      <nav style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, height: '72px', 
        display: 'flex', alignItems: 'center', padding: '0 20px 0 5%', 
        background: isScrolled ? 'rgba(255, 255, 255, 0.95)' : 'transparent', 
        backdropFilter: isScrolled ? 'blur(10px)' : 'none', 
        borderBottom: isScrolled ? '0.5px solid #eee' : 'none', transition: 'all 0.3s' 
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{ width: '30px', height: '30px', background: '#1D9E75', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={18} fill="#fff" color="#fff" />
          </div>
          <span style={{ fontSize: '20px', fontWeight: '900', color: '#1D9E75' }}>부분케어</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginLeft: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }} className="desktop-only">
            {navLinks.map(l => <Link key={l.name} href={l.href} style={{ textDecoration: 'none', color: '#444', fontSize: '14px', fontWeight: '600' }}>{l.name}</Link>)}
            {!isLoggedIn && <Link href="/login" style={{ textDecoration: 'none', color: '#444', fontSize: '14px', fontWeight: '600' }}>로그인</Link>}
          </div>
          
          <Link href={isLoggedIn ? "/dashboard" : "/signup"} style={{ 
            background: '#1D9E75', color: '#fff', padding: '10px 24px', 
            borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '800',
            boxShadow: '0 4px 12px rgba(29, 158, 117, 0.2)', transition: 'all 0.2s'
          }}>
            {isLoggedIn ? "대시보드" : "회원가입"}
          </Link>
        </div>
      </nav>

      <section style={{ paddingTop: '160px', paddingBottom: '100px', textAlign: 'center', background: 'linear-gradient(180deg, #F0F9F6 0%, #FFFFFF 100%)', paddingLeft: '20px', paddingRight: '20px' }}>
        <div style={{ background: '#E1F5EE', color: '#085041', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', marginBottom: '24px', display: 'inline-block' }}>부모님 건강 관리의 새로운 기준</div>
        <h1 style={{ fontSize: '50px', fontWeight: '900', lineHeight: '1.2', marginBottom: '24px' }}>부모님 약·병원 정보를<br/><span style={{ color: '#1D9E75' }}>자녀가 직접 관리</span>하세요</h1>
        <p style={{ fontSize: '18px', color: '#666', maxWidth: '600px', margin: '0 auto 40px', lineHeight: '1.6' }}>여러 병원, 복잡한 복약 일정 — 이제 한 곳에서 정리됩니다. <br/>케어파트너가 현장에서 확인하고 자녀에게 리포트로 전달합니다.</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link href={isLoggedIn ? "/dashboard" : "/signup"} style={{ background: '#1D9E75', color: '#fff', padding: '16px 32px', borderRadius: '12px', fontSize: '16px', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isLoggedIn ? "대시보드" : "지금 시작하기"} <ArrowRight size={18} />
          </Link>
          <Link href="/demo" style={{ background: '#fff', color: '#1a1a1a', padding: '16px 32px', borderRadius: '12px', fontSize: '16px', fontWeight: '700', textDecoration: 'none', border: '1px solid #ddd' }}>데모 버전</Link>
        </div>
      </section>

      <footer style={{ padding: '60px 5%', background: '#f8fafc', borderTop: '1px solid #eee', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px' }}>
          {!isLoggedIn && <Link href="/login" style={{ fontSize: '14px', color: '#666', textDecoration: 'none' }}>로그인</Link>}
          <Link href="/signup" style={{ fontSize: '14px', color: '#666', textDecoration: 'none' }}>회원가입</Link>
          <Link href="/demo" style={{ fontSize: '14px', color: '#666', textDecoration: 'none' }}>데모 버전</Link>
        </div>
        <p style={{ marginTop: '30px', fontSize: '13px', color: '#ccc' }}>© 2026 부분케어. All rights reserved.</p>
      </footer>
    </div>
  );
}
