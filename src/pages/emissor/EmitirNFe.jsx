import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { AnimatePresence, motion } from "framer-motion";
import {
  User, Package, Calculator, Send, ChevronLeft, ChevronRight,
  Check, Search, Plus, Trash2, Loader2, X, Settings2, Layers
} from "lucide-react";

const STEPS = [
  { id: 0, title: "Destinatário", icon: User },
  { id: 1, title: "Produtos", icon: Package },
  { id: 2, title: "Impostos", icon: Calculator },
  { id: 3, title: "Avançado", icon: Settings2 },
  { id: 4, title: "Transmissão", icon: Send },
];

const FORMAS_PAGAMENTO = [
  "Dinheiro","Cheque","Cartão de Crédito","Cartão de Débito","Crédito Loja",
  "Vale Alimentação","Vale Refeição","Vale Presente","Vale Combustível",
  "Duplicata Mercantil","Boleto Bancário","Depósito Bancário",
  "Pagamento Instantâneo (PIX)","Transferência Bancária","Sem Pagamento","Outros",
];

const INDICADORES_INTERMEDIADOR = [
  "Operação sem intermediador (em site ou plataforma própria)",
  "Operação em site ou plataforma de terceiros",
];

const TIPOS_ATENDIMENTO = [
  "Não se aplica","Operação presencial","Operação não presencial - Internet",
  "Operação não presencial - Teleatendimento","NFC-e em operação com entrega a domicílio",
  "Operação não presencial - Outros",
];

const INDICADORES_OPERACAO = [
  "Operação interna","Operação interestadual","Operação com exterior",
];

const variants = {
  enter: (d) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
};

const fmt = v => Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

// Modal de item com busca de produtos cadastrados
function ItemModal({ empresaId, onAdd, onClose }) {
  const [produtos, setProdutos] = useState([]);
  const [searchProd, setSearchProd] = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    descricao: "", ncm: "", cfop: "5102", unidade: "UN",
    quantidade: 1, valor_unitario: 0,
    aliquota_icms: 0, aliquota_pis: 0.65, aliquota_cofins: 3,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (empresaId) {
      base44.entities.Produto.filter({ empresa_id: empresaId }).then(setProdutos);
    }
  }, [empresaId]);

  const handleSelectProduto = (p) => {
    setSelected(p);
    setForm(f => ({
      ...f,
      descricao: p.descricao || "",
      ncm: p.ncm || "",
      cfop: p.cfop || "5102",
      unidade: p.unidade || "UN",
      valor_unitario: p.valor_unitario || 0,
      aliquota_icms: p.aliquota_icms || 0,
      aliquota_pis: p.aliquota_pis || 0.65,
      aliquota_cofins: p.aliquota_cofins || 3,
    }));
    setSearchProd("");
  };

  const produtosFiltrados = produtos.filter(p =>
    p.descricao?.toLowerCase().includes(searchProd.toLowerCase()) ||
    p.ncm?.includes(searchProd) || p.codigo_barras?.includes(searchProd)
  );

  const total = Number(form.quantidade) * Number(form.valor_unitario);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-semibold text-gray-900">Adicionar Item</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Busca de produto cadastrado */}
          {produtos.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                Buscar produto cadastrado
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                  placeholder="Digite o nome, NCM ou código..."
                  value={searchProd} onChange={e => setSearchProd(e.target.value)} />
              </div>
              {searchProd && produtosFiltrados.length > 0 && (
                <div className="mt-1 border border-gray-200 rounded-xl overflow-hidden shadow-lg max-h-48 overflow-y-auto">
                  {produtosFiltrados.map(p => (
                    <button key={p.id} onClick={() => handleSelectProduto(p)}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm border-b border-gray-50 last:border-0">
                      <p className="font-medium text-gray-900">{p.descricao}</p>
                      <p className="text-xs text-gray-400">NCM: {p.ncm || "—"} · {p.unidade} · R$ {fmt(p.valor_unitario)}</p>
                    </button>
                  ))}
                </div>
              )}
              {selected && (
                <div className="mt-1 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                  <Check className="w-3.5 h-3.5" /> Produto selecionado: <strong>{selected.descricao}</strong>
                  <button onClick={() => setSelected(null)} className="ml-auto text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Campos do item */}
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
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Qtd</label>
              <input type="number" min="0.001" step="0.001"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                value={form.quantidade} onChange={e => set("quantidade", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vl. Unit. (R$)</label>
              <input type="number" min="0" step="0.01"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
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
                <input type="number" min="0" step="0.01"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                  value={form[field]} onChange={e => set(field, e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={() => {
            if (!form.descricao) return;
            const t = Number(form.quantidade) * Number(form.valor_unitario);
            onAdd({
              ...form,
              valor_total: t,
              valor_icms: t * Number(form.aliquota_icms) / 100,
              valor_pis: t * Number(form.aliquota_pis) / 100,
              valor_cofins: t * Number(form.aliquota_cofins) / 100,
            });
            onClose();
          }} className="flex-1 text-white text-sm font-semibold py-2.5 rounded-xl" style={{ backgroundColor: "#0B63D4" }}>
            Adicionar Item
          </button>
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

  // Dados
  const [destinatarios, setDestinatarios] = useState([]);
  const [naturezas, setNaturezas] = useState([]);
  const [selectedDest, setSelectedDest] = useState(null);
  const [selectedNatureza, setSelectedNatureza] = useState(null);
  const [searchDest, setSearchDest] = useState("");
  const [itens, setItens] = useState([]);
  const [itemModal, setItemModal] = useState(false);

  // Avançado
  const [avancado, setAvancado] = useState({
    forma_pagamento: "Dinheiro",
    indicador_intermediador: "Operação sem intermediador (em site ou plataforma própria)",
    atendimento: "Não se aplica",
    indicador_operacao: "Operação interna",
    info_complementar: "",
    valor_frete: 0,
    valor_seguro: 0,
    outras_despesas: 0,
    desconto_total: 0,
  });
  const setAv = (k, v) => setAvancado(a => ({ ...a, [k]: v }));

  // Transmissão
  const [transmitindo, setTransmitindo] = useState(false);
  const [transmitida, setTransmitida] = useState(false);
  const [notaId, setNotaId] = useState(null);

  useEffect(() => {
    try {
      const c = localStorage.getItem("emissor_current_client");
      if (!c) { navigate("/emissor/painel"); return; }
      const parsed = JSON.parse(c);
      setClient(parsed);
      // Carrega destinatários e naturezas — SEM criar rascunho automático
      Promise.all([
        base44.entities.Destinatario.filter({ empresa_id: parsed.id }),
        base44.entities.NaturezaTributaria.filter({ empresa_id: parsed.id }),
      ]).then(([dests, nats]) => {
        setDestinatarios(dests);
        setNaturezas(nats);
      });
    } catch { navigate("/emissor/painel"); }
  }, []);

  const goTo = (next) => { setDir(next > step ? 1 : -1); setStep(next); };

  const totais = {
    produtos: itens.reduce((s, i) => s + Number(i.valor_total || 0), 0),
    icms: itens.reduce((s, i) => s + Number(i.valor_icms || 0), 0),
    pis: itens.reduce((s, i) => s + Number(i.valor_pis || 0), 0),
    cofins: itens.reduce((s, i) => s + Number(i.valor_cofins || 0), 0),
  };
  totais.impostos = totais.icms + totais.pis + totais.cofins;
  totais.total = totais.produtos + Number(avancado.valor_frete) + Number(avancado.valor_seguro)
    + Number(avancado.outras_despesas) - Number(avancado.desconto_total);

  const transmitir = async () => {
    setTransmitindo(true);
    // Cria a nota APENAS no momento da transmissão
    const nota = await base44.entities.NotaFiscal55.create({
      empresa_id: client?.id,
      empresa_nome: client?.razao_social,
      status_sefaz: "transmitindo",
      destinatario_id: selectedDest?.id,
      destinatario_nome: selectedDest?.nome,
      destinatario_cnpj: selectedDest?.cnpj,
      dest_logradouro: selectedDest?.logradouro,
      dest_numero: selectedDest?.numero,
      dest_bairro: selectedDest?.bairro,
      dest_municipio: selectedDest?.municipio,
      dest_uf: selectedDest?.uf,
      dest_cep: selectedDest?.cep,
      destinatario_email: selectedDest?.email,
      natureza_operacao: selectedNatureza?.nome,
      forma_pagamento_codigo: avancado.forma_pagamento_codigo || "01",
      valor_produtos: totais.produtos,
      valor_impostos: totais.impostos,
      valor_total: totais.total,
      observacoes: avancado.info_complementar,
    });
    setNotaId(nota.id);

    // Salva itens
    await Promise.all(itens.map(item =>
      base44.entities.ItemNota.create({ ...item, nota_id: nota.id, empresa_id: client?.id })
    ));

    // Chama backend NFE.io
    const res = await base44.functions.invoke('emitirNfe', {
      notaId: nota.id,
      empresaId: client?.id,
      ambiente: client?.ambiente,
    });

    if (res.data?.error) {
      setTransmitindo(false);
      alert('Erro ao emitir: ' + res.data.error);
      return;
    }

    setTransmitindo(false);
    setTransmitida(true);
  };

  const destFiltrados = destinatarios.filter(d =>
    d.nome?.toLowerCase().includes(searchDest.toLowerCase()) || d.cnpj?.includes(searchDest)
  );

  const canNext = () => {
    if (step === 0) return !!selectedDest && !!selectedNatureza;
    if (step === 1) return itens.length > 0;
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emitir NF-e 55</h1>
          <p className="text-gray-500 text-sm">{client?.razao_social}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Stepper */}
        <div className="border-b border-gray-100 px-4 py-5">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
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
                    <span className={`text-xs font-medium hidden sm:block ${isActive ? "text-[#0B63D4]" : isDone ? "text-emerald-600" : "text-gray-400"}`}>
                      {s.title}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-5 transition-colors ${isDone ? "bg-emerald-400" : "bg-gray-100"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-80">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={step} custom={dir} variants={variants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.25, ease: "easeOut" }}>

              {/* Passo 0 – Destinatário + Natureza */}
              {step === 0 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold text-gray-800">Destinatário e Natureza da Operação</h2>

                  {/* Natureza */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      <Layers className="w-4 h-4 inline mr-1" /> Natureza da Operação *
                    </label>
                    {naturezas.length === 0 ? (
                      <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                        Nenhuma natureza cadastrada.{" "}
                        <a href="/emissor/naturezas" className="underline font-medium">Cadastrar natureza →</a>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {naturezas.map(n => (
                          <button key={n.id} onClick={() => setSelectedNatureza(n)}
                            className={`text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                              selectedNatureza?.id === n.id
                                ? "border-[#0B63D4] bg-[#E6F0FF] text-[#0B63D4]"
                                : "border-gray-100 hover:bg-gray-50"
                            }`}>
                            <p className="font-medium">{n.nome}</p>
                            <p className="text-xs text-gray-400 mt-0.5">CFOP: {n.cfop_estadual} / {n.cfop_interestadual} · {n.finalidade}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Destinatário */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      <User className="w-4 h-4 inline mr-1" /> Destinatário *
                    </label>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                        placeholder="Buscar por nome ou CNPJ..." value={searchDest}
                        onChange={e => setSearchDest(e.target.value)} />
                    </div>
                    {destFiltrados.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-2xl">
                        <User className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                        <p className="text-sm text-gray-400">Nenhum destinatário. Cadastre em <strong>Destinatários</strong>.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto">
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
                              <p className="text-xs text-gray-400">{d.cnpj}{d.municipio && ` · ${d.municipio}/${d.uf}`}</p>
                            </div>
                            {selectedDest?.id === d.id && <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#0B63D4" }} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Passo 1 – Produtos */}
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

              {/* Passo 2 – Impostos */}
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
                        {[
                          ["Total de Produtos", totais.produtos],
                          ["ICMS", totais.icms],
                          ["PIS", totais.pis],
                          ["COFINS", totais.cofins],
                        ].map(([lbl, val]) => (
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
                </div>
              )}

              {/* Passo 3 – Avançado */}
              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold text-gray-800">Opções Avançadas</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Forma de pagamento *</label>
                      <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                        value={avancado.forma_pagamento} onChange={e => setAv("forma_pagamento", e.target.value)}>
                        {FORMAS_PAGAMENTO.map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Indicador de intermediador</label>
                      <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                        value={avancado.indicador_intermediador} onChange={e => setAv("indicador_intermediador", e.target.value)}>
                        {INDICADORES_INTERMEDIADOR.map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Atendimento</label>
                      <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                        value={avancado.atendimento} onChange={e => setAv("atendimento", e.target.value)}>
                        {TIPOS_ATENDIMENTO.map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Indicador de operação *</label>
                    <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                      value={avancado.indicador_operacao} onChange={e => setAv("indicador_operacao", e.target.value)}>
                      {INDICADORES_OPERACAO.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Informações Complementares de interesse do Contribuinte</label>
                    <textarea rows={3} value={avancado.info_complementar}
                      onChange={e => setAv("info_complementar", e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4] resize-none" />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      ["valor_frete","Valor do frete"],
                      ["valor_seguro","Valor do seguro"],
                      ["outras_despesas","Outras despesas acessórias"],
                      ["desconto_total","Desconto total"],
                    ].map(([k, label]) => (
                      <div key={k}>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs text-gray-400">R$</span>
                          <input type="number" min="0" step="0.01"
                            className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                            value={avancado[k]} onChange={e => setAv(k, parseFloat(e.target.value) || 0)} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-3 p-4 rounded-xl" style={{ backgroundColor: "#E6F0FF" }}>
                    {[
                      ["Total da nota", fmt(totais.total)],
                      ["Total Pago", fmt(totais.total)],
                      ["Valor do troco", "0,00"],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="text-sm font-bold" style={{ color: "#0B63D4" }}>R$ {val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Passo 4 – Transmissão */}
              {step === 4 && (
                <div className="space-y-5">
                  {!transmitida ? (
                    <>
                      <h2 className="text-lg font-semibold text-gray-800">Confirmar e Transmitir</h2>
                      <div className="bg-gray-50 rounded-2xl p-5 space-y-3 border border-gray-100">
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Destinatário</span><span className="font-semibold text-gray-900">{selectedDest?.nome || "—"}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Natureza</span><span className="font-medium text-gray-700">{selectedNatureza?.nome || "—"}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Forma de Pagamento</span><span className="font-medium text-gray-700">{avancado.forma_pagamento}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Itens</span><span className="font-medium text-gray-700">{itens.length} item(ns)</span></div>
                        <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                          <span className="font-bold text-gray-700">Total da Nota</span>
                          <span className="font-bold text-2xl" style={{ color: "#0B63D4" }}>R$ {fmt(totais.total)}</span>
                        </div>
                      </div>
                      <button onClick={transmitir}
                        disabled={transmitindo || !selectedDest || itens.length === 0}
                        className="w-full flex items-center justify-center gap-3 text-white font-bold py-4 rounded-2xl text-lg disabled:opacity-40 transition-all shadow-lg shadow-blue-200"
                        style={{ backgroundColor: "#0B63D4" }}>
                        {transmitindo
                          ? <><Loader2 className="w-6 h-6 animate-spin" /> Transmitindo para SEFAZ...</>
                          : <><Send className="w-5 h-5" /> Transmitir Nota</>}
                      </button>
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

        {/* Footer navegação */}
        {!transmitida && (
          <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between">
            <button onClick={() => goTo(step - 1)} disabled={step === 0}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 disabled:opacity-30 font-medium">
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            {step < STEPS.length - 1 && (
              <button onClick={() => goTo(step + 1)} disabled={!canNext()}
                className="flex items-center gap-1.5 text-white text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-40"
                style={{ backgroundColor: "#0B63D4" }}>
                Próximo <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {itemModal && (
        <ItemModal
          empresaId={client?.id}
          onAdd={item => setItens(p => [...p, item])}
          onClose={() => setItemModal(false)}
        />
      )}
    </div>
  );
}