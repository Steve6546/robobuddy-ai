/**
 * @fileoverview قائمة المستخدم - User Menu Component
 * 
 * @description
 * يعرض قائمة منبثقة للمستخدم تحتوي على:
 * - صورة المستخدم أو الأحرف الأولى
 * - البريد الإلكتروني
 * - زر تسجيل الخروج
 * 
 * @accessibility
 * - دعم لوحة المفاتيح
 * - aria-labels مناسبة
 * - focus-visible للتنقل
 */

import { useState, useEffect } from 'react';
import { LogOut, User, Grid2X2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface UserMenuProps {
  /** هل الشريط الجانبي مطوي؟ */
  collapsed?: boolean;
}

interface UserData {
  email: string | null;
  avatarUrl: string | null;
  fullName: string | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * مكون قائمة المستخدم
 * 
 * @example
 * ```tsx
 * <UserMenu collapsed={false} />
 * ```
 */
export const UserMenu = ({ collapsed = false }: UserMenuProps) => {
  // ─────────────────────────────────────────────────────────────────────────
  // STATE & HOOKS
  // ─────────────────────────────────────────────────────────────────────────
  
  const [userData, setUserData] = useState<UserData>({
    email: null,
    avatarUrl: null,
    fullName: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // ─────────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * جلب بيانات المستخدم الحالي
   */
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserData({
          email: user.email ?? null,
          avatarUrl: user.user_metadata?.avatar_url ?? null,
          fullName: user.user_metadata?.full_name ?? null,
        });
      }
    };

    fetchUserData();

    // الاستماع لتغييرات المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUserData({
          email: session.user.email ?? null,
          avatarUrl: session.user.user_metadata?.avatar_url ?? null,
          fullName: session.user.user_metadata?.full_name ?? null,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * تسجيل الخروج
   */
  const handleSignOut = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: 'خطأ في تسجيل الخروج',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'تم تسجيل الخروج',
        description: 'نراك قريباً! 👋',
      });

      navigate('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: 'خطأ غير متوقع',
        description: 'حدث خطأ أثناء تسجيل الخروج',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // DERIVED STATE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * الأحرف الأولى للعرض في Avatar
   */
  const getInitials = (): string => {
    if (userData.fullName) {
      const names = userData.fullName.split(' ');
      return names.map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (userData.email) {
      return userData.email[0].toUpperCase();
    }
    return 'U';
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-3 h-auto py-2.5 px-3',
            'hover:bg-accent/50 transition-colors',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            collapsed && 'justify-center px-2'
          )}
          aria-label="قائمة المستخدم"
        >
          {/* أيقونة المستخدم - مقسمة لـ 4 أجزاء */}
          <div className="relative flex-shrink-0">
            <Avatar className="h-9 w-9 border-2 border-border">
              <AvatarImage src={userData.avatarUrl ?? undefined} alt={userData.fullName ?? 'المستخدم'} />
              <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                {userData.avatarUrl ? (
                  <Grid2X2 className="h-4 w-4" strokeWidth={2} />
                ) : (
                  getInitials()
                )}
              </AvatarFallback>
            </Avatar>
            {/* مؤشر الاتصال */}
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card" />
          </div>

          {/* معلومات المستخدم - تختفي عند الطي */}
          {!collapsed && (
            <div className="flex-1 min-w-0 text-right">
              <p className="text-sm font-medium text-foreground truncate">
                {userData.fullName || 'المستخدم'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {userData.email || 'غير متصل'}
              </p>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="w-56"
        sideOffset={8}
      >
        {/* معلومات المستخدم في القائمة */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1 text-right">
            <p className="text-sm font-medium leading-none">
              {userData.fullName || 'المستخدم'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {userData.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* الملف الشخصي (مستقبلياً) */}
        <DropdownMenuItem 
          className="gap-2 cursor-pointer"
          disabled
        >
          <User className="h-4 w-4" strokeWidth={2} />
          <span>الملف الشخصي</span>
          <span className="mr-auto text-xs text-muted-foreground">قريباً</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* تسجيل الخروج */}
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isLoading}
          className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" strokeWidth={2} />
          <span>{isLoading ? 'جاري الخروج...' : 'تسجيل الخروج'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
