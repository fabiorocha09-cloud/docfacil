import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const NFE_IO_BASE = "https://api.nfe.io/v1";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { notaId, empresaId, ambiente } = body;

    const apiKey = Deno.env.get("NFE_IO_API_KEY");
    if (!apiKey) return Response.json({ error: 'NFE_IO_API_KEY não configurada' }, { status: 500 });

    // Busca dados da nota e empresa
    const [notas, empresas, itens] = await Promise.all([
      base44.asServiceRole.entities.NotaFiscal55.filter({ id: notaId }),
      base44.asServiceRole.entities.EmpresaCliente.filter({ id: empresaId }),
      base44.asServiceRole.entities.ItemNota.filter({ nota_id: notaId }),
    ]);

    const nota = notas[0];
    const empresa = empresas[0];

    if (!nota || !empresa) {
      return Response.json({ error: 'Nota ou empresa não encontrada' }, { status: 404 });
    }

    const nfeIoCompanyId = empresa.nfe_io_company_id;
    if (!nfeIoCompanyId) {
      return Response.json({ error: 'ID da empresa no NFE.io não configurado. Edite a empresa e informe o NFE.io Company ID.' }, { status: 400 });
    }

    const ambienteEmissao = ambiente || empresa.nfe_ambiente || "homologacao";

    // Monta payload NFE.io para NF-e modelo 55
    const payload = {
      ambiente: ambienteEmissao === "homologacao" ? "Homologação" : "Produção",
      naturezaOperacao: nota.natureza_operacao || "VENDA DE MERCADORIA",
      dataEmissao: new Date().toISOString(),
      destinatario: {
        tipoPessoa: "J",
        cnpjCpf: nota.destinatario_cnpj?.replace(/\D/g, ""),
        nome: nota.destinatario_nome,
        email: nota.destinatario_email || "",
        enderecoLogradouro: nota.dest_logradouro || "",
        enderecoNumero: nota.dest_numero || "S/N",
        enderecoBairro: nota.dest_bairro || "",
        enderecoCodigoMunicipio: nota.dest_codigo_municipio ? parseInt(nota.dest_codigo_municipio, 10) : undefined,
        enderecoNomeMunicipio: nota.dest_municipio || "",
        enderecoUf: nota.dest_uf || "",
        enderecoCep: nota.dest_cep?.replace(/\D/g, "") || "",
        indicadorIe: 9,
      },
      produtos: itens.map((item, idx) => ({
        item: idx + 1,
        codigo: item.produto_id || String(idx + 1),
        descricao: item.descricao,
        ncm: item.ncm || "00000000",
        cfop: item.cfop || "5102",
        unidadeComercial: item.unidade || "UN",
        quantidadeComercial: Number(item.quantidade),
        valorUnitarioComercial: Number(item.valor_unitario),
        valorTotal: Number(item.valor_total),
        tributosIcmsCst: item.icms_cst || "400",
        tributosIcmsCsosn: item.icms_csosn || "400",
        tributosIcmsOrigem: 0,
        tributosPisCst: item.pis_cst || "07",
        tributosCofinssCst: item.cofins_cst || "07",
      })),
      pagamentos: [{
        forma: nota.forma_pagamento_codigo || "01",
        valor: Number(nota.valor_total),
      }],
      informacoesAdicionaisContribuinte: nota.observacoes || "",
    };

    // Envia para NFE.io
    const response = await fetch(`${NFE_IO_BASE}/companies/${nfeIoCompanyId}/nfe`, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    console.log('NFE.io status:', response.status);
    console.log('NFE.io raw response:', rawText);

    let result;
    try {
      result = JSON.parse(rawText);
    } catch (parseError) {
      await base44.asServiceRole.entities.NotaFiscal55.update(notaId, {
        status_sefaz: 'rejeitada',
        erros: [{ message: 'Resposta inválida da NFE.io', raw: rawText }],
      });
      return Response.json({ error: 'Resposta inválida da NFE.io: ' + rawText }, { status: 500 });
    }

    if (!response.ok) {
      const logEntryErr = {
        timestamp: new Date().toISOString(),
        status: "rejeitada",
        raw: result,
      };
      // Busca log anterior para append
      const notaAtual = notas[0];
      const logAnterior = notaAtual?.log_transmissao || [];
      await base44.asServiceRole.entities.NotaFiscal55.update(notaId, {
        status_sefaz: "rejeitada",
        erros: [result],
        nfe_io_raw: result,
        log_transmissao: [...logAnterior, logEntryErr],
      });
      return Response.json({ error: result.message || 'Erro ao emitir NF-e', details: result }, { status: 400 });
    }

    // Atualiza nota com retorno do NFE.io — salva raw para diagnóstico
    const nfeData = result.nfe || result;

    // Tenta todas as variações de campo que a API NFE.io pode retornar
    const danfePdf =
      nfeData.linkDanfe ||
      nfeData.danfeUrl ||
      nfeData.pdfUrl ||
      nfeData.linkDanfePdf ||
      nfeData.links?.danfe ||
      result.linkDanfe ||
      null;

    const xmlUrl =
      nfeData.linkXml ||
      nfeData.xmlUrl ||
      nfeData.links?.xml ||
      result.linkXml ||
      null;

    const chave =
      nfeData.chaveAcesso ||
      nfeData.accessKey ||
      nfeData.key ||
      result.chaveAcesso ||
      null;

    const prot =
      nfeData.protocolo ||
      nfeData.number ||
      nfeData.nProtocolo ||
      result.protocolo ||
      null;

    const num =
      nfeData.numero ||
      nfeData.number ||
      nfeData.nNF ||
      null;

    const logEntry = {
      timestamp: new Date().toISOString(),
      status: "transmitida",
      danfe_pdf_url: danfePdf,
      xml_url: xmlUrl,
      chave_acesso: chave,
      protocolo: prot,
      raw: result,
    };

    await base44.asServiceRole.entities.NotaFiscal55.update(notaId, {
      status_sefaz: "transmitida",
      chave_acesso: chave || "",
      protocolo: prot || "",
      danfe_pdf_url: danfePdf || "",
      retorno_xml_url: xmlUrl || "",
      numero: num || null,
      erros: [],
      nfe_io_raw: result,
      log_transmissao: [logEntry],
    });

    return Response.json({
      success: true,
      chaveAcesso: chave,
      protocolo: prot,
      danfe: danfePdf,
      xml: xmlUrl,
      raw: result,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});