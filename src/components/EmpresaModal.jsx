import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, ShieldOff } from "lucide-react";
import { TIPOS_CERTIDAO } from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";

export default function EmpresaModal({ empresa, onClose, onSave }) {
  const { toast } = useToast();
  const [form, setForm] = useState(empresa || { nome: "", nome_fantasia: "", cnpj: "", cnpj_matriz: "", email: "", telefone: "", responsavel: "", regime_tributario: "", inscricao_estadual: "", status: "ativo", grupo_id: "", grupo_nome: "", certidoes_nao_aplicaveis: [] });

  const toggleNaoAplicavel = (tipo) => {
    const atual = form.certidoes_nao_aplicaveis || [];
    const novaLista = atual.includes(tipo)
      ? atual.filter(t => t !== tipo)
      : [...atual, tipo];
    setForm(f => ({ ...f, certidoes_nao_aplicaveis: novaLista }));
  };
  const [eFilial, setEFilial] = useState(!!(empresa?.cnpj_matriz));
  const [grupos, setGrupos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [consultando, setConsultando] = useState(false);
  const [erroCnpj, setErroCnpj] = useState("");

  useEffect(() => {
    base44.entities.GrupoEmpresarial.list().then(setGrupos).catch(() => {});
  }, []);

  const handleToggleFilial = (checked) => {
    setEFilial(checked);
    if (checked && form.cnpj) {
      const digits = form.cnpj.replace(/\D/g, "");
      if (digits.length === 14) {
        const raiz = digits.slice(0, 8);
        const matrizFormatada = `${raiz.slice(0,2)}.${raiz.slice(2,5)}.${raiz.slice(5,8)}/0001`;
        setForm(f => ({ ...f, cnpj_matriz: matrizFormatada }));
      }
    } else {
      setForm(f => ({ ...f, cnpj_matriz: "" }));
    }
  };

  const handleConsultarCnpj = async () => {
    if (!form.cnpj) return;
    setConsultando(true);
    setErroCnpj("");
    try {
      const response = await base44.functions.invoke('consultarCnpj', { cnpj: form.cnpj });
      if (response.data?.error) {
        setErroCnpj(response.data.error);
      } else {
        const d = response.data;
        setForm(f => ({
          ...f,
          nome: d.nome || f.nome,
          email: d.email || f.email,
          telefone: d.telefone || f.telefone,
          inscricao_estadual: d.inscricao_estadual || f.inscricao_estadual,
        }));
      }
    } catch (err) {
      setErroCnpj("Não foi possível consultar o CNPJ. Tente novamente.");
    }
    setConsultando(false);
  };

  const handleGrupo = (id) => {
    const g = grupos.find(g => g.id === id);
    setForm({ ...form, grupo_id: id, grupo_nome: g?.nome || "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (empresa?.id) {
      await base44.entities.Empresa.update(empresa.id, form);
    } else {
      const novaEmpresa = await base44.entities.Empresa.create(form);
      const docsExistentes = await base44.entities.DocumentoEmpresa.list();
      const crcExistente = docsExistentes.find(d => d.tipo === "crc_contador");
      if (crcExistente) {
        await base44.entities.DocumentoEmpresa.create({
          empresa_id: novaEmpresa.id,
          empresa_nome: novaEmpresa.nome,
          empresa_cnpj: novaEmpresa.cnpj,
          tipo: "crc_contador",
          arquivo_url: crcExistente.arquivo_url,
        });
      }
    }
    toast({ title: "✅ Gravação realizada com sucesso!", description: empresa?.id ? "Empresa atualizada." : "Nova empresa criada." });
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{empresa ? "Editar Empresa" : "Nova Empresa"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social *</label>
            <input required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia <span className="text-gray-400 font-normal">(opcional)</span></label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.nome_fantasia || ""} onChange={e => setForm({ ...form, nome_fantasia: e.target.value })} placeholder="Nome pelo qual a empresa é conhecida" />
          </div>

          {/* Toggle É Filial */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => handleToggleFilial(!eFilial)}
              className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${eFilial ? "bg-blue-600" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${eFilial ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <div>
              <p className="text-sm font-medium text-gray-700">Esta empresa é uma filial?</p>
              <p className="text-xs text-gray-400">Certidões Federais, FGTS e Trabalhistas serão buscadas na matriz</p>
            </div>
          </div>

          {eFilial && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CNPJ da Matriz <span className="text-gray-400 font-normal">(preenchido automaticamente)</span>
              </label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="XX.XXX.XXX/0001-XX"
                value={form.cnpj_matriz || ""}
                onChange={e => setForm({ ...form, cnpj_matriz: e.target.value })}
              />
              <p className="text-xs text-gray-400 mt-1">Confirme ou ajuste o CNPJ da matriz se necessário.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ *</label>
            <div className="flex gap-2">
              <input
                required
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.cnpj}
                onChange={e => setForm({ ...form, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
              />
              <button
                type="button"
                onClick={handleConsultarCnpj}
                disabled={consultando || !form.cnpj}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg disabled:opacity-50 whitespace-nowrap"
              >
                {consultando ? "Buscando..." : "Consultar"}
              </button>
            </div>
            {erroCnpj && <p className="text-xs text-red-500 mt-1">{erroCnpj}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Regime Tributário</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.regime_tributario} onChange={e => setForm({ ...form, regime_tributario: e.target.value })}>
                <option value="">Selecionar...</option>
                <option value="simples_nacional">Simples Nacional</option>
                <option value="lucro_presumido">Lucro Presumido</option>
                <option value="lucro_real">Lucro Real</option>
                <option value="mei">MEI</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inscrição Estadual</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.inscricao_estadual} onChange={e => setForm({ ...form, inscricao_estadual: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grupo Empresarial <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.grupo_id || ""}
              onChange={e => handleGrupo(e.target.value)}
            >
              <option value="">— Sem grupo —</option>
              {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
            </select>
            {grupos.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">Nenhum grupo cadastrado ainda. Crie um na aba "Grupos Empresariais".</p>
            )}
          </div>

          {/* Certidões Não Aplicáveis */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldOff className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Certidões Não Aplicáveis</label>
            </div>
            <p className="text-xs text-gray-400 mb-3">Marque as certidões que <strong>não se aplicam</strong> a esta empresa. Elas aparecerão como "Não Aplicável" em vez de "Ausente".</p>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS_CERTIDAO.map(({ tipo, label }) => {
                const marcado = (form.certidoes_nao_aplicaveis || []).includes(tipo);
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => toggleNaoAplicavel(tipo)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors text-left ${
                      marcado
                        ? "bg-orange-50 border-orange-300 text-orange-700"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                      marcado ? "bg-orange-500 border-orange-500" : "border-gray-300"
                    }`}>
                      {marcado && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}