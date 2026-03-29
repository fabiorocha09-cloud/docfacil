import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { X, ChevronLeft, Loader2, Info } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO","EX"
];

const ESTADO_LABELS = {
  AC:"Acre",AL:"Alagoas",AP:"Amapá",AM:"Amazonas",BA:"Bahia",CE:"Ceará",
  DF:"Distrito Federal",ES:"Espírito Santo",GO:"Goiás",MA:"Maranhão",
  MT:"Mato Grosso",MS:"Mato Grosso do Sul",MG:"Minas Gerais",PA:"Pará",
  PB:"Paraíba",PR:"Paraná",PE:"Pernambuco",PI:"Piauí",RJ:"Rio de Janeiro",
  RN:"Rio Grande do Norte",RS:"Rio Grande do Sul",RO:"Rondônia",RR:"Roraima",
  SC:"Santa Catarina",SP:"São Paulo",SE:"Sergipe",TO:"Tocantins",EX:"Exterior"
};

const CSOSN_OPTIONS = [
  { value: "101", label: "101 - Tributada c/ permissão de crédito" },
  { value: "102", label: "102 - Tributada s/ permissão de crédito" },
  { value: "103", label: "103 - Isenção do ICMS (faixa de receita bruta)" },
  { value: "201", label: "201 - Tributada c/ crédito e com ST" },
  { value: "202", label: "202 - Tributada s/ crédito e com ST" },
  { value: "203", label: "203 - Isenção + com ST" },
  { value: "300", label: "300 - Imune" },
  { value: "400", label: "400 - Não tributada pelo Simples Nacional" },
  { value: "500", label: "500 - ICMS cobrado anteriormente por ST" },
  { value: "900", label: "900 - Outros" },
];

const CST_ICMS = [
  { value: "00", label: "00 - Tributada integralmente" },
  { value: "10", label: "10 - Tributada e com cobrança do ICMS por ST" },
  { value: "20", label: "20 - Com redução de BC" },
  { value: "30", label: "30 - Isenta ou não tributada e com ST" },
  { value: "40", label: "40 - Isenta" },
  { value: "41", label: "41 - Não tributada" },
  { value: "50", label: "50 - Suspensão" },
  { value: "51", label: "51 - Diferimento" },
  { value: "60", label: "60 - ICMS cobrado anteriormente por ST" },
  { value: "70", label: "70 - Com redução de BC e cobrança do ICMS por ST" },
  { value: "90", label: "90 - Outras" },
];

const MOD_BC_OPTIONS = [
  { value: "0", label: "0 - Margem Valor Agregado (%)" },
  { value: "1", label: "1 - Pauta (Valor)" },
  { value: "2", label: "2 - Preço Tabelado Máx. (valor)" },
  { value: "3", label: "3 - Valor da Operação" },
];

const MOD_BC_ST_OPTIONS = [
  { value: "0", label: "0 - Preço tabelado ou máximo sugerido" },
  { value: "1", label: "1 - Lista Negativa (valor)" },
  { value: "2", label: "2 - Lista Positiva (valor)" },
  { value: "3", label: "3 - Lista Neutra (valor)" },
  { value: "4", label: "4 - Margem Valor Agregado (%)" },
  { value: "5", label: "5 - Pauta (valor)" },
];

const CST_PIS_COFINS = [
  { value: "01", label: "01 - Operação Tributável (alíquota normal)" },
  { value: "02", label: "02 - Operação Tributável (alíquota diferenciada)" },
  { value: "04", label: "04 - Operação Tributável (monofásica)" },
  { value: "06", label: "06 - Operação Tributável a alíquota zero" },
  { value: "07", label: "07 - Operação Isenta" },
  { value: "08", label: "08 - Operação sem Incidência" },
  { value: "09", label: "09 - Operação com Suspensão" },
  { value: "49", label: "49 - Outras Saídas" },
  { value: "99", label: "99 - Outras Entradas" },
];

const CST_IPI = [
  { value: "50", label: "50 - Saída Tributada" },
  { value: "51", label: "51 - Saída Trib. Alíquota Zero" },
  { value: "52", label: "52 - Saída Isenta" },
  { value: "53", label: "53 - Saída Não Tributada" },
  { value: "54", label: "54 - Saída Imune" },
  { value: "55", label: "55 - Saída com Suspensão" },
  { value: "99", label: "99 - Outras Saídas" },
];

// Tabela C - NT2009/005: define quais seções ICMS aparecem por CSOSN
const CSOSN_CONFIG = {
  "101": { showCalc: false, showST: false, showCredSN: true },
  "102": { showCalc: false, showST: false, showCredSN: false },
  "103": { showCalc: false, showST: false, showCredSN: false },
  "201": { showCalc: false, showST: true,  showCredSN: true },
  "202": { showCalc: false, showST: true,  showCredSN: false },
  "203": { showCalc: false, showST: true,  showCredSN: false },
  "300": { showCalc: false, showST: false, showCredSN: false },
  "400": { showCalc: false, showST: false, showCredSN: false },
  "500": { showCalc: false, showST: false, showCredSN: false, showSTRet: true },
  "900": { showCalc: true,  showST: true,  showCredSN: true },
};

const defaultConfig = () => ({
  icms_csosn: "102",
  icms_cst: "",
  icms_aliquota: 0,
  icms_modalidade_bc: "3",
  icms_p_red_bc: 0,
  icms_p_cred_sn: 0,
  icms_mod_bc_st: "4",
  icms_p_mva_st: 0,
  icms_p_red_bc_st: 0,
  icms_p_st: 0,
  icms_v_bc_st_ret: 0,
  icms_v_st_ret: 0,
  pis_cst: "07",
  pis_aliquota: 0,
  pis_base_frete: false,
  pis_base_seguro: false,
  pis_base_ipi: false,
  pis_base_outras: false,
  pis_excluir_icms: false,
  cofins_cst: "07",
  cofins_aliquota: 0,
  cofins_base_frete: false,
  cofins_base_seguro: false,
  cofins_base_ipi: false,
  cofins_base_outras: false,
  cofins_excluir_icms: false,
  ipi_cst: "99",
  ipi_aliquota: 0,
  ipi_base_frete: false,
  ipi_base_seguro: false,
  ipi_base_outras: false,
});

function NumInput({ label, value, onChange, step = "0.01", suffix = "" }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-1 block">{label}</label>
      <div className="relative">
        <input type="number" min="0" step={step} value={value || 0}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]" />
        {suffix && <span className="absolute right-3 top-2 text-xs text-gray-400">{suffix}</span>}
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, required }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-1 block">{label}{required && " *"}</label>
      <select value={value || ""} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4] bg-white">
        <option value="">Selecione...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function BaseCheckboxes({ prefix, data, onChange, showIPI = true, showExcluirICMS = true }) {
  const fields = ["frete", "seguro", ...(showIPI ? ["ipi"] : []), "outras"];
  const labels = { frete: "Adicionar frete", seguro: "Adicionar seguro", ipi: "Adicionar IPI", outras: "Outras despesas" };
  return (
    <div className="flex flex-wrap gap-3 mb-3">
      {fields.map(f => (
        <label key={f} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
          <input type="checkbox" checked={!!data[`${prefix}_base_${f}`]}
            onChange={e => onChange(`${prefix}_base_${f}`, e.target.checked)}
            className="rounded border-gray-300 text-blue-600 w-3.5 h-3.5" />
          {labels[f]}
        </label>
      ))}
      {showExcluirICMS && (
        <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
          <input type="checkbox" checked={!!data[`${prefix}_excluir_icms`]}
            onChange={e => onChange(`${prefix}_excluir_icms`, e.target.checked)}
            className="rounded border-gray-300 text-blue-600 w-3.5 h-3.5" />
          Excluir ICMS
        </label>
      )}
    </div>
  );
}

function ImpostoSection({ title, badge, children }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
        <h4 className="font-bold text-gray-800 text-sm">{title}</h4>
        {badge && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function ICMSSection({ data, onChange, isSimples }) {
  const csosn = data.icms_csosn;
  const cfg = CSOSN_CONFIG[csosn] || { showCalc: true, showST: false, showCredSN: false };

  if (!isSimples) {
    // Regime Normal: CST + campos completos de cálculo
    return (
      <ImpostoSection title="ICMS" badge="Regime Normal">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SelectField label="CST do ICMS *" value={data.icms_cst}
            onChange={v => onChange("icms_cst", v)} options={CST_ICMS} required />
          <SelectField label="Modalidade BC" value={data.icms_modalidade_bc}
            onChange={v => onChange("icms_modalidade_bc", v)} options={MOD_BC_OPTIONS} />
          <NumInput label="Alíquota ICMS %" value={data.icms_aliquota}
            onChange={v => onChange("icms_aliquota", v)} suffix="%" />
          <NumInput label="Redução BC %" value={data.icms_p_red_bc}
            onChange={v => onChange("icms_p_red_bc", v)} suffix="%" />
        </div>
      </ImpostoSection>
    );
  }

  // Simples Nacional: baseado no CSOSN (Tabela C - NT2009/005)
  const csosn_labels = {
    "101": "Crédito permitido", "102": "Sem crédito", "103": "Isento (receita)",
    "201": "Com crédito + ST", "202": "Sem crédito + ST", "203": "Isento + ST",
    "300": "Imune", "400": "Não tributada", "500": "ICMS retido por ST", "900": "Outros"
  };

  return (
    <ImpostoSection title="ICMS" badge="Simples Nacional">
      <div className="max-w-sm mb-4">
        <SelectField label="CSOSN *" value={csosn}
          onChange={v => onChange("icms_csosn", v)} options={CSOSN_OPTIONS} required />
      </div>

      {csosn && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">{csosn_labels[csosn] || ""}</p>
        </div>
      )}

      {/* CSOSN 900: cálculo normal de ICMS */}
      {cfg.showCalc && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <SelectField label="Modalidade BC" value={data.icms_modalidade_bc}
            onChange={v => onChange("icms_modalidade_bc", v)} options={MOD_BC_OPTIONS} />
          <NumInput label="Alíquota ICMS %" value={data.icms_aliquota}
            onChange={v => onChange("icms_aliquota", v)} suffix="%" />
          <NumInput label="Redução BC %" value={data.icms_p_red_bc}
            onChange={v => onChange("icms_p_red_bc", v)} suffix="%" />
        </div>
      )}

      {/* Crédito SN - CSOSN 101, 201, 900 */}
      {cfg.showCredSN && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
          <NumInput label="Alíquota Crédito SN %" value={data.icms_p_cred_sn}
            onChange={v => onChange("icms_p_cred_sn", v)} suffix="%" />
        </div>
      )}

      {/* ST - CSOSN 201, 202, 203, 900 */}
      {cfg.showST && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
          <div className="col-span-full text-xs font-semibold text-amber-700 mb-1">Substituição Tributária</div>
          <SelectField label="Modalidade BC ST" value={data.icms_mod_bc_st}
            onChange={v => onChange("icms_mod_bc_st", v)} options={MOD_BC_ST_OPTIONS} />
          <NumInput label="MVA ST %" value={data.icms_p_mva_st}
            onChange={v => onChange("icms_p_mva_st", v)} suffix="%" />
          <NumInput label="Redução BC ST %" value={data.icms_p_red_bc_st}
            onChange={v => onChange("icms_p_red_bc_st", v)} suffix="%" />
          <NumInput label="Alíquota ST %" value={data.icms_p_st}
            onChange={v => onChange("icms_p_st", v)} suffix="%" />
        </div>
      )}

      {/* CSOSN 500: ST Retido anteriormente */}
      {cfg.showSTRet && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl">
          <div className="col-span-full text-xs font-semibold text-gray-600 mb-1">ICMS ST Retido Anteriormente</div>
          <NumInput label="BC ICMS ST Retido (R$)" value={data.icms_v_bc_st_ret}
            onChange={v => onChange("icms_v_bc_st_ret", v)} />
          <NumInput label="Valor ICMS ST Retido (R$)" value={data.icms_v_st_ret}
            onChange={v => onChange("icms_v_st_ret", v)} />
        </div>
      )}

      {/* CSOSN 102/103/300/400: informativo */}
      {!cfg.showCalc && !cfg.showST && !cfg.showSTRet && !cfg.showCredSN && csosn && (
        <div className="text-xs text-gray-400 italic">
          Para este CSOSN, não há campos adicionais de cálculo do ICMS.
        </div>
      )}
    </ImpostoSection>
  );
}

function ClienteTab({ data, onChange, isSimples }) {
  return (
    <div className="space-y-1">
      <ICMSSection data={data} onChange={onChange} isSimples={isSimples} />

      {/* PIS */}
      <ImpostoSection title="PIS">
        <BaseCheckboxes prefix="pis" data={data} onChange={onChange} />
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="CST do PIS *" value={data.pis_cst}
            onChange={v => onChange("pis_cst", v)} options={CST_PIS_COFINS} required />
          <NumInput label="Alíquota PIS %" value={data.pis_aliquota}
            onChange={v => onChange("pis_aliquota", v)} suffix="%" />
        </div>
      </ImpostoSection>

      {/* COFINS */}
      <ImpostoSection title="COFINS">
        <BaseCheckboxes prefix="cofins" data={data} onChange={onChange} />
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="CST do COFINS *" value={data.cofins_cst}
            onChange={v => onChange("cofins_cst", v)} options={CST_PIS_COFINS} required />
          <NumInput label="Alíquota COFINS %" value={data.cofins_aliquota}
            onChange={v => onChange("cofins_aliquota", v)} suffix="%" />
        </div>
      </ImpostoSection>

      {/* IPI */}
      <ImpostoSection title="IPI">
        <BaseCheckboxes prefix="ipi" data={data} onChange={onChange} showIPI={false} showExcluirICMS={false} />
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="CST do IPI" value={data.ipi_cst}
            onChange={v => onChange("ipi_cst", v)} options={CST_IPI} />
          <NumInput label="Alíquota IPI %" value={data.ipi_aliquota}
            onChange={v => onChange("ipi_aliquota", v)} suffix="%" />
        </div>
      </ImpostoSection>
    </div>
  );
}

export default function TributacaoModal({ item, empresaId, regimeTributario, onClose, onSave }) {
  const { theme } = useTheme();
  const isSimples = (regimeTributario || "simples_nacional") === "simples_nacional";

  const [step, setStep] = useState(0);
  const [nome, setNome] = useState(item?.nome || "");
  const [todosEstados, setTodosEstados] = useState(item ? (item.todos_estados ?? true) : true);
  const [estados, setEstados] = useState(item?.estados || [...ESTADOS]);
  const [abaCliente, setAbaCliente] = useState("revenda");
  const [revenda, setRevenda] = useState({ ...defaultConfig(), ...(item?.revenda || {}) });
  const [consumidorFinal, setConsumidorFinal] = useState({ ...defaultConfig(), ...(item?.consumidor_final || {}) });
  const [observacoes, setObservacoes] = useState(item?.observacoes || "");
  const [ibpt, setIbpt] = useState(item?.ibpt_na_nota ?? false);
  const [saving, setSaving] = useState(false);

  const toggleEstado = (uf) => setEstados(prev =>
    prev.includes(uf) ? prev.filter(e => e !== uf) : [...prev, uf]
  );

  const toggleTodos = (v) => {
    setTodosEstados(v);
    if (v) setEstados([...ESTADOS]);
  };

  const updateRevenda = (field, val) => setRevenda(prev => ({ ...prev, [field]: val }));
  const updateConsumidor = (field, val) => setConsumidorFinal(prev => ({ ...prev, [field]: val }));

  const handleSave = async () => {
    if (!nome.trim()) return;
    setSaving(true);
    const data = {
      nome, empresa_id: empresaId,
      todos_estados: todosEstados, estados,
      regime_tributario: regimeTributario || "simples_nacional",
      revenda, consumidor_final: consumidorFinal,
      observacoes, ibpt_na_nota: ibpt, ativo: true,
    };
    if (item?.id) await base44.entities.RegraTributacao.update(item.id, data);
    else await base44.entities.RegraTributacao.create(data);
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className={`rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col backdrop-blur-md ${theme === 'dark' ? 'bg-gray-800 border border-white/10' : 'bg-white'}`}>

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b flex-shrink-0 ${theme === 'dark' ? 'border-white/10' : 'border-gray-100'}`}>
          <div>
            <h2 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {step === 0 ? (item ? "Editar Regra de Tributação" : "Nova Regra de Tributação") : nome}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {step === 0 ? "Etapa 1 de 2: Identificação e Estados" : "Etapa 2 de 2: Configuração dos Impostos"}
            </p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {/* Step 0: Nome + Estados */}
        {step === 0 && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Nome da Regra *</label>
              <input required
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                placeholder="Ex: Simples Nacional - SP" value={nome} onChange={e => setNome(e.target.value)} />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Estados *</label>
              <div className="border border-gray-200 rounded-xl p-4 min-h-20">
                {!todosEstados && estados.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">Nenhum estado selecionado</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {ESTADOS.filter(uf => estados.includes(uf)).map(uf => (
                    <span key={uf} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                      {ESTADO_LABELS[uf]}
                      {!todosEstados && (
                        <button onClick={() => toggleEstado(uf)} className="text-gray-400 hover:text-red-500 ml-0.5">×</button>
                      )}
                    </span>
                  ))}
                </div>
                {!todosEstados && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Clique para adicionar:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ESTADOS.filter(uf => !estados.includes(uf)).map(uf => (
                        <button key={uf} onClick={() => toggleEstado(uf)}
                          className="text-xs border border-dashed border-gray-300 text-gray-500 px-2 py-0.5 rounded-full hover:border-blue-400 hover:text-blue-600 transition-colors">
                          + {ESTADO_LABELS[uf]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" checked={todosEstados} onChange={e => toggleTodos(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 w-4 h-4" />
                <span className="text-sm text-gray-600">Todos os estados</span>
              </label>
            </div>
          </div>
        )}

        {/* Step 1: Impostos */}
        {step === 1 && (
          <div className="flex-1 overflow-y-auto">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 flex-shrink-0">
              {["revenda", "consumidor_final"].map(tab => (
                <button key={tab} onClick={() => setAbaCliente(tab)}
                  className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
                    abaCliente === tab
                      ? "border-[#0B63D4] text-[#0B63D4]"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}>
                  {tab === "revenda" ? "🏢 Cliente Revenda" : "👤 Consumidor Final"}
                </button>
              ))}
            </div>

            <div className="p-6">
              {abaCliente === "revenda"
                ? <ClienteTab data={revenda} onChange={updateRevenda} isSimples={isSimples} />
                : <ClienteTab data={consumidorFinal} onChange={updateConsumidor} isSimples={isSimples} />
              }

              {/* Observações + IBPT */}
              <div className="border-t border-gray-100 pt-4 space-y-3 mt-2">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Observações da nota</label>
                  <textarea rows={3} value={observacoes} onChange={e => setObservacoes(e.target.value)}
                    placeholder="Texto que aparecerá nas informações adicionais da NF-e"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4] resize-none" />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => setIbpt(v => !v)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${ibpt ? "bg-[#0B63D4]" : "bg-gray-200"}`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${ibpt ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm text-gray-700">Informações de IBPT na nota</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`flex items-center justify-between px-6 py-4 border-t flex-shrink-0 ${theme === 'dark' ? 'border-white/10' : 'border-gray-100'}`}>
          {step === 0 ? (
            <>
              <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 font-medium">Cancelar</button>
              <button onClick={() => setStep(1)} disabled={!nome.trim()}
                className="text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-40"
                style={{ backgroundColor: "#0B63D4" }}>
                Próximo →
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep(0)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium">
                <ChevronLeft className="w-4 h-4" /> Voltar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50"
                style={{ backgroundColor: "#0B63D4" }}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : "Salvar Regra"}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}