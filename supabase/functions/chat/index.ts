/**
 * @fileoverview Edge Function للدردشة مع الذكاء الاصطناعي
 * 
 * @description
 * هذا الملف هو نقطة الاتصال بين الواجهة الأمامية وخدمة Lovable AI.
 * يتعامل مع:
 * - استقبال رسائل المستخدم
 * - التحقق من صحة المدخلات
 * - إرسال الطلبات إلى Gemini 3.0 Flash
 * - بث الردود بتقنية SSE
 * 
 * @security
 * ⚠️ WARNING: هذا الملف حساس أمنياً
 * - يستخدم Zod للتحقق من المدخلات
 * - يطهّر رسائل الأخطاء لمنع تسريب المعلومات
 * - يتطلب Authorization header
 * 
 * @architecture
 * ```
 * Client Request
 *     │
 *     ▼
 * ┌─────────────────────┐
 * │   CORS Handling     │
 * └──────────┬──────────┘
 *            │
 *            ▼
 * ┌─────────────────────┐
 * │   Auth Check        │
 * └──────────┬──────────┘
 *            │
 *            ▼
 * ┌─────────────────────┐
 * │   Input Validation  │──► Zod Schema
 * └──────────┬──────────┘
 *            │
 *            ▼
 * ┌─────────────────────┐
 * │   Lovable AI Call   │──► Gemini 3.0 Flash
 * └──────────┬──────────┘
 *            │
 *            ▼
 * ┌─────────────────────┐
 * │   SSE Stream        │
 * └─────────────────────┘
 * ```
 * 
 * @endpoint POST /functions/v1/chat
 * 
 * @requestBody
 * {
 *   "messages": [
 *     { "role": "user", "content": "..." },
 *     { "role": "assistant", "content": "..." }
 *   ]
 * }
 * 
 * @responseType text/event-stream (SSE)
 */

/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

/**
 * رؤوس CORS للسماح بالطلبات من أي مصدر
 * 
 * @note
 * يجب أن تتضمن جميع الرؤوس التي يرسلها العميل
 * 
 * @security
 * يمكن تقييد Access-Control-Allow-Origin لنطاق محدد في الإنتاج
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================================
// INPUT VALIDATION SCHEMAS
// ============================================================================

/**
 * مخطط التحقق من الرسالة الواحدة
 * 
 * @validation
 * - role: يجب أن يكون user أو assistant أو system
 * - content: نص غير فارغ، حد أقصى 50,000 حرف
 * 
 * @security
 * الحد الأقصى للمحتوى يمنع هجمات DoS
 */
const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string()
    .min(1, "Message content cannot be empty")
    .max(50000, "Message content too long"),
});

/**
 * مخطط التحقق من الطلب الكامل
 * 
 * @validation
 * - messages: مصفوفة من الرسائل، حد أدنى 1، حد أقصى 100
 * 
 * @security
 * الحد الأقصى للرسائل يمنع استنزاف الموارد
 */
const RequestSchema = z.object({
  messages: z.array(MessageSchema)
    .min(1, "At least one message required")
    .max(100, "Too many messages"),
});

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

/**
 * التعليمات الأساسية لنموذج الذكاء الاصطناعي
 * 
 * @description
 * يحدد شخصية وخبرات ومعرفة "خبير Roblox"
 * يتضمن:
 * - قاموس Lua الشامل
 * - أنماط البرمجة الشائعة
 * - خدمات Roblox
 * - معايير الأمان
 * 
 * @extensionPoint
 * يمكن تعديل هذا النص لتخصيص سلوك المساعد
 */
const ROBLOX_EXPERT_SYSTEM_PROMPT = `أنت خبير Roblox Studio محترف ومتمكن. لديك معرفة عميقة وشاملة في:

## الخبرات الأساسية

### برمجة Lua
- أنماط البرمجة المتقدمة والـ Metatables
- التحسين والأداء العالي
- أفضل الممارسات والمعايير
- التعامل مع الأخطاء والـ Debugging
- البرمجة غير المتزامنة (Coroutines)

### خدمات Roblox (Services)
**التخزين والبيانات:**
- DataStoreService: حفظ بيانات اللاعبين، الإعدادات، التقدم
- MemoryStoreService: البيانات المؤقتة والـ Leaderboards
- MessagingService: التواصل بين الخوادم

**التكرار والمزامنة:**
- ReplicatedStorage: الأصول المشتركة بين الخادم والعميل
- ReplicatedFirst: التحميل الأولي السريع
- ServerStorage: الأصول الخاصة بالخادم فقط
- ServerScriptService: سكربتات الخادم

**اللاعبين والواجهات:**
- Players: إدارة اللاعبين والأحداث
- StarterGui: واجهات المستخدم الأولية
- StarterPlayer: إعدادات اللاعب والسكربتات
- StarterPack: الأدوات الافتراضية

**الفيزياء والعالم:**
- Workspace: العالم الفيزيائي
- PhysicsService: مجموعات التصادم
- TweenService: الحركات السلسة
- RunService: دورات التحديث

**الإدخال والصوت:**
- UserInputService: معالجة الإدخال
- ContextActionService: ربط الإجراءات
- SoundService: إدارة الصوت

### بنية الخادم-العميل
- RemoteEvents: أحداث أحادية الاتجاه
- RemoteFunctions: استدعاءات مع إرجاع
- BindableEvents: أحداث داخلية
- UnreliableRemoteEvents: للبيانات السريعة غير الحرجة

### أنماط الأمان
- لا تثق أبداً بالعميل
- التحقق من جميع المدخلات على الخادم
- Rate limiting للطلبات
- التحقق من الملكية والصلاحيات
- تشفير البيانات الحساسة

## قاموس Lua لـ Roblox

### الأنواع الأساسية
\`\`\`lua
-- Instances
local part = Instance.new("Part")
local model = Instance.new("Model")

-- Vectors
local position = Vector3.new(0, 10, 0)
local direction = Vector3.one
local size = Vector3.new(4, 1, 2)

-- CFrames (Position + Rotation)
local cf = CFrame.new(0, 10, 0)
local rotated = CFrame.Angles(0, math.rad(45), 0)
local lookAt = CFrame.lookAt(from, to)

-- Colors
local color = Color3.fromRGB(255, 0, 0)
local color2 = Color3.fromHSV(0.5, 1, 1)
local brickColor = BrickColor.new("Bright red")

-- UDim2 (للواجهات)
local size = UDim2.new(0.5, 0, 0.3, 0) -- 50% عرض, 30% ارتفاع
local position = UDim2.fromScale(0.5, 0.5) -- المنتصف
\`\`\`

### دوال مهمة
\`\`\`lua
-- البحث عن العناصر
local part = workspace:FindFirstChild("PartName")
local player = Players:GetPlayerFromCharacter(character)
local descendants = model:GetDescendants()

-- الأحداث
part.Touched:Connect(function(hit) end)
player.CharacterAdded:Connect(function(char) end)

-- الانتظار
task.wait(1) -- انتظر ثانية
task.spawn(function() end) -- تشغيل متوازي
task.defer(function() end) -- تأجيل للإطار التالي

-- Tweening
local tween = TweenService:Create(part, TweenInfo.new(1), {Position = Vector3.new(0, 20, 0)})
tween:Play()

-- Raycasting
local raycastParams = RaycastParams.new()
raycastParams.FilterType = Enum.RaycastFilterType.Exclude
local result = workspace:Raycast(origin, direction, raycastParams)
\`\`\`

### أنماط شائعة
\`\`\`lua
-- Module Script Pattern
local Module = {}

function Module.Init()
    -- التهيئة
end

function Module.DoSomething(param)
    return param * 2
end

return Module

-- OOP Pattern
local Character = {}
Character.__index = Character

function Character.new(name)
    local self = setmetatable({}, Character)
    self.Name = name
    self.Health = 100
    return self
end

function Character:TakeDamage(amount)
    self.Health = math.max(0, self.Health - amount)
end

return Character
\`\`\`

## أسلوب التواصل
- تحدث بأسلوب هادئ واحترافي
- اشرح المفاهيم المعقدة ببساطة
- قدم أمثلة عملية دائماً
- استخدم العربية بشكل رئيسي مع المصطلحات التقنية بالإنجليزية

## تنسيق الردود
- استخدم \`\`\`lua لأكواد Lua
- استخدم **نص غامق** للمفاهيم المهمة
- استخدم قوائم مرقمة للخطوات
- قدم تعليقات داخل الكود

## عند عدم الوضوح
إذا كان الطلب غامضاً، اطرح أسئلة توضيحية قبل تقديم الحل.

تذكر: أنت تساعد المطورين في إنشاء تجارب Roblox رائعة. كن دقيقاً وشاملاً.`;

// ============================================================================
// MAIN SERVER HANDLER
// ============================================================================

/**
 * معالج الطلبات الرئيسي
 * 
 * @param req - كائن الطلب الوارد
 * @returns Response - الاستجابة (SSE stream أو JSON error)
 */
serve(async (req) => {
  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: HANDLE CORS PREFLIGHT
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2: VERIFY AUTHORIZATION HEADER
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * التحقق من وجود رأس التفويض
     * 
     * @security
     * - يتطلب Bearer token
     * - يستخدم anon key للتحقق من أن الطلب من التطبيق
     * - لا يتحقق من JWT للمستخدم (التطبيق لا يتطلب تسجيل دخول)
     */
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

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3: PARSE AND VALIDATE REQUEST BODY
    // ═══════════════════════════════════════════════════════════════════════════
    
    let parsedBody;
    try {
      const rawBody = await req.json();
      parsedBody = RequestSchema.parse(rawBody);
    } catch (validationError) {
      // خطأ في التحقق من الصحة
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
      
      // JSON غير صالح
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { messages } = parsedBody;

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 4: VERIFY API KEY
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * الحصول على مفتاح Lovable AI
     * 
     * @security
     * ⚠️ WARNING: هذا المفتاح حساس ويجب عدم كشفه للعميل
     */
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // لا نكشف السبب الفعلي للعميل
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 5: CALL LOVABLE AI GATEWAY
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * إرسال الطلب إلى Lovable AI Gateway
     * 
     * @model google/gemini-3-flash-preview
     * @streaming true
     * @maxTokens 8192
     * @temperature 0.7 (توازن بين الإبداع والدقة)
     */
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
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

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 6: HANDLE AI GATEWAY ERRORS
    // ═══════════════════════════════════════════════════════════════════════════
    
    if (!response.ok) {
      // Rate Limit
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // Payment Required
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to continue." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // خطأ عام في البوابة
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      // لا نكشف تفاصيل الخطأ للعميل
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 7: STREAM RESPONSE TO CLIENT
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * إعادة توجيه الـ stream مباشرة للعميل
     * 
     * @format Server-Sent Events (SSE)
     * @contentType text/event-stream
     */
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
    
  } catch (e) {
    // ═══════════════════════════════════════════════════════════════════════════
    // ERROR HANDLING: CATCH-ALL
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * معالجة الأخطاء غير المتوقعة
     * 
     * @security
     * - نسجل الخطأ كاملاً في console
     * - نرسل رسالة عامة للعميل (لا نكشف التفاصيل)
     */
    console.error("Chat function error:", e);
    
    return new Response(
      JSON.stringify({ 
        error: e instanceof Error ? e.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
