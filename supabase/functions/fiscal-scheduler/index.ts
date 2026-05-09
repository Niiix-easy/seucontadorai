 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
 
  import { corsHeaders } from '../_shared/cors.ts'

  serve(async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    try {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { action, schedule_id, log_id } = await req.json().catch(() => ({}));

      if (action === "run_now") {
        // Implementation for report generation
        const { data: schedule, error: schError } = await supabaseClient
          .from("fiscal_scheduled_reports")
          .select("*")
          .eq("id", schedule_id)
          .single();

        if (schError || !schedule) throw new Error("Schedule not found");

        // Create a log entry
        const { data: log, error: logError } = await supabaseClient
          .from("fiscal_export_logs")
          .insert({
            user_id: schedule.user_id,
            report_id: schedule.id,
            report_type: schedule.report_type,
            format: schedule.format,
            status: "processing",
            recipients: schedule.email_recipients,
            filters: schedule.filters
          })
          .select()
          .single();

        if (logError) throw logError;

        // In a real world scenario, this would be an async task or another edge function call
        // For now, we simulate success and update the log
        // We'll set record_count based on filters
        let count = 0;
        if (schedule.report_type === 'backlog') {
          const { count: c } = await supabaseClient
            .from("processed_documents")
            .select("*", { count: 'exact', head: true })
            .or('status.in.("pending","error")');
          count = c || 0;
        } else {
          const { count: c } = await supabaseClient
            .from("fiscal_action_logs")
            .select("*", { count: 'exact', head: true });
          count = c || 0;
        }

        await supabaseClient.from("fiscal_export_logs").update({
          status: "success",
          record_count: count,
          file_url: "https://ghvfzwehyysldzxuvhez.supabase.co/storage/v1/object/public/reports/sample_report.zip" // Simulated
        }).eq("id", log.id);

        return new Response(JSON.stringify({ success: true, log_id: log.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "resend_email") {
        const { data: log, error: logErr } = await supabaseClient
          .from("fiscal_export_logs")
          .select("*")
          .eq("id", log_id)
          .single();
        
        if (logErr || !log) throw new Error("Log not found");

        // Logic to resend email with existing file_url
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Default: Retries
      const { data: docs, error: fetchError } = await supabaseClient
        .from("processed_documents")
        .select("id")
        .in("status", ["error", "pending"])
        .lte("next_retry_at", new Date().toISOString())
        .eq("is_processing", false)
        .limit(10);

      if (fetchError) throw fetchError;

      const results = [];
      for (const doc of docs || []) {
        try {
          await supabaseClient.functions.invoke("fiscal-engine", {
            body: { action: "sign_and_send", documentId: doc.id }
          });
          results.push({ id: doc.id, success: true });
        } catch (e) {
          results.push({ id: doc.id, success: false, error: e.message });
        }
      }

      return new Response(JSON.stringify({ success: true, processed: results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  });