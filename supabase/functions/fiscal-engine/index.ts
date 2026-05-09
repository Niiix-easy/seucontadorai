import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import forge from "https://esm.sh/node-forge@1.3.1";
import { SignedXml } from "https://esm.sh/xml-crypto@3.0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple encryption/decryption using the secret key
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

async function encryptPassword(password: string) {
  const keyStr = Deno.env.get("FISCAL_ENCRYPTION_KEY");
  if (!keyStr) return password;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(keyStr.padEnd(32, '0').slice(0, 32)),
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(16));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    key,
    new TextEncoder().encode(password)
  );

  const ivStr = String.fromCharCode(...iv);
  const encryptedStr = String.fromCharCode(...new Uint8Array(encrypted));
  
  return forge.util.encode64(ivStr + encryptedStr);
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { action, documentId, password } = await req.json();

    if (action === "update_password") {
      const encrypted = await encryptPassword(password);
      const authHeader = req.headers.get("Authorization");
      const { data: { user } } = await supabaseClient.auth.getUser(authHeader?.split(" ")[1] ?? "");
      
      if (!user) throw new Error("Não autorizado");

      const { error } = await supabaseClient
        .from("fiscal_configurations")
        .update({ certificate_password_encrypted: encrypted })
        .eq("user_id", user.id);
      
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "sign_and_send") {
      await supabaseClient.from("processed_documents").update({ is_processing: true }).eq("id", documentId);

      const { data: doc, error: docError } = await supabaseClient
        .from("processed_documents")
        .select("*, fiscal_configurations(*)")
        .eq("id", documentId)
        .single();

      if (docError || !doc) throw new Error("Documento não encontrado");

      const config = doc.fiscal_configurations;
      if (!config.certificate_path || !config.certificate_password_encrypted) {
        throw new Error("Certificado ou senha não configurados");
      }

      const decryptedPass = await decryptPassword(config.certificate_password_encrypted);

      const { data: pfxData, error: downloadError } = await supabaseClient.storage
        .from("certificates")
        .download(config.certificate_path);

      if (downloadError) throw new Error("Erro ao baixar certificado: " + downloadError.message);

      const pfxArrayBuffer = await pfxData.arrayBuffer();
      const pfxBytes = new Uint8Array(pfxArrayBuffer);
      
      const p12Asn1 = forge.asn1.fromDer(forge.util.createBuffer(pfxBytes as any).getBytes());
      const p12 = forge.pkcs12.fromP12(p12Asn1, decryptedPass);
      
      const bags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const keyBag = bags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag]?.[0];

      if (!keyBag || !certBag) throw new Error("Certificado inválido ou senha incorreta");

      const privateKeyPem = forge.pki.privateKeyToPem(keyBag.key);
      const certPem = forge.pki.certificateToPem(certBag.cert);

      const signedXml = await signXml(doc.xml_content, privateKeyPem, certPem);

      try {
        const response = await sendToSefaz(signedXml, config.uf, config.environment);
        const responseText = await response.text();
        
        const cStat = responseText.match(/<cStat>(.*?)<\/cStat>/)?.[1];
        const xMotivo = responseText.match(/<xMotivo>(.*?)<\/xMotivo>/)?.[1];
        const nProt = responseText.match(/<nProt>(.*?)<\/nProt>/)?.[1];

        if (cStat === "100") {
          await supabaseClient.from("processed_documents").update({
            status: "authorized",
            signed_xml_content: signedXml,
            protocol_number: nProt || "—",
            sefaz_response_code: cStat,
            sefaz_response_message: xMotivo,
            is_processing: false,
            processing_log: [...(doc.processing_log || []), { timestamp: new Date().toISOString(), event: "Autorizado pela SEFAZ" }]
          }).eq("id", documentId);
        } else {
          throw new Error(`SEFAZ [${cStat}]: ${xMotivo}`);
        }
      } catch (error) {
        const newRetryCount = (doc.retry_count || 0) + 1;
        const maxRetries = config.max_retries || 5;
        const delay = config.retry_delay_minutes || 15;
        
        const status = newRetryCount >= maxRetries ? "failed_permanently" : "error";
        const nextRetry = status === "error" 
          ? new Date(Date.now() + 1000 * 60 * delay).toISOString() 
          : null;

        await supabaseClient.from("processed_documents").update({
          status,
          last_error: error.message,
          retry_count: newRetryCount,
          next_retry_at: nextRetry,
          is_processing: false,
            processing_log: [...(doc.processing_log || []), { timestamp: new Date().toISOString(), event: `Erro: ${error.message}` }]
        }).eq("id", documentId);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), { status: 400 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
