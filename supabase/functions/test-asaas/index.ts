import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { api_key, ambiente } = await req.json();

    if (!api_key) {
      throw new Error("API Key é obrigatória");
    }

    const baseUrl = ambiente === "sandbox" 
      ? "https://sandbox.asaas.com/api/v3" 
      : "https://api.asaas.com/v3";

    console.log(`Testando conexão Asaas (${ambiente}) em ${baseUrl}`);

    const response = await fetch(`${baseUrl}/finance/balance`, {
      method: "GET",
      headers: {
        "access_token": api_key,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro na resposta do Asaas:", data);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: data.errors?.[0]?.description || "Erro ao conectar com o Asaas. Verifique sua API Key." 
        }),
        { 
          status: 200, // Returning 200 to handle the error in the frontend gracefully
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Conexão com o Asaas estabelecida com sucesso!",
        balance: data.balance 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: any) {
    console.error("Erro no teste de integração:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
