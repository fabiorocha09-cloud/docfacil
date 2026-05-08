import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Determina o mês de origem: usa o passado pelo frontend ou calcula o mês anterior ao atual
    let mesOrigem = body.mes_origem || null;

    const agora = new Date();

    if (!mesOrigem) {
      const dataAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
      mesOrigem = `${String(dataAnterior.getMonth() + 1).padStart(2, '0')}/${dataAnterior.getFullYear()}`;
    }

    // Calcula o próximo mês a partir do mês de origem
    const [origemMes, origemAno] = mesOrigem.split('/').map(Number);
    const dataDestino = new Date(origemAno, origemMes, 1); // origemMes já é 1-based, então +1 é automático
    const mesDestino = `${String(dataDestino.getMonth() + 1).padStart(2, '0')}/${dataDestino.getFullYear()}`;

    // Busca todos os débitos
    const todos = await base44.asServiceRole.entities.DebitoFiscal.list('-created_date', 5000);

    // Débitos do mês de origem que NÃO estão pagos
    const paraRolar = todos.filter(d =>
      d.mes_referencia === mesOrigem &&
      d.status !== 'Pago'
    );

    if (paraRolar.length === 0) {
      return Response.json({ sucesso: true, rolados: 0, ignorados: 0, mesAnterior: mesOrigem, mesAtual: mesDestino, msg: 'Nenhum débito para rolar.' });
    }

    // Verifica duplicatas no mês destino
    const existentesNoDestino = todos.filter(d => d.mes_referencia === mesDestino);
    const chaveExistente = new Set(existentesNoDestino.map(d => `${d.empresa_cnpj}|${d.tributo}|${d.competencia}`));

    let rolados = 0;
    let ignorados = 0;

    for (const debito of paraRolar) {
      const chave = `${debito.empresa_cnpj}|${debito.tributo}|${debito.competencia}`;
      if (chaveExistente.has(chave)) {
        ignorados++;
        continue;
      }

      await base44.asServiceRole.entities.DebitoFiscal.create({
        empresa_nome: debito.empresa_nome,
        empresa_cnpj: debito.empresa_cnpj,
        esfera: debito.esfera,
        tributo: debito.tributo,
        competencia: debito.competencia,
        valor: debito.valor,
        status: 'Em aberto',
        observacao: `Rolado de ${mesOrigem}${debito.observacao ? ' | ' + debito.observacao : ''}`,
        mes_referencia: mesDestino,
      });

      chaveExistente.add(chave);
      rolados++;
    }

    return Response.json({ sucesso: true, rolados, ignorados, mesAnterior: mesOrigem, mesAtual: mesDestino });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});