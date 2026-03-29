import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const NFE_IO_BASE = "https://api.nfe.io/v1";
const NFSE_IO_BASE = "https://api.nfse.io/v2";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = Deno.env.get("NFE_IO_API_KEY");
    if (!apiKey) return Response.json({ error: 'NFE_IO_API_KEY não configurada' }, { status: 500 });

    const body = await req.json();
    const { companyId, action, empresa } = body;

    const headers = {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    };

    // Ação: criar empresa na NFSe.io v2
    if (action === 'criar_empresa') {
      if (!empresa) return Response.json({ error: 'Dados da empresa não fornecidos' }, { status: 400 });

      const taxRegimeMap = {
        simples_nacional: 'simplesNacional',
        lucro_presumido: 'lucroPresumido',
        lucro_real: 'lucroReal',
        mei: 'mei',
      };

      const payload = {
        company: {
          name: empresa.razao_social,
          tradeName: empresa.nome_fantasia || empresa.razao_social,
          federalTaxNumber: Number(empresa.cnpj?.replace(/\D/g, '')),
          taxRegime: taxRegimeMap[empresa.regime_tributario] || 'simplesNacional',
          address: {
            country: 'BRA',
            postalCode: empresa.cep?.replace(/\D/g, '') || '',
            street: empresa.logradouro || '',
            number: empresa.numero || 'S/N',
            additionalInformation: empresa.complemento || '',
            district: empresa.bairro || '',
            city: {
              name: empresa.municipio || '',
              code: String(empresa.codigo_ibge_municipio || ''),
            },
            state: empresa.uf || '',
          },
        },
      };

      console.log('Criando empresa na NFSe.io v2:', JSON.stringify(payload));

      const postResp = await fetch(`${NFSE_IO_BASE}/companies`, {
        method: 'POST',
        headers: { ...headers, 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      const postRaw = await postResp.text();
      console.log('POST /v2/companies status:', postResp.status, postRaw);

      let postResult;
      try { postResult = JSON.parse(postRaw); } catch { postResult = postRaw; }

      if (postResp.ok) {
        const newId = postResult?.company?.id || postResult?.id;
        return Response.json({ ok: true, company_id: newId, data: postResult });
      }

      return Response.json({ ok: false, status: postResp.status, data: postResult });
    }

    // Ação padrão: testar conexão com ID existente
    const getResp = await fetch(`${NFE_IO_BASE}/companies/${companyId}`, { method: 'GET', headers });
    const getRaw = await getResp.text();
    console.log('GET status:', getResp.status, getRaw.substring(0, 300));

    let result;
    try { result = JSON.parse(getRaw); } catch { result = getRaw; }

    if (getResp.ok) {
      return Response.json({ companyId, status: getResp.status, ok: true, data: result });
    }

    const isMunicipalError =
      result?.errors?.some(e => e.code === 40401) ||
      getRaw.includes('municipal tax not found');

    // Se deu erro de municipal ou 404, verifica se nossa API key tem acesso
    // Tenta listar para diagnosticar
    const listResp = await fetch(`${NFE_IO_BASE}/companies`, { method: 'GET', headers });
    const listRaw = await listResp.text();
    let listResult;
    try { listResult = JSON.parse(listRaw); } catch { listResult = {}; }

    const apiKeyHasNoCompanies = listResult?.companies?.length === 0;

    return Response.json({
      companyId,
      status: getResp.status,
      ok: false,
      municipal_error: isMunicipalError,
      api_key_has_no_companies: apiKeyHasNoCompanies,
      data: result,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});