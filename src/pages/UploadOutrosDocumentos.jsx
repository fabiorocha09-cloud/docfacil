import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, FileText, Trash2, Loader2, CheckCircle2, Building2, Users, Layers } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ImportarDocsLoteModal from "@/components/ImportarDocsLoteModal";

const TIPOS_POR_EMPRESA = [
  { tipo: "cartao_cnpj", label: "Cartão CNPJ" },
  { tipo: "procuracao_tj", label: "Procuração TJ" },
];

export default function UploadOutrosDocumentos() {
  const [empresas, setEmpresas] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState("");
  const [uploading, setUploading] = useState(null);
  const [uploadingCrc, setUploadingCrc] = useState(false);
  const [crcAtual, setCrcAtual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loteOpen, setLoteOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    carregar();
  }, []);

  const carregar = async () => {
    setLoading(true);
    const [emps, docs] = await Promise.all([
      base44.entities.Empresa.list(),
      base44.entities.DocumentoEmpresa.list(),
    ]);
    const ativas = emps.filter(e => !e.excluida);
    setEmpresas(ativas);
    setDocumentos(docs);

    // Pega CRC mais recente (qualquer empresa)
    const crcs = docs.filter(d => d.tipo === "crc_contador");
    if (crcs.length > 0) {
      setCrcAtual(crcs[crcs.length - 1]);
    } else {
      setCrcAtual(null);
    }
    setLoading(false);
  };

  const getDoc = (tipo, empresaId) =>
    documentos.find(d => d.tipo === tipo && d.empresa_id === empresaId);

  const handleUpload = async (tipo, file) => {
    if (!empresaSelecionada) return;
    setUploading(tipo);
    const empresa = empresas.find(e => e.id === empresaSelecionada);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    const existente = getDoc(tipo, empresaSelecionada);
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
    toast({ title: "✅ Documento enviado com sucesso!" });
    setUploading(null);
    carregar();
  };

  const handleUploadCrc = async (file) => {
    setUploadingCrc(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    // Atualizar ou criar para TODAS as empresas
    const todasEmpresas = empresas;
    const crcsExistentes = documentos.filter(d => d.tipo === "crc_contador");
    const empresasComCrc = new Set(crcsExistentes.map(d => d.empresa_id));

    const promises = [];

    // Atualizar existentes
    crcsExistentes.forEach(doc => {
      promises.push(base44.entities.DocumentoEmpresa.update(doc.id, { arquivo_url: file_url }));
    });

    // Criar para empresas sem CRC
    todasEmpresas.forEach(empresa => {
      if (!empresasComCrc.has(empresa.id)) {
        promises.push(base44.entities.DocumentoEmpresa.create({
          empresa_id: empresa.id,
          empresa_nome: empresa.nome,
          empresa_cnpj: empresa.cnpj,
          tipo: "crc_contador",
          arquivo_url: file_url,
        }));
      }
    });

    await Promise.all(promises);
    toast({ title: "✅ CRC do Contador atualizado!", description: `Replicado para ${todasEmpresas.length} empresa(s).` });
    setUploadingCrc(false);
    carregar();
  };

  const deletar = async (doc) => {
    if (!confirm("Remover este documento?")) return;
    await base44.entities.DocumentoEmpresa.delete(doc.id);
    toast({ title: "🗑️ Documento removido." });
    carregar();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload de Outros Documentos</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Gerencie Cartão CNPJ, Procuração TJ e CRC do Contador
          </p>
        </div>
        <button
          onClick={() => setLoteOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Layers className="w-4 h-4" /> Importar em Lote (IA)
        </button>
      </div>

      {/* CRC do Contador — Global */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-indigo-200 dark:border-indigo-800 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 bg-indigo-50 dark:bg-indigo-900/30 border-b border-indigo-200 dark:border-indigo-800">
          <Users className="w-5 h-5 text-indigo-600" />
          <div>
            <h2 className="font-semibold text-indigo-900 dark:text-indigo-200">CRC do Contador</h2>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
              Documento global — será replicado para todas as empresas automaticamente
            </p>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileText className={`w-8 h-8 ${crcAtual ? "text-indigo-600" : "text-gray-300"}`} />
                <div>
                  {crcAtual ? (
                    <>
                      <a href={crcAtual.arquivo_url} target="_blank" rel="noreferrer"
                        className="text-sm font-medium text-indigo-600 hover:underline">
                        Ver CRC do Contador atual
                      </a>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Vinculado a {documentos.filter(d => d.tipo === "crc_contador").length} empresa(s)
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Nenhum CRC enviado ainda</p>
                  )}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                {uploadingCrc ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                ) : (
                  <><Upload className="w-4 h-4" /> {crcAtual ? "Atualizar CRC" : "Enviar CRC"}</>
                )}
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={e => e.target.files[0] && handleUploadCrc(e.target.files[0])}
                  disabled={uploadingCrc}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Cartão CNPJ e Procuração TJ — Por Empresa */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <Building2 className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Documentos por Empresa</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Cartão CNPJ e Procuração TJ são vinculados individualmente a cada empresa
            </p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Seletor de empresa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Selecionar empresa
            </label>
            <select
              className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              value={empresaSelecionada}
              onChange={e => setEmpresaSelecionada(e.target.value)}
            >
              <option value="">— Selecione uma empresa —</option>
              {empresas.map(e => (
                <option key={e.id} value={e.id}>{e.nome} ({e.cnpj})</option>
              ))}
            </select>
          </div>

          {empresaSelecionada && (
            <div className="space-y-3">
              {TIPOS_POR_EMPRESA.map(({ tipo, label }) => {
                const doc = getDoc(tipo, empresaSelecionada);
                const isUp = uploading === tipo;
                return (
                  <div key={tipo} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileText className={`w-5 h-5 ${doc ? "text-blue-600" : "text-gray-300"}`} />
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
                        {doc ? (
                          <a href={doc.arquivo_url} target="_blank" rel="noreferrer"
                            className="text-xs text-blue-600 hover:underline">
                            Ver arquivo enviado
                          </a>
                        ) : (
                          <p className="text-xs text-gray-400">Não enviado</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {doc && (
                        <button onClick={() => deletar(doc)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <label className="flex items-center gap-1.5 cursor-pointer border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
                        {isUp ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando...</>
                        ) : (
                          <><Upload className="w-3.5 h-3.5" /> {doc ? "Substituir" : "Enviar"}</>
                        )}
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={e => e.target.files[0] && handleUpload(tipo, e.target.files[0])}
                          disabled={!!uploading}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!empresaSelecionada && (
            <div className="text-center py-8 text-gray-400 text-sm">
              <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
              Selecione uma empresa para gerenciar seus documentos
            </div>
          )}
        </div>
      </div>

      {/* Visão geral */}
      {!loading && empresas.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Visão Geral por Empresa</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {empresas.map(emp => {
              const cartao = documentos.find(d => d.empresa_id === emp.id && d.tipo === "cartao_cnpj");
              const procuracao = documentos.find(d => d.empresa_id === emp.id && d.tipo === "procuracao_tj");
              const crc = documentos.find(d => d.empresa_id === emp.id && d.tipo === "crc_contador");
              return (
                <div key={emp.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{emp.nome}</p>
                    <p className="text-xs text-gray-400">{emp.cnpj}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <DocStatus label="CNPJ" ok={!!cartao} />
                    <DocStatus label="Proc. TJ" ok={!!procuracao} />
                    <DocStatus label="CRC" ok={!!crc} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DocStatus({ label, ok }) {
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${ok ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-400"}`}>
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3 h-3 inline-block" />}
      {label}
    </span>
  );
}