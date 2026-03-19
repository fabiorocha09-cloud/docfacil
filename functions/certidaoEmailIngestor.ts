import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * certidaoEmailIngestor
 *
 * Webhook endpoint para receber e-mails encaminhados por um serviço como
 * Mailgun, SendGrid Inbound Parse, Postmark Inbound, etc.
 *
 * Payload esperado (multipart/form-data ou JSON):
 * {
 *   from: "remetente@dominio.com",
 *   to: "docfacil@docfacil.comvcscala.com",
 *   subject: "Re: Solicitação de Certidão TJ-PA — Empresa Exemplo Ltda",
 *   body_plain: "Corpo do e-mail em texto simples",
 *   attachments: [ { filename, content (base64), contentType } ]  <- se JSON
 *   attachment-1, attachment-2 ... <- se multipart/form-data (Mailgun style)
 * }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const contentType = req.headers.get('content-type') || '';

    let from = '', to = '', subject = '', bodyPlain = '';
    const attachmentBlobs = []; // { filename, blob }

    if (contentType.includes('application/json')) {
      // --- JSON payload (ex: SendGrid, Postmark) ---
      const body = await req.json();
      from = body.from || body.sender || '';
      to = body.to || body.recipient || '';
      subject = body.subject || '';
      bodyPlain = body.body_plain || body.text || body.body || '';

      const attachments = body.attachments || [];
      for (const att of attachments) {
        const base64Data = att.content || att.data || '';
        if (!base64Data) continue;
        const binaryStr = atob(base64Data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        const blob = new Blob([bytes], { type: att.contentType || 'application/octet-stream' });
        attachmentBlobs.push({ filename: att.filename || `anexo_${attachmentBlobs.length + 1}`, blob });
      }
    } else {
      // --- multipart/form-data (ex: Mailgun) ---
      const formData = await req.formData();
      from = formData.get('from') || formData.get('sender') || '';
      to = formData.get('to') || formData.get('recipient') || '';
      subject = formData.get('subject') || '';
      bodyPlain = formData.get('body-plain') || formData.get('text') || formData.get('body') || '';

      for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.size > 0) {
          attachmentBlobs.push({ filename: value.name || key, blob: value });
        }
      }
    }

    // --- Upload dos anexos ---
    const anexosUrls = [];
    for (const { filename, blob } of attachmentBlobs) {
      const file = new File([blob], filename, { type: blob.type });
      const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });
      anexosUrls.push(file_url);
    }

    // --- Identificar empresa pelo CNPJ no assunto ou corpo ---
    let empresaId = '';
    let empresaNome = 'Desconhecida';

    const textoCompleto = `${subject} ${bodyPlain}`;
    const cnpjMatch = textoCompleto.match(/\d{2}[\.\s]?\d{3}[\.\s]?\d{3}[\/\s]?\d{4}[-\s]?\d{2}/);

    if (cnpjMatch) {
      // Normaliza o CNPJ extraído para busca
      const cnpjRaw = cnpjMatch[0].replace(/\D/g, '');
      const todasEmpresas = await base44.asServiceRole.entities.Empresa.list();
      const encontrada = todasEmpresas.find(e => e.cnpj && e.cnpj.replace(/\D/g, '') === cnpjRaw);
      if (encontrada) {
        empresaId = encontrada.id;
        empresaNome = encontrada.nome;
      }
    }

    // Fallback: buscar pelo nome da empresa no assunto
    if (!empresaId) {
      const todasEmpresas = await base44.asServiceRole.entities.Empresa.list();
      for (const empresa of todasEmpresas) {
        if (empresa.nome && subject.toLowerCase().includes(empresa.nome.toLowerCase())) {
          empresaId = empresa.id;
          empresaNome = empresa.nome;
          break;
        }
      }
    }

    if (!empresaId) {
      console.warn(`[certidaoEmailIngestor] Empresa não identificada. From: ${from} | Subject: ${subject}`);
      return Response.json({
        status: 'error',
        message: 'Empresa não identificada. Inclua o CNPJ ou nome da empresa no assunto do e-mail.'
      }, { status: 422 });
    }

    // --- Determinar tipo ---
    const tipo = subject.toLowerCase().includes('tj') || bodyPlain.toLowerCase().includes('tribunal') ? 'tj_pa' : 'outro';

    // --- Criar registro de RespostaEmail ---
    const registro = await base44.asServiceRole.entities.RespostaEmail.create({
      empresa_id: empresaId,
      empresa_nome: empresaNome,
      assunto_original: subject,
      de: from,
      para: to,
      corpo: bodyPlain,
      data_recebimento: new Date().toISOString(),
      lida: false,
      tipo,
      anexos_urls: anexosUrls,
    });

    console.log(`[certidaoEmailIngestor] Resposta criada: ${registro.id} | Empresa: ${empresaNome} | Anexos: ${anexosUrls.length}`);

    return Response.json({ status: 'success', id: registro.id, anexos: anexosUrls.length });

  } catch (error) {
    console.error('[certidaoEmailIngestor] Erro:', error.message);
    return Response.json({ status: 'error', message: error.message }, { status: 500 });
  }
});