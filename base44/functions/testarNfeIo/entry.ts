import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const NFE_IO_BASE = "https://api.nfe.io/v1";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = Deno.env.get("NFE_IO_API_KEY");
    if (!apiKey) return Response.json({ error: 'NFE_IO_API_KEY não configurada' }, { status: 500 });

    const { companyId, inscricao_municipal } = await req.json();

    const headers = {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    };

    // Se houver inscrição municipal, envia para o NFE.io antes de testar
    if (inscricao_municipal) {
      const patchUrl = `${NFE_IO_BASE}/companies/${companyId}`;
      const patchBody = JSON.stringify({
        municipalTaxNumber: inscricao_municipal,
      });
      console.log('Atualizando inscrição municipal no NFE.io...');
      const patchResp = await fetch(patchUrl, {
        method: 'PUT',
        headers,
        body: patchBody,
      });
      const patchText = await patchResp.text();
      console.log('PATCH status:', patchResp.status, 'body:', patchText);
    }

    // Testa a conexão consultando a empresa
    const url = `${NFE_IO_BASE}/companies/${companyId}`;
    console.log('Testando URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const rawText = await response.text();
    console.log('Status:', response.status);
    console.log('Resposta:', rawText);

    let result;
    try { result = JSON.parse(rawText); } catch { result = rawText; }

    return Response.json({
      companyId,
      status: response.status,
      ok: response.ok,
      data: result,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});