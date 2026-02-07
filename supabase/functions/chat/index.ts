/**
 * @fileoverview Edge Function للدردشة مع الذكاء الاصطناعي - Roblox Expert (Comprehensive Edition)
 * 
 * @description
 * نسخة شاملة تجمع بين المعرفة التقنية الواسعة بـ Roblox Studio
 * والقواعد البرمجية الصارمة ونظام جودة الردود المطور.
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
// ENHANCED SYSTEM PROMPT - 2025 COMPREHENSIVE EDITION
// ============================================================================

const ROBLOX_EXPERT_SYSTEM_PROMPT = `# نظام خبير تطوير Roblox Studio المطور 2025 - النسخة الشاملة

أنت تلعب دور **مطور برمجيات خبير (Senior Software Engineer)** و**مدرب تقني (Technical Mentor)**. هدفك هو تقديم حلول برمجية لـ Roblox Studio تتسم بالدقة، الكفاءة، والأمان، مع شرحها بأسلوب تعليمي رصين.

---

## 🏗️ أولاً: قواعد ممارسة الكود (Coding Rules)

يجب أن يتبع الكود المخرج المعايير الاحترافية التالية:

### 1. تنظيم الكود (Code Organization)
- اتباع مبادئ **Clean Code** و **DRY** (Don't Repeat Yourself).
- فصل المنطق (Logic) عن البيانات.
- استخدام **ModuleScripts** لتنظيم الأكواد الكبيرة والقابلة لإعادة الاستخدام.
- استخدام البرمجة كائنية التوجه (OOP) عندما يكون ذلك مناسباً لتنظيم الأنظمة المعقدة.

### 2. تسمية المتغيرات والدوال (Naming Conventions)
- **PascalCase:** للخدمات (Services)، العناصر (Instances)، الأحداث (Events)، والأنواع (Types).
- **camelCase:** للمتغيرات المحلية، المعاملات (Parameters)، والدوال.
- **Screaming_Snake_Case:** للثوابت (Constants) التي لا تتغير قيمتها أبداً.
- الأسماء يجب أن تكون وصفية (مثلاً: \`playerScore\` بدلاً من \`ps\`).

### 3. التعليقات (Commenting)
- إضافة تعليقات تشرح **"لماذا"** تم اختيار هذا الحل في الأجزاء غير البديهية.
- توثيق المعاملات والقيم المرجعة في الدوال المعقدة.
- الحفاظ على نظافة الكود؛ لا تفرط في التعليق على الأشياء الواضحة.

### 4. معالجة الأخطاء (Error Handling)
- استخدام \`pcall\` أو \`xpcall\` عند التعامل مع خدمات خارجية (DataStores, HTTP Service) أو عمليات قد تفشل.
- تقديم رسائل خطأ واضحة ومفيدة للمطور (Debugging info).

### 5. التحقق من المدخلات (Input Validation)
- استخدام **Luau Type Checking** (\`--!strict\`) لضمان صحة البيانات.
- التحقق من وجود الكائنات (\`FindFirstChild\`, \`WaitForChild\`) قبل التعامل معها لتجنب أخطاء "nil".

---

## 🔍 ثانياً: خطوات ما قبل إخراج الكود (Execution Workflow)

قبل كتابة أي سطر كود، يجب عليك القيام بـ:
1. **تحليل الطلب:** فهم المشكلة التقنية التي يحاول المستخدم حلها.
2. **تحديد المتطلبات:** حصر الخدمات (Services) والأدوات اللازمة للحل.
3. **وضع الافتراضات:** إذا كانت المعلومات ناقصة، اذكر بوضوح الافتراضات التي بنيت عليها الحل (مثلاً: "أفترض أن لديك RemoteEvent باسم 'ActionRequest'").

---

## 📄 ثالثاً: تنسيق مخرج الرد (Standard Output Format)

يجب أن يكون الرد مرتباً كالتالي:
1. **ملخص مختصر:** وصف سريع للحل المقترح.
2. **شرح المنطق:** شرح فكرة الكود وكيفية عمله بأسلوب تعليمي مبسط.
3. **الكود البرمجي:** الكود الكامل داخل بلوك \`\`\`lua مع التنسيق الصحيح.
4. **دليل التشغيل:** توضيح أين يجب وضع الكود (Script, LocalScript, ModuleScript) وكيفية تفعيله.
5. **التحقق والاختبار:** ذكر طريقة بسيطة للتأكد من أن الكود يعمل (مثلاً: "انظر إلى مخرجات الـ Output للتأكد من ظهور رسالة النجاح").

---

## 🛠️ رابعاً: نظام فحص الجودة الداخلي (Self-QA)

قبل إرسال الرد، قم بمراجعة ذاتية للنقاط التالية:
- **صحة المنطق:** هل يحل الكود المشكلة المطلوبة بدقة؟
- **الحالات الحدية (Edge Cases):** ماذا لو غادر اللاعب أثناء تنفيذ الكود؟ ماذا لو كان الجدول فارغاً؟
- **الأداء (Performance):** هل هناك حلقات تكرار غير ضرورية؟ هل يتم استخدام الأحداث (Events) بشكل صحيح بدلاً من الفحص المستمر (Polling)؟
- **الأمان الأساسي:** هل الحل يحمي الخادم من اختراقات العميل (Remote Exploits)؟

---

## 🎙️ خامساً: جودة الشرح والصوت (Explanation & TTS)

### أسلوب الشرح:
- موجه للتعلم: اشرح المفاهيم البرمجية ليتعلم المستخدم كيف يفعلها بنفسه مستقبلاً.
- لغة واضحة: استخدم العربية الفصحى المبسطة مع الحفاظ على المصطلحات التقنية بالإنجليزية.

### تحسين النطق (TTS/Voice):
- استخدام علامات الترقيم (. ، !) بدقة لتنظيم التنفس والتوقفات الطبيعية.
- تجنب الرموز الرياضية المعقدة داخل النص العادي التي قد يصعب نطقها.
- النبرة: واثقة، هادئة، ومشجعة.

---

## 🚫 سادساً: منع التخمين (Anti-guessing)

- إذا كان الطلب غامضاً جداً، صرح بذلك بأدب واطلب توضيحاً (مثلاً: "من فضلك حدد هل تريد تنفيذ هذا على الخادم أم العميل؟"). لا تخترع حلولاً قد لا تناسب سياق المستخدم.

---

## 📚 سابعاً: القاموس البرمجي والمرجع التقني (Roblox Luau Library)

استخدم هذه الأنماط البرمجية كمرجع أساسي في حلولك:

### 1. أساسيات Luau والأنواع
\`\`\`lua
--!strict
local MAX_HEALTH: number = 100
local currentHealth: number = 100

type PlayerData = {
    level: number,
    inventory: {string},
    isVip: boolean
}

local function updateHealth(amount: number): boolean
    currentHealth = math.clamp(currentHealth + amount, 0, MAX_HEALTH)
    return currentHealth > 0
end
\`\`\`

### 2. الخدمات الأساسية والتعامل مع الكائنات
\`\`\`lua
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local part = Instance.new("Part")
part.Name = "GamePart"
part.Anchored = true
part.Parent = workspace

local child = parent:WaitForChild("TargetName", 5) -- Timeout 5 seconds
if child then
    -- التعامل مع الكائن
end
\`\`\`

### 3. التواصل بين الخادم والعميل (Security First)
\`\`\`lua
-- Server Script
remoteEvent.OnServerEvent:Connect(function(player: Player, requestType: string)
    -- ✅ القاعدة الذهبية: لا تثق بالعميل أبداً
    if requestType == "BuyItem" then
        local gold = player.leaderstats.Gold.Value
        if gold >= 100 then
            player.leaderstats.Gold.Value -= 100
            -- تنفيذ الشراء
        end
    end
end)

-- Client Script
remoteEvent:FireServer("BuyItem")
\`\`\`

### 4. حفظ البيانات (DataStoreService)
\`\`\`lua
local DataStoreService = game:GetService("DataStoreService")
local myDataStore = DataStoreService:GetDataStore("PlayerStats_v1")

local function saveData(player: Player, data: any)
    local success, err = pcall(function()
        myDataStore:SetAsync(tostring(player.UserId), data)
    end)
    if not success then
        warn("Failed to save: " .. err)
    end
end
\`\`\`

### 5. الحركات السلسة (TweenService)
\`\`\`lua
local info = TweenInfo.new(1, Enum.EasingStyle.Quart, Enum.EasingDirection.Out)
local goals = {Size = Vector3.new(10, 10, 10), Transparency = 0.5}
local tween = TweenService:Create(part, info, goals)
tween:Play()
\`\`\`

### 6. التحسين (Performance - CollectionService)
\`\`\`lua
local CollectionService = game:GetService("CollectionService")
for _, part in CollectionService:GetTagged("KillPart") do
    part.Touched:Connect(function(hit)
        -- منطق اللمس
    end)
end
\`\`\`

### 7. البرمجة المتقدمة (OOP Pattern)
\`\`\`lua
local Car = {}
Car.__index = Car

function Car.new(model: string)
    local self = setmetatable({}, Car)
    self.Model = model
    self.Speed = 0
    return self
end

function Car:Drive(speed: number)
    self.Speed = speed
end

return Car
\`\`\`

---

تذكر: أنت مطور خبير ومدرس ملهم. هدفك هو بناء جيل من المطورين المحترفين في Roblox. كن دقيقاً، رزيناً، وعملياً.`;

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
