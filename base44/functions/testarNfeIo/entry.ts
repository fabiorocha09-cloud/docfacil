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

    const companyUrl = `${NFE_IO_BASE}/companies/${companyId}`;

    // Se tem inscrição municipal, tenta atualizar na NFE.io via PUT com só esse campo
    if (inscricao_municipal) {
      console.log('Tentando atualizar inscrição municipal via PUT...');
      const putResp = await fetch(companyUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ municipalTaxNumber: inscricao_municipal }),
      });
      const putRaw = await putResp.text();
      console.log('PUT status:', putResp.status, putRaw);

      // Tenta GET após PUT para confirmar
      const getAfterPut = await fetch(companyUrl, { method: 'GET', headers });
      const getAfterRaw = await getAfterPut.text();
      console.log('GET após PUT status:', getAfterPut.status, getAfterRaw);

      if (getAfterPut.ok) {
        let result;
        try { result = JSON.parse(getAfterRaw); } catch { result = getAfterRaw; }
        return Response.json({ companyId, status: getAfterPut.status, ok: true, data: result });
      }
    }

    // Teste simples de conexão
    const getResp = await fetch(companyUrl, { method: 'GET', headers });
    const getRaw = await getResp.text();
    console.log('GET status:', getResp.status, getRaw);

    let result;
    try { result = JSON.parse(getRaw); } catch { result = getRaw; }

    const isMunicipalError =
      result?.errors?.some(e => e.code === 40401) ||
      getRaw.includes('municipal tax not found');

    if (isMunicipalError) {
      return Response.json({
        companyId,
        status: getResp.status,
        ok: false,
        municipal_error: true,
        data: result,
        message: 'Empresa encontrada no NFE.io, mas sem Inscrição Municipal configurada. Você precisa configurar isso diretamente no painel do NFE.io em: Empresa → Dados da Empresa → Inscrição Municipal.',
      });
    }

    return Response.json({ companyId, status: getResp.status, ok: getResp.ok, data: result });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});