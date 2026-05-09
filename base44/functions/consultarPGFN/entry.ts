import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SERPRO_TOKEN_URL = 'https://gateway.apiserpro.serpro.gov.br/token';
const SERPRO_DIVIDA_URL = 'https://gateway.apiserpro.serpro.gov.br/consulta-divida-ativa-df/v1/cnpj';

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

    // Consulta dívida ativa por CNPJ
    const res = await fetch(`${SERPRO_DIVIDA_URL}/${cnpjLimpo}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    let nomeEmpresa = empresa_nome || '';
    let valorDivida = 0;
    let situacao = 'regular';
    let observacao = '';
    let inscricoes = [];

    const rawBody = await res.text();
    if (body.debug) return Response.json({ serpro_status: res.status, serpro_body: rawBody.slice(0, 2000) });

    if (res.status === 200) {
      const data = JSON.parse(rawBody);
      // A API retorna array de inscrições ou objeto com array
      inscricoes = Array.isArray(data) ? data : (data.inscricoes || data.items || [data]);

      // Calcula total somando todos os valorTotalConsolidadoMoeda de inscrições ATIVAS
      for (const insc of inscricoes) {
        const situacaoInsc = (insc.situacaoDescricao || insc.situacao || '').toUpperCase();
        // Ignora inscrições extintas
        if (situacaoInsc.includes('EXTINT')) continue;

        const valorStr = String(insc.valorTotalConsolidadoMoeda || insc.valorTotalConsolidado || '0')
          .replace(/\./g, '').replace(',', '.');
        const valor = parseFloat(valorStr) || 0;
        valorDivida += valor;

        if (!nomeEmpresa && insc.nomeDevedor) {
          nomeEmpresa = insc.nomeDevedor;
        }
      }

      situacao = valorDivida > 0 ? 'devedor' : 'regular';
      observacao = `${inscricoes.length} inscrição(ões) encontrada(s) na Dívida Ativa da União via SERPRO.`;

    } else if (res.status === 404) {
      situacao = 'regular';
      observacao = 'CNPJ não encontrado na Lista de Devedores da PGFN. Situação: Regular.';
    } else {
      throw new Error(`SERPRO retornou ${res.status}: ${rawBody}`);
    }

    const resultado = {
      cnpj: cnpjLimpo,
      empresa_nome: nomeEmpresa,
      valor_divida_total: valorDivida,
      situacao,
      data_ultima_consulta: new Date().toISOString(),
      observacao,
    };

    // Salva ou atualiza no banco se solicitado
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