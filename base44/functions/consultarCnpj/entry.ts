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

    // Inscrição estadual (primeira ativa se houver)
    const registrations = data.registrations || data.company?.registrations || data.establishment?.registrations || [];
    console.log('registrations raw:', JSON.stringify(registrations.slice(0, 2)));
    console.log('data keys:', Object.keys(data));
    const ie = registrations.find(r => r.enabled || r.state || r.number);
    const inscricao_estadual = ie ? (ie.number || ie.state_registration || ie.ie || "") : "";

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