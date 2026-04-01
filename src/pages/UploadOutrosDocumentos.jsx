import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, FileText, Trash2, Loader2, CheckCircle2, Building2, Users, Layers } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ImportarDocsLoteModal from "@/components/ImportarDocsLoteModal";

const TIPOS_POR_EMPRESA = [
  { tipo: "cartao_cnpj", label: "Cartão CNPJ" },
  { tipo: "procuracao_tj", label: "Procuração TJ" },
];

const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };

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

  useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    setLoading(true);
    const [emps, docs] = await Promise.all([
      base44.entities.Empresa.list(),
      base44.entities.DocumentoEmpresa.list(),
    ]);
    const ativas = emps.filter(e => !e.excluida);
    setEmpresas(ativas);
    setDocumentos(docs);
    const crcs = docs.filter(d => d.tipo === "crc_contador");
    setCrcAtual(crcs.length > 0 ? crcs[crcs.length - 1] : null);
    setLoading(false);
  };

  const getDoc = (tipo, empresaId) => documentos.find(d => d.tipo === tipo && d.empresa_id === empresaId);

  const handleUpload = async (tipo, file) => {
    if (!empresaSelecionada) return;
    setUploading(tipo);
    const empresa = empresas.find(e => e.id === empresaSelecionada);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const existente = getDoc(tipo, empresaSelecionada);
    if (existente) {
      await base44.entities.DocumentoEmpresa.update(existente.id, { arquivo_url: file_url });
    } else {
      await base44.entities.DocumentoEmpresa.create({ empresa_id: empresa.id, empresa_nome: empresa.nome, empresa_cnpj: empresa.cnpj, tipo, arquivo_url: file_url });
    }
    toast({ title: "✅ Documento enviado com sucesso!" });
    setUploading(null);
    carregar();
  };

  const handleUploadCrc = async (file) => {
    setUploadingCrc(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const crcsExistentes = documentos.filter(d => d.tipo === "crc_contador");
    const empresasComCrc = new Set(crcsExistentes.map(d => d.empresa_id));
    const promises = [];
    crcsExistentes.forEach(doc => promises.push(base44.entities.DocumentoEmpresa.update(doc.id, { arquivo_url: file_url })));
    empresas.forEach(empresa => {
      if (!empresasComCrc.has(empresa.id)) {
        promises.push(base44.entities.DocumentoEmpresa.create({ empresa_id: empresa.id, empresa_nome: empresa.nome, empresa_cnpj: empresa.cnpj, tipo: "crc_contador", arquivo_url: file_url }));
      }
    });
    await Promise.all(promises);
    toast({ title: "✅ CRC do Contador atualizado!", description: `Replicado para ${empresas.length} empresa(s).` });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Exo 2', sans-serif", letterSpacing: "-0.02em" }}>Upload de Outros Documentos</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>Gerencie Cartão CNPJ, Procuração TJ e CRC do Contador</p>
        </div>
        <button onClick={() => setLoteOpen(true)}
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl"
          style={{ background: "linear-gradient(135deg,#3A8DFF,#1A58CC)" }}>
          <Layers className="w-4 h-4" /> Importar em Lote (IA)
        </button>
      </div>

      {/* CRC Global */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(99,102,241,0.15)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.2)" }}>
            <Users className="w-4 h-4" style={{ color: "#818cf8" }} />
          </div>
          <div>
            <h2 className="font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>CRC do Contador</h2>
            <p className="text-xs mt-0.5" style={{ color: "#818cf8", fontFamily: "'Rethink Sans', sans-serif" }}>Documento global — replicado para todas as empresas automaticamente</p>
          </div>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: "#6B7FA3" }}>
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8" style={{ color: crcAtual ? "#818cf8" : "#6B7FA3" }} />
                <div>
                  {crcAtual ? (
                    <>
                      <a href={crcAtual.arquivo_url} target="_blank" rel="noreferrer"
                        className="text-sm font-medium" style={{ color: "#818cf8", fontFamily: "'Manrope', sans-serif" }}>
                        Ver CRC do Contador atual
                      </a>
                      <p className="text-xs mt-0.5" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>
                        Vinculado a {documentos.filter(d => d.tipo === "crc_contador").length} empresa(s)
                      </p>
                    </>
                  ) : (
                    <p className="text-sm" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>Nenhum CRC enviado ainda</p>
                  )}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-white text-sm font-semibold px-4 py-2 rounded-xl"
                style={{ background: "rgba(99,102,241,0.25)", border: "1px solid rgba(99,102,241,0.4)" }}>
                {uploadingCrc ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <><Upload className="w-4 h-4" /> {crcAtual ? "Atualizar CRC" : "Enviar CRC"}</>}
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden"
                  onChange={e => e.target.files[0] && handleUploadCrc(e.target.files[0])} disabled={uploadingCrc} />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Documentos por empresa */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(58,141,255,0.1)" }}>
            <Building2 className="w-4 h-4" style={{ color: "#5E9BFF" }} />
          </div>
          <div>
            <h2 className="font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>Documentos por Empresa</h2>
            <p className="text-xs mt-0.5" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>Cartão CNPJ e Procuração TJ são vinculados individualmente</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#A0B1D4", fontFamily: "'Rethink Sans', sans-serif" }}>Selecionar empresa</label>
            <select className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
              value={empresaSelecionada} onChange={e => setEmpresaSelecionada(e.target.value)}>
              <option value="" style={{ background: "#0A0D14" }}>— Selecione uma empresa —</option>
              {empresas.map(e => <option key={e.id} value={e.id} style={{ background: "#0A0D14" }}>{e.nome} ({e.cnpj})</option>)}
            </select>
          </div>

          {empresaSelecionada && (
            <div className="space-y-3">
              {TIPOS_POR_EMPRESA.map(({ tipo, label }) => {
                const doc = getDoc(tipo, empresaSelecionada);
                const isUp = uploading === tipo;
                return (
                  <div key={tipo} className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5" style={{ color: doc ? "#5E9BFF" : "#6B7FA3" }} />
                      <div>
                        <p className="text-sm font-medium text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>{label}</p>
                        {doc ? (
                          <a href={doc.arquivo_url} target="_blank" rel="noreferrer"
                            className="text-xs" style={{ color: "#5E9BFF", fontFamily: "'Rethink Sans', sans-serif" }}>
                            Ver arquivo enviado
                          </a>
                        ) : (
                          <p className="text-xs" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>Não enviado</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc && (
                        <button onClick={() => deletar(doc)} className="p-1.5 rounded-lg transition-colors" style={{ color: "#6B7FA3" }}
                          onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                          onMouseLeave={e => e.currentTarget.style.color = "#6B7FA3"}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <label className="flex items-center gap-1.5 cursor-pointer text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                        style={{ border: "1px solid rgba(58,141,255,0.3)", color: "#5E9BFF", background: "rgba(58,141,255,0.08)" }}>
                        {isUp ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando...</> : <><Upload className="w-3.5 h-3.5" /> {doc ? "Substituir" : "Enviar"}</>}
                        <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden"
                          onChange={e => e.target.files[0] && handleUpload(tipo, e.target.files[0])} disabled={!!uploading} />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!empresaSelecionada && (
            <div className="text-center py-8" style={{ color: "#6B7FA3" }}>
              <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm" style={{ fontFamily: "'Rethink Sans', sans-serif" }}>Selecione uma empresa para gerenciar seus documentos</p>
            </div>
          )}
        </div>
      </div>

      {/* Visão geral */}
      {!loading && empresas.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>Visão Geral por Empresa</h3>
          </div>
          <div>
            {empresas.map(emp => {
              const cartao = documentos.find(d => d.empresa_id === emp.id && d.tipo === "cartao_cnpj");
              const procuracao = documentos.find(d => d.empresa_id === emp.id && d.tipo === "procuracao_tj");
              const crc = documentos.find(d => d.empresa_id === emp.id && d.tipo === "crc_contador");
              return (
                <div key={emp.id} className="flex items-center justify-between px-5 py-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div>
                    <p className="text-sm font-medium text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>{emp.nome}</p>
                    <p className="text-xs" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>{emp.cnpj}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
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

      {loteOpen && (
        <ImportarDocsLoteModal onClose={() => setLoteOpen(false)} onImportado={() => { setLoteOpen(false); carregar(); }} />
      )}
    </div>
  );
}

function DocStatus({ label, ok }) {
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        background: ok ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.04)",
        border: ok ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.08)",
        color: ok ? "#4ade80" : "#6B7FA3",
        fontFamily: "'Outfit', sans-serif",
      }}>
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3 h-3 inline-block" />}
      {label}
    </span>
  );
}