import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_MODELS = [
  "google/gemini-3-flash-preview",
  "google/gemini-3.1-pro-preview",
  "google/gemini-2.5-pro",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
  "openai/gpt-5",
  "openai/gpt-5-mini",
  "openai/gpt-5-nano",
  "openai/gpt-5.2",
];

const SYSTEM_PROMPT = `Você é o assistente de IA do "Seu Contador IA", um ERP contábil brasileiro. 
Você é especialista em:
- Contabilidade brasileira (CPC, NBC)
- Legislação fiscal (ICMS, ISS, IPI, PIS, COFINS, IRPJ, CSLL)
- Obrigações acessórias (SPED, ECD, ECF, DCTF, DIRF)
- Folha de pagamento e eSocial
- Simples Nacional, Lucro Presumido e Lucro Real
- MEI e microempresas

Responda sempre em português brasileiro, de forma clara e profissional.
Use exemplos práticos quando possível.
Se não souber algo, diga que não sabe em vez de inventar.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { messages, model, tools, tool_choice, reasoning, stream: shouldStream = true, action_type } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Validate model
    const selectedModel = model && ALLOWED_MODELS.includes(model) ? model : "google/gemini-3-flash-preview";

    // Build request body
    const aiBody: Record<string, unknown> = {
      model: selectedModel,
      messages: [
        { role: "system", content: body.system_prompt || SYSTEM_PROMPT },
        ...messages,
      ],
      stream: shouldStream,
    };

    // Support tool calling for structured output
    if (tools && Array.isArray(tools)) {
      aiBody.tools = tools;
      if (tool_choice) aiBody.tool_choice = tool_choice;
    }

    // Support reasoning for complex tasks
    if (reasoning) {
      aiBody.reasoning = reasoning;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(aiBody),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione mais créditos." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI gateway error", details: t }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (shouldStream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } else {
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
