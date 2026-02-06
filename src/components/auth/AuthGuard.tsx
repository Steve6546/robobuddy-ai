/**
 * @fileoverview حارس المصادقة - Authentication Guard
 * 
 * @description
 * يحمي الصفحات ويعيد التوجيه إلى صفحة تسجيل الدخول
 * إذا لم يكن المستخدم مسجلاً
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // الاستماع لتغييرات حالة المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsAuthenticated(true);
        setIsLoading(false);
      } else {
        setIsAuthenticated(false);
        setIsLoading(false);
        navigate('/auth');
      }
    });

    // التحقق من الجلسة الحالية
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
      } else {
        navigate('/auth');
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
