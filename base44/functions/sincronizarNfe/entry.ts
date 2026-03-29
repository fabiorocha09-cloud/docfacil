import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const NFE_IO_BASE = "https://api.nfe.io/v2";

// Extrai o ID interno da NFE.io de qualquer formato de resposta salvo
function extrairNfeIoId(raw) {
  if (!raw) return null;
  return (
    raw.productInvoice?.id ||
    raw.nfe?.id ||
    raw.id ||
    null
  );
}

// Extrai links PDF/XML de qualquer formato de resposta
function extrairLinks(obj) {
  if (!obj) return {};
  const inner = obj.productInvoice || obj.nfe || obj;
  return {
    pdf: inner.links?.pdf || inner.links?.danfe || inner.linkDanfe || inner.pdfUrl || inner.danfeUrl || obj.links?.pdf || null,
    xml: inner.links?.xml || inner.linkXml || inner.xmlUrl || obj.links?.xml || null,
    chave: inner.accessKey || inner.chaveAcesso || inner.key || obj.accessKey || obj.chaveAcesso || null,
    protocolo: inner.protocol || inner.protocolo || inner.number || inner.nProtocolo || obj.protocolo || null,
    numero: inner.number || inner.numero || inner.nNF || obj.number || null,
    status: (inner.status || inner.description || obj.status || '').toLowerCase(),
  };
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
    if (!empresa.nfe_io_company_id) return Response.json({ error: 'NFE.io Company ID não configurado na empresa' }, { status: 400 });

    const headers = { 'Authorization': apiKey, 'Accept': 'application/json' };
    const companyId = empresa.nfe_io_company_id;

    // Estratégia 1: usar ID interno da NFE.io salvo no nfe_io_raw
    const nfeIoId = extrairNfeIoId(nota.nfe_io_raw);

    // Estratégia 2: usar chave de acesso salva no banco (já sem formatação)
    const chave = (nota.chave_acesso || '').replace(/\D/g, '');

    let data = null;
    let fetchedOk = false;

    // Tenta buscar pelo ID interno primeiro (mais confiável)
    if (nfeIoId) {
      console.log('Tentando buscar por ID interno NFE.io:', nfeIoId);
      const r = await fetch(`${NFE_IO_BASE}/companies/${companyId}/productinvoices/${nfeIoId}`, { headers });
      const txt = await r.text();
      console.log('Por ID status:', r.status, txt.substring(0, 300));
      if (r.ok) {
        try { data = JSON.parse(txt); fetchedOk = true; } catch { /* continua */ }
      }
    }

    // Tenta buscar pela chave de acesso
    if (!fetchedOk && chave.length >= 44) {
      console.log('Tentando buscar por chave de acesso:', chave);
      const r = await fetch(`${NFE_IO_BASE}/companies/${companyId}/productinvoices/${chave}`, { headers });
      const txt = await r.text();
      console.log('Por chave status:', r.status, txt.substring(0, 300));
      if (r.ok) {
        try { data = JSON.parse(txt); fetchedOk = true; } catch { /* continua */ }
      }
    }

    // Tenta listar as notas mais recentes e encontrar a correspondente
    if (!fetchedOk) {
      console.log('Tentando listar notas recentes...');
      const r = await fetch(`${NFE_IO_BASE}/companies/${companyId}/productinvoices?pageCount=50&pageIndex=0`, { headers });
      const txt = await r.text();
      console.log('Lista status:', r.status, txt.substring(0, 300));
      if (r.ok) {
        try {
          const list = JSON.parse(txt);
          const items = list.productInvoices || list.nfes || list.items || list || [];
          // Tenta encontrar pela chave ou pelo número
          const match = items.find(n =>
            (n.accessKey && n.accessKey === chave) ||
            (n.chaveAcesso && n.chaveAcesso.replace(/\D/g,'') === chave) ||
            (nota.numero && (n.number == nota.numero || n.numero == nota.numero))
          );
          if (match) {
            data = match;
            fetchedOk = true;
            console.log('Nota encontrada na listagem:', match.id || match.accessKey);
          }
        } catch { /* continua */ }
      }
    }

    // Último recurso: tenta extrair dados do nfe_io_raw já salvo (resposta da emissão)
    if (!fetchedOk && nota.nfe_io_raw) {
      console.log('Usando nfe_io_raw salvo como fallback');
      data = nota.nfe_io_raw;
      fetchedOk = true;
    }

    if (!fetchedOk || !data) {
      return Response.json({
        error: 'Não foi possível localizar a nota na NFE.io automaticamente. Verifique se a nota possui chave de acesso salva ou se o Company ID está correto.',
      }, { status: 404 });
    }

    // Extrai todos os campos relevantes
    const links = extrairLinks(data);

    const updates = { nfe_io_raw: data };

    if (links.pdf) updates.danfe_pdf_url = links.pdf;
    if (links.xml) updates.retorno_xml_url = links.xml;
    if (links.chave) updates.chave_acesso = links.chave;
    if (links.protocolo) updates.protocolo = String(links.protocolo);
    if (links.numero) updates.numero = links.numero;

    if (links.status.includes('autorizado') || links.status.includes('authorized') || links.status.includes('issued')) {
      updates.status_sefaz = 'transmitida';
    }

    await base44.asServiceRole.entities.NotaFiscal55.update(notaId, updates);

    return Response.json({
      success: true,
      danfe_pdf_url: links.pdf,
      retorno_xml_url: links.xml,
      chave_acesso: links.chave,
      data,
    });

  } catch (error) {
    console.error('Erro sincronizarNfe:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});