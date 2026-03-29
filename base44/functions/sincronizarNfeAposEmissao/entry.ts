import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const NFE_IO_BASE = "https://api.nfse.io/v2";

function mapStatus(apiStatus) {
  const s = (apiStatus || '').toLowerCase();
  if (s === 'cancelled') return 'cancelada';
  if (['authorized', 'issued', 'approved'].includes(s)) return 'transmitida';
  if (s === 'rejected' || s === 'denied') return 'rejeitada';
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const apiKey = Deno.env.get("NFE_IO_API_KEY");
    if (!apiKey) return Response.json({ error: 'NFE_IO_API_KEY não configurada' }, { status: 500 });

    const body = await req.json();
    const { event, data } = body;

    // Recebe evento de entidade
    const notaId = event?.entity_id;
    const nota = data;

    if (!notaId || !nota) {
      return Response.json({ skipped: true, reason: 'Sem dados da nota' });
    }

    const nfeIoId = nota.nfe_io_id || nota.nfe_io_raw?.productInvoice?.id;
    if (!nfeIoId) {
      return Response.json({ skipped: true, reason: 'Nota sem nfe_io_id' });
    }

    const empresas = await base44.asServiceRole.entities.EmpresaCliente.filter({ id: nota.empresa_id });
    const empresa = empresas[0];
    if (!empresa?.nfe_io_company_id) {
      return Response.json({ skipped: true, reason: 'Empresa sem nfe_io_company_id' });
    }

    const companyId = empresa.nfe_io_company_id;
    const headers = { 'Authorization': apiKey, 'Accept': 'application/json' };

    // Busca dados atualizados da nota na NFE.io
    const notaResp = await fetch(`${NFE_IO_BASE}/companies/${companyId}/productinvoices/${nfeIoId}`, { headers });
    if (!notaResp.ok) {
      console.log(`NFE.io retornou ${notaResp.status} para nota ${notaId}`);
      return Response.json({ skipped: true, reason: `NFE.io status ${notaResp.status}` });
    }

    const notaData = await notaResp.json();
    const invoice = notaData.productInvoice || notaData;

    const updates = {
      nfe_io_id: invoice.id || nfeIoId,
      nfe_io_raw: notaData,
    };

    const novoStatus = mapStatus(invoice.status);
    if (novoStatus) updates.status_sefaz = novoStatus;
    if (invoice.accessKey) updates.chave_acesso = invoice.accessKey;
    if (invoice.number) updates.numero = invoice.number;

    // Busca PDF e XML em paralelo
    const [pdfResp, xmlResp] = await Promise.all([
      fetch(`${NFE_IO_BASE}/companies/${companyId}/productinvoices/${nfeIoId}/pdf`, { headers }),
      fetch(`${NFE_IO_BASE}/companies/${companyId}/productinvoices/${nfeIoId}/xml`, { headers }),
    ]);

    if (pdfResp.ok) { const d = await pdfResp.json(); if (d.uri) updates.danfe_pdf_url = d.uri; }
    if (xmlResp.ok) { const d = await xmlResp.json(); if (d.uri) updates.retorno_xml_url = d.uri; }

    await base44.asServiceRole.entities.NotaFiscal55.update(notaId, updates);

    console.log(`Nota ${notaId} sincronizada → ${novoStatus || invoice.status}`);
    return Response.json({ success: true, notaId, status: novoStatus || invoice.status });

  } catch (error) {
    console.error('Erro sincronizarNfeAposEmissao:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});