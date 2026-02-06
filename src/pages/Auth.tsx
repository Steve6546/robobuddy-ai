/**
 * @fileoverview صفحة تسجيل الدخول - Authentication Page
 * 
 * @description
 * صفحة تسجيل دخول احترافية مع:
 * - خلفية متحركة (محادثة وهمية مع AI)
 * - تسجيل دخول بـ Google و Apple
 * - أنميشن سلسة
 * - دعم RTL
 * - تصميم متجاوب
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bot, Sparkles, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { lovable } from '@/integrations/lovable';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// ============================================================================
// MOCK CONVERSATION DATA
// ============================================================================

const MOCK_CONVERSATIONS = [
  {
    role: 'user',
    content: 'كيف أنشئ نظام DataStore في Roblox؟'
  },
  {
    role: 'assistant',
    content: `-- نظام حفظ البيانات المتقدم
local DataStoreService = game:GetService("DataStoreService")
local playerDataStore = DataStoreService:GetDataStore("PlayerData")

local function savePlayerData(player, data)
    local success, err = pcall(function()
        playerDataStore:SetAsync(player.UserId, data)
    end)
    return success
end`
  },
  {
    role: 'user',
    content: 'أريد نظام متجر للعبتي'
  },
  {
    role: 'assistant',
    content: `-- نظام المتجر الاحترافي
local ShopSystem = {}
ShopSystem.__index = ShopSystem

function ShopSystem.new()
    local self = setmetatable({}, ShopSystem)
    self.items = {}
    self.currency = "Coins"
    return self
end

function ShopSystem:purchase(player, itemId)
    local item = self.items[itemId]
    if not item then return false end
    return true
end`
  },
  {
    role: 'user',
    content: 'كيف أضيف أنيميشن للشخصية؟'
  },
  {
    role: 'assistant',
    content: `-- نظام الأنيميشن المتقدم
local AnimationController = {}

function AnimationController:loadAnimation(humanoid, animId)
    local animation = Instance.new("Animation")
    animation.AnimationId = "rbxassetid://" .. animId
    return humanoid:LoadAnimation(animation)
end

function AnimationController:playAnimation(track)
    track:Play(0.1)
end`
  }
];

// ============================================================================
// BACKGROUND CODE ANIMATION COMPONENT
// ============================================================================

const BackgroundCodeAnimation = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const conversation = MOCK_CONVERSATIONS[currentIndex];
    let charIndex = 0;
    setDisplayedText('');
    setIsTyping(true);

    const typingInterval = setInterval(() => {
      if (charIndex < conversation.content.length) {
        setDisplayedText(conversation.content.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % MOCK_CONVERSATIONS.length);
        }, 2000);
      }
    }, 25);

    return () => clearInterval(typingInterval);
  }, [currentIndex]);

  const conversation = MOCK_CONVERSATIONS[currentIndex];
  const isUser = conversation.role === 'user';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background z-10" />
      
      {/* Animated Code Box - Left Side */}
      <div className="absolute left-8 top-1/4 w-80 opacity-20 transform -rotate-6 hidden lg:block">
        <div className="bg-card/50 rounded-xl border border-border/50 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <Code2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Lua</span>
          </div>
          <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
{`local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local function onPlayerJoin(player)
    print("Welcome, " .. player.Name)
end

Players.PlayerAdded:Connect(onPlayerJoin)`}
          </pre>
        </div>
      </div>

      {/* Animated Code Box - Right Side */}
      <div className="absolute right-8 top-1/3 w-72 opacity-15 transform rotate-3 hidden lg:block">
        <div className="bg-card/50 rounded-xl border border-border/50 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <Code2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Lua</span>
          </div>
          <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
{`local TweenService = game:GetService("TweenService")

local function animate(part, goal)
    local tween = TweenService:Create(
        part, 
        TweenInfo.new(1),
        goal
    )
    tween:Play()
end`}
          </pre>
        </div>
      </div>

      {/* Main Animated Conversation - Center Background */}
      <div className="absolute left-1/2 top-2/3 transform -translate-x-1/2 w-96 opacity-10 hidden md:block">
        <div className="bg-card/50 rounded-xl border border-border/50 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {isUser ? 'أنت' : 'Roblox Expert'}
            </span>
          </div>
          <div className="font-mono text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed" dir="auto">
            {displayedText}
            {isTyping && (
              <span className="inline-block w-0.5 h-3 bg-muted-foreground ml-0.5 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute left-20 bottom-1/4 opacity-10 animate-pulse">
        <Sparkles className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="absolute right-32 bottom-1/3 opacity-10 animate-pulse delay-500">
        <Code2 className="h-6 w-6 text-muted-foreground" />
      </div>
    </div>
  );
};

// ============================================================================
// MAIN AUTH PAGE
// ============================================================================

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // التحقق من حالة المصادقة
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    // التحقق من الجلسة الحالية
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (provider: 'google' | 'apple') => {
    setIsLoading(provider);
    setError(null);

    try {
      const { error } = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });

      if (error) {
        setError(error.message || 'حدث خطأ أثناء تسجيل الدخول');
        setIsLoading(null);
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع');
      setIsLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-background overflow-hidden" dir="rtl">
      {/* Background Animation */}
      <BackgroundCodeAnimation />

      {/* Main Content - Centered */}
      <div className="relative z-20 h-full flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo & Title */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-foreground shadow-2xl mx-auto">
              <Bot className="h-10 w-10 text-background" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Roblox Expert
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                مساعدك الذكي في عالم Roblox Studio
              </p>
            </div>
          </div>

          {/* Login Buttons */}
          <div className="space-y-4">
            {/* Google Button */}
            <Button
              onClick={() => handleSignIn('google')}
              disabled={isLoading !== null}
              className={cn(
                "w-full h-14 rounded-xl text-base font-medium transition-all duration-300",
                "bg-card/80 hover:bg-card text-foreground border border-border",
                "flex items-center justify-center gap-3",
                "shadow-lg hover:shadow-xl backdrop-blur-sm"
              )}
            >
              {isLoading === 'google' ? (
                <div className="thinking-spinner !w-5 !h-5 !border-muted-foreground" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span>المتابعة باستخدام Google</span>
            </Button>

            {/* Apple Button */}
            <Button
              onClick={() => handleSignIn('apple')}
              disabled={isLoading !== null}
              className={cn(
                "w-full h-14 rounded-xl text-base font-medium transition-all duration-300",
                "bg-foreground hover:bg-foreground/90 text-background",
                "flex items-center justify-center gap-3",
                "shadow-lg hover:shadow-xl"
              )}
            >
              {isLoading === 'apple' ? (
                <div className="thinking-spinner !w-5 !h-5 !border-muted" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              )}
              <span>المتابعة باستخدام Apple</span>
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center backdrop-blur-sm">
              {error}
            </div>
          )}

          {/* Terms */}
          <p className="text-sm text-muted-foreground text-center">
            بتسجيل الدخول، أنت توافق على{' '}
            <Link to="/terms" className="text-foreground hover:underline font-medium">
              شروط الخدمة
            </Link>
            {' '}و{' '}
            <Link to="/privacy" className="text-foreground hover:underline font-medium">
              سياسة الخصوصية
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
