import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Link2, Copy, Check, Mail, Loader2, Clock, Layers } from "lucide-react";

const EXPIRACAO_OPCOES = [
  { label: "7 dias", dias: 7 },
  { label: "15 dias", dias: 15 },
  { label: "30 dias", dias: 30 },
  { label: "Sem expiração", dias: null },
];

// Pode ser usado para empresa individual OU grupo
// Props: empresa (scope=empresa) OU grupo + empresasDoGrupo (scope=grupo)
export default function GerarLinkModal({ empresa, grupo, empresasDoGrupo = [], onClose }) {
  const [emailCliente, setEmailCliente] = useState("");
  const [expiracao, setExpiracao] = useState(7);
  const [allowDownload, setAllowDownload] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [linkGerado, setLinkGerado] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);

  const isGrupo = !!grupo;
  const titulo = isGrupo ? grupo.nome : empresa.nome;
  const subtitulo = isGrupo ? `${empresasDoGrupo.length} empresa(s) vinculada(s)` : empresa.cnpj;

  const gerarToken = () => {
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
  };

  const handleGerar = async (e) => {
    e.preventDefault();
    setGerando(true);

    const token = gerarToken();
    const user = await base44.auth.me();
    const expiresAt = expiracao ? new Date(Date.now() + expiracao * 24 * 60 * 60 * 1000).toISOString() : null;

    if (isGrupo) {
      await base44.entities.SharedLink.create({
        token,
        email_cliente: emailCliente,
        scope: "grupo",
        grupo_id: grupo.id,
        grupo_nome: grupo.nome,
        expires_at: expiresAt,
        allow_download: allowDownload,
        ativo: true,
        acesso_count: 0,
        criado_por_email: user?.email || "",
        criado_por_nome: user?.full_name || "",
      });
    } else {
      await base44.entities.SharedLink.create({
        token,
        email_cliente: emailCliente,
        scope: "empresa",
        empresa_id: empresa.id,
        empresa_nome: empresa.nome,
        empresa_cnpj: empresa.cnpj,
        expires_at: expiresAt,
        allow_download: allowDownload,
        ativo: true,
        acesso_count: 0,
        criado_por_email: user?.email || "",
        criado_por_nome: user?.full_name || "",
      });
    }

    const url = `${window.location.origin}/acesso/${token}`;
    setLinkGerado(url);
    setGerando(false);
  };

  const copiar = () => {
    navigator.clipboard.writeText(linkGerado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const enviarPorEmail = async () => {
    setEnviandoEmail(true);
    const expMsg = expiracao ? `Este link expira em ${expiracao} dias.` : "Este link não possui expiração.";
    const descricao = isGrupo
      ? `documentos e certidões de todas as empresas do <strong>Grupo ${grupo.nome}</strong>`
      : `documentos e certidões da empresa <strong>${empresa.nome}</strong> (CNPJ: ${empresa.cnpj})`;

    await base44.integrations.Core.SendEmail({
      to: emailCliente,
      subject: `Acesso aos documentos — ${titulo}`,
      from_name: "DocFácil",
      body: `
<div style="font-family:Arial,sans-serif;font-size:14px;color:#1f2937;line-height:1.7;max-width:600px;">
  <p>Olá,</p>
  <p>Segue o link de acesso aos ${descricao}:</p>
  <p style="margin:24px 0;">
    <a href="${linkGerado}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
      Acessar Documentos
    </a>
  </p>
  <p style="color:#6b7280;font-size:13px;">${expMsg}</p>
  <p>Atenciosamente,<br/><strong>DocFácil</strong></p>
</div>`,
    });
    setEmailEnviado(true);
    setEnviandoEmail(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              {isGrupo ? <Layers className="w-4 h-4 text-indigo-600" /> : <Link2 className="w-4 h-4 text-blue-600" />}
              Gerar Link Compartilhável
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{titulo} · {subtitulo}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {!linkGerado ? (
          <form onSubmit={handleGerar} className="p-5 space-y-4">
            {isGrupo && empresasDoGrupo.length > 0 && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
                <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium mb-1">Empresas incluídas neste link:</p>
                <ul className="text-xs text-indigo-600 dark:text-indigo-400 space-y-0.5">
                  {empresasDoGrupo.map(e => <li key={e.id}>• {e.nome} ({e.cnpj})</li>)}
                </ul>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail do cliente *</label>
              <input
                required
                type="email"
                value={emailCliente}
                onChange={e => setEmailCliente(e.target.value)}
                placeholder="cliente@empresa.com.br"
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-400 mt-1">Somente este e-mail poderá acessar o link.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Expiração
              </label>
              <div className="grid grid-cols-2 gap-2">
                {EXPIRACAO_OPCOES.map(({ label, dias }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setExpiracao(dias)}
                    className={`px-3 py-2 rounded-lg border text-sm transition-all ${expiracao === dias ? "border-blue-500 bg-blue-50 text-blue-700 font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowDownload}
                onChange={e => setAllowDownload(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Permitir download dos arquivos</span>
            </label>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={gerando}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50"
              >
                {gerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                {gerando ? "Gerando..." : "Gerar Link"}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800 dark:text-green-300">Link gerado com sucesso!</p>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Link de acesso</label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={linkGerado}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs bg-gray-50 text-gray-700 truncate"
                />
                <button
                  onClick={copiar}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${copiado ? "border-green-400 bg-green-50 text-green-700" : "border-gray-200 hover:bg-gray-50 text-gray-700"}`}
                >
                  {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiado ? "Copiado!" : "Copiar"}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Acessível apenas pelo e-mail: <strong>{emailCliente}</strong>
                {expiracao && ` · Expira em ${expiracao} dias`}
              </p>
            </div>

            <button
              onClick={enviarPorEmail}
              disabled={enviandoEmail || emailEnviado}
              className="w-full flex items-center justify-center gap-2 border border-blue-200 text-blue-700 hover:bg-blue-50 text-sm font-medium py-2 rounded-lg disabled:opacity-50 transition-colors"
            >
              {enviandoEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {emailEnviado ? "E-mail enviado!" : enviandoEmail ? "Enviando..." : "Enviar link por e-mail"}
            </button>

            <button onClick={onClose} className="w-full border border-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}