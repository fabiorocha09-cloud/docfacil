import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Pencil, Trash2, X, Loader2, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const UNIDADES = ["UN","KG","CX","PC","LT","MT","M2","M3","TON","PAR","DZ","FD","VD","AMP","SC","BD","RL","GR","MG","MIL"];

const ORIGENS = [
  "0 - Nacional, exceto as indicadas nos códigos 3, 4, 5 e 8",
  "1 - Estrangeira - Importação direta",
  "2 - Estrangeira - Adquirida no mercado interno",
  "3 - Nacional, mercadoria ou bem com conteúdo de importação > 40% e <= 70%",
  "4 - Nacional, cuja produção tenha sido feita em conformidade com os processos produtivos básicos",
  "5 - Nacional, mercadoria ou bem com conteúdo de importação > 70%",
  "6 - Estrangeira - Importação direta, sem similar nacional",
  "7 - Estrangeira - Adquirida no mercado interno, sem similar nacional",
  "8 - Nacional, mercadoria ou bem com conteúdo de importação >= 40%",
];

const CFOP_OPTIONS = [
  "5101","5102","5103","5104","5105","5106","5109","5110","5111","5112","5113","5114","5115",
  "5116","5117","5118","5119","5120","5201","5202","5208","5209","5210","5251","5252","5253",
  "5254","5255","5256","5257","5258","5301","5302","5303","5304","5305","5306","5307","5401",
  "5402","5403","5405","5501","5502","5503","5504","5505","5651","5652","5653","5654","5655",
  "5656","5657","5658","5659","5660","5661","5662","5663","5664","5665","5666","5667","5668",
  "6101","6102","6103","6104","6105","6106","6107","6108","6109","6110","6111","6112","6113",
  "6114","6115","6116","6117","6118","6119","6120","6201","6202","6208","6209","6210","6251",
  "6252","6253","6254","6255","6256","6257","6258","6301","6302","6303","6304","6305","6306",
  "6307","6401","6402","6403","6404","6405","6408","6501","6502","6503","6504","6505",
];

const defaultForm = {
  codigo_barras: "", codigo_produto_nota: "", descricao: "", unidade: "UN",
  valor_unitario: 0, origem: "0", ncm: "", peso_unitario: 0,
  cfop: "5102", cfop_externo: "6102",
  cod_beneficio_fiscal: "", observacoes: "", ativo: true,
};

function ProdutoModal({ item, empresaId, onClose, onSave }) {
  const [form, setForm] = useState(item ? { ...defaultForm, ...item } : { ...defaultForm });
  const [aba, setAba] = useState("geral");
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = { ...form, empresa_id: empresaId };
    if (item?.id) await base44.entities.Produto.update(item.id, data);
    else await base44.entities.Produto.create(data);
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{item ? "Editar Produto" : "Cadastrar Produto"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {["geral", "tributaria"].map(t => (
            <button key={t} onClick={() => setAba(t)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
                aba === t ? "border-[#0B63D4] text-[#0B63D4]" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}>
              {t === "geral" ? "Geral" : "Reforma Tributária"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5">
          {aba === "geral" && (
            <div className="space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Código de barras</label>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4] uppercase"
                    placeholder="CÓDIGO DE BARRAS" value={form.codigo_barras}
                    onChange={e => set("codigo_barras", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Código Produto na Nota</label>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4] uppercase"
                    placeholder="CÓDIGO PRODUTO NA NOTA" value={form.codigo_produto_nota}
                    onChange={e => set("codigo_produto_nota", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Nome do produto *</label>
                  <input required className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                    placeholder="Nome do produto" value={form.descricao}
                    onChange={e => set("descricao", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Unidade *</label>
                  <select required className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4] bg-white"
                    value={form.unidade} onChange={e => set("unidade", e.target.value)}>
                    {UNIDADES.map(u => <option key={u} value={u}>{u} - {u === "UN" ? "UNIDADE" : u}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Preço</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm text-gray-400">R$</span>
                    <input type="number" min="0" step="0.01"
                      className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                      value={form.valor_unitario} onChange={e => set("valor_unitario", parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Origem *</label>
                  <select required className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4] bg-white"
                    value={form.origem} onChange={e => set("origem", e.target.value)}>
                    {ORIGENS.map((o, i) => <option key={i} value={String(i)}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">NCM *</label>
                  <input required maxLength={8}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                    placeholder="00000000" value={form.ncm}
                    onChange={e => set("ncm", e.target.value.replace(/\D/g, ""))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Peso unitário (KG)</label>
                  <input type="number" min="0" step="0.001"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                    value={form.peso_unitario} onChange={e => set("peso_unitario", parseFloat(e.target.value) || 0)} />
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">CFOP Interno *</label>
                  <select required className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4] bg-white"
                    value={form.cfop} onChange={e => set("cfop", e.target.value)}>
                    {CFOP_OPTIONS.filter(c => c.startsWith("5")).map(c => (
                      <option key={c} value={c}>{c}: VENDA DE MERCADORIA</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">CFOP Externo *</label>
                  <select required className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4] bg-white"
                    value={form.cfop_externo} onChange={e => set("cfop_externo", e.target.value)}>
                    {CFOP_OPTIONS.filter(c => c.startsWith("6")).map(c => (
                      <option key={c} value={c}>{c}: VENDA DE MERCADORIA</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Cód. Benefício Fiscal</label>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4] uppercase"
                    placeholder="CÓD. BENEFÍCIO FISCAL" value={form.cod_beneficio_fiscal}
                    onChange={e => set("cod_beneficio_fiscal", e.target.value)} />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Observações do produto</label>
                <textarea rows={3} value={form.observacoes} onChange={e => set("observacoes", e.target.value)}
                  placeholder="Observações do produto"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4] resize-none" />
              </div>
            </div>
          )}

          {aba === "tributaria" && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                As configurações da Reforma Tributária (CBS, IBS, IS) estarão disponíveis conforme a implementação progressiva da reforma.
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Alíquota ICMS %</label>
                  <input type="number" min="0" step="0.01"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                    value={form.aliquota_icms || 0} onChange={e => set("aliquota_icms", parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Alíquota PIS %</label>
                  <input type="number" min="0" step="0.01"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                    value={form.aliquota_pis || 0} onChange={e => set("aliquota_pis", parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Alíquota COFINS %</label>
                  <input type="number" min="0" step="0.01"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                    value={form.aliquota_cofins || 0} onChange={e => set("aliquota_cofins", parseFloat(e.target.value) || 0)} />
                </div>
              </div>
            </div>
          )}
        </form>

        <div className="flex gap-3 px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: "#0B63D4" }}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : "Salvar"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Produtos() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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
    const data = await base44.entities.Produto.filter({ empresa_id: id || client?.id });
    setProdutos(data.sort((a, b) => a.descricao?.localeCompare(b.descricao)));
    setLoading(false);
  };

  const deletar = async (id) => {
    if (!confirm("Excluir este produto?")) return;
    await base44.entities.Produto.delete(id);
    carregar(client?.id);
  };

  const filtrados = produtos.filter(p =>
    p.descricao?.toLowerCase().includes(search.toLowerCase()) ||
    p.codigo_barras?.includes(search) ||
    p.ncm?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Produtos</h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{client?.razao_social} · {produtos.length} produto(s)</p>
        </div>
        <button onClick={() => { setEditando(null); setModalOpen(true); }}
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm"
          style={{ backgroundColor: "#0B63D4" }}>
          <Plus className="w-4 h-4" /> Novo Produto
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4] shadow-sm ${theme === 'dark' ? 'bg-white/10 border border-white/20 text-white' : 'bg-white border border-gray-200'}`}
          placeholder="Buscar por nome, código de barras ou NCM..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className={`rounded-2xl shadow-sm overflow-hidden ${theme === 'dark' ? 'bg-white/5 border border-white/10 backdrop-blur-md' : 'bg-white border border-gray-100'}`}>
        {loading ? (
          <div className={`p-8 text-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">{produtos.length === 0 ? "Nenhum produto cadastrado." : "Nenhum resultado."}</p>
            <button onClick={() => { setEditando(null); setModalOpen(true); }} className="mt-3 text-sm font-medium hover:underline" style={{ color: "#0B63D4" }}>
              + Cadastrar produto
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className={`border-b ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                  <th className={`text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Produto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">NCM</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unid.</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Preço</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">CFOP</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/10' : 'divide-gray-50'}`}>
                <AnimatePresence>
                  {filtrados.map(p => (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                      <td className="px-5 py-4">
                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{p.descricao}</p>
                        {p.codigo_barras && <p className="text-xs text-gray-400">{p.codigo_barras}</p>}
                      </td>
                      <td className="px-4 py-4 text-gray-600 font-mono text-xs">{p.ncm || "—"}</td>
                      <td className="px-4 py-4 text-gray-600">{p.unidade}</td>
                      <td className="px-4 py-4 text-right font-semibold text-gray-900">
                        R$ {(p.valor_unitario || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-gray-500 text-xs font-mono">{p.cfop}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => { setEditando(p); setModalOpen(true); }}
                            className="p-2 text-gray-400 hover:text-[#0B63D4] rounded-lg hover:bg-blue-50">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => deletar(p.id)}
                            className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <ProdutoModal item={editando} empresaId={client?.id}
          onClose={() => setModalOpen(false)}
          onSave={() => { setModalOpen(false); carregar(client?.id); }} />
      )}
    </div>
  );
}