import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SERPRO_TOKEN_URL = 'https://gateway.apiserpro.serpro.gov.br/token';

async function getSerproToken() {
  const key = Deno.env.get('SERPRO_API_KEY');
  const secret = Deno.env.get('SERPRO_API_SECRET');
  const credentials = btoa(`${key}:${secret}`);

  const res = await fetch(SERPRO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Erro ao obter token: ${res.status} - ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const cnpj = (body.cnpj || '13772792000164').replace(/\D/g, '');

    const accessToken = await getSerproToken();

    // Testa múltiplos paths possíveis
    const endpoints = [
      `https://gateway.apiserpro.serpro.gov.br/consulta-divida-ativa-df/v1/cnpj/${cnpj}`,
      `https://gateway.apiserpro.serpro.gov.br/consulta-divida-ativa-df/v2/cnpj/${cnpj}`,
      `https://gateway.apiserpro.serpro.gov.br/consulta-dívida-ativa/v1/cnpj/${cnpj}`,
      `https://gateway.apiserpro.serpro.gov.br/pgfn/v1/divida-ativa/cnpj/${cnpj}`,
      `https://gateway.apiserpro.serpro.gov.br/divida-ativa/v1/cnpj/${cnpj}`,
      `https://gateway.apiserpro.serpro.gov.br/consulta-divida-ativa-df/v1/situacao/${cnpj}`,
      `https://gateway.apiserpro.serpro.gov.br/integra-contador/v1/Consultar/divida-ativa/${cnpj}`,
    ];

    const results = await Promise.all(
      endpoints.map(async (url) => {
        try {
          const r = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
            },
          });
          const body = await r.text();
          return { url, status: r.status, body: body.slice(0, 300) };
        } catch (e) {
          return { url, status: 'error', body: e.message };
        }
      })
    );

    return Response.json({ cnpj, token_ok: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});