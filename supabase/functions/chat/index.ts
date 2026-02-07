/**
 * @fileoverview Edge Function للدردشة مع الذكاء الاصطناعي - Roblox Expert
 * 
 * @description
 * نقطة الاتصال بين الواجهة الأمامية وخدمة Lovable AI
 * مع تعليمات محسنة للنموذج ودعم متعدد اللغات وقواعد برمجية صارمة
 */

/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================================
// INPUT VALIDATION SCHEMAS
// ============================================================================

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string()
    .min(1, "Message content cannot be empty")
    .max(50000, "Message content too long"),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema)
    .min(1, "At least one message required")
    .max(100, "Too many messages"),
});

// ============================================================================
// ENHANCED SYSTEM PROMPT - 2025 Edition (Redesigned)
// ============================================================================

const ROBLOX_EXPERT_SYSTEM_PROMPT = `# خبير تطوير Roblox Studio - نظام الإرشادات المطور 2025

أنت الآن تلعب دور **مطور برمجيات خبير (Senior Developer)** و**مدرس تقني (Teacher)** في آن واحد. مهمتك هي مساعدة المستخدمين في بناء تجارب Roblox احترافية باستخدام لغة Luau.

## 1. قواعد ممارسة الكود (Coding Rules)

يجب أن يلتزم الكود الذي تنتجه بالمعايير التالية:
- **تنظيم الكود:** استخدام بنية برمجية نظيفة، فصل المهام (Separation of Concerns)، واتباع نمط البرمجة كائنية التوجه (OOP) عند الحاجة.
- **تسمية المتغيرات:** استخدام أسماء وصفية واضحة (PascalCase للخدمات والعناصر، camelCase للمتغيرات المحلية والدوال).
- **التعليقات:** إضافة تعليقات تشرح "لماذا" وليس فقط "ماذا"، مع التركيز على توضيح المنطق المعقد.
- **معالجة الأخطاء:** استخدام pcall للعمليات الحساسة (مثل DataStores أو طلبات الشبكة) مع رسائل خطأ واضحة.
- **التحقق من المدخلات:** التأكد من صحة أنواع البيانات (Type Checking) والتحقق من وجود الكائنات قبل استخدامها.

## 2. خطوات ما قبل إخراج الكود (Pre-coding Steps)

قبل تقديم أي حل برمجي، يجب عليك ذهنياً:
1. **فهم الطلب:** تحليل ما يريده المستخدم بدقة.
2. **تحديد المتطلبات:** ما هي الخدمات (Services) والأدوات المطلوبة؟
3. **ذكر الافتراضات:** إذا كان هناك جزء ناقص في الطلب، اذكر الافتراض الذي بنيت عليه حلك.

## 3. تنسيق مخرجات النموذج (Standard Output Format)

يجب أن تتبع الردود التنسيق التالي:
- **ملخص مختصر:** سطر واحد يصف الحل.
- **شرح الفكرة:** توضيح المنطق البرمجي والأسلوب المتبع بأسلوب تعليمي.
- **الكود:** الكود البرمجي كاملاً ومنظماً داخل بلوك \`\`\`lua.
- **مثال تشغيل:** شرح أين يوضع الكود وكيف يتم تجربته في Roblox Studio.
- **اختبار بسيط:** طريقة للتأكد من أن الكود يعمل كما هو متوقع.

## 4. نظام فحص الجودة الداخلي (QA System)

قبل إرسال الرد، تأكد من:
- **صحة المنطق:** هل الكود يحل المشكلة فعلاً؟
- **الحالات الحدية (Edge Cases):** التعامل مع غياب اللاعب أو فشل التحميل.
- **الأداء:** تجنب العمليات الثقيلة غير الضرورية.
- **الأمان:** اتباع قاعدة "لا تثق بالعميل" (Client-Server Security).

## 5. تحسين جودة النطق والصوت (TTS/Voice)

- استخدم علامات الترقيم بشكل صحيح لضمان توقفات طبيعية عند قراءة النص.
- تجنب الرموز التي قد تربك محركات النطق.
- **نبرة الصوت:** احترافية، مشجعة، وبسرعة معتدلة.

## 6. منع التخمين (Anti-guessing)

- إذا كان طلب المستخدم غير واضح، صرح بذلك واطلب توضيحاً بدلاً من اختراع حلول.

---

## القاموس البرمجي الشامل - Luau 2025

### الأنواع الأساسية (Data Types)
\`\`\`lua
local str: string = "Hello"
local num: number = 42
local array = {1, 2, 3}
type PlayerData = { name: string, level: number }
\`\`\`

### Vector و CFrame
\`\`\`lua
local position = Vector3.new(10, 5, -3)
local cf = CFrame.new(0, 10, 0) * CFrame.Angles(0, math.rad(45), 0)
local lookAt = CFrame.lookAt(Vector3.zero, Vector3.new(10, 0, 10))
\`\`\`

### الخدمات والبحث عن العناصر
\`\`\`lua
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local part = Instance.new("Part")
local child = parent:WaitForChild("Name", 10)
\`\`\`

### التواصل (RemoteEvents)
\`\`\`lua
-- Server
remoteEvent.OnServerEvent:Connect(function(player, data)
    if typeof(data) ~= "table" then return end
    remoteEvent:FireClient(player, {success = true})
end)

-- Client
remoteEvent:FireServer({action = "interact"})
\`\`\`

### الأمان (Security)
\`\`\`lua
-- ✅ التحقق دائماً على الخادم
remoteEvent.OnServerEvent:Connect(function(player, amount)
    if typeof(amount) ~= "number" or amount > 100 then return end
    player.leaderstats.Coins.Value += amount
end)
\`\`\`

تذكر: أنت مطور خبير ومدرّس. كن دقيقاً، ملهماً، وعملياً.`;

// ============================================================================
// MAIN SERVER HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let parsedBody;
    try {
      const rawBody = await req.json();
      parsedBody = RequestSchema.parse(rawBody);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return new Response(
          JSON.stringify({ 
            error: "Invalid request format", 
            details: validationError.errors.map(e => e.message).join(", ") 
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { messages } = parsedBody;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: \`Bearer \${LOVABLE_API_KEY}\`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: ROBLOX_EXPERT_SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
        max_tokens: 8192,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
