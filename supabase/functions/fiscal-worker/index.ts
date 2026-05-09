import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find documents that need retry
    const { data: docs, error: fetchError } = await supabaseClient
      .from("processed_documents")
      .select("id")
      .in("status", ["error", "pending"])
      .lte("next_retry_at", new Date().toISOString())
      .eq("is_processing", false)
      .limit(10); // Process in small batches

    if (fetchError) throw fetchError;

    const results = [];
    if (docs && docs.length > 0) {
      for (const doc of docs) {
        try {
          // Trigger the fiscal-engine for each document
          // We use the service role key internally
          const response = await fetch(\`\${Deno.env.get("SUPABASE_URL")}/functions/v1/fiscal-engine\`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": \`Bearer \${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}\`
            },
            body: JSON.stringify({ action: "sign_and_send", documentId: doc.id })
          });
          results.push({ id: doc.id, success: response.ok });
        } catch (e) {
          results.push({ id: doc.id, success: false, error: e.message });
        }
      }
    }

    return new Response(JSON.stringify({ processed: docs?.length || 0, results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
