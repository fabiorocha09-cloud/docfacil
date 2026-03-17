import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, FileText, Trash2, Loader2, ChevronDown, ChevronUp, FolderOpen } from "lucide-react";

const tipoConfig = {
  cartao_cnpj:      { label: "Cartão CNPJ" },
  procuracao_tj:    { label: "Procuração TJ" },
  crc_contador:     { label: "CRC Contador" },
  alvara_municipal: { label: "Alvará Municipal" },
  alvara_visa:      { label: "Alvará VISA" },
  avcb_bombeiros:   { label: "AVCB Bombeiros" },
};

export default function DocumentosEmpresa({ empresa, isAdmin }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(null);

  useEffect(() => {
    if (expanded) carregar();
  }, [expanded]);

  const carregar = () => {
    setLoading(true);
    base44.entities.DocumentoEmpresa.filter({ empresa_id: empresa.id }).then(data => {
      setDocs(data);
      setLoading(false);
    });
  };

  const handleUpload = async (tipo, file) => {
    setUploading(tipo);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const existente = docs.find(d => d.tipo === tipo);
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
    setUploading(null);
    carregar();
  };

  const deletar = async (id) => {
    if (!confirm("Remover este documento?")) return;
    await base44.entities.DocumentoEmpresa.delete(id);
    carregar();
  };

  return (
    <div className="border-t border-gray-100 dark:border-gray-700">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-blue-500" />
          Documentos da empresa
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading ? (
            <div className="col-span-full flex items-center gap-2 text-sm text-gray-400 py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
            </div>
          ) : (
            Object.entries(tipoConfig).map(([tipo, { label }]) => {
              const doc = docs.find(d => d.tipo === tipo);
              const isUp = uploading === tipo;
              return (
                <div key={tipo} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className={`w-4 h-4 flex-shrink-0 ${doc ? "text-blue-600" : "text-gray-300"}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{label}</p>
                      {doc ? (
                        <a href={doc.arquivo_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Ver arquivo</a>
                      ) : (
                        <p className="text-xs text-gray-400">Não enviado</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isAdmin && (
                      <>
                        <label className="cursor-pointer p-1.5 text-gray-400 hover:text-blue-600 rounded" title={doc ? "Substituir" : "Enviar"}>
                          {isUp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={e => e.target.files[0] && handleUpload(tipo, e.target.files[0])} disabled={!!uploading} />
                        </label>
                        {doc && (
                          <button onClick={() => deletar(doc.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}