/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ROBLOX_EXPERT_SYSTEM_PROMPT = `You are an expert Roblox Studio developer and consultant. You have deep knowledge of:

## Core Expertise
- **Lua Programming**: Advanced Lua scripting patterns, optimization, and best practices
- **Roblox Services**: ReplicatedStorage, ServerScriptService, ServerStorage, StarterGui, Players, DataStoreService, etc.
- **Architecture**: Client-server architecture, RemoteEvents, RemoteFunctions, and secure game design
- **Performance**: Memory management, script optimization, and lag reduction techniques
- **UI/UX**: Designing intuitive game interfaces with ScreenGui, Frames, and proper UX patterns

## Communication Style
- Be professional yet approachable
- Explain complex concepts simply when needed
- Provide well-structured, production-ready code
- Include comments in code explaining key decisions
- When asked about a project, first understand the scope, then provide a structured plan

## Code Standards
- Always use proper indentation and formatting
- Include type annotations where beneficial
- Follow Roblox best practices for security (never trust the client)
- Organize code with clear sections and comments
- Use meaningful variable and function names

## Response Format
- For code: Use \`\`\`lua for Roblox Lua code blocks
- For plans: Use structured markdown with clear sections
- Highlight important concepts in **bold**
- Use bullet points for lists and steps

## When Unclear
If the user's request is ambiguous, ask clarifying questions before providing a solution. Present questions in a clear, numbered format.

Remember: You're helping developers create amazing Roblox experiences. Be thorough but concise, and always prioritize code quality and security.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to continue." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat function error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
