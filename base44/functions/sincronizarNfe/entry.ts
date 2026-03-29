import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const NFE_IO_BASE = "https://api.nfe.io/v2";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { notaId, empresaId, chaveManual } = await req.json();

    const apiKey = Deno.env.get("NFE_IO_API_KEY");
    if (!apiKey) return Response.json({ error: 'NFE_IO_API_KEY não configurada' }, { status: 500 });

    const [notas, empresas] = await Promise.all([
      base44.asServiceRole.entities.NotaFiscal55.filter({ id: notaId }),
      base44.asServiceRole.entities.EmpresaCliente.filter({ id: empresaId }),
    ]);

    const nota = notas[0];
    const empresa = empresas[0];

    if (!nota || !empresa) return Response.json({ error: 'Nota ou empresa não encontrada' }, { status: 404 });

    // Usa chave manual se fornecida, senão usa a do banco
    const chaveRaw = chaveManual || nota.chave_acesso || '';
    const chave = chaveRaw.replace(/\D/g, '');

    if (!chave || chave.length < 44) {
      return Response.json({ error: 'Nota sem chave de acesso válida (44 dígitos) — informe a chave manualmente.' }, { status: 400 });
    }
    if (!empresa.nfe_io_company_id) {
      return Response.json({ error: 'NFE.io Company ID não configurado na empresa' }, { status: 400 });
    }

    // Busca dados da nota na NFE.io usando a chave de acesso (endpoint de notas emitidas)
    const response = await fetch(
      `${NFE_IO_BASE}/companies/${empresa.nfe_io_company_id}/productinvoices/${chave}`,
      { headers: { 'Authorization': apiKey, 'Accept': 'application/json' } }
    );

    const rawText = await response.text();
    console.log('NFE.io sincronizar status:', response.status, rawText.substring(0, 400));

    let data;
    try { data = JSON.parse(rawText); } catch { data = { raw: rawText }; }

    if (!response.ok) {
      return Response.json({ error: data.message || 'Erro ao buscar nota na NFE.io', details: data }, { status: 400 });
    }

    // Extrai links conforme documentação NFE.io v2
    const nfeData = data.nfe || data;
    const danfePdf = nfeData.links?.pdf || nfeData.links?.danfe || nfeData.linkDanfe || nfeData.pdfUrl || data.links?.pdf || data.linkDanfe || null;
    const xmlUrl   = nfeData.links?.xml  || nfeData.linkXml  || nfeData.xmlUrl  || data.links?.xml  || data.linkXml  || null;
    const chaveRetorno = nfeData.chaveAcesso || nfeData.accessKey || nfeData.key || chave;
    const protocolo = nfeData.protocolo || nfeData.number || nfeData.nProtocolo || nota.protocolo;

    const updates = {
      nfe_io_raw: data,
      chave_acesso: chaveRetorno,
    };

    if (danfePdf) updates.danfe_pdf_url = danfePdf;
    if (xmlUrl)   updates.retorno_xml_url = xmlUrl;
    if (protocolo) updates.protocolo = protocolo;

    // Atualiza status se a NFE.io indicar autorizada
    const desc = (nfeData.description || data.description || nfeData.status || '').toLowerCase();
    if (desc.includes('autorizado') || desc.includes('authorized')) {
      updates.status_sefaz = 'transmitida';
    }

    await base44.asServiceRole.entities.NotaFiscal55.update(notaId, updates);

    return Response.json({ success: true, danfe_pdf_url: danfePdf, retorno_xml_url: xmlUrl, data });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});