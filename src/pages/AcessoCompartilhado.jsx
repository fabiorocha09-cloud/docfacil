import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { FileCheck2, Download, Building2, FileText, Lock, AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react";

const statusConfig = {
  regular: { label: "Regular", color: "text-green-700 bg-green-50 border-green-200", icon: CheckCircle2 },
  irregular: { label: "Irregular", color: "text-red-700 bg-red-50 border-red-200", icon: XCircle },
  pendente: { label: "Pendente", color: "text-yellow-700 bg-yellow-50 border-yellow-200", icon: Clock },
  processando: { label: "Processando", color: "text-blue-700 bg-blue-50 border-blue-200", icon: Clock },
  erro: { label: "Erro", color: "text-gray-700 bg-gray-50 border-gray-200", icon: AlertTriangle },
};

const tipoDocLabels = {
  cartao_cnpj: "Cartão CNPJ",
  procuracao_tj: "Procuração TJ",
  crc_contador: "CRC Contador",
  alvara_municipal: "Alvará Municipal",
  alvara_visa: "Alvará VISA",
  avcb_bombeiros: "AVCB Bombeiros",
};

const tipoLabels = { federal: "Federal", estadual: "Estadual", municipal: "Municipal", fgts: "FGTS", trabalhista: "Trabalhista" };

export default function AcessoCompartilhado() {
  const token = window.location.pathname.split("/acesso/")[1];
  const [step, setStep] = useState("email"); // email | loading | valido | expirado | invalido | bloqueado
  const [email, setEmail] = useState("");
  const [sharedLink, setSharedLink] = useState(null);
  const [certidoes, setCertidoes] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [erro, setErro] = useState("");

  const validar = async (e) => {
    e.preventDefault();
    setStep("loading");

    const links = await base44.entities.SharedLink.filter({ token });

    if (!links || links.length === 0) {
      setStep("invalido");
      return;
    }

    const link = links[0];

    if (!link.ativo) {
      setStep("bloqueado");
      return;
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      setStep("expirado");
      return;
    }

    if (link.email_cliente.toLowerCase() !== email.toLowerCase()) {
      setErro("Este e-mail não tem permissão para acessar este link.");
      setStep("email");
      return;
    }

    // Incrementa contador de acesso
    await base44.entities.SharedLink.update(link.id, { acesso_count: (link.acesso_count || 0) + 1 });

    setSharedLink(link);

    // Carrega certidões e documentos da empresa
    const [certs, docs] = await Promise.all([
      base44.entities.Certidao.filter({ empresa_id: link.empresa_id }),
      base44.entities.DocumentoEmpresa.filter({ empresa_id: link.empresa_id }),
    ]);

    setCertidoes(certs.filter(c => !c.excluida));
    setDocumentos(docs);
    setStep("valido");
  };

  if (step === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (step === "invalido") {
    return <TelaErro icon={AlertTriangle} titulo="Link inválido" descricao="Este link não existe ou foi removido." />;
  }

  if (step === "expirado") {
    return <TelaErro icon={Clock} titulo="Link expirado" descricao="Este link de acesso não é mais válido. Solicite um novo link ao seu contador." />;
  }

  if (step === "bloqueado") {
    return <TelaErro icon={Lock} titulo="Acesso revogado" descricao="Este link foi desativado. Entre em contato com o seu contador." />;
  }

  if (step === "email") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <FileCheck2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">CertidãoHub</h1>
              <p className="text-xs text-gray-500">Acesso seguro a documentos</p>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-1">Confirme seu e-mail</h2>
          <p className="text-sm text-gray-500 mb-6">Digite o e-mail cadastrado para acessar os documentos.</p>

          <form onSubmit={validar} className="space-y-4">
            <input
              required
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com.br"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {erro && (
              <p className="text-sm text-red-600 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> {erro}
              </p>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Acessar Documentos
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Tela principal — documentos e certidões
  const certRegulares = certidoes.filter(c => c.status === "regular").length;
  const certIrregulares = certidoes.filter(c => c.status === "irregular").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileCheck2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-gray-900">CertidãoHub</span>
            <span className="text-gray-400 mx-2">·</span>
            <span className="text-sm text-gray-600">Portal do Cliente</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Info da empresa */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{sharedLink.empresa_nome}</h1>
              <p className="text-sm text-gray-500">CNPJ: {sharedLink.empresa_cnpj}</p>
            </div>
          </div>
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{certidoes.length}</p>
              <p className="text-xs text-gray-500">Certidões</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{certRegulares}</p>
              <p className="text-xs text-gray-500">Regulares</p>
            </div>
            {certIrregulares > 0 && (
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{certIrregulares}</p>
                <p className="text-xs text-gray-500">Irregulares</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{documentos.length}</p>
              <p className="text-xs text-gray-500">Documentos</p>
            </div>
          </div>
        </div>

        {/* Certidões */}
        {certidoes.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Certidões</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {certidoes.map(cert => {
                const cfg = statusConfig[cert.status] || statusConfig.pendente;
                const StatusIcon = cfg.icon;
                return (
                  <div key={cert.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-gray-900 text-sm">{tipoLabels[cert.tipo]}</span>
                        {cert.subtipo && <span className="text-xs text-gray-400">{cert.subtipo}</span>}
                      </div>
                      {cert.data_vencimento && (
                        <p className="text-xs text-gray-500">
                          Vence em: {new Date(cert.data_vencimento).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </div>
                      {cert.arquivo_url && sharedLink.allow_download && (
                        <a
                          href={cert.arquivo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Documentos */}
        {documentos.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Documentos da Empresa</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {documentos.map(doc => (
                <div key={doc.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span className="text-sm text-gray-800 font-medium">{tipoDocLabels[doc.tipo] || doc.tipo}</span>
                  </div>
                  {doc.arquivo_url && sharedLink.allow_download && (
                    <a
                      href={doc.arquivo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" /> Baixar
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {certidoes.length === 0 && documentos.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FileCheck2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum documento disponível no momento.</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-400">
          Acesso autorizado para {sharedLink.email_cliente}
          {sharedLink.expires_at && ` · Expira em ${new Date(sharedLink.expires_at).toLocaleDateString("pt-BR")}`}
        </p>
      </div>
    </div>
  );
}

function TelaErro({ icon: Icon, titulo, descricao }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">{titulo}</h2>
        <p className="text-sm text-gray-500">{descricao}</p>
      </div>
    </div>
  );
}