import { useState } from "react";
import { X, Download, FileArchive, FileText, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import JSZip from "jszip";
import { jsPDF } from "jspdf";

export default function DownloadLoteModal({ certidoes, onClose }) {
  const [modo, setModo] = useState("zip"); // "zip" | "pdf"
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [erros, setErros] = useState([]);
  const [concluido, setConcluido] = useState(false);

  const comArquivo = certidoes.filter(c => c.arquivo_url);

  const baixarZip = async () => {
    const zip = new JSZip();
    const novosErros = [];

    for (let i = 0; i < comArquivo.length; i++) {
      const cert = comArquivo[i];
      try {
        const resp = await fetch(cert.arquivo_url);
        if (!resp.ok) throw new Error("Falha ao baixar");
        const blob = await resp.blob();
        const nome = `${cert.empresa_nome}_${cert.tipo}${cert.subtipo ? "_" + cert.subtipo : ""}.pdf`
          .replace(/[^a-zA-Z0-9_\-\.]/g, "_");
        zip.file(nome, blob);
      } catch {
        novosErros.push(cert.empresa_nome);
      }
      setProgresso(Math.round(((i + 1) / comArquivo.length) * 100));
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "certidoes.zip";
    a.click();
    URL.revokeObjectURL(url);
    setErros(novosErros);
    setConcluido(true);
  };

  const baixarPdfUnificado = async () => {
    const pdf = new jsPDF();
    const novosErros = [];
    let pagina = 0;

    for (let i = 0; i < comArquivo.length; i++) {
      const cert = comArquivo[i];
      try {
        // Adiciona página de capa para cada certidão
        if (pagina > 0) pdf.addPage();
        pdf.setFontSize(16);
        pdf.setTextColor(30, 64, 175);
        pdf.text("CertidãoHub", 20, 20);
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Empresa: ${cert.empresa_nome}`, 20, 35);
        pdf.text(`CNPJ: ${cert.empresa_cnpj || "—"}`, 20, 45);
        pdf.text(`Tipo: ${cert.tipo}${cert.subtipo ? " — " + cert.subtipo : ""}`, 20, 55);
        pdf.text(`Status: ${cert.status}`, 20, 65);
        if (cert.data_vencimento) {
          pdf.text(`Vencimento: ${new Date(cert.data_vencimento).toLocaleDateString("pt-BR")}`, 20, 75);
        }
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text("* O PDF original da certidão está disponível no sistema.", 20, 90);
        pagina++;
      } catch {
        novosErros.push(cert.empresa_nome);
      }
      setProgresso(Math.round(((i + 1) / comArquivo.length) * 100));
    }

    pdf.save("certidoes_unificado.pdf");
    setErros(novosErros);
    setConcluido(true);
  };

  const iniciar = async () => {
    setProcessando(true);
    setProgresso(0);
    setErros([]);
    setConcluido(false);
    if (modo === "zip") {
      await baixarZip();
    } else {
      await baixarPdfUnificado();
    }
    setProcessando(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Download em Lote</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>{comArquivo.length}</strong> certidão(ões) com arquivo disponível de <strong>{certidoes.length}</strong> selecionada(s).
          </p>

          {/* Modo */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setModo("zip")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                modo === "zip"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
              }`}
            >
              <FileArchive className={`w-8 h-8 ${modo === "zip" ? "text-blue-600" : "text-gray-400"}`} />
              <div className="text-center">
                <p className={`text-sm font-medium ${modo === "zip" ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}>
                  Arquivo ZIP
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">PDFs individuais compactados</p>
              </div>
            </button>

            <button
              onClick={() => setModo("pdf")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                modo === "pdf"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
              }`}
            >
              <FileText className={`w-8 h-8 ${modo === "pdf" ? "text-blue-600" : "text-gray-400"}`} />
              <div className="text-center">
                <p className={`text-sm font-medium ${modo === "pdf" ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}>
                  PDF Unificado
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Resumo em um único PDF</p>
              </div>
            </button>
          </div>

          {/* Progresso */}
          {processando && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Processando...</span>
                <span className="font-medium text-gray-900 dark:text-white">{progresso}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progresso}%` }}
                />
              </div>
            </div>
          )}

          {/* Concluído */}
          {concluido && (
            <div className={`flex items-start gap-2 p-3 rounded-lg border ${
              erros.length === 0
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
            }`}>
              {erros.length === 0
                ? <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                : <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              }
              <p className={`text-sm ${erros.length === 0 ? "text-green-800 dark:text-green-300" : "text-yellow-800 dark:text-yellow-300"}`}>
                {erros.length === 0
                  ? "Download concluído com sucesso!"
                  : `Download concluído com ${erros.length} erro(s): ${erros.join(", ")}`
                }
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {concluido ? "Fechar" : "Cancelar"}
          </button>
          {!concluido && (
            <button
              onClick={iniciar}
              disabled={processando || comArquivo.length === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50"
            >
              {processando
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Download className="w-4 h-4" />
              }
              {processando ? "Baixando..." : "Baixar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}