/**
 * @fileoverview حارس المصادقة - Authentication Guard
 * 
 * @description
 * يحمي الصفحات ويعيد التوجيه إلى صفحة تسجيل الدخول
 * إذا لم يكن المستخدم مسجلاً
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // منع إعادة التوجيه المتكررة
  const hasCheckedSession = useRef(false);

  useEffect(() => {
    // منع التحقق المتكرر
    if (hasCheckedSession.current) return;
    
    /**
     * التحقق من الجلسة الحالية أولاً
     * 
     * @important
     * يجب استدعاء getSession قبل onAuthStateChange
     * لضمان استمرار الجلسة بعد تحديث الصفحة
     */
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          setIsAuthenticated(false);
          setIsLoading(false);
          navigate('/auth', { replace: true });
          return;
        }

        if (session) {
          setIsAuthenticated(true);
          hasCheckedSession.current = true;
        } else {
          setIsAuthenticated(false);
          navigate('/auth', { replace: true });
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Unexpected session error:', err);
        setIsLoading(false);
        navigate('/auth', { replace: true });
      }
    };

    checkSession();

    // الاستماع لتغييرات حالة المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // معالجة الأحداث المختلفة
      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          setIsAuthenticated(true);
          setIsLoading(false);
          hasCheckedSession.current = true;
          break;
          
        case 'SIGNED_OUT':
          setIsAuthenticated(false);
          setIsLoading(false);
          hasCheckedSession.current = false;
          navigate('/auth', { replace: true });
          break;
          
        case 'INITIAL_SESSION':
          // تم معالجته بواسطة getSession
          if (session) {
            setIsAuthenticated(true);
            hasCheckedSession.current = true;
          }
          setIsLoading(false);
          break;
          
        default:
          // للأحداث الأخرى، التحقق من وجود جلسة
          if (session) {
            setIsAuthenticated(true);
          }
          break;
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="thinking-spinner !w-8 !h-8" />
          <p className="text-muted-foreground text-sm">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
