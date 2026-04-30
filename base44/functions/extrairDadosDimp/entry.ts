import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url, empresa_id, ano_base } = await req.json();

    if (!file_url) {
      return Response.json({ error: 'file_url é obrigatório' }, { status: 400 });
    }

    const jsonSchema = {
      type: "object",
      properties: {
        ano_base: {
          type: "integer",
          description: "Ano base do relatório (ex: 2025)"
        },
        meses: {
          type: "array",
          description: "Lista de meses extraídos do Histórico Mensal Detalhado",
          items: {
            type: "object",
            properties: {
              mes_nome: {
                type: "string",
                description: "Nome do mês em português (ex: Janeiro, Fevereiro)"
              },
              mes_numero: {
                type: "integer",
                description: "Número do mês (1=Janeiro, 12=Dezembro)"
              },
              entrada_contabil: {
                type: "number",
                description: "Valor Contábil da coluna Entrada (NF de entrada)"
              },
              saida_contabil: {
                type: "number",
                description: "Valor Contábil (NF-e + NFC-e) da coluna Saída"
              },
              dimp_valor: {
                type: "number",
                description: "Valor da coluna DIMP"
              },
              pgdas_receita_bruta: {
                type: "number",
                description: "Receita Bruta do Grupo da coluna PGDAS"
              }
            },
            required: ["mes_nome", "mes_numero"]
          }
        }
      }
    };

    const result = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: jsonSchema
    });

    if (result.status !== 'success') {
      return Response.json({ error: 'Falha ao extrair dados do PDF', details: result.details }, { status: 422 });
    }

    const anoBase = result.output?.ano_base || ano_base || new Date().getFullYear();
    const meses = result.output?.meses || [];

    // Buscar registros existentes para a empresa
    let existentes = [];
    if (empresa_id) {
      existentes = await base44.asServiceRole.entities.PassivoTributario.filter({ empresa_id });
    }

    // Montar comparação por mês
    const comparacao = meses.map(m => {
      const periodo = `${anoBase}-${String(m.mes_numero).padStart(2, '0')}`;
      const existente = existentes.find(e => e.periodo === periodo) || null;

      const campos = [
        {
          campo: 'faturamento_entrada',
          label: 'Entrada NF (Valor Contábil)',
          valorExistente: existente?.faturamento_entrada ?? null,
          valorPdf: m.entrada_contabil ?? null,
        },
        {
          campo: 'faturamento_nfe',
          label: 'Saída NF-e (Valor Contábil)',
          valorExistente: existente?.faturamento_nfe ?? null,
          valorPdf: m.saida_contabil ?? null,
        },
        {
          campo: 'dimp_total',
          label: 'DIMP (Valor)',
          valorExistente: existente?.dimp_total ?? null,
          valorPdf: m.dimp_valor ?? null,
        },
        {
          campo: 'faturamento_declarado',
          label: 'PGDAS – Receita Bruta do Grupo',
          valorExistente: existente?.faturamento_declarado ?? null,
          valorPdf: m.pgdas_receita_bruta ?? null,
        },
      ].map(c => {
        const temExistente = c.valorExistente !== null && c.valorExistente !== undefined;
        const temPdf = c.valorPdf !== null && c.valorPdf !== undefined;
        let situacao = 'igual';
        if (!temExistente && temPdf) situacao = 'novo';
        else if (temExistente && !temPdf) situacao = 'sem_dado_pdf';
        else if (temExistente && temPdf && Math.abs(c.valorExistente - c.valorPdf) > 0.01) situacao = 'divergente';
        return { ...c, situacao };
      });

      const temDivergencia = campos.some(c => c.situacao === 'divergente' || c.situacao === 'novo');

      return {
        mes_nome: m.mes_nome,
        mes_numero: m.mes_numero,
        periodo,
        existente_id: existente?.id || null,
        campos,
        temDivergencia,
        isNovo: !existente,
      };
    });

    return Response.json({ comparacao, anoBase });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});