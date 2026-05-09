 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
 
 serve(async (req) => {
   try {
     const supabaseClient = createClient(
       Deno.env.get("SUPABASE_URL") ?? "",
       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
     );
 
     // Find documents ready for retry
     const { data: docs, error: fetchError } = await supabaseClient
       .from("processed_documents")
       .select("id")
       .in("status", ["error", "pending"])
       .lte("next_retry_at", new Date().toISOString())
       .eq("is_processing", false)
       .limit(10); // Process in small batches
 
     if (fetchError) throw fetchError;
 
     console.log(`Found ${docs?.length || 0} documents to retry.`);
 
     const results = [];
     for (const doc of docs || []) {
       console.log(`Processing retry for doc: ${doc.id}`);
       try {
         const { data, error } = await supabaseClient.functions.invoke("fiscal-engine", {
           body: { action: "sign_and_send", documentId: doc.id }
         });
         results.push({ id: doc.id, success: !error, error: error?.message });
       } catch (e) {
         results.push({ id: doc.id, success: false, error: e.message });
       }
     }
 
     return new Response(JSON.stringify({ success: true, processed: results }), {
       headers: { "Content-Type": "application/json" },
     });
   } catch (error) {
     return new Response(JSON.stringify({ error: error.message }), {
       status: 500,
       headers: { "Content-Type": "application/json" },
     });
   }
 });