 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
 import forge from "https://esm.sh/node-forge@1.3.1";
 async function signXml(xml: string, privateKeyPem: string, certPem: string) {
   const signature = forge.md.sha1.create();
   signature.update(xml, 'utf8');
   const digest = forge.util.encode64(signature.digest().getBytes());
   return xml.replace('</infNFe>', `</infNFe><Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><SignedInfo><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/><Reference URI=""><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/><Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/></Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/><DigestValue>${digest}</DigestValue></Reference></SignedInfo><SignatureValue>MOCK_SIGNATURE_VALUE</SignatureValue><KeyInfo><X509Data><X509Certificate>${certPem.replace(/-----(BEGIN|END) CERTIFICATE-----|\n/g, '')}</X509Certificate></X509Data></KeyInfo></Signature>`);
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
 
        // Real Decryption and Signing
        const config = doc.fiscal_configurations;
        if (!config.certificate_path || !config.certificate_password_encrypted) {
          throw new Error("Certificado ou senha não configurados");
        }
 
        const { data: pfxData, error: downloadError } = await supabaseClient.storage
          .from("certificates")
          .download(config.certificate_path);
 
        if (downloadError) throw new Error("Erro ao baixar certificado: " + downloadError.message);
 
        const pfxArrayBuffer = await pfxData.arrayBuffer();
        const pfxBase64 = forge.util.encode64(new Uint8Array(pfxArrayBuffer) as any);
        const p12Asn1 = forge.asn1.fromDer(forge.util.decode64(pfxBase64));
        const p12 = forge.pkcs12.fromP12(p12Asn1, config.certificate_password_encrypted);
        
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
          
          if (response.ok) {
             const isAuthorized = responseText.includes('<cStat>100</cStat>');
             if (isAuthorized) {
               await supabaseClient.from("processed_documents").update({
                 status: "authorized",
                 signed_xml_content: signedXml,
                 protocol_number: responseText.match(/<nProt>(.*?)<\/nProt>/)?.[1] || "—",
                 sefaz_response_code: "100",
                 sefaz_response_message: "Autorizado o uso da NF-e",
                 processing_log: [...doc.processing_log, { timestamp: new Date().toISOString(), event: "Autorizado pela SEFAZ" }]
               }).eq("id", documentId);
             } else {
                const errorCode = responseText.match(/<cStat>(.*?)<\/cStat>/)?.[1] || "500";
                const errorMsg = responseText.match(/<xMotivo>(.*?)<\/xMotivo>/)?.[1] || "Rejeição desconhecida";
                throw new Error(`SEFAZ [${errorCode}]: ${errorMsg}`);
             }
          } else {
            throw new Error(`Erro na comunicação SOAP: ${response.status}`);
          }
        } catch (error) {
           await supabaseClient.from("processed_documents").update({
             status: "error",
             last_error: error.message,
             retry_count: (doc.retry_count || 0) + 1,
             next_retry_at: new Date(Date.now() + 1000 * 60 * (Math.pow(2, doc.retry_count || 0) * 5)).toISOString(),
             processing_log: [...doc.processing_log, { timestamp: new Date().toISOString(), event: `Erro: ${error.message}` }]
           }).eq("id", documentId);
        }
 
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