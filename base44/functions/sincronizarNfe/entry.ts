import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const NFE_IO_BASE = "https://api.nfe.io/v2";

// Mapeia status da NFE.io para status interno
function mapStatus(apiStatus) {
  const s = (apiStatus || '').toLowerCase();
  if (s === 'cancelled') return 'cancelada';
  if (['authorized', 'issued', 'approved'].includes(s)) return 'transmitida';
  if (s === 'rejected' || s === 'denied') return 'rejeitada';
  return null; // não atualiza se desconhecido
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { notaId, empresaId } = await req.json();

    const apiKey = Deno.env.get("NFE_IO_API_KEY");
    if (!apiKey) return Response.json({ error: 'NFE_IO_API_KEY não configurada' }, { status: 500 });

    const [notas, empresas] = await Promise.all([
      base44.asServiceRole.entities.NotaFiscal55.filter({ id: notaId }),
      base44.asServiceRole.entities.EmpresaCliente.filter({ id: empresaId }),
    ]);

    const nota = notas[0];
    const empresa = empresas[0];

    if (!nota || !empresa) return Response.json({ error: 'Nota ou empresa não encontrada' }, { status: 404 });
    if (!empresa.nfe_io_company_id) return Response.json({ error: 'NFE.io Company ID não configurado' }, { status: 400 });

    const companyId = empresa.nfe_io_company_id;
    const headers = { 'Authorization': apiKey, 'Accept': 'application/json' };

    // Resolve o identificador da nota na NFE.io
    // Prioridade: nfe_io_id salvo > id salvo no raw > chave de acesso
    const nfeIoId =
      nota.nfe_io_id ||
      nota.nfe_io_raw?.productInvoice?.id ||
      nota.nfe_io_raw?.id ||
      nota.chave_acesso?.replace(/\D/g, '') ||
      null;

    if (!nfeIoId) {
      return Response.json({ error: 'Não há ID NFE.io ou chave de acesso salva nesta nota para sincronizar.' }, { status: 400 });
    }

    console.log('Consultando NFE.io com ID:', nfeIoId);

    // 1. Busca dados principais da nota
    const notaResp = await fetch(`${NFE_IO_BASE}/companies/${companyId}/productinvoices/${nfeIoId}`, { headers });
    const notaText = await notaResp.text();
    console.log('GET nota status:', notaResp.status, notaText.substring(0, 200));

    if (!notaResp.ok) {
      return Response.json({ error: `NFE.io retornou ${notaResp.status}: ${notaText}` }, { status: 400 });
    }

    const notaData = JSON.parse(notaText);
    const invoice = notaData.productInvoice || notaData;

    // 2. Busca PDF (DANFE) — retorna { uri: "..." }
    let danfePdfUrl = nota.danfe_pdf_url || null;
    const pdfResp = await fetch(`${NFE_IO_BASE}/companies/${companyId}/productinvoices/${nfeIoId}/pdf`, { headers });
    if (pdfResp.ok) {
      const pdfData = await pdfResp.json();
      danfePdfUrl = pdfData.uri || pdfData.url || danfePdfUrl;
      console.log('PDF URI:', danfePdfUrl);
    } else {
      console.log('PDF não disponível, status:', pdfResp.status);
    }

    // 3. Busca XML — retorna { uri: "..." }
    let xmlUrl = nota.retorno_xml_url || null;
    const xmlResp = await fetch(`${NFE_IO_BASE}/companies/${companyId}/productinvoices/${nfeIoId}/xml`, { headers });
    if (xmlResp.ok) {
      const xmlData = await xmlResp.json();
      xmlUrl = xmlData.uri || xmlData.url || xmlUrl;
      console.log('XML URI:', xmlUrl);
    } else {
      console.log('XML não disponível, status:', xmlResp.status);
    }

    // Monta updates
    const updates = {
      nfe_io_id: invoice.id || nfeIoId,
      nfe_io_raw: notaData,
    };

    if (danfePdfUrl) updates.danfe_pdf_url = danfePdfUrl;
    if (xmlUrl) updates.retorno_xml_url = xmlUrl;
    if (invoice.accessKey) updates.chave_acesso = invoice.accessKey;
    if (invoice.number) updates.numero = invoice.number;
    if (invoice.serie) updates.serie = String(invoice.serie);

    const novoStatus = mapStatus(invoice.status);
    if (novoStatus) updates.status_sefaz = novoStatus;

    await base44.asServiceRole.entities.NotaFiscal55.update(notaId, updates);

    return Response.json({
      success: true,
      status: invoice.status,
      danfe_pdf_url: danfePdfUrl,
      retorno_xml_url: xmlUrl,
      chave_acesso: invoice.accessKey,
      numero: invoice.number,
    });

  } catch (error) {
    console.error('Erro sincronizarNfe:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});