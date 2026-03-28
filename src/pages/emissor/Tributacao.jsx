import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, BookOpen, Globe, MapPin, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TributacaoModal from "@/components/emissor/TributacaoModal";

const CSOSN_SHORT = {
  "101":"Tributada c/ crédito","102":"Tributada s/ crédito","103":"Isenta (faixa receita)",
  "201":"Trib. c/ crédito + ST","202":"Trib. s/ crédito + ST","203":"Isento/Imune + ST",
  "300":"Imune","400":"Não tributada","500":"ICMS por ST (Revenda)","900":"Outros",
};

export default function Tributacao() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    try {
      const c = localStorage.getItem("emissor_current_client");
      if (!c) { navigate("/emissor/painel"); return; }
      const parsed = JSON.parse(c);
      setClient(parsed);
      carregar(parsed.id);
    } catch { navigate("/emissor/painel"); }
  }, []);

  const carregar = async (id) => {
    setLoading(true);
    const data = await base44.entities.RegraTributacao.filter({ empresa_id: id || client?.id });
    setItens(data);
    setLoading(false);
  };

  const deletar = async (id) => {
    if (!confirm("Excluir esta regra de tributação?")) return;
    await base44.entities.RegraTributacao.delete(id);
    carregar(client?.id);
  };

  const regimeTributario = client?.regime || "simples_nacional";
  const isSimples = regimeTributario === "simples_nacional";

  const getResumoICMS = (item) => {
    const csosn = item?.revenda?.icms_csosn || item?.revenda?.icms_cst;
    if (!csosn) return "—";
    return isSimples ? `CSOSN ${csosn}: ${CSOSN_SHORT[csosn] || ""}` : `CST ${csosn}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tributação</h1>
          <p className="text-gray-500 text-sm">
            {client?.razao_social} · {itens.length} regra(s) cadastrada(s)
            {isSimples && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Simples Nacional</span>}
          </p>
        </div>
        <button onClick={() => { setEditando(null); setModalOpen(true); }}
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm"
          style={{ backgroundColor: "#0B63D4" }}>
          <Plus className="w-4 h-4" /> Nova Regra
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}</div>
      ) : itens.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">Nenhuma regra de tributação cadastrada.</p>
          <p className="text-gray-400 text-xs mt-1">Crie regras para aplicar automaticamente nos produtos da NF-e.</p>
          <button onClick={() => { setEditando(null); setModalOpen(true); }}
            className="mt-4 text-sm font-semibold hover:underline" style={{ color: "#0B63D4" }}>
            + Criar primeira regra
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {itens.map(item => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between p-5">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#E6F0FF" }}>
                      <BookOpen className="w-5 h-5" style={{ color: "#0B63D4" }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900">{item.nome}</p>
                        {item.ativo
                          ? <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Ativo</span>
                          : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Inativo</span>}
                      </div>

                      <div className="flex items-center gap-1.5 mt-1">
                        {item.todos_estados
                          ? <><Globe className="w-3.5 h-3.5 text-gray-400" /><span className="text-xs text-gray-500">Todos os estados</span></>
                          : <><MapPin className="w-3.5 h-3.5 text-gray-400" /><span className="text-xs text-gray-500">{(Array.isArray(item.estados) ? item.estados : []).join(", ")}</span></>
                        }
                      </div>

                      {/* Resumo por tipo de cliente */}
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {["revenda", "consumidor_final"].map(tipo => {
                          const conf = item[tipo] || {};
                          const csosn = conf.icms_csosn || conf.icms_cst;
                          const pisCst = conf.pis_cst;
                          const cofinsCst = conf.cofins_cst;
                          return (
                            <div key={tipo} className="bg-gray-50 rounded-xl px-3 py-2">
                              <p className="text-xs font-semibold text-gray-500 mb-1">
                                {tipo === "revenda" ? "🏢 Cliente Revenda" : "👤 Consumidor Final"}
                              </p>
                              <div className="space-y-0.5">
                                {csosn && <p className="text-xs text-gray-700">ICMS: <span className="font-medium">{isSimples ? "CSOSN" : "CST"} {csosn}</span></p>}
                                {pisCst && <p className="text-xs text-gray-700">PIS: <span className="font-medium">CST {pisCst}</span> {conf.pis_aliquota > 0 && `· ${conf.pis_aliquota}%`}</p>}
                                {cofinsCst && <p className="text-xs text-gray-700">COFINS: <span className="font-medium">CST {cofinsCst}</span> {conf.cofins_aliquota > 0 && `· ${conf.cofins_aliquota}%`}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 ml-4 flex-shrink-0">
                    <button onClick={() => { setEditando(item); setModalOpen(true); }}
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#0B63D4] px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button onClick={() => deletar(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {modalOpen && (
        <TributacaoModal
          item={editando}
          empresaId={client?.id}
          regimeTributario={regimeTributario}
          onClose={() => setModalOpen(false)}
          onSave={() => { setModalOpen(false); carregar(client?.id); }}
        />
      )}
    </div>
  );
}