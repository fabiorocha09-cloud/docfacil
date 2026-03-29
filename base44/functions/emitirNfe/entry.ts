import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const NFE_IO_BASE = "https://api.nfse.io/v2";

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

    // Determina tipo de pessoa pelo CNPJ/CPF
    const docLimpo = nota.destinatario_cnpj?.replace(/\D/g, "") || "";
    const isLegalEntity = docLimpo.length === 14;

    // Monta payload NFE.io para NF-e modelo 55 (API v2)
    const payload = {
      environment: ambienteEmissao === "producao" ? "Production" : "Test",
      operationNature: nota.natureza_operacao || "VENDA DE MERCADORIA",
      operationType: "Outgoing",
      destination: empresa.uf === (nota.dest_uf || empresa.uf) ? "Internal_Operation" : "Interstate_Operation",
      presenceType: "Internet",
      buyer: {
        name: nota.destinatario_nome,
        federalTaxNumber: parseInt(docLimpo, 10),
        type: isLegalEntity ? "LegalEntity" : "NaturalPerson",
        stateTaxNumberIndicator: "NonTaxPayer",
        email: nota.destinatario_email || undefined,
        address: {
          street: nota.dest_logradouro || "Não informado",
          number: nota.dest_numero || "S/N",
          district: nota.dest_bairro || "Não informado",
          city: {
            code: nota.dest_codigo_municipio ? parseInt(nota.dest_codigo_municipio, 10) : undefined,
            name: nota.dest_municipio || "",
          },
          state: nota.dest_uf || empresa.uf || "",
          postalCode: nota.dest_cep?.replace(/\D/g, "") || "",
          country: "BRA",
        },
      },
      items: itens.map((item, idx) => ({
        code: item.produto_id || String(idx + 1),
        description: item.descricao,
        ncm: item.ncm || "00000000",
        cfop: parseInt(item.cfop || "5102", 10),
        unit: item.unidade || "UN",
        quantity: Number(item.quantidade),
        unitAmount: Number(item.valor_unitario),
        totalAmount: Number(item.valor_total),
        totalIndicator: true,
        tax: {
          icms: {
            origin: "0",
            cst: item.icms_cst || undefined,
            csosn: item.icms_csosn || "400",
          },
          pis: {
            cst: item.pis_cst || "07",
            baseTax: 0,
            rate: 0,
            amount: 0,
          },
          cofins: {
            cst: item.cofins_cst || "07",
            baseTax: 0,
            rate: 0,
            amount: 0,
          },
        },
      })),
      transport: {
        freightModality: "Free",
      },
      payment: {
        paymentDetail: [{
          method: "Cash",
          amount: Number(nota.valor_total),
          paymentType: "InCash",
        }],
      },
      totals: {
        icms: {
          productAmount: Number(nota.valor_produtos || nota.valor_total),
          invoiceAmount: Number(nota.valor_total),
        },
      },
      additionalInformation: {
        taxpayer: nota.observacoes || "",
      },
    };

    // Envia para NFE.io
    const response = await fetch(`${NFE_IO_BASE}/companies/${nfeIoCompanyId}/productinvoices`, {
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