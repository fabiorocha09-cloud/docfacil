import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';


Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { empresa_id, empresa_nome, empresa_cnpj } = await req.json();

    if (!empresa_cnpj) {
      return Response.json({ error: 'CNPJ é obrigatório' }, { status: 400 });
    }

    const cnpjLimpo = empresa_cnpj.replace(/\D/g, '');
    const apiKey = Deno.env.get('CNP_JA_CARTAO');

    // Chama a API da CNPJA para obter o cartão CNPJ em PDF
    const cnpjaResponse = await fetch(
      `https://api.cnpja.com/rfb/certificate?taxId=${cnpjLimpo}&pages=REGISTRATION,MEMBERS`,
      {
        headers: { 'Authorization': apiKey },
      }
    );

    if (!cnpjaResponse.ok) {
      const errorText = await cnpjaResponse.text();
      return Response.json({ error: `Erro na API CNPJA: ${cnpjaResponse.status} - ${errorText}` }, { status: 502 });
    }

    const pdfBuffer = await cnpjaResponse.arrayBuffer();
    const fileName = `cartao_cnpj_${cnpjLimpo}.pdf`;

    // Cria File object (Web API suportada pelo Deno) e faz upload via SDK
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const file = new File([blob], fileName, { type: 'application/pdf' });

    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    // Verifica se já existe um cartão CNPJ para esta empresa
    const existentes = await base44.asServiceRole.entities.DocumentoEmpresa.filter({
      empresa_id,
      tipo: 'cartao_cnpj',
    });

    if (existentes.length > 0) {
      await base44.asServiceRole.entities.DocumentoEmpresa.update(existentes[0].id, {
        arquivo_url: file_url,
      });
    } else {
      await base44.asServiceRole.entities.DocumentoEmpresa.create({
        empresa_id,
        empresa_nome,
        empresa_cnpj,
        tipo: 'cartao_cnpj',
        arquivo_url: file_url,
      });
    }

    return Response.json({ success: true, file_url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});