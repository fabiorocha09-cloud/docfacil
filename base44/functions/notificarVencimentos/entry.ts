import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Apenas chamada interna/admin ou automação agendada
    const certidoes = await base44.asServiceRole.entities.Certidao.list();
    const empresas = await base44.asServiceRole.entities.Empresa.list();
    const sharedLinks = await base44.asServiceRole.entities.SharedLink.list();

    const hoje = new Date();
    const diasAlerta = [30, 15, 7];
    let enviados = 0;
    let irregularidades = 0;

    for (const cert of certidoes) {
      if (cert.excluida || cert.status === 'irregular') continue;
      if (!cert.data_vencimento) continue;

      const empresa = empresas.find(e => e.id === cert.empresa_id);
      if (!empresa || !empresa.email) continue;

      const vencimento = new Date(cert.data_vencimento);
      const diffDias = Math.round((vencimento - hoje) / (1000 * 60 * 60 * 24));

      const notificacoesJaEnviadas = cert.notificacoes_enviadas || [];

      for (const dias of diasAlerta) {
        if (diffDias <= dias && diffDias >= 0 && !notificacoesJaEnviadas.includes(String(dias))) {
          const tipoLabel = {
            federal: 'Federal', estadual: 'Estadual', municipal: 'Municipal',
            fgts: 'FGTS', trabalhista: 'Trabalhista',
            alvara_bombeiros: 'Alvará - Bombeiros',
            alvara_vigilancia_sanitaria: 'Alvará - Vigilância Sanitária',
            alvara_funcionamento: 'Alvará - Funcionamento',
            alvara_meio_ambiente: 'Alvará - Meio Ambiente',
          }[cert.tipo] || cert.tipo;

          const dataFormatada = vencimento.toLocaleDateString('pt-BR');

          await base44.asServiceRole.integrations.Core.SendEmail({
            to: empresa.email,
            subject: `⚠️ Certidão vence em ${diffDias} dia(s) — ${empresa.nome}`,
            body: `Olá,\n\nA certidão abaixo está próxima do vencimento:\n\n• Empresa: ${empresa.nome}\n• Tipo: ${tipoLabel}${cert.subtipo ? ' — ' + cert.subtipo : ''}\n• Vencimento: ${dataFormatada}\n• Dias restantes: ${diffDias}\n\nPor favor, providencie a renovação o quanto antes.\n\nAtenciosamente,\nEquipe CertidãoHub`,
          });

          await base44.asServiceRole.entities.Certidao.update(cert.id, {
            notificacoes_enviadas: [...notificacoesJaEnviadas, String(dias)],
          });

          enviados++;
          break; // envia só o alerta do menor prazo ainda não enviado
        }
      }
    }

    // Notificações de irregularidade (vencidas ou status irregular)
    for (const cert of certidoes) {
      if (cert.excluida) continue;
      if (cert.notificacao_irregularidade_enviada) continue;

      const empresa = empresas.find(e => e.id === cert.empresa_id);
      if (!empresa || !empresa.email) continue;

      const isIrregular = cert.status === 'irregular';
      const isVencida = cert.data_vencimento && new Date(cert.data_vencimento) < hoje;

      if (isIrregular || isVencida) {
        const tipoLabel = {
          federal: 'Federal', estadual: 'Estadual', municipal: 'Municipal',
          fgts: 'FGTS', trabalhista: 'Trabalhista',
          alvara_bombeiros: 'Alvará - Bombeiros',
          alvara_vigilancia_sanitaria: 'Alvará - Vigilância Sanitária',
          alvara_funcionamento: 'Alvará - Funcionamento',
          alvara_meio_ambiente: 'Alvará - Meio Ambiente',
        }[cert.tipo] || cert.tipo;

        const motivo = isVencida
          ? `venceu em ${new Date(cert.data_vencimento).toLocaleDateString('pt-BR')}`
          : 'foi marcada como irregular';

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: empresa.email,
          subject: `🔴 Certidão irregular — ${empresa.nome}`,
          body: `Atenção,\n\nUma certidão da empresa ${empresa.nome} ${motivo}:\n\n• Tipo: ${tipoLabel}${cert.subtipo ? ' — ' + cert.subtipo : ''}\n• Status: ${isVencida ? 'Vencida' : 'Irregular'}\n\nPor favor, entre em contato com seu contador para regularização.\n\nAtenciosamente,\nEquipe CertidãoHub`,
        });

        await base44.asServiceRole.entities.Certidao.update(cert.id, {
          notificacao_irregularidade_enviada: true,
        });

        irregularidades++;
      }
    }

    return Response.json({ ok: true, enviados, irregularidades });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});