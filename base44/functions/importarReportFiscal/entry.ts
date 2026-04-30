import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url, mes_referencia } = await req.json();

    if (!file_url) {
      return Response.json({ error: 'file_url é obrigatório' }, { status: 400 });
    }

    // Extrair dados do PDF usando IA
    const resultado = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          empresa_nome: { type: "string", description: "Nome completo da empresa" },
          empresa_cnpj: { type: "string", description: "CNPJ da empresa no formato XX.XXX.XXX/YYYY-ZZ" },
          mes_referencia_relatorio: { type: "string", description: "Mês e ano de referência do relatório, ex: ABRIL/2026. Converta para MM/YYYY, ex: 04/2026" },
          pendencias: {
            type: "array",
            items: {
              type: "object",
              properties: {
                esfera: { type: "string", description: "Esfera fiscal: Federal, Estadual ou Municipal" },
                tributo: { type: "string", description: "Nome do tributo: IRRF, INSS, SIMPLES NACIONAL, FGTS, ISS, ICMS, etc." },
                competencia: { type: "string", description: "Competência/período, ex: 02/2025, DÉCIMO TERCEIRO/2025" },
                valor: { type: "number", description: "Valor numérico do débito sem símbolo de moeda" }
              },
              required: ["esfera", "tributo", "competencia", "valor"]
            }
          }
        },
        required: ["empresa_nome", "empresa_cnpj", "mes_referencia_relatorio", "pendencias"]
      }
    });

    if (resultado.status !== "success" || !resultado.output) {
      return Response.json({ error: 'Não foi possível extrair dados do PDF.' }, { status: 422 });
    }

    const dados = resultado.output;
    const mesRef = mes_referencia || dados.mes_referencia_relatorio;

    if (!dados.pendencias || dados.pendencias.length === 0) {
      return Response.json({ error: 'Nenhuma pendência encontrada no documento.' }, { status: 422 });
    }

    // Criar registros de DebitoFiscal
    const registros = dados.pendencias.map(p => ({
      empresa_nome: dados.empresa_nome,
      empresa_cnpj: dados.empresa_cnpj,
      esfera: p.esfera || "Federal",
      tributo: p.tributo,
      competencia: p.competencia,
      valor: p.valor,
      status: "Em aberto",
      mes_referencia: mesRef,
    }));

    const criados = await base44.asServiceRole.entities.DebitoFiscal.bulkCreate(registros);

    return Response.json({
      sucesso: true,
      empresa_nome: dados.empresa_nome,
      empresa_cnpj: dados.empresa_cnpj,
      mes_referencia: mesRef,
      total_importado: registros.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});