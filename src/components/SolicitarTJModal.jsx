import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Mail, Loader2, CheckCircle2, AlertTriangle, FileText, Paperclip, Pencil } from "lucide-react";

const DOCS_NECESSARIOS = ["procuracao_tj", "cartao_cnpj", "crc_contador"];
const DOCS_LABELS = {
  procuracao_tj: "Procuração TJ",
  cartao_cnpj: "Cartão CNPJ",
  crc_contador: "CRC Contador",
};

const REMETENTE = "docfacil@docfacil.comvcscala.com";
const DESTINATARIO_PADRAO = "fabio@scalagestao.com.br";

export default function SolicitarTJModal({ empresa, onClose }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [destinatario, setDestinatario] = useState(DESTINATARIO_PADRAO);
  const [editandoDest, setEditandoDest] = useState(false);

  useEffect(() => {
    base44.entities.DocumentoEmpresa.filter({ empresa_id: empresa.id }).then(data => {
      setDocs(data);
      setLoading(false);
    });
  }, [empresa.id]);

  const getDoc = (tipo) => docs.find(d => d.tipo === tipo);
  const docsPresentes = DOCS_NECESSARIOS.filter(t => getDoc(t));
  const docsFaltando = DOCS_NECESSARIOS.filter(t => !getDoc(t));

  const corpoEmail = `Prezado,

Venho, por meio deste, solicitar a emissão de nova certidão de falência e concordata da empresa ${empresa.nome}, inscrita no CNPJ nº ${empresa.cnpj},

Partes envolvidas:
Empresa: ${empresa.nome}
Procurador: Fábio Luciano da Cruz Rocha
Finalidade: Solicitação de certidão de falência e concordata atualizada.

Em anexo à Procuração, Documento de identificação e cartão CNPJ.`;

  const gerarHtmlEmail = () => {
    const linksHtml = docsPresentes.map(tipo => {
      const doc = getDoc(tipo);
      return `<li style="margin-bottom:6px;"><strong>${DOCS_LABELS[tipo]}:</strong> <a href="${doc.arquivo_url}" style="color:#2563eb;">${DOCS_LABELS[tipo]} — clique para acessar</a></li>`;
    }).join("");

    return `
<div style="font-family:Arial,sans-serif;font-size:14px;color:#1f2937;line-height:1.7;max-width:600px;">
  <p>Prezado(a),</p>
  <p>Venho, por meio deste, solicitar a emissão de nova <strong>certidão de falência e concordata</strong> da empresa abaixo:</p>
  <table style="border-collapse:collapse;margin:16px 0;width:100%;">
    <tr><td style="padding:6px 12px;background:#f3f4f6;font-weight:bold;width:40%;">Empresa</td><td style="padding:6px 12px;border:1px solid #e5e7eb;">${empresa.nome}</td></tr>
    <tr><td style="padding:6px 12px;background:#f3f4f6;font-weight:bold;">CNPJ</td><td style="padding:6px 12px;border:1px solid #e5e7eb;">${empresa.cnpj}</td></tr>
    <tr><td style="padding:6px 12px;background:#f3f4f6;font-weight:bold;">Procurador</td><td style="padding:6px 12px;border:1px solid #e5e7eb;">Fábio Luciano da Cruz Rocha</td></tr>
    <tr><td style="padding:6px 12px;background:#f3f4f6;font-weight:bold;">Finalidade</td><td style="padding:6px 12px;border:1px solid #e5e7eb;">Solicitação de certidão de falência e concordata atualizada</td></tr>
  </table>
  <p>Seguem os documentos necessários para instrução do pedido:</p>
  <ul style="padding-left:20px;">${linksHtml}</ul>
  <p style="margin-top:24px;">Atenciosamente,<br/>
  <strong>Fábio Luciano da Cruz Rocha</strong><br/>
  <span style="color:#6b7280;">Scala Gestão — ${REMETENTE}</span></p>
</div>`;
  };

  const enviarEmail = async () => {
    setEnviando(true);

    await base44.integrations.Core.SendEmail({
      to: destinatario,
      subject: `Solicitação de Certidão TJ-PA — ${empresa.nome}`,
      body: gerarHtmlEmail(),
      from_name: "Scala Gestão",
    });

    await base44.entities.LogRobo.create({
      timestamp: new Date().toISOString(),
      empresa_id: empresa.id,
      empresa_nome: empresa.nome,
      tipo_certidao: "trabalhista",
      acao: "Solicitação TJ-PA enviada por email",
      detalhes: `Email enviado para ${destinatario}. Documentos incluídos: ${docsPresentes.map(t => DOCS_LABELS[t]).join(", ")}`,
      status: "info",
    });

    setResultado("sucesso");
    setEnviando(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Solicitar Certidão TJ-PA</h2>
            <p className="text-xs text-gray-500 mt-0.5">{empresa.nome} — {empresa.cnpj}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Verificando documentos...
            </div>
          ) : (
            <>
              {/* Preview do email */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Mail className="w-3.5 h-3.5" />
                  <span>De: <strong>{REMETENTE}</strong></span>
                </div>
                {/* Destinatário editável */}
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Mail className="w-3.5 h-3.5" />
                  {editandoDest ? (
                    <input
                      type="email"
                      autoFocus
                      value={destinatario}
                      onChange={e => setDestinatario(e.target.value)}
                      onBlur={() => setEditandoDest(false)}
                      onKeyDown={e => e.key === "Enter" && setEditandoDest(false)}
                      className="flex-1 bg-white dark:bg-gray-700 border border-blue-300 rounded px-2 py-0.5 text-xs focus:outline-none"
                    />
                  ) : (
                    <span className="flex items-center gap-1">
                      Para: <strong>{destinatario}</strong>
                      <button
                        onClick={() => setEditandoDest(true)}
                        className="ml-1 text-gray-400 hover:text-blue-600"
                        title="Editar destinatário"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                  <p className="font-medium mb-1">Assunto: Solicitação de Certidão TJ-PA — {empresa.nome}</p>
                  <pre className="whitespace-pre-wrap text-xs text-gray-600 dark:text-gray-300 font-sans leading-relaxed">{corpoEmail}</pre>
                </div>
              </div>

              {/* Documentos */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4" /> Documentos a incluir no email
                </p>
                <div className="space-y-2">
                  {DOCS_NECESSARIOS.map(tipo => {
                    const doc = getDoc(tipo);
                    return (
                      <div key={tipo} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${doc ? "border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800" : "border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800"}`}>
                        <div className="flex items-center gap-2">
                          <FileText className={`w-4 h-4 ${doc ? "text-green-600" : "text-red-500"}`} />
                          <span className={doc ? "text-green-800 dark:text-green-300" : "text-red-700 dark:text-red-300"}>{DOCS_LABELS[tipo]}</span>
                        </div>
                        {doc ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <span className="text-xs text-red-600 dark:text-red-400">Não enviado</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {docsFaltando.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-800 dark:text-yellow-300">
                    <strong>Atenção:</strong> {docsFaltando.map(t => DOCS_LABELS[t]).join(", ")} não {docsFaltando.length === 1 ? "está" : "estão"} disponível(is). O email será enviado apenas com os documentos presentes.
                  </p>
                </div>
              )}

              {resultado === "sucesso" && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-green-800 dark:text-green-300">Email enviado com sucesso para {destinatario}!</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100 dark:border-gray-700">
          <button onClick={onClose} className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            {resultado === "sucesso" ? "Fechar" : "Cancelar"}
          </button>
          {resultado !== "sucesso" && (
            <button
              onClick={enviarEmail}
              disabled={enviando || loading || docsPresentes.length === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50"
            >
              {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {enviando ? "Enviando..." : "Enviar Email"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}