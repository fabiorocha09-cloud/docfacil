import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {

    const { cnpj } = await req.json();
    if (!cnpj) return Response.json({ error: 'CNPJ é obrigatório' }, { status: 400 });

    const apiKey = Deno.env.get("API_KEY");
    const cnpjLimpo = cnpj.replace(/\D/g, "");

    const response = await fetch(`https://api.cnpja.com/office/${cnpjLimpo}`, {
      headers: { 'Authorization': apiKey },
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: data.message || 'CNPJ não encontrado' }, { status: response.status });
    }

    // Monta telefone
    const phones = data.phones || [];
    const telefone = phones.length > 0
      ? `(${phones[0].area}) ${phones[0].number}`
      : "";

    // Inscrição estadual — registrations está na raiz do objeto
    const registrations = data.registrations || [];
    // Tenta primeiro enabled, se não, pega qualquer uma com número
    const ie = registrations.find(r => r.enabled && r.number) || registrations.find(r => r.number);
    const inscricao_estadual = ie ? ie.number : "";
    // Debug temporário
    const _regDebug = registrations.slice(0, 2);

    return Response.json({
      nome: data.company?.name || "",
      email: data.emails?.[0]?.address || "",
      telefone,
      inscricao_estadual,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});