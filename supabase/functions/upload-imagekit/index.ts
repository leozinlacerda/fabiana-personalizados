// Supabase Edge Function: upload-imagekit
// Gera token/signature para upload seguro sem expor private key no frontend
// Deploy: supabase functions deploy upload-imagekit --no-verify-jwt
// Env: IMAGEKIT_PRIVATE_KEY, IMAGEKIT_PUBLIC_KEY (no Supabase Dashboard > Edge Functions > Secrets)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Verifica auth (opcional: só admin pode fazer upload)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    
    // Gera parâmetros de autenticação ImageKit
    // ImageKit auth: token = uuid, expire = timestamp + 30min, signature = HMAC-SHA1(privateKey, token+expire)
    const privateKey = Deno.env.get("IMAGEKIT_PRIVATE_KEY");
    if (!privateKey) throw new Error("IMAGEKIT_PRIVATE_KEY não configurado nos secrets");

    const token = crypto.randomUUID();
    const expire = Math.floor(Date.now() / 1000) + 1800; // 30 min
    const toSign = token + expire;
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(privateKey);
    const msgData = encoder.encode(toSign);
    const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
    const sigBuffer = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
    const signature = Array.from(new Uint8Array(sigBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    return new Response(JSON.stringify({ token, expire: expire.toString(), signature }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
