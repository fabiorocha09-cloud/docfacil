import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SERPRO_TOKEN_URL = 'https://gateway.apiserpro.serpro.gov.br/token';

// Endpoints da API SERPRO Dívida Ativa — tenta DF (contratado) e fallback para versão sem DF
const ENDPOINTS_DEVEDOR = [
  'https://gateway.apiserpro.serpro.gov.br/consulta-divida-ativa-df/api/v1/devedor',
  'https://gateway.apiserpro.serpro.gov.br/consulta-divida-ativa/api/v1/devedor',
];

async function getSerproToken() {
  const key = Deno.env.get('SERPRO_API_KEY');
  const secret = Deno.env.get('SERPRO_API_SECRET');
  const credentials = btoa(`${key}:${secret}`);

  const res = await fetch(SERPRO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Erro ao obter token SERPRO: ${res.status} - ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

// Tenta cada endpoint em sequência e retorna o primeiro que responder com 200 ou 404
async function consultarDevedor(cnpj, accessToken) {
  let lastError = null;

  for (const baseUrl of ENDPOINTS_DEVEDOR) {
    const res = await fetch(`${baseUrl}/${cnpj}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (res.status === 200 || res.status === 404) {
      const body = await res.text();
      return { status: res.status, body, endpoint: baseUrl };
    }

    const body = await res.text();
    lastError = `${baseUrl} → ${res.status}: ${body}`;
  }

  throw new Error(`Todos os endpoints falharam. Último erro: ${lastError}`);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { cnpj, salvar = false, empresa_id = null, empresa_nome = null } = body;

    if (!cnpj) {
      return Response.json({ error: 'CNPJ é obrigatório' }, { status: 400 });
    }

    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) {
      return Response.json({ error: 'CNPJ inválido' }, { status: 400 });
    }

    // Obtém token SERPRO
    const accessToken = await getSerproToken();

    // Consulta dívida ativa — tenta endpoints em sequência
    const { status, body: rawBody, endpoint } = await consultarDevedor(cnpjLimpo, accessToken);

    if (body.debug) {
      return Response.json({ serpro_status: status, serpro_body: rawBody.slice(0, 2000), endpoint });
    }

    let nomeEmpresa = empresa_nome || '';
    let valorDivida = 0;
    let situacao = 'regular';
    let observacao = '';

    if (status === 200) {
      const data = JSON.parse(rawBody);

      // A API retorna objeto com nomeDevedor + array de inscrições
      const inscricoes = Array.isArray(data) ? data : (data.inscricoes || data.items || [data]);

      if (!nomeEmpresa && data.nomeDevedor) {
        nomeEmpresa = data.nomeDevedor;
      }

      for (const insc of inscricoes) {
        const situacaoInsc = (insc.situacaoDescricao || insc.situacao || '').toUpperCase();
        if (situacaoInsc.includes('EXTINT')) continue;

        if (!nomeEmpresa && insc.nomeDevedor) {
          nomeEmpresa = insc.nomeDevedor;
        }

        // Tenta diferentes campos de valor que a API pode retornar
        const valorStr = String(
          insc.valorTotalConsolidadoMoeda ||
          insc.valorTotalConsolidado ||
          insc.valorConsolidado ||
          '0'
        ).replace(/\./g, '').replace(',', '.');
        valorDivida += parseFloat(valorStr) || 0;
      }

      valorDivida = Math.round(valorDivida * 100) / 100;
      situacao = valorDivida > 0 ? 'devedor' : 'regular';
      observacao = `${inscricoes.length} inscrição(ões) encontrada(s) na Dívida Ativa da União via SERPRO.`;

    } else if (status === 404) {
      situacao = 'regular';
      observacao = 'CNPJ não encontrado na Lista de Devedores da PGFN. Situação: Regular.';
    }

    const resultado = {
      cnpj: cnpjLimpo,
      empresa_nome: nomeEmpresa,
      valor_divida_total: valorDivida,
      situacao,
      data_ultima_consulta: new Date().toISOString(),
      observacao,
    };

    if (salvar) {
      const existentes = await base44.asServiceRole.entities.ConsultaPGFN.list();
      const existente = existentes.find(c => c.cnpj === cnpjLimpo);
      if (existente) {
        await base44.asServiceRole.entities.ConsultaPGFN.update(existente.id, {
          ...resultado,
          empresa_id: empresa_id || existente.empresa_id,
          empresa_nome: nomeEmpresa || existente.empresa_nome,
          is_cliente_scala: !!empresa_id || existente.is_cliente_scala,
        });
      } else {
        await base44.asServiceRole.entities.ConsultaPGFN.create({
          ...resultado,
          empresa_id: empresa_id || null,
          is_cliente_scala: !!empresa_id,
        });
      }
    }

    return Response.json({ sucesso: true, ...resultado });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});