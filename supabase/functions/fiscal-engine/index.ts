import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import forge from "https://esm.sh/node-forge@1.3.1";
import { SignedXml } from "https://esm.sh/xml-crypto@3.0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function decryptPassword(encryptedBase64: string) {
  const keyStr = Deno.env.get("FISCAL_ENCRYPTION_KEY");
  if (!keyStr) return encryptedBase64;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(keyStr.padEnd(32, '0').slice(0, 32)),
      { name: "AES-CBC" },
      false,
      ["decrypt"]
    );
    const combined = forge.util.decode64(encryptedBase64);
    const iv = new TextEncoder().encode(combined.slice(0, 16));
    const data = combined.slice(16);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv },
      key,
      new Uint8Array([...data].map(c => c.charCodeAt(0)))
    );
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error("Decryption error:", e);
    return encryptedBase64;
  }
}

async function signXml(xml: string, privateKeyPem: string, certPem: string) {
  const sig = new SignedXml();
  sig.addReference("//*[local-name(.)='infNFe']", 
    ["http://www.w3.org/2000/09/xmldsig#enveloped-signature", "http://www.w3.org/TR/2001/REC-xml-c14n-20010315"],
    "http://www.w3.org/2000/09/xmldsig#sha1"
  );
  sig.signingKey = privateKeyPem;
  sig.keyInfoProvider = {
    getKeyInfo: () => `<X509Data><X509Certificate>${certPem.replace(/-----(BEGIN|END) CERTIFICATE-----|\n/g, '')}</X509Certificate></X509Data>`,
    getKey: () => privateKeyPem
  };
  sig.computeSignature(xml, { 
    location: { reference: "//*[local-name(.)='infNFe']", action: "after" } 
  });
  return sig.getSignedXml();
}

async function sendToSefaz(signedXml: string, uf: string, env: string) {
  const endpoint = env === 'producao' 
    ? `https://nfe.sefaz.${uf.toLowerCase()}.gov.br/ws/NFeAutorizacao4`
    : `https://homologacao.nfe.sefaz.${uf.toLowerCase()}.gov.br/ws/NFeAutorizacao4`;

  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">${signedXml}</nfeDadosMsg>
  </soap12:Body>
</soap12:Envelope>`;

  return await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/soap+xml; charset=utf-8' },
    body: soapEnvelope
  });
}

async function updateSuspensionState(supabase: any, userId: string, uf: string, environment: string, success: boolean) {
  const { data: state } = await supabase
    .from("fiscal_suspension_states")
    .select("*")
    .match({ user_id: userId, uf, environment })
    .maybeSingle();

  if (success) {
    if (state) {
      await supabase.from("fiscal_suspension_states").update({ 
        consecutive_failures: 0, 
        is_suspended: false,
        updated_at: new Date().toISOString() 
      }).match({ user_id: userId, uf, environment });
    }
  } else {
    const failures = (state?.consecutive_failures || 0) + 1;
    const isSuspended = failures >= 5;
    await supabase.from("fiscal_suspension_states").upsert({
      user_id: userId,
      uf,
      environment,
      consecutive_failures: failures,
      is_suspended: isSuspended,
      last_failure_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    return isSuspended;
  }
  return false;
}

 async function queueDeadLetterNotification(supabase: any, userId: string, doc: any, cStat: string, xMotivo: string) {
   const { data: prefs } = await supabase
     .from("notification_preferences")
     .select("dead_letter_alerts_email, dead_letter_alerts_push")
     .eq("user_id", userId)
     .maybeSingle();

   const channels = [];
   if (prefs?.dead_letter_alerts_push !== false) channels.push('push');
   if (prefs?.dead_letter_alerts_email) channels.push('email');

   await supabase.from("dead_letter_notifications").insert({
     user_id: userId,
     document_id: doc.id,
     cstat: cStat,
     xmotivo: xMotivo,
     channels,
     status: 'pending',
     retry_count_at_failure: doc.retry_count,
     last_receipt_number: doc.receipt_number
   });

   // Also create/update a summary for batch alerts
   const { data: summary } = await supabase
     .from("dead_letter_summaries")
     .select("*")
     .match({ user_id: userId, status: 'pending' })
     .maybeSingle();

   if (summary) {
     const docIds = [...(summary.document_ids || []), doc.id];
     const cstats = Array.from(new Set([...(summary.cstat_summary || []), cStat]));
     await supabase.from("dead_letter_summaries").update({
       document_ids: docIds,
       cstat_summary: cstats,
       event_summary: `Resumo: ${docIds.length} documentos em dead-letter. cStats: ${cstats.join(', ')}`
     }).eq("id", summary.id);
   } else {
     await supabase.from("dead_letter_summaries").insert({
       user_id: userId,
       document_ids: [doc.id],
       cstat_summary: [cStat],
       event_summary: `Documento ${doc.id.slice(0, 8)} entrou em dead-letter. cStat: ${cStat}`,
       channels,
       status: 'pending'
     });
   }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const { action, documentId, userId: forcedUserId, uf: forcedUf, environment: forcedEnv } = await req.json();

     if (action === "sign_and_send" || action === "manual_retry_batch") {
       if (action === "manual_retry_batch") {
         const { uf, environment, userId } = await req.json();
         const { data: config } = await supabaseClient
           .from("fiscal_configurations")
           .select("reactivation_throughput")
           .eq("user_id", userId)
           .single();
         
         const limit = config?.reactivation_throughput || 10;
 
         const { data: docsToRetry } = await supabaseClient
           .from("processed_documents")
           .select("id")
           .match({ user_id: userId, uf, environment })
           .in("status", ["error", "dead-letter"])
           .eq("is_processing", false)
           .limit(limit);
 
         if (!docsToRetry || docsToRetry.length === 0) {
           return new Response(JSON.stringify({ success: true, count: 0, message: "Nenhum documento para reprocessar." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
         }
 
         const ids = docsToRetry.map(d => d.id);
         await supabaseClient
           .from("processed_documents")
           .update({ 
             status: "pending", 
             next_retry_at: new Date().toISOString(),
             last_error: "Disparado via reprocessamento manual"
           })
           .in("id", ids);
 
         // Trigger logging
         await supabaseClient.from("fiscal_action_logs").insert({
           user_id: userId,
           action: "manual_retry",
           uf,
           environment,
           reason: "Reprocessamento manual disparado pelo usuário"
         });
 
         return new Response(JSON.stringify({ success: true, count: ids.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
       }
 
      const { data: doc, error: docError } = await supabaseClient
        .from("processed_documents")
        .select("*, fiscal_configurations(*)")
        .eq("id", documentId)
        .single();

      if (docError || !doc) throw new Error("Documento não encontrado");

      const config = doc.fiscal_configurations;
      const uf = doc.uf || config.uf;
      const env = doc.environment || config.environment;

      const { data: suspState } = await supabaseClient
        .from("fiscal_suspension_states")
        .select("is_suspended")
        .match({ user_id: doc.user_id, uf, environment: env })
        .maybeSingle();

      if (suspState?.is_suspended) {
        throw new Error(`Motor fiscal suspenso para ${uf} em ${env}.`);
      }

      await supabaseClient.from("processed_documents").update({ is_processing: true }).eq("id", documentId);

      try {
        const decryptedPass = await decryptPassword(config.certificate_password_encrypted);
        const { data: pfxData, error: downloadError } = await supabaseClient.storage.from("certificates").download(config.certificate_path);
        if (downloadError) throw downloadError;

        const pfxBytes = new Uint8Array(await pfxData.arrayBuffer());
        const p12Asn1 = forge.asn1.fromDer(forge.util.createBuffer(pfxBytes as any).getBytes());
        const p12 = forge.pkcs12.fromP12(p12Asn1, decryptedPass);
        
        const keyBag = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
        const certBag = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag]?.[0];

        if (!keyBag || !certBag) throw new Error("Certificado ou senha inválidos.");

        await updateSuspensionState(supabaseClient, doc.user_id, uf, env, true);

        const signedXml = await signXml(doc.xml_content, forge.pki.privateKeyToPem(keyBag.key), forge.pki.certificateToPem(certBag.cert));
        const response = await sendToSefaz(signedXml, uf, env);
        const responseText = await response.text();
        
        const getTag = (tag: string) => (responseText.match(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 'i')) || [])[1];
        const cStat = getTag("cStat");
        const xMotivo = getTag("xMotivo");
        const nProt = getTag("nProt");

        if (cStat === "100" || cStat === "101" || cStat === "102") {
          await supabaseClient.from("processed_documents").update({
            status: "authorized",
            signed_xml_content: signedXml,
            protocol_number: nProt || "—",
            sefaz_response_code: cStat,
            sefaz_response_message: xMotivo,
            is_processing: false,
            processing_log: [...(doc.processing_log || []), { timestamp: new Date().toISOString(), event: "Autorizado pela SEFAZ", cStat, xMotivo }]
          }).eq("id", documentId);
        } else {
          throw new Error(`SEFAZ [${cStat || 'ERRO'}]: ${xMotivo || 'Erro desconhecido'}`);
        }
      } catch (error) {
        const cStat = error.message.match(/\[(.*?)\]/)?.[1] || "ERROR";
        const xMotivo = error.message;
        
        await updateSuspensionState(supabaseClient, doc.user_id, uf, env, false);

        const newRetryCount = (doc.retry_count || 0) + 1;
        const maxRetries = config.max_retries || 5;
        const status = newRetryCount >= maxRetries ? "dead-letter" : "error";
        const nextRetry = status === "error" ? new Date(Date.now() + 1000 * 60 * (config.retry_delay_minutes || 15)).toISOString() : null;

        await supabaseClient.from("processed_documents").update({
          status,
          last_error: error.message,
          retry_count: newRetryCount,
          next_retry_at: nextRetry,
          is_processing: false,
          processing_log: [...(doc.processing_log || []), { timestamp: new Date().toISOString(), event: `Falha: ${error.message}`, cStat }]
        }).eq("id", documentId);

        if (status === "dead-letter") {
          await queueDeadLetterNotification(supabaseClient, doc.user_id, { ...doc, retry_count: newRetryCount }, cStat, xMotivo);
        }
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: "Ação inválida" }), { status: 400 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
