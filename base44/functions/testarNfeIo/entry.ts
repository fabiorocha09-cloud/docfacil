import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const NFE_IO_BASE = "https://api.nfe.io/v1";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = Deno.env.get("NFE_IO_API_KEY");
    if (!apiKey) return Response.json({ error: 'NFE_IO_API_KEY não configurada' }, { status: 500 });

    const { companyId } = await req.json();

    const url = `${NFE_IO_BASE}/companies/${companyId}`;
    console.log('Testando URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
    });

    const rawText = await response.text();
    console.log('Status:', response.status);
    console.log('Resposta:', rawText);

    let result;
    try { result = JSON.parse(rawText); } catch { result = rawText; }

    return Response.json({
      companyId,
      status: response.status,
      ok: response.ok,
      data: result,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});