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

    // Se houver inscrição municipal, tenta atualizar no NFE.io
    if (inscricao_municipal) {
      const patchUrl = `${NFE_IO_BASE}/companies/${companyId}`;
      const patchResp = await fetch(patchUrl, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ municipalTaxNumber: inscricao_municipal }),
      });
      const patchText = await patchResp.text();
      console.log('PATCH municipal status:', patchResp.status, patchText);
    }

    // Testa a conexão consultando a empresa
    const url = `${NFE_IO_BASE}/companies/${companyId}`;
    const response = await fetch(url, { method: 'GET', headers });

    const rawText = await response.text();
    console.log('GET status:', response.status, rawText);

    let result;
    try { result = JSON.parse(rawText); } catch { result = rawText; }

    // Trata especificamente o erro de inscrição municipal ausente
    const isMunicipalError = !response.ok && (
      result?.errors?.some(e => e.code === 40401) ||
      rawText.includes('municipal tax not found')
    );

    if (isMunicipalError) {
      return Response.json({
        companyId,
        status: response.status,
        ok: false,
        municipal_error: true,
        data: result,
        message: 'Empresa encontrada, mas a Inscrição Municipal (ISS) não está configurada no NFE.io. Preencha o campo "Inscrição Municipal" e salve antes de testar, ou configure diretamente no painel do NFE.io.',
      });
    }

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