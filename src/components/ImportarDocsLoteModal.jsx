import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Upload, FileText, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";

const TIPOS_DOC = {
  cartao_cnpj: "Cartão CNPJ",
  procuracao_tj: "Procuração TJ",
  crc_contador: "CRC do Contador",
  alvara_municipal: "Alvará Municipal",
  alvara_visa: "Alvará VISA",
  avcb_bombeiros: "AVCB Bombeiros",
};

const statusLabel = {
  aguardando: { label: "Aguardando", color: "text-gray-500", icon: FileText },
  processando: { label: "Processando", color: "text-blue-600", icon: Loader2 },
  sucesso: { label: "Identificado", color: "text-green-600", icon: CheckCircle2 },
  erro: { label: "Erro", color: "text-red-600", icon: XCircle },
  sem_empresa: { label: "Empresa não encontrada", color: "text-yellow-600", icon: AlertTriangle },
  revisar: { label: "Revisar CNPJ", color: "text-orange-600", icon: AlertTriangle },
};

function limparCnpj(raw) {
  if (!raw) return "";
  const apenasDigitos = raw.replace(/\D/g, "");
  if (apenasDigitos.length === 14) return apenasDigitos;
  if (apenasDigitos.length > 14) return apenasDigitos.slice(-14);
  return apenasDigitos;
}

export default function ImportarDocsLoteModal({ onClose, onImportado }) {
  const [arquivos, setArquivos] = useState([]);
  const [processando, setProcessando] = useState(false);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    const novos = files.map(f => ({ file: f, nome: f.name, status: "aguardando", dados: null }));
    setArquivos(prev => [...prev, ...novos]);
  };

  const processarTodos = async () => {
    setProcessando(true);
    const empresas = await base44.entities.Empresa.list();
    const documentosExistentes = await base44.entities.DocumentoEmpresa.list();

    for (let i = 0; i < arquivos.length; i++) {
      if (arquivos[i].status === "sucesso") continue;

      setArquivos(prev => prev.map((a, idx) => idx === i ? { ...a, status: "processando" } : a));

      const { file_url } = await base44.integrations.Core.UploadFile({ file: arquivos[i].file });

      const resultado = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            cnpj: { type: "string", description: "CNPJ da empresa no documento, apenas números ou formatado" },
            tipo_documento: {
              type: "string",
              description: "Tipo do documento: cartao_cnpj, procuracao_tj, crc_contador, alvara_municipal, alvara_visa ou avcb_bombeiros"
            },
          }
        }
      });

      if (resultado.status !== "success") {
        setArquivos(prev => prev.map((a, idx) => idx === i ? { ...a, status: "erro", arquivo_url: file_url } : a));
        continue;
      }

      const dados = resultado.output;
      const cnpjLimpo = limparCnpj(dados?.cnpj);

      // CNPJ duvidoso
      if (dados?.cnpj && cnpjLimpo.length !== 14) {
        setArquivos(prev => prev.map((a, idx) => idx === i ? { ...a, status: "revisar", dados, arquivo_url: file_url, cnpjExtraido: dados.cnpj } : a));
        continue;
      }

      const empresa = empresas.find(e => e.cnpj?.replace(/\D/g, "") === cnpjLimpo);

      if (!empresa) {
        setArquivos(prev => prev.map((a, idx) => idx === i ? { ...a, status: "sem_empresa", dados, arquivo_url: file_url } : a));
        continue;
      }

      const tipo = dados?.tipo_documento || "cartao_cnpj";

      // Atualiza ou cria
      const existente = documentosExistentes.find(d => d.empresa_id === empresa.id && d.tipo === tipo);
      if (existente) {
        await base44.entities.DocumentoEmpresa.update(existente.id, { arquivo_url: file_url });
      } else {
        await base44.entities.DocumentoEmpresa.create({
          empresa_id: empresa.id,
          empresa_nome: empresa.nome,
          empresa_cnpj: empresa.cnpj,
          tipo,
          arquivo_url: file_url,
        });
      }

      setArquivos(prev => prev.map((a, idx) => idx === i ? { ...a, status: "sucesso", dados, empresa, arquivo_url: file_url } : a));
    }

    setProcessando(false);
    if (arquivos.some(a => a.status === "sucesso")) onImportado?.();
  };

  const remover = (i) => setArquivos(prev => prev.filter((_, idx) => idx !== i));
  const sucessos = arquivos.filter(a => a.status === "sucesso").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Importação em Lote com IA</h2>
            <p className="text-xs text-gray-500 mt-0.5">A IA identificará o tipo do documento e a empresa automaticamente</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Drop zone */}
          <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors">
            <Upload className="w-8 h-8 text-gray-400" />
            <div className="text-center">
              <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">Clique para selecionar arquivos</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">PDF, PNG, JPG — múltiplos permitidos</p>
            </div>
            <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple className="hidden" onChange={handleFiles} />
          </label>

          {arquivos.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">{arquivos.length} arquivo(s) · {sucessos} importado(s)</span>
                <button
                  onClick={processarTodos}
                  disabled={processando || arquivos.every(a => a.status === "sucesso")}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50"
                >
                  {processando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {processando ? "Processando..." : "Processar com IA"}
                </button>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {arquivos.map((arq, i) => {
                  const cfg = statusLabel[arq.status];
                  const Icon = cfg.icon;
                  return (
                    <div key={i} className="flex items-start justify-between px-4 py-3 gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{arq.nome}</p>
                          {arq.dados && arq.empresa && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 space-y-0.5">
                              <p>Empresa: <span className="font-medium text-gray-700 dark:text-gray-300">{arq.empresa.nome}</span></p>
                              {arq.dados.tipo_documento && <p>Tipo: <span className="font-medium">{TIPOS_DOC[arq.dados.tipo_documento] || arq.dados.tipo_documento}</span></p>}
                            </div>
                          )}
                          {arq.status === "sem_empresa" && arq.dados?.cnpj && (
                            <p className="text-xs text-yellow-600 mt-0.5">CNPJ {arq.dados.cnpj} não cadastrado no sistema.</p>
                          )}
                          {arq.status === "revisar" && (
                            <p className="text-xs text-orange-600 mt-0.5">CNPJ duvidoso: <strong>{arq.cnpjExtraido}</strong> — verifique manualmente.</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
                          <Icon className={`w-3.5 h-3.5 ${arq.status === "processando" ? "animate-spin" : ""}`} />
                          {cfg.label}
                        </span>
                        {arq.status !== "processando" && (
                          <button onClick={() => remover(i)} className="text-gray-300 hover:text-red-500 text-xs ml-1">✕</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            {sucessos > 0 ? "Fechar" : "Cancelar"}
          </button>
        </div>
      </div>
    </div>
  );
}