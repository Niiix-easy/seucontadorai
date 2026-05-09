import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find documents that need retry, including those in dead-letter if auto_retry_on_reactivation is enabled
    const { data: docs, error: fetchError } = await supabaseClient
      .from("processed_documents")
      .select(`
        id,
        user_id,
        uf,
        environment,
        status,
        fiscal_configurations (
          is_suspended,
          auto_retry_on_reactivation,
          reactivation_throughput
        )
      `)
      .or('status.in.("error","pending"),and(status.eq.dead-letter,next_retry_at.lte.now())')
      .lte("next_retry_at", new Date().toISOString())
      .eq("is_processing", false)
      .limit(20);

    if (fetchError) throw fetchError;

    const results = [];
    if (docs && docs.length > 0) {
      // Group by user/uf/env to check granular suspension
      for (const doc of docs) {
        const { data: susp } = await supabaseClient
          .from("fiscal_suspension_states")
          .select("is_suspended, throughput_per_minute")
          .match({ user_id: doc.user_id, uf: doc.uf || 'SP', environment: doc.environment || 'homologacao' })
          .maybeSingle();

        if (susp?.is_suspended) {
          console.log(`Skipping doc ${doc.id} - suspended for ${doc.uf}/${doc.environment}`);
          continue;
        }

        // Handle dead-letter auto-retry logic
        if (doc.status === 'dead-letter' && !doc.fiscal_configurations?.auto_retry_on_reactivation) {
          continue;
        }

        try {
          const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/fiscal-engine`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
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
