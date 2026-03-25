import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {

    const { cnpj } = await req.json();
    if (!cnpj) return Response.json({ error: 'CNPJ é obrigatório' }, { status: 400 });

    const apiKey = Deno.env.get("API_KEY");
    const cnpjLimpo = cnpj.replace(/\D/g, "");

    const response = await fetch(`https://api.cnpja.com/office/${cnpjLimpo}`, {
      headers: { 'Authorization': apiKey },
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: data.message || 'CNPJ não encontrado' }, { status: response.status });
    }

    // Retorna dados brutos para debug
    return Response.json({ _debug: data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});