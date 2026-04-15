'use client';
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { LayoutDashboard, Hospital, Pill, BarChart3, Settings, Menu, X, Heart, UserPlus, UserCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Suspense } from 'react';

const noto = Noto_Sans_KR({ subsets: ["latin"], weight: ['400', '500', '700', '900'] });

function LayoutContent({ children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // 하이드레이션 체크
  const [activeProfile, setActiveProfile] = useState(null);
  const [guardianName, setGuardianName] = useState('보호자');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isLandingPage = pathname === '/';
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isDemoParam = searchParams.get('demo') === 'true';
  const isDemoMode = pathname === '/demo' || isDemoParam;
  const showSidebar = !isLandingPage && !isAuthPage;
  const currentTab = searchParams.get('tab') || 'dashboard';

  // [강력한 반응형 감지 및 초기값 설정]
  useEffect(() => {
    setIsMounted(true);
    const handleResize = () => {
      const mobile = window.innerWidth < 1024; 
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (showSidebar) {
      if (isDemoMode) {
        // 데모 모드면 강제로 세션 데이터 주입
        setActiveProfile({ id: 'demo-id', name: '이순자' });
        setGuardianName('데모보호자');
      } else {
        const getProfiles = async () => {
          const { data } = await supabase.from('care_profiles').select('id, name').order('created_at', { ascending: false }).limit(1).maybeSingle();
          if (data) setActiveProfile(data);
          const { data: { user } } = await supabase.auth.getUser();
          if (user) setGuardianName(user.user_metadata?.full_name || '보호자');
        };
        getProfiles();
      }
    }
  }, [showSidebar, pathname, isDemoMode]);

  const handleLogout = async () => {
    localStorage.removeItem('isLoggedIn');
    await supabase.auth.signOut();
    window.location.href = '/'; 
  };

  const getMenuHref = (base) => {
    if (isDemoMode) {
      if (base === 'dashboard') return '/demo';
      return `/demo?tab=${base}`;
    }
    if (!activeProfile) return '/dashboard';
    return `/profile/${activeProfile.id}/${base}`;
  };

  const menuItems = [
    { name: '대시보드', icon: <LayoutDashboard size={20} />, href: isDemoMode ? '/demo' : '/dashboard', key: 'dashboard' },
    { name: '병원관리', icon: <Hospital size={20} />, href: getMenuHref('hospitals'), key: 'hospitals' },
    { name: '복약관리', icon: <Pill size={20} />, href: getMenuHref('medications'), key: 'medications' },
    { name: '지출분석', icon: <BarChart3 size={20} />, href: getMenuHref('costs'), key: 'costs' },
  ];

  // 하이드레이션 전에는 아무것도 보여주지 않아 레이아웃 튐 방지
  if (!isMounted) return <body className={noto.className} style={{ margin: 0, padding: 0, background: '#f4f7fa' }} />;

  return (
    <body className={noto.className} style={{ margin: 0, padding: 0, background: isLandingPage ? '#fff' : '#f4f7fa', overflowX: 'hidden' }}>
      
      {showSidebar ? (
        <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
          
          {/* [모바일 배경막] */}
          {isMobile && isSidebarOpen && (
            <div 
              onClick={() => setSidebarOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 150, backdropFilter: 'blur(1px)' }} 
            />
          )}

          {/* [사이드바] */}
          <aside style={{ 
            width: '260px', 
            background: '#1a222d', 
            color: '#fff', 
            display: 'flex', 
            flexDirection: 'column', 
            transition: 'transform 0.3s ease', 
            transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-260px)',
            position: 'fixed', 
            height: '100vh', 
            zIndex: 200,
            boxShadow: isMobile && isSidebarOpen ? '4px 0 20px rgba(0,0,0,0.3)' : 'none'
          }}>
            <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', background: '#1D9E75', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Heart size={20} fill="#fff" color="#fff" /></div>
                <span style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-1.5px', color: '#fff' }}>부분케어</span>
              </Link>
              {isMobile && <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={24}/></button>}
            </div>

            <nav style={{ flex: 1, padding: '10px 12px' }}>
              {menuItems.map((item) => {
                const isActive = isDemoMode 
                  ? (currentTab === item.key || (item.key === 'dashboard' && currentTab === 'dashboard'))
                  : pathname === item.href;

                return (
                  <Link key={item.name} href={item.href} onClick={() => isMobile && setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '8px', marginBottom: '4px', textDecoration: 'none', color: isActive ? '#fff' : '#a2b1c3', background: isActive ? '#1D9E75' : 'transparent', fontSize: isMobile ? '15px' : '14px' }}>
                    {item.icon} <span style={{ fontWeight: isActive ? '700' : '500' }}>{item.name}</span>
                  </Link>
                );
              })}
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '15px 10px' }}></div>
              <Link href={isDemoMode ? "/guardian/edit?demo=true" : "/guardian/edit"} onClick={() => isMobile && setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '8px', marginBottom: '8px', textDecoration: 'none', color: '#a2b1c3' }}><UserCircle size={20} /><span>보호자수정</span></Link>
              <Link href={isDemoMode ? "/profile/new?demo=true" : "/profile/new"} onClick={() => isMobile && setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '8px', textDecoration: 'none', color: '#a2b1c3' }}><UserPlus size={20} /><span>이용자등록</span></Link>
            </nav>
            <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button onClick={handleLogout} style={{ width: '100%', background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '12px', color: '#a2b1c3', cursor: 'pointer' }}><X size={18} /> 로그아웃</button>
            </div>
          </aside>

          {/* [본문 영역] */}
          <main style={{ 
            flex: 1, 
            marginLeft: (!isMobile && isSidebarOpen) ? '260px' : '0', 
            transition: 'margin-left 0.3s ease',
            width: '100%',
            position: 'relative'
          }}>
            <header style={{ height: '64px', background: '#fff', borderBottom: '1px solid #e1e8ef', display: 'flex', alignItems: 'center', padding: '0 16px', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
              <button 
                onClick={() => setSidebarOpen(!isSidebarOpen)} 
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', cursor: 'pointer', color: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Menu size={24} />
              </button>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{guardianName}</div>
                <div style={{ fontSize: '11px', color: '#888' }}>{activeProfile?.name || '관리 중'}</div>
              </div>
            </header>
            <div style={{ padding: isMobile ? '20px 16px' : '32px', boxSizing: 'border-box' }}>
              {children}
            </div>
          </main>
        </div>
      ) : (
        <div style={{ minHeight: '100vh' }}>{children}</div>
      )}
    </body>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <Suspense fallback={null}>
        <LayoutContent>{children}</LayoutContent>
      </Suspense>
    </html>
  );
}
