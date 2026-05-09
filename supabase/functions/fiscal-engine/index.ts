 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
 
   try {
     const supabaseClient = createClient(
       Deno.env.get("SUPABASE_URL") ?? "",
       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
       { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
     );
 
     const { action, documentId } = await req.json();
 
     if (action === "sign_and_send") {
       // 1. Get document and fiscal config
       const { data: doc, error: docError } = await supabaseClient
         .from("processed_documents")
         .select("*, fiscal_configurations(*)")
         .eq("id", documentId)
         .single();
 
       if (docError || !doc) throw new Error("Documento não encontrado");
 
       // 2. Mocking actual signing logic (would require node-forge or similar for PFX)
       // In a real scenario, we would decrypt the password here and use the certificate from storage
       console.log(`Assinando documento ${documentId} para UF ${doc.fiscal_configurations.uf}`);
 
       const signedXml = doc.xml_content.replace("<infNFe", `<infNFe Id="NFe${Math.random().toString().slice(2, 12)}"`);
       
       // 3. Update status to 'sent'
       await supabaseClient.from("processed_documents").update({
         status: "sent",
         signed_xml_content: signedXml,
         processing_log: [...doc.processing_log, { timestamp: new Date().toISOString(), event: "XML assinado e enviado para SEFAZ" }]
       }).eq("id", documentId);
 
       // 4. Simulate SEFAZ response
       setTimeout(async () => {
         const success = Math.random() > 0.2; // 80% success rate
         if (success) {
           await supabaseClient.from("processed_documents").update({
             status: "authorized",
             protocol_number: "135" + Math.floor(Math.random() * 100000000),
             sefaz_response_code: "100",
             sefaz_response_message: "Autorizado o uso da NF-e",
             processing_log: [...doc.processing_log, { timestamp: new Date().toISOString(), event: "Autorizado pela SEFAZ" }]
           }).eq("id", documentId);
         } else {
           await supabaseClient.from("processed_documents").update({
             status: "error",
             last_error: "Rejeição: Falha na comunicação com a SEFAZ (Timeout)",
             retry_count: (doc.retry_count || 0) + 1,
             next_retry_at: new Date(Date.now() + 1000 * 60 * 5).toISOString(), // 5 min later
             processing_log: [...doc.processing_log, { timestamp: new Date().toISOString(), event: "Erro na transmissão: Rejeição Timeout" }]
           }).eq("id", documentId);
         }
       }, 2000);
 
       return new Response(JSON.stringify({ success: true, message: "Processamento iniciado" }), {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     return new Response(JSON.stringify({ error: "Ação inválida" }), { status: 400 });
   } catch (error) {
     return new Response(JSON.stringify({ error: error.message }), {
       headers: { ...corsHeaders, "Content-Type": "application/json" },
       status: 500,
     });
   }
 });