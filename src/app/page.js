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
        display: 'flex', alignItems: 'center', padding: '0 20px', 
        background: isScrolled ? 'rgba(255, 255, 255, 0.95)' : 'transparent', 
        backdropFilter: isScrolled ? 'blur(10px)' : 'none', 
        borderBottom: isScrolled ? '0.5px solid #eee' : 'none', transition: 'all 0.3s' 
      }}>
        <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{ width: '32px', height: '32px', background: '#1D9E75', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={20} fill="#fff" color="#fff" />
            </div>
            <span style={{ fontSize: '22px', fontWeight: '900', color: '#1D9E75', letterSpacing: '-0.5px' }}>부분케어</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginLeft: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }} className="desktop-only">
              {navLinks.map(l => <Link key={l.name} href={l.href} style={{ textDecoration: 'none', color: '#444', fontSize: '14px', fontWeight: '600' }}>{l.name}</Link>)}
              {!isLoggedIn && <Link href="/login" style={{ textDecoration: 'none', color: '#444', fontSize: '14px', fontWeight: '600' }}>로그인</Link>}
            </div>
            
            <Link href={isLoggedIn ? "/dashboard" : "/signup"} style={{ 
              background: '#1D9E75', color: '#fff', padding: '12px 24px', 
              borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: '800',
              boxShadow: '0 4px 12px rgba(29, 158, 117, 0.2)', transition: 'all 0.2s'
            }}>
              {isLoggedIn ? "대시보드" : "시작하기"}
            </Link>
          </div>
        </div>
      </nav>

      <section className="mobile-padding-x" style={{ 
        paddingTop: '180px', paddingBottom: '120px', textAlign: 'center', 
        background: 'linear-gradient(180deg, #F0F9F6 0%, #FFFFFF 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        <div className="fade-in" style={{ background: '#E1F5EE', color: '#085041', padding: '8px 18px', borderRadius: '30px', fontSize: '13px', fontWeight: '800', marginBottom: '32px', display: 'inline-block' }}>
          ✨ 부모님 건강 관리의 새로운 기준
        </div>
        
        <h1 className="fade-in" style={{ 
          fontSize: 'clamp(32px, 8vw, 64px)', fontWeight: '900', lineHeight: '1.2', 
          marginBottom: '28px', letterSpacing: '-1.5px', maxWidth: '900px' 
        }}>
          부모님 약·병원 정보를<br/>
          <span style={{ color: '#1D9E75', position: 'relative' }}>
            자녀가 직접 관리
            <span style={{ position: 'absolute', bottom: '5px', left: 0, width: '100%', height: '8px', background: 'rgba(29, 158, 117, 0.1)', zIndex: -1 }}></span>
          </span>하세요
        </h1>

        <p className="fade-in" style={{ 
          fontSize: 'clamp(16px, 4vw, 20px)', color: '#555', maxWidth: '640px', 
          margin: '0 auto 48px', lineHeight: '1.7', fontWeight: '500' 
        }}>
          여러 병원, 복잡한 복약 일정 — 이제 한 곳에서 정리됩니다.<br className="desktop-only"/>
          케어파트너가 현장에서 확인하고 자녀에게 정확한 리포트를 전달합니다.
        </p>

        <div className="mobile-stack fade-in" style={{ display: 'flex', gap: '16px', justifyContent: 'center', width: '100%' }}>
          <Link href={isLoggedIn ? "/dashboard" : "/signup"} className="mobile-full-width" style={{ 
            background: '#1D9E75', color: '#fff', padding: '20px 40px', 
            borderRadius: '16px', fontSize: '18px', fontWeight: '800', 
            textDecoration: 'none', display: 'flex', alignItems: 'center', 
            gap: '10px', boxShadow: '0 8px 24px rgba(29, 158, 117, 0.25)' 
          }}>
            {isLoggedIn ? "대시보드 이동" : "지금 무료로 시작하기"} <ArrowRight size={20} />
          </Link>
          <Link href="/demo" className="mobile-full-width" style={{ 
            background: '#fff', color: '#1a1a1a', padding: '20px 40px', 
            borderRadius: '16px', fontSize: '18px', fontWeight: '800', 
            textDecoration: 'none', border: '1.5px solid #eee' 
          }}>데모 둘러보기</Link>
        </div>
      </section>

      {/* 모바일 최적화를 위한 부가 설명 섹션 (간소화) */}
      <section style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          {[
            { title: '실시간 복약 알림', desc: '약 먹을 시간을 놓치지 않도록 자동 알림을 보내드려요.' },
            { title: '병원 동행 리포트', desc: '진료 내용을 꼼꼼히 기록하여 자녀분께 전달합니다.' },
            { title: '지능형 건강 분석', desc: '빅데이터 기반으로 중복 처방 위험을 미리 감지합니다.' }
          ].map((feat, i) => (
            <div key={i} style={{ padding: '32px', background: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '12px' }}>{feat.title}</h3>
              <p style={{ color: '#666', lineHeight: '1.6', fontSize: '15px' }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ padding: '80px 20px', background: '#f8fafc', borderTop: '1px solid #eee', textAlign: 'center' }}>
        <div className="mobile-stack" style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '40px' }}>
          {!isLoggedIn && <Link href="/login" style={{ fontSize: '15px', color: '#444', textDecoration: 'none', fontWeight: '700' }}>로그인</Link>}
          <Link href="/signup" style={{ fontSize: '15px', color: '#444', textDecoration: 'none', fontWeight: '700' }}>회원가입</Link>
          <Link href="/demo" style={{ fontSize: '15px', color: '#444', textDecoration: 'none', fontWeight: '700' }}>데모 버전</Link>
        </div>
        <p style={{ fontSize: '14px', color: '#aaa', fontWeight: '500' }}>© 2026 부분케어. 자녀와 부모를 잇는 건강 파트너.</p>
      </footer>

      <style jsx global>{`
        @media (max-width: 768px) {
          br { display: none; }
        }
      `}</style>
    </div>
  );
}
