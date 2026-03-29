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

    const headers = { 'Authorization': apiKey, 'Accept': 'application/json' };

    // Busca todas as notas em status "transmitindo" que têm nfe_io_id
    const notas = await base44.asServiceRole.entities.NotaFiscal55.filter({ status_sefaz: 'transmitindo' });
    const notasComId = notas.filter(n => n.nfe_io_id || n.nfe_io_raw?.productInvoice?.id);

    console.log(`Sincronizando ${notasComId.length} nota(s) pendente(s)...`);

    const resultados = [];

    for (const nota of notasComId) {
      const empresas = await base44.asServiceRole.entities.EmpresaCliente.filter({ id: nota.empresa_id });
      const empresa = empresas[0];
      if (!empresa?.nfe_io_company_id) continue;

      const companyId = empresa.nfe_io_company_id;
      const nfeIoId = nota.nfe_io_id || nota.nfe_io_raw?.productInvoice?.id;

      try {
        const notaResp = await fetch(`${NFE_IO_BASE}/companies/${companyId}/productinvoices/${nfeIoId}`, { headers });
        if (!notaResp.ok) {
          console.log(`Nota ${nota.id}: erro ${notaResp.status}`);
          continue;
        }

        const notaData = await notaResp.json();
        const invoice = notaData.productInvoice || notaData;
        const novoStatus = mapStatus(invoice.status);

        if (!novoStatus) continue;

        const updates = {
          nfe_io_id: invoice.id || nfeIoId,
          nfe_io_raw: notaData,
          status_sefaz: novoStatus,
        };

        if (invoice.accessKey) updates.chave_acesso = invoice.accessKey;
        if (invoice.number) updates.numero = invoice.number;

        // Busca PDF e XML apenas se autorizada
        if (novoStatus === 'transmitida') {
          const [pdfResp, xmlResp] = await Promise.all([
            fetch(`${NFE_IO_BASE}/companies/${companyId}/productinvoices/${nfeIoId}/pdf`, { headers }),
            fetch(`${NFE_IO_BASE}/companies/${companyId}/productinvoices/${nfeIoId}/xml`, { headers }),
          ]);
          if (pdfResp.ok) { const d = await pdfResp.json(); if (d.uri) updates.danfe_pdf_url = d.uri; }
          if (xmlResp.ok) { const d = await xmlResp.json(); if (d.uri) updates.retorno_xml_url = d.uri; }
        }

        await base44.asServiceRole.entities.NotaFiscal55.update(nota.id, updates);
        resultados.push({ id: nota.id, status: novoStatus });
        console.log(`Nota ${nota.id} → ${novoStatus}`);
      } catch (err) {
        console.error(`Erro ao sincronizar nota ${nota.id}:`, err.message);
      }
    }

    return Response.json({ success: true, sincronizadas: resultados.length, resultados });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});