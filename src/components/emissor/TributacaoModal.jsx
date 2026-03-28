import { useState } from "react";
import { X, ChevronLeft, Loader2 } from "lucide-react";
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
  { value: "101", label: "101: Tributada com permissão de crédito" },
  { value: "102", label: "102: Tributada sem permissão de crédito" },
  { value: "103", label: "103: Isenção do ICMS para faixa de receita" },
  { value: "201", label: "201: Tributada com crédito e ST" },
  { value: "202", label: "202: Tributada sem crédito e ST" },
  { value: "203", label: "203: Isenção/Imunidade com ST" },
  { value: "300", label: "300: Imune" },
  { value: "400", label: "400: Não tributada" },
  { value: "500", label: "500: ICMS cobrado anteriormente por ST" },
  { value: "900", label: "900: Outros" },
];

const CST_ICMS = [
  { value: "00", label: "00: Tributada integralmente" },
  { value: "10", label: "10: Tributada e com cobrança do ICMS por ST" },
  { value: "20", label: "20: Com redução de BC" },
  { value: "30", label: "30: Isenta ou não tributada e com cobrança do ICMS por ST" },
  { value: "40", label: "40: Isenta" },
  { value: "41", label: "41: Não tributada" },
  { value: "50", label: "50: Suspensão" },
  { value: "51", label: "51: Diferimento" },
  { value: "60", label: "60: ICMS cobrado anteriormente por ST" },
  { value: "70", label: "70: Com redução de BC e cobrança do ICMS por ST" },
  { value: "90", label: "90: Outras" },
];

const CST_PIS_COFINS = [
  { value: "01", label: "01: Operação Tributável (alíquota normal)" },
  { value: "02", label: "02: Operação Tributável (alíquota diferenciada)" },
  { value: "03", label: "03: Operação Tributável (por unidade)" },
  { value: "04", label: "04: Operação Tributável (tributação monofásica)" },
  { value: "05", label: "05: Operação Tributável por ST" },
  { value: "06", label: "06: Operação Tributável a alíquota zero" },
  { value: "07", label: "07: Operação Isenta da Contribuição" },
  { value: "08", label: "08: Operação sem Incidência da Contribuição" },
  { value: "09", label: "09: Operação com Suspensão da Contribuição" },
  { value: "49", label: "49: Outras Operações de Saída" },
  { value: "50", label: "50: Com Direito a Crédito - Receita Tributada Mercado Interno" },
  { value: "51", label: "51: Com Direito a Crédito - Receita Não Tributada Mercado Interno" },
  { value: "52", label: "52: Com Direito a Crédito - Receita de Exportação" },
  { value: "60", label: "60: Sem Direito a Crédito" },
  { value: "70", label: "70: Presumido" },
  { value: "99", label: "99: Outras Entradas" },
];

const CST_IPI = [
  { value: "00", label: "00: Entrada com Recuperação de Crédito" },
  { value: "01", label: "01: Entrada Tributada com Alíquota Zero" },
  { value: "02", label: "02: Entrada Isenta" },
  { value: "03", label: "03: Entrada Não Tributada" },
  { value: "04", label: "04: Entrada Imune" },
  { value: "05", label: "05: Entrada com Suspensão" },
  { value: "49", label: "49: Outras Entradas" },
  { value: "50", label: "50: Saída Tributada" },
  { value: "51", label: "51: Saída Tributável com Alíquota Zero" },
  { value: "52", label: "52: Saída Isenta" },
  { value: "53", label: "53: Saída Não Tributada" },
  { value: "54", label: "54: Saída Imune" },
  { value: "55", label: "55: Saída com Suspensão" },
  { value: "99", label: "99: Outras Saídas" },
];

const defaultConfig = () => ({
  icms_csosn: "102",
  icms_cst: "",
  icms_aliquota: 0,
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

function BaseCheckboxes({ prefix, data, onChange, showIPI = true, showExcluirICMS = true }) {
  const chk = (field) => (
    <label key={field} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
      <input type="checkbox" checked={!!data[`${prefix}_base_${field}`]}
        onChange={e => onChange(`${prefix}_base_${field}`, e.target.checked)}
        className="rounded border-gray-300 text-blue-600 w-3.5 h-3.5" />
      {field === "frete" ? "Adicionar frete"
        : field === "seguro" ? "Adicionar seguro"
        : field === "ipi" ? "Adicionar IPI"
        : "Adicionar outras despesas"}
    </label>
  );
  return (
    <div className="flex flex-wrap gap-4 mb-3">
      {chk("frete")}{chk("seguro")}
      {showIPI && chk("ipi")}
      {chk("outras")}
      {showExcluirICMS && (
        <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
          <input type="checkbox" checked={!!data[`${prefix}_excluir_icms`]}
            onChange={e => onChange(`${prefix}_excluir_icms`, e.target.checked)}
            className="rounded border-gray-300 text-blue-600 w-3.5 h-3.5" />
          Excluir valor do ICMS
        </label>
      )}
    </div>
  );
}

function ImpostoSection({ title, children }) {
  return (
    <div className="mb-6">
      <h4 className="font-bold text-gray-800 text-sm mb-3 border-b border-gray-100 pb-2">{title}</h4>
      {children}
    </div>
  );
}

function SelectField({ label, value, onChange, options, required }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-1 block">{label}{required && "*"}</label>
      <select value={value || ""} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4] bg-white">
        <option value="">Selecione...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function ClienteTab({ data, onChange, isSimples }) {
  const icmsCSONOptions = isSimples ? CSOSN_OPTIONS : CST_ICMS;
  const icmsField = isSimples ? "icms_csosn" : "icms_cst";
  const icmsLabel = isSimples ? "CSOSN" : "CST do ICMS";

  return (
    <div className="space-y-2">
      {/* ICMS */}
      <ImpostoSection title="ICMS">
        <div className="max-w-sm">
          <SelectField label={icmsLabel} value={data[icmsField]}
            onChange={v => onChange(icmsField, v)} options={icmsCSONOptions} required />
        </div>
        {!isSimples && (
          <div className="mt-2 max-w-xs">
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Alíquota do ICMS %</label>
            <input type="number" min="0" step="0.01" value={data.icms_aliquota || 0}
              onChange={e => onChange("icms_aliquota", parseFloat(e.target.value) || 0)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]" />
          </div>
        )}
      </ImpostoSection>

      {/* PIS */}
      <ImpostoSection title="PIS">
        <BaseCheckboxes prefix="pis" data={data} onChange={onChange} />
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="CST do PIS" value={data.pis_cst}
            onChange={v => onChange("pis_cst", v)} options={CST_PIS_COFINS} required />
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Alíquota do PIS %</label>
            <input type="number" min="0" step="0.01" value={data.pis_aliquota || 0}
              onChange={e => onChange("pis_aliquota", parseFloat(e.target.value) || 0)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]" />
          </div>
        </div>
      </ImpostoSection>

      {/* COFINS */}
      <ImpostoSection title="COFINS">
        <BaseCheckboxes prefix="cofins" data={data} onChange={onChange} />
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="CST do COFINS" value={data.cofins_cst}
            onChange={v => onChange("cofins_cst", v)} options={CST_PIS_COFINS} required />
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Alíquota do COFINS %</label>
            <input type="number" min="0" step="0.01" value={data.cofins_aliquota || 0}
              onChange={e => onChange("cofins_aliquota", parseFloat(e.target.value) || 0)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]" />
          </div>
        </div>
      </ImpostoSection>

      {/* IPI */}
      <ImpostoSection title="IPI">
        <BaseCheckboxes prefix="ipi" data={data} onChange={onChange} showIPI={false} showExcluirICMS={false} />
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="CST do IPI" value={data.ipi_cst}
            onChange={v => onChange("ipi_cst", v)} options={CST_IPI} required />
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Alíquota do IPI %</label>
            <input type="number" min="0" step="0.01" value={data.ipi_aliquota || 0}
              onChange={e => onChange("ipi_aliquota", parseFloat(e.target.value) || 0)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]" />
          </div>
        </div>
      </ImpostoSection>
    </div>
  );
}

export default function TributacaoModal({ item, empresaId, regimeTributario, onClose, onSave }) {
  const isSimples = (regimeTributario || "simples_nacional") === "simples_nacional";

  const [step, setStep] = useState(0); // 0=info, 1=form
  const [nome, setNome] = useState(item?.nome || "");
  const [todosEstados, setTodosEstados] = useState(item ? (item.todos_estados ?? true) : true);
  const [estados, setEstados] = useState(item?.estados || [...ESTADOS]);
  const [abaCliente, setAbaCliente] = useState("revenda");
  const [revenda, setRevenda] = useState({ ...defaultConfig(), ...(item?.revenda || {}) });
  const [consumidorFinal, setConsumidorFinal] = useState({ ...defaultConfig(), ...(item?.consumidor_final || {}) });
  const [observacoes, setObservacoes] = useState(item?.observacoes || "");
  const [ibpt, setIbpt] = useState(item?.ibpt_na_nota ?? false);
  const [saving, setSaving] = useState(false);

  const toggleEstado = (uf) => {
    setEstados(prev => prev.includes(uf) ? prev.filter(e => e !== uf) : [...prev, uf]);
  };

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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900">
              {step === 0 ? (item ? "Editar Regra de Tributação" : "Nova Regra de Tributação") : nome}
            </h2>
            {item?.id && <p className="text-xs text-gray-400 mt-0.5">Id: {item.id.slice(0,8)}</p>}
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {/* Step 0: Nome + Estados */}
        {step === 0 && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Nome da Regra *</label>
              <input required className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                placeholder="Ex: Tributação Simples Nacional" value={nome} onChange={e => setNome(e.target.value)} />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Estados *</label>
              <div className="border border-gray-200 rounded-xl p-4 min-h-24">
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
                  {tab === "revenda" ? "Cliente Revenda" : "Cliente Consumidor Final"}
                </button>
              ))}
            </div>
            
            <div className="p-6">
              {abaCliente === "revenda"
                ? <ClienteTab data={revenda} onChange={updateRevenda} isSimples={isSimples} />
                : <ClienteTab data={consumidorFinal} onChange={updateConsumidor} isSimples={isSimples} />
              }

              {/* Observações + IBPT (só na segunda aba consumidor para não repetir) */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1">Observações da nota</label>
                  <textarea rows={3} value={observacoes} onChange={e => setObservacoes(e.target.value)}
                    placeholder="Observação da NFe e NFCe"
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0">
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
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : "Salvar"}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}