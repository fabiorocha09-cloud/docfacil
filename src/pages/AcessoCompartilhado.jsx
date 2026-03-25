import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { FileCheck2, Download, Building2, FileText, Lock, AlertTriangle, CheckCircle2, XCircle, Clock, Layers, FolderDown, FileArchive } from "lucide-react";
import JSZip from "jszip";
import { jsPDF } from "jspdf";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const statusConfig = {
  regular: { label: "Regular", color: "text-green-700 bg-green-50 border-green-200", icon: CheckCircle2 },
  irregular: { label: "Irregular", color: "text-red-700 bg-red-50 border-red-200", icon: XCircle },
  pendente: { label: "Pendente", color: "text-yellow-700 bg-yellow-50 border-yellow-200", icon: Clock },
  processando: { label: "Processando", color: "text-blue-700 bg-blue-50 border-blue-200", icon: Clock },
  erro: { label: "Erro", color: "text-gray-700 bg-gray-50 border-gray-200", icon: AlertTriangle },
  ausente: { label: "Ausente", color: "text-red-700 bg-red-50 border-red-200", icon: XCircle },
  nao_aplicavel: { label: "Não Aplicável", color: "text-gray-500 bg-gray-50 border-gray-200", icon: AlertTriangle },
};

const tipoDocLabels = {
  cartao_cnpj: "Cartão CNPJ", procuracao_tj: "Procuração TJ", crc_contador: "CRC Contador",
  alvara_municipal: "Alvará Municipal", alvara_visa: "Alvará VISA", avcb_bombeiros: "AVCB Bombeiros",
};

const tipoLabels = {
  federal: "Federal", estadual: "Estadual", municipal: "Municipal",
  fgts: "FGTS", trabalhista: "Trabalhista",
  alvara_bombeiros: "Alvará - Bombeiros",
  alvara_vigilancia_sanitaria: "Alvará - Vigilância Sanitária",
  alvara_funcionamento: "Alvará - Funcionamento",
  alvara_meio_ambiente: "Alvará - Meio Ambiente",
};

const TODOS_TIPOS = ["federal","estadual","municipal","fgts","trabalhista","alvara_bombeiros","alvara_vigilancia_sanitaria","alvara_funcionamento","alvara_meio_ambiente"];

async function renderPdfAsImages(pdfUrl) {
  const resp = await fetch(pdfUrl);
  const arrayBuffer = await resp.arrayBuffer();
  const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const images = [];
  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    images.push({ dataUrl: canvas.toDataURL("image/jpeg", 0.85), width: viewport.width, height: viewport.height });
  }
  return images;
}

function DownloadEmpresaButton({ empresa, certidoes, documentos, allowDownload }) {
  const [baixando, setBaixando] = useState(false);
  const [modo, setModo] = useState(null); // null | "zip" | "pdf"

  if (!allowDownload) return null;

  const todosArquivos = [
    ...certidoes.filter(c => c.arquivo_url).map(c => ({ url: c.arquivo_url, nome: `certidao_${c.tipo}${c.subtipo ? "_" + c.subtipo : ""}` })),
    ...documentos.filter(d => d.arquivo_url).map(d => ({ url: d.arquivo_url, nome: `doc_${tipoDocLabels[d.tipo] || d.tipo}` })),
  ];

  if (todosArquivos.length === 0) return null;

  const baixarZip = async () => {
    setBaixando(true);
    const zip = new JSZip();
    for (const arq of todosArquivos) {
      try {
        const resp = await fetch(arq.url);
        const blob = await resp.blob();
        zip.file(`${arq.nome.replace(/[^a-zA-Z0-9_\-]/g, "_")}.pdf`, blob);
      } catch {}
    }
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${empresa.nome.replace(/[^a-zA-Z0-9]/g, "_")}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setBaixando(false);
    setModo(null);
  };

  const baixarPdf = async () => {
    setBaixando(true);
    const pdf = new jsPDF({ unit: "pt" });
    let first = true;
    for (const arq of todosArquivos) {
      try {
        const images = await renderPdfAsImages(arq.url);
        for (const img of images) {
          if (!first) pdf.addPage();
          first = false;
          const pageW = 595, pageH = 842;
          const ratio = Math.min(pageW / img.width, pageH / img.height);
          const w = img.width * ratio, h = img.height * ratio;
          pdf.addImage(img.dataUrl, "JPEG", (pageW - w) / 2, (pageH - h) / 2, w, h);
        }
      } catch {}
    }
    pdf.save(`${empresa.nome.replace(/[^a-zA-Z0-9]/g, "_")}_unificado.pdf`);
    setBaixando(false);
    setModo(null);
  };

  if (baixando) {
    return <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3 animate-spin" /> Processando...</span>;
  }

  if (modo === "choose") {
    return (
      <div className="flex items-center gap-2">
        <button onClick={baixarZip} className="flex items-center gap-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 hover:bg-gray-50">
          <FileArchive className="w-3 h-3" /> ZIP
        </button>
        <button onClick={baixarPdf} className="flex items-center gap-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 hover:bg-gray-50">
          <FileText className="w-3 h-3" /> PDF Unificado
        </button>
        <button onClick={() => setModo(null)} className="text-xs text-gray-400 hover:text-gray-600 px-1">✕</button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setModo("choose")}
      className="flex items-center gap-1.5 text-xs border border-blue-200 text-blue-700 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
    >
      <FolderDown className="w-3.5 h-3.5" /> Baixar tudo
    </button>
  );
}

export default function AcessoCompartilhado() {
  const token = window.location.pathname.split("/acesso/")[1];
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [sharedLink, setSharedLink] = useState(null);
  // Para empresa individual
  const [empresaIndividual, setEmpresaIndividual] = useState(null);
  const [certidoes, setCertidoes] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  // Para grupo
  const [empresasGrupo, setEmpresasGrupo] = useState([]); // [{empresa, certidoes, documentos}]
  const [erro, setErro] = useState("");

  const validar = async (e) => {
    e.preventDefault();
    setStep("loading");

    const links = await base44.entities.SharedLink.filter({ token });
    if (!links || links.length === 0) { setStep("invalido"); return; }

    const link = links[0];
    if (!link.ativo) { setStep("bloqueado"); return; }
    if (link.expires_at && new Date(link.expires_at) < new Date()) { setStep("expirado"); return; }
    if (link.email_cliente.toLowerCase() !== email.toLowerCase()) {
      setErro("Este e-mail não tem permissão para acessar este link.");
      setStep("email");
      return;
    }

    await base44.entities.SharedLink.update(link.id, { acesso_count: (link.acesso_count || 0) + 1 });
    setSharedLink(link);

    if (link.scope === "grupo") {
      // Carrega todas as empresas do grupo
      const todasEmpresas = (await base44.entities.Empresa.filter({ grupo_id: link.grupo_id })).filter(e => !e.excluida);
      const dados = await Promise.all(
        todasEmpresas.map(async emp => {
          const [certs, docs] = await Promise.all([
            base44.entities.Certidao.filter({ empresa_id: emp.id }),
            base44.entities.DocumentoEmpresa.filter({ empresa_id: emp.id }),
          ]);
          return { empresa: emp, certidoes: certs.filter(c => !c.excluida), documentos: docs };
        })
      );
      setEmpresasGrupo(dados);
    } else {
      const [certs, docs, emps] = await Promise.all([
        base44.entities.Certidao.filter({ empresa_id: link.empresa_id }),
        base44.entities.DocumentoEmpresa.filter({ empresa_id: link.empresa_id }),
        base44.entities.Empresa.filter({ id: link.empresa_id }),
      ]);
      setCertidoes(certs.filter(c => !c.excluida));
      setDocumentos(docs);
      setEmpresaIndividual(emps[0] || null);
    }

    setStep("valido");
  };

  if (step === "loading") return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  if (step === "invalido") return <TelaErro icon={AlertTriangle} titulo="Link inválido" descricao="Este link não existe ou foi removido." />;
  if (step === "expirado") return <TelaErro icon={Clock} titulo="Link expirado" descricao="Este link de acesso não é mais válido. Solicite um novo link ao seu contador." />;
  if (step === "bloqueado") return <TelaErro icon={Lock} titulo="Acesso revogado" descricao="Este link foi desativado. Entre em contato com o seu contador." />;

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
              required type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com.br"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {erro && <p className="text-sm text-red-600 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> {erro}</p>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors">
              Acessar Documentos
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Tela principal
  const isGrupo = sharedLink.scope === "grupo";

  if (isGrupo) {
    const totalCerts = empresasGrupo.reduce((s, e) => s + e.certidoes.length, 0);
    const totalRegulares = empresasGrupo.reduce((s, e) => s + e.certidoes.filter(c => c.status === "regular").length, 0);
    const totalDocs = empresasGrupo.reduce((s, e) => s + e.documentos.length, 0);

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileCheck2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">CertidãoHub</span>
            <span className="text-gray-400 mx-1">·</span>
            <span className="text-sm text-gray-600">Portal do Cliente</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          {/* Header do grupo */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Layers className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{sharedLink.grupo_nome}</h1>
                <p className="text-sm text-gray-500">{empresasGrupo.length} empresa(s) no grupo</p>
              </div>
            </div>
            <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
              <div className="text-center"><p className="text-2xl font-bold text-gray-900">{empresasGrupo.length}</p><p className="text-xs text-gray-500">Empresas</p></div>
              <div className="text-center"><p className="text-2xl font-bold text-gray-900">{totalCerts}</p><p className="text-xs text-gray-500">Certidões</p></div>
              <div className="text-center"><p className="text-2xl font-bold text-green-600">{totalRegulares}</p><p className="text-xs text-gray-500">Regulares</p></div>
              <div className="text-center"><p className="text-2xl font-bold text-gray-900">{totalDocs}</p><p className="text-xs text-gray-500">Documentos</p></div>
            </div>
          </div>

          {/* Empresas do grupo */}
          {empresasGrupo.map(({ empresa, certidoes: certs, documentos: docs }) => (
            <EmpresaCard
              key={empresa.id}
              empresa={empresa}
              certidoes={certs}
              documentos={docs}
              allowDownload={sharedLink.allow_download}
            />
          ))}

          <p className="text-center text-xs text-gray-400">
            Acesso autorizado para {sharedLink.email_cliente}
            {sharedLink.expires_at && ` · Expira em ${new Date(sharedLink.expires_at).toLocaleDateString("pt-BR")}`}
          </p>
        </div>
      </div>
    );
  }

  // Empresa individual
  const certRegulares = certidoes.filter(c => c.status === "regular").length;
  const certIrregulares = certidoes.filter(c => c.status === "irregular").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileCheck2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">CertidãoHub</span>
          <span className="text-gray-400 mx-1">·</span>
          <span className="text-sm text-gray-600">Portal do Cliente</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <EmpresaCard
          empresa={empresaIndividual || { nome: sharedLink.empresa_nome, cnpj: sharedLink.empresa_cnpj }}
          certidoes={certidoes}
          documentos={documentos}
          allowDownload={sharedLink.allow_download}
          showHeader
          stats={{ certRegulares, certIrregulares }}
        />

        <p className="text-center text-xs text-gray-400">
          Acesso autorizado para {sharedLink.email_cliente}
          {sharedLink.expires_at && ` · Expira em ${new Date(sharedLink.expires_at).toLocaleDateString("pt-BR")}`}
        </p>
      </div>
    </div>
  );
}

function EmpresaCard({ empresa, certidoes, documentos, allowDownload, showHeader, stats }) {
  const naoAplicaveis = empresa?.certidoes_nao_aplicaveis || [];
  // Gera entradas virtuais para tipos sem certidão cadastrada
  const tiposPresentes = new Set(certidoes.map(c => c.tipo));
  const virtuais = TODOS_TIPOS
    .filter(tipo => !tiposPresentes.has(tipo))
    .map(tipo => ({
      id: `virtual_${tipo}`,
      tipo,
      _virtual: true,
      status: naoAplicaveis.includes(tipo) ? "nao_aplicavel" : "ausente",
    }));
  const todasCertidoes = [...certidoes, ...virtuais];

  const certRegulares = stats?.certRegulares ?? certidoes.filter(c => c.status === "regular").length;
  const certIrregulares = stats?.certIrregulares ?? certidoes.filter(c => c.status === "irregular").length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header da empresa */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">{empresa.nome}</h2>
              {empresa.cnpj && <p className="text-sm text-gray-500">CNPJ: {empresa.cnpj}</p>}
            </div>
          </div>
          <DownloadEmpresaButton
            empresa={empresa}
            certidoes={certidoes}
            documentos={documentos}
            allowDownload={allowDownload}
          />
        </div>
        <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
          <div className="text-center"><p className="text-lg font-bold text-gray-900">{todasCertidoes.length}</p><p className="text-xs text-gray-500">Certidões</p></div>
          <div className="text-center"><p className="text-lg font-bold text-green-600">{certRegulares}</p><p className="text-xs text-gray-500">Regulares</p></div>
          {certIrregulares > 0 && <div className="text-center"><p className="text-lg font-bold text-red-600">{certIrregulares}</p><p className="text-xs text-gray-500">Irregulares</p></div>}
          <div className="text-center"><p className="text-lg font-bold text-gray-900">{documentos.length}</p><p className="text-xs text-gray-500">Documentos</p></div>
        </div>
      </div>

      {/* Certidões */}
      {todasCertidoes.length > 0 && (
        <div>
          <p className="px-5 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-100">Certidões</p>
          <div className="divide-y divide-gray-100">
            {todasCertidoes.map(cert => {
              const cfg = statusConfig[cert.status] || statusConfig.pendente;
              const StatusIcon = cfg.icon;
              return (
                <div key={cert.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">{tipoLabels[cert.tipo]}</span>
                      {cert.subtipo && <span className="text-xs text-gray-400">{cert.subtipo}</span>}
                    </div>
                    {cert.data_vencimento && <p className="text-xs text-gray-500">Vence: {new Date(cert.data_vencimento).toLocaleDateString("pt-BR")}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />{cfg.label}
                    </div>
                    {cert.arquivo_url && allowDownload && (
                      <a href={cert.arquivo_url} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Download">
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
        <div>
          <p className="px-5 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-y border-gray-100">Documentos</p>
          <div className="divide-y divide-gray-100">
            {documentos.map(doc => (
              <div key={doc.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-800 font-medium">{tipoDocLabels[doc.tipo] || doc.tipo}</span>
                </div>
                {doc.arquivo_url && allowDownload && (
                  <a href={doc.arquivo_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                    <Download className="w-3.5 h-3.5" /> Baixar
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {todasCertidoes.length === 0 && documentos.length === 0 && (
        <div className="p-8 text-center text-gray-400 text-sm">Nenhum documento disponível.</div>
      )}
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