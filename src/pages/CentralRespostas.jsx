import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, Plus, Trash2, CheckCircle2, Circle, Search, Building2, X, Loader2, Paperclip, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function CentralRespostas() {
  const [respostas, setRespostas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [visualizando, setVisualizando] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      base44.entities.RespostaEmail.list("-created_date", 100),
      base44.entities.Empresa.list(),
    ]).then(([r, e]) => {
      setRespostas(r);
      setEmpresas(e);
      setLoading(false);
    });
  }, []);

  const marcarLida = async (resp) => {
    await base44.entities.RespostaEmail.update(resp.id, { lida: true });
    setRespostas(prev => prev.map(r => r.id === resp.id ? { ...r, lida: true } : r));
  };

  const deletar = async (id) => {
    if (!confirm("Remover esta resposta?")) return;
    await base44.entities.RespostaEmail.delete(id);
    toast({ title: "🗑️ Resposta removida." });
    setRespostas(prev => prev.filter(r => r.id !== id));
  };

  const naoLidas = respostas.filter(r => !r.lida).length;

  const filtradas = respostas.filter(r =>
    r.empresa_nome?.toLowerCase().includes(search.toLowerCase()) ||
    r.de?.toLowerCase().includes(search.toLowerCase()) ||
    r.assunto_original?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Central de Respostas
            {naoLidas > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">{naoLidas}</span>
            )}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Respostas recebidas aos e-mails de solicitação de certidões</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          <Plus className="w-4 h-4" /> Registrar Resposta
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          placeholder="Buscar por empresa, remetente ou assunto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : filtradas.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-16 text-center">
          <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma resposta registrada.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtradas.map(resp => (
              <div
                key={resp.id}
                className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${!resp.lida ? "bg-blue-50/40 dark:bg-blue-900/10" : ""}`}
                onClick={() => { setVisualizando(resp); if (!resp.lida) marcarLida(resp); }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex-shrink-0 ${!resp.lida ? "text-blue-500" : "text-gray-300"}`}>
                    {resp.lida ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-medium ${!resp.lida ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                        {resp.empresa_nome}
                      </span>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                        {resp.tipo === "tj_pa" ? "TJ-PA" : "Outro"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      De: {resp.de} · {resp.assunto_original && `"${resp.assunto_original}"`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <span className="text-xs text-gray-400">
                    {resp.data_recebimento ? new Date(resp.data_recebimento).toLocaleDateString("pt-BR") : new Date(resp.created_date).toLocaleDateString("pt-BR")}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); deletar(resp.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {visualizando && (
        <VisualizarRespostaModal resposta={visualizando} onClose={() => setVisualizando(null)} />
      )}

      {modalOpen && (
        <RegistrarRespostaModal
          empresas={empresas}
          onClose={() => setModalOpen(false)}
          onSave={(nova) => {
            setRespostas(prev => [nova, ...prev]);
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function VisualizarRespostaModal({ resposta, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Resposta Recebida</h2>
            <p className="text-xs text-gray-500 mt-0.5">{resposta.empresa_nome}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-1 text-xs text-gray-600 dark:text-gray-300">
            <p><strong>De:</strong> {resposta.de}</p>
            <p><strong>Para:</strong> {resposta.para}</p>
            {resposta.assunto_original && <p><strong>Assunto:</strong> {resposta.assunto_original}</p>}
            {resposta.data_recebimento && <p><strong>Recebido em:</strong> {new Date(resposta.data_recebimento).toLocaleDateString("pt-BR")}</p>}
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{resposta.corpo}</p>
          </div>
          {resposta.anexos_urls && resposta.anexos_urls.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4" /> Anexos ({resposta.anexos_urls.length})
              </p>
              <div className="space-y-2">
                {resposta.anexos_urls.map((url, index) => {
                  const nome = decodeURIComponent(url.split('/').pop().split('?')[0]) || `Anexo ${index + 1}`;
                  return (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      <Download className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{nome}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
          {resposta.observacoes && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-xs text-yellow-800 dark:text-yellow-300"><strong>Observações:</strong> {resposta.observacoes}</p>
            </div>
          )}
        </div>
        <div className="p-5 border-t border-gray-100 dark:border-gray-700">
          <button onClick={onClose} className="w-full border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function RegistrarRespostaModal({ empresas, onClose, onSave }) {
  const [form, setForm] = useState({
    empresa_id: "", empresa_nome: "", assunto_original: "", de: "", para: "",
    corpo: "", data_recebimento: new Date().toISOString().slice(0, 16), tipo: "tj_pa", observacoes: ""
  });
  const [saving, setSaving] = useState(false);

  const handleEmpresa = (id) => {
    const emp = empresas.find(e => e.id === id);
    setForm({ ...form, empresa_id: id, empresa_nome: emp?.nome || "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const nova = await base44.entities.RespostaEmail.create({
      ...form,
      data_recebimento: form.data_recebimento ? new Date(form.data_recebimento).toISOString() : new Date().toISOString(),
      lida: false,
    });
    onSave(nova);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Registrar Resposta Recebida</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form id="form-resposta" onSubmit={handleSubmit} className="p-5 space-y-3 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empresa *</label>
              <select required className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={form.empresa_id} onChange={e => handleEmpresa(e.target.value)}>
                <option value="">Selecionar...</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
              <select className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                <option value="tj_pa">TJ-PA</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">De (remetente) *</label>
              <input required className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={form.de} onChange={e => setForm({ ...form, de: e.target.value })} placeholder="cartorio@tj.pa.gov.br" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Para</label>
              <input className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={form.para} onChange={e => setForm({ ...form, para: e.target.value })} placeholder="fiscal@scalagestao.com.br" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assunto original</label>
            <input className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={form.assunto_original} onChange={e => setForm({ ...form, assunto_original: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de recebimento</label>
            <input type="datetime-local" className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={form.data_recebimento} onChange={e => setForm({ ...form, data_recebimento: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Corpo da resposta *</label>
            <textarea required rows={5} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={form.corpo} onChange={e => setForm({ ...form, corpo: e.target.value })} placeholder="Cole aqui o conteúdo da resposta recebida..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações internas</label>
            <textarea rows={2} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
          </div>
        </form>
        <div className="flex gap-3 p-5 border-t border-gray-100 dark:border-gray-700">
          <button type="button" onClick={onClose} className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
          <button
            type="submit"
            form="form-resposta"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {saving ? "Salvando..." : "Salvar Resposta"}
          </button>
        </div>
      </div>
    </div>
  );
}