import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const NFE_IO_BASE = "https://api.nfse.io/v2";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { notaId, empresaId, justificativa } = body;

    const apiKey = Deno.env.get("NFE_IO_API_KEY");
    if (!apiKey) return Response.json({ error: 'NFE_IO_API_KEY não configurada' }, { status: 500 });

    const [notas, empresas] = await Promise.all([
      base44.asServiceRole.entities.NotaFiscal55.filter({ id: notaId }),
      base44.asServiceRole.entities.EmpresaCliente.filter({ id: empresaId }),
    ]);

    const nota = notas[0];
    const empresa = empresas[0];

    if (!nota || !empresa) {
      return Response.json({ error: 'Nota ou empresa não encontrada' }, { status: 404 });
    }
    if (nota.status_sefaz !== 'transmitida') {
      return Response.json({ error: 'Apenas notas transmitidas podem ser canceladas' }, { status: 400 });
    }

    const nfeIoCompanyId = empresa.nfe_io_company_id;
    const chaveAcesso = nota.chave_acesso;

    if (!nfeIoCompanyId || !chaveAcesso) {
      return Response.json({ error: 'NFE.io Company ID ou Chave de Acesso não encontrados' }, { status: 400 });
    }

    const response = await fetch(`${NFE_IO_BASE}/companies/${nfeIoCompanyId}/productinvoices/${chaveAcesso}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ justification: justificativa }),
    });

    const rawText = await response.text();
    console.log('NFE.io cancel status:', response.status, rawText.substring(0, 300));

    let result;
    try { result = JSON.parse(rawText); } catch { result = { raw: rawText }; }

    if (!response.ok) {
      return Response.json({ error: result.message || 'Erro ao cancelar NF-e', details: result }, { status: 400 });
    }

    await base44.asServiceRole.entities.NotaFiscal55.update(notaId, {
      status_sefaz: 'cancelada',
      nfe_io_raw: result,
    });

    return Response.json({ success: true, result });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});