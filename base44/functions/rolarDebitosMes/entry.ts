import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Determina mês anterior e mês atual
    const agora = new Date();
    const mesAtual = `${String(agora.getMonth() + 1).padStart(2, '0')}/${agora.getFullYear()}`;

    // Mês anterior
    const dataAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
    const mesAnterior = `${String(dataAnterior.getMonth() + 1).padStart(2, '0')}/${dataAnterior.getFullYear()}`;

    // Busca todos os débitos do mês anterior que NÃO estão pagos
    const todos = await base44.asServiceRole.entities.DebitoFiscal.list('-created_date', 5000);
    const paraRolar = todos.filter(d =>
      d.mes_referencia === mesAnterior &&
      d.status !== 'Pago'
    );

    if (paraRolar.length === 0) {
      return Response.json({ sucesso: true, rolados: 0, mesAnterior, mesAtual, msg: 'Nenhum débito para rolar.' });
    }

    // Verifica quais combinações (empresa+tributo+competencia) já existem no mês atual para evitar duplicatas
    const existentesNoMesAtual = todos.filter(d => d.mes_referencia === mesAtual);
    const chaveExistente = new Set(existentesNoMesAtual.map(d => `${d.empresa_cnpj}|${d.tributo}|${d.competencia}`));

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
        observacao: `Rolado de ${mesAnterior}${debito.observacao ? ' | ' + debito.observacao : ''}`,
        mes_referencia: mesAtual,
      });

      chaveExistente.add(chave);
      rolados++;
    }

    return Response.json({ sucesso: true, rolados, ignorados, mesAnterior, mesAtual });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});