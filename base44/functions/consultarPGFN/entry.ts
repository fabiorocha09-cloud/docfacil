import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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
    const cnpjFormatado = cnpjLimpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');

    let valorDivida = 0;
    let nomeEmpresa = empresa_nome || '';
    let situacao = 'regular';

    // Usa Gemini com busca na web para consultar dados PGFN
    const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      prompt: `Pesquise na internet informações sobre a dívida ativa na PGFN para o CNPJ ${cnpjFormatado}.

Fontes a consultar:
1. https://www.listadevedores.pgfn.gov.br/ buscando pelo CNPJ ${cnpjFormatado}
2. Qualquer outra fonte pública que tenha dados sobre dívidas PGFN para este CNPJ

Retorne:
- nome_empresa: razão social da empresa com este CNPJ
- valor_divida_total: valor total da dívida na PGFN em reais como número (ex: se aparecer "22.362.519,16" retorne 22362519.16). Se não encontrar, retorne 0.
- possui_divida: true se constar na lista de devedores da PGFN, false se não constar
- observacao: qualquer informação relevante encontrada sobre a situação fiscal`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          nome_empresa: { type: 'string' },
          valor_divida_total: { type: 'number' },
          possui_divida: { type: 'boolean' },
          observacao: { type: 'string' },
        },
      },
    });

    if (llmResult) {
      valorDivida = llmResult.valor_divida_total || 0;
      nomeEmpresa = llmResult.nome_empresa || empresa_nome || '';
      situacao = (llmResult.possui_divida || valorDivida > 0) ? 'devedor' : 'regular';
    }

    const resultado = {
      cnpj: cnpjLimpo,
      empresa_nome: nomeEmpresa,
      valor_divida_total: valorDivida,
      situacao,
      data_ultima_consulta: new Date().toISOString(),
      observacao: llmResult?.observacao || '',
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