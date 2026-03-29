import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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
        simples_nacional: 'SimplesNacional',
        lucro_presumido: 'LucroPresumido',
        lucro_real: 'LucroReal',
        mei: 'MicroempreendedorIndividual',
        isento: 'Isento',
      };

      const payload = {
        company: {
          name: empresa.razao_social,
          tradeName: empresa.nome_fantasia || null,
          federalTaxNumber: Number(empresa.cnpj?.replace(/\D/g, '')),
          municipalTaxNumber: empresa.inscricao_municipal || null,
          taxRegime: taxRegimeMap[empresa.regime_tributario] || 'SimplesNacional',
          address: {
            country: 'BRA',
            postalCode: empresa.cep?.replace(/\D/g, '') || '',
            street: empresa.logradouro || '',
            number: empresa.numero || 'S/N',
            additionalInformation: empresa.complemento || null,
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

    // Ação: configurar imposto municipal (municipaltaxes)
    if (action === 'criar_municipal_tax') {
      if (!companyId) return Response.json({ error: 'companyId não fornecido' }, { status: 400 });
      if (!empresa) return Response.json({ error: 'Dados da empresa não fornecidos' }, { status: 400 });

      const envMap = { homologacao: 'Development', producao: 'Production' };
      const specialTaxRegimeMap = {
        simples_nacional: 'SimplesNacional',
        lucro_presumido: 'LucroPresumido',
        lucro_real: 'LucroReal',
        mei: 'Mei',
      };

      const mtPayload = {
        municipalTax: {
          city: {
            code: String(empresa.codigo_ibge_municipio || ''),
            name: empresa.municipio || '',
            country: 'BRA',
            state: empresa.uf || '',
          },
          taxNumber: empresa.inscricao_municipal || '',
          environment: envMap[empresa.nfe_ambiente] || 'Development',
          specialTaxRegime: specialTaxRegimeMap[empresa.regime_tributario] || 'Nenhum',
          email: empresa.email || '',
          legalNature: 'None',
          companyRegistryNumber: 0,
          regionalTaxNumber: Number(empresa.ie?.replace(/\D/g, '') || 0),
          issRate: Number(empresa.iss_rate || 0),
          federalTaxDetermination: 'NotInformed',
          municipalTaxDetermination: 'NotInformed',
          loginName: empresa.portal_login || '',
          loginPassword: empresa.portal_senha || '',
          authIssueValue: '',
          rpsNumber: Number(empresa.rps_number || 0),
          lastRpsSent: Number(empresa.rps_number || 0),
          rpsSerialNumber: empresa.rps_serial_number || 'RPS',
        },
      };

      console.log('POST municipaltaxes payload:', JSON.stringify(mtPayload));

      const mtResp = await fetch(`${NFSE_IO_BASE}/companies/${companyId}/municipaltaxes`, {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(mtPayload),
      });
      const mtRaw = await mtResp.text();
      console.log('municipaltaxes status:', mtResp.status, mtRaw.substring(0, 400));

      let mtResult;
      try { mtResult = JSON.parse(mtRaw); } catch { mtResult = mtRaw; }

      return Response.json({ ok: mtResp.ok, status: mtResp.status, data: mtResult });
    }

    // Ação padrão: testar conexão com ID existente na NFSe.io v2 (NF-e produto)
    const getResp = await fetch(`${NFSE_IO_BASE}/companies/${companyId}`, {
      method: 'GET',
      headers: { 'Authorization': apiKey, 'Accept': 'application/json' },
    });
    const getRaw = await getResp.text();
    console.log('GET /v2/companies status:', getResp.status, getRaw.substring(0, 300));

    let result;
    try { result = JSON.parse(getRaw); } catch { result = getRaw; }

    if (getResp.ok) {
      return Response.json({ companyId, status: getResp.status, ok: true, data: result });
    }

    return Response.json({ companyId, status: getResp.status, ok: false, data: result });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});