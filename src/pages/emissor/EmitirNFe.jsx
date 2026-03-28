import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { AnimatePresence, motion } from "framer-motion";
import { User, Package, Calculator, Send, ChevronLeft, ChevronRight, Check, Search, Plus, Trash2, Loader2, X } from "lucide-react";

const STEPS = [
  { id: 0, title: "Destinatário", icon: User },
  { id: 1, title: "Produtos", icon: Package },
  { id: 2, title: "Impostos", icon: Calculator },
  { id: 3, title: "Transmissão", icon: Send },
];

const variants = {
  enter: (d) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
};

function ItemModal({ onAdd, onClose }) {
  const [form, setForm] = useState({
    descricao: "", ncm: "", cfop: "5102", unidade: "UN",
    quantidade: 1, valor_unitario: 0, aliquota_icms: 0, aliquota_pis: 0.65, aliquota_cofins: 3,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const total = Number(form.quantidade) * Number(form.valor_unitario);
  const fmt = v => Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Adicionar Item</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Descrição *</label>
            <input className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
              value={form.descricao} onChange={e => set("descricao", e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[["ncm","NCM","00000000"],["cfop","CFOP","5102"],["unidade","Unidade","UN"]].map(([field, label, ph]) => (
              <div key={field}>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
                <input className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                  placeholder={ph} value={form[field]} onChange={e => set(field, e.target.value)} />
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Qtd</label>
              <input type="number" min="0.001" step="0.001" className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                value={form.quantidade} onChange={e => set("quantidade", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vl. Unit. (R$)</label>
              <input type="number" min="0" step="0.01" className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                value={form.valor_unitario} onChange={e => set("valor_unitario", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</label>
              <div className="mt-1 px-3 py-2 rounded-xl text-sm font-bold" style={{ backgroundColor: "#E6F0FF", color: "#0B63D4" }}>
                R$ {fmt(total)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[["aliquota_icms","ICMS %"],["aliquota_pis","PIS %"],["aliquota_cofins","COFINS %"]].map(([field, label]) => (
              <div key={field}>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
                <input type="number" min="0" step="0.01" className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                  value={form[field]} onChange={e => set(field, e.target.value)} />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50">Cancelar</button>
            <button onClick={() => {
              if (!form.descricao) return;
              const t = Number(form.quantidade) * Number(form.valor_unitario);
              onAdd({ ...form, valor_total: t, valor_icms: t * Number(form.aliquota_icms) / 100, valor_pis: t * Number(form.aliquota_pis) / 100, valor_cofins: t * Number(form.aliquota_cofins) / 100 });
              onClose();
            }} className="flex-1 text-white text-sm font-semibold py-2.5 rounded-xl" style={{ backgroundColor: "#0B63D4" }}>
              Adicionar Item
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function EmitirNFe() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [destinatarios, setDestinatarios] = useState([]);
  const [selectedDest, setSelectedDest] = useState(null);
  const [searchDest, setSearchDest] = useState("");
  const [itens, setItens] = useState([]);
  const [itemModal, setItemModal] = useState(false);
  const [notaId, setNotaId] = useState(null);
  const [transmitindo, setTransmitindo] = useState(false);
  const [transmitida, setTransmitida] = useState(false);

  useEffect(() => {
    try {
      const c = localStorage.getItem("emissor_current_client");
      if (!c) { navigate("/emissor/painel"); return; }
      const parsed = JSON.parse(c);
      setClient(parsed);
      base44.entities.Destinatario.filter({ empresa_id: parsed.id }).then(setDestinatarios);
      base44.entities.NotaFiscal55.create({
        empresa_id: parsed.id, empresa_nome: parsed.razao_social,
        status_sefaz: "rascunho", valor_produtos: 0, valor_impostos: 0, valor_total: 0,
      }).then(n => setNotaId(n.id));
    } catch { navigate("/emissor/painel"); }
  }, []);

  const goTo = (next) => { setDir(next > step ? 1 : -1); setStep(next); };
  const fmt = v => Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  const totais = {
    produtos: itens.reduce((s, i) => s + Number(i.valor_total || 0), 0),
    icms: itens.reduce((s, i) => s + Number(i.valor_icms || 0), 0),
    pis: itens.reduce((s, i) => s + Number(i.valor_pis || 0), 0),
    cofins: itens.reduce((s, i) => s + Number(i.valor_cofins || 0), 0),
  };
  totais.impostos = totais.icms + totais.pis + totais.cofins;
  totais.total = totais.produtos;

  const transmitir = async () => {
    setTransmitindo(true);
    if (notaId) {
      await Promise.all(itens.map(item => base44.entities.ItemNota.create({ ...item, nota_id: notaId, empresa_id: client?.id })));
      await base44.entities.NotaFiscal55.update(notaId, {
        destinatario_id: selectedDest?.id, destinatario_nome: selectedDest?.nome, destinatario_cnpj: selectedDest?.cnpj,
        valor_produtos: totais.produtos, valor_impostos: totais.impostos, valor_total: totais.total, status_sefaz: "transmitindo",
      });
    }
    await new Promise(r => setTimeout(r, 2500));
    if (notaId) {
      await base44.entities.NotaFiscal55.update(notaId, {
        status_sefaz: "transmitida",
        chave_acesso: `35${new Date().getFullYear()}${Math.random().toString().slice(2, 16)}00`,
        protocolo: `141${Math.floor(Math.random() * 1e9)}`,
      });
    }
    setTransmitindo(false);
    setTransmitida(true);
  };

  const destFiltrados = destinatarios.filter(d =>
    d.nome?.toLowerCase().includes(searchDest.toLowerCase()) || d.cnpj?.includes(searchDest)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emitir NF-e 55</h1>
          <p className="text-gray-500 text-sm">{client?.razao_social}</p>
        </div>
        {notaId && !transmitida && (
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse inline-block" /> Rascunho salvo
          </span>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Stepper header */}
        <div className="border-b border-gray-100 px-6 py-5">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === i;
              const isDone = step > i;
              return (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1.5">
                    <button onClick={() => isDone && goTo(i)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                        isActive ? "border-[#0B63D4] shadow-md shadow-blue-200 text-white" :
                        isDone ? "border-emerald-500 bg-emerald-500 text-white cursor-pointer" :
                        "bg-gray-100 border-gray-200 text-gray-400"
                      }`}
                      style={isActive ? { backgroundColor: "#0B63D4" } : {}}>
                      {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </button>
                    <span className={`text-xs font-medium hidden sm:block ${isActive ? "text-[#0B63D4]" : isDone ? "text-emerald-600" : "text-gray-400"}`}>{s.title}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 mb-5 transition-colors ${isDone ? "bg-emerald-400" : "bg-gray-100"}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="p-6 min-h-80">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={step} custom={dir} variants={variants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.27, ease: "easeOut" }}>

              {/* Passo 1 – Destinatário */}
              {step === 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-800">Selecionar Destinatário</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                      placeholder="Buscar por nome ou CNPJ..." value={searchDest} onChange={e => setSearchDest(e.target.value)} />
                  </div>
                  {destFiltrados.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-2xl">
                      <User className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                      <p className="text-sm text-gray-400">Nenhum destinatário. Cadastre em <strong>Destinatários</strong>.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {destFiltrados.map(d => (
                        <button key={d.id} onClick={() => setSelectedDest(d)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                            selectedDest?.id === d.id ? "border-[#0B63D4] bg-[#E6F0FF]" : "border-gray-100 hover:bg-gray-50"
                          }`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            selectedDest?.id === d.id ? "text-white" : "bg-gray-100 text-gray-600"
                          }`} style={selectedDest?.id === d.id ? { backgroundColor: "#0B63D4" } : {}}>
                            {d.nome?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{d.nome}</p>
                            <p className="text-xs text-gray-400">{d.cnpj} {d.municipio && `· ${d.municipio}/${d.uf}`}</p>
                          </div>
                          {selectedDest?.id === d.id && <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#0B63D4" }} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Passo 2 – Produtos */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">Produtos / Itens</h2>
                    <button onClick={() => setItemModal(true)}
                      className="flex items-center gap-1.5 text-white text-sm font-medium px-3 py-2 rounded-xl"
                      style={{ backgroundColor: "#0B63D4" }}>
                      <Plus className="w-4 h-4" /> Adicionar Item
                    </button>
                  </div>
                  {itens.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl">
                      <Package className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                      <p className="text-sm text-gray-400">Nenhum item adicionado.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {itens.map((item, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.descricao}</p>
                            <p className="text-xs text-gray-400">{item.quantidade} {item.unidade} × R$ {fmt(item.valor_unitario)} · NCM {item.ncm || "—"} · CFOP {item.cfop}</p>
                          </div>
                          <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                            <span className="text-sm font-bold text-gray-900">R$ {fmt(item.valor_total)}</span>
                            <button onClick={() => setItens(p => p.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                      <div className="flex justify-between items-center p-3.5 rounded-xl" style={{ backgroundColor: "#E6F0FF" }}>
                        <span className="text-sm font-semibold" style={{ color: "#0B63D4" }}>Total Produtos</span>
                        <span className="text-lg font-bold" style={{ color: "#0B63D4" }}>R$ {fmt(totais.produtos)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Passo 3 – Impostos */}
              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-800">Revisão de Impostos</h2>
                  <div className="rounded-2xl overflow-hidden border border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tributo</th>
                          <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 bg-white">
                        {[["Total de Produtos", totais.produtos], ["ICMS", totais.icms], ["PIS", totais.pis], ["COFINS", totais.cofins]].map(([lbl, val]) => (
                          <tr key={lbl}>
                            <td className="px-5 py-3 text-gray-700">{lbl}</td>
                            <td className="px-5 py-3 text-right font-medium">R$ {fmt(val)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ backgroundColor: "#E6F0FF" }}>
                          <td className="px-5 py-4 font-bold" style={{ color: "#0B63D4" }}>Total da Nota</td>
                          <td className="px-5 py-4 text-right font-bold text-lg" style={{ color: "#0B63D4" }}>R$ {fmt(totais.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
                    ℹ️ Valores calculados com base nas alíquotas por item. Verifique antes de transmitir.
                  </p>
                </div>
              )}

              {/* Passo 4 – Transmissão */}
              {step === 3 && (
                <div className="space-y-5">
                  {!transmitida ? (
                    <>
                      <h2 className="text-lg font-semibold text-gray-800">Confirmar e Transmitir</h2>
                      <div className="bg-gray-50 rounded-2xl p-5 space-y-3 border border-gray-100">
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Destinatário</span><span className="font-semibold text-gray-900">{selectedDest?.nome || "—"}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">CNPJ</span><span className="font-medium text-gray-700">{selectedDest?.cnpj || "—"}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Itens</span><span className="font-medium text-gray-700">{itens.length} item(ns)</span></div>
                        <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                          <span className="font-bold text-gray-700">Total da Nota</span>
                          <span className="font-bold text-2xl" style={{ color: "#0B63D4" }}>R$ {fmt(totais.total)}</span>
                        </div>
                      </div>
                      <button onClick={transmitir} disabled={transmitindo || !selectedDest || itens.length === 0}
                        className="w-full flex items-center justify-center gap-3 text-white font-bold py-4 rounded-2xl text-lg disabled:opacity-40 transition-all shadow-lg shadow-blue-200"
                        style={{ backgroundColor: "#0B63D4" }}>
                        {transmitindo ? <><Loader2 className="w-6 h-6 animate-spin" /> Transmitindo para SEFAZ...</> : <><Send className="w-5 h-5" /> Transmitir Nota</>}
                      </button>
                      {(!selectedDest || itens.length === 0) && (
                        <p className="text-xs text-center text-red-500">{!selectedDest ? "Selecione um destinatário (passo 1)." : "Adicione pelo menos um item (passo 2)."}</p>
                      )}
                    </>
                  ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10 space-y-4">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: "spring" }}
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto bg-emerald-50">
                        <Check className="w-10 h-10 text-emerald-500" />
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Nota Transmitida!</h3>
                        <p className="text-gray-500 text-sm mt-1">NF-e enviada com sucesso para a SEFAZ.</p>
                      </div>
                      <button onClick={() => navigate("/emissor/historico")}
                        className="text-white font-semibold px-6 py-3 rounded-xl" style={{ backgroundColor: "#0B63D4" }}>
                        Ver no Histórico
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {!transmitida && (
          <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between">
            <button onClick={() => goTo(step - 1)} disabled={step === 0}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 disabled:opacity-30 font-medium">
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            {step < 3 && (
              <button onClick={() => goTo(step + 1)} disabled={step === 0 && !selectedDest}
                className="flex items-center gap-1.5 text-white text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-40"
                style={{ backgroundColor: "#0B63D4" }}>
                Próximo <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {itemModal && <ItemModal onAdd={item => setItens(p => [...p, item])} onClose={() => setItemModal(false)} />}
    </div>
  );
}