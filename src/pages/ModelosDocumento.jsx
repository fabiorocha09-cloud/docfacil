import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, FileText, Trash2, Loader2, BookOpen, Plus, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const TIPOS = [
  { value: "federal", label: "Federal" },
  { value: "estadual", label: "Estadual" },
  { value: "municipal", label: "Municipal" },
  { value: "fgts", label: "FGTS" },
  { value: "trabalhista", label: "Trabalhista" },
  { value: "alvara_bombeiros", label: "Alvará - Bombeiros" },
  { value: "alvara_vigilancia_sanitaria", label: "Alvará - Vigilância Sanitária" },
  { value: "alvara_funcionamento", label: "Alvará - Funcionamento" },
  { value: "alvara_meio_ambiente", label: "Alvará - Meio Ambiente" },
];

const SUBTIPOS = {
  federal: ["Receita Federal", "PGFN", "Conjunta RFB/PGFN"],
  estadual: ["SEFAZ-PA", "SEFAZ-SP", "SEFAZ-RJ", "SEFAZ-MG", "SEFAZ-RS", "Outro"],
  municipal: ["ISS", "TFE", "TFA", "Outro"],
  fgts: ["CRF - Caixa"],
  trabalhista: ["CNDT - TST"],
};

function ModeloModal({ modelo, onClose, onSave }) {
  const { toast } = useToast();
  const [form, setForm] = useState(modelo || { tipo: "estadual", subtipo: "", estado_municipio: "", descricao: "", arquivo_url: "" });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, arquivo_url: file_url }));
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (modelo?.id) {
      await base44.entities.ModeloDocumento.update(modelo.id, form);
    } else {
      await base44.entities.ModeloDocumento.create(form);
    }
    toast({ title: "✅ Modelo salvo com sucesso!", duration: 3000 });
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{modelo ? "Editar Modelo" : "Novo Modelo de Documento"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            📌 Envie um documento real como <strong>exemplo padrão</strong>. A IA usará este modelo para identificar melhor certidões do mesmo tipo/estado/município.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value, subtipo: "" }))}>
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtipo</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={SUBTIPOS[form.tipo]?.[0] || "Ex: SEFAZ-PA"}
                value={form.subtipo} onChange={e => setForm(f => ({ ...f, subtipo: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado / Município</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: PA, Belém-PA, SP..."
              value={form.estado_municipio} onChange={e => setForm(f => ({ ...f, estado_municipio: e.target.value }))} />
            <p className="text-xs text-gray-400 mt-1">Deixe em branco se o modelo for genérico.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Certidão SEFAZ Pará - modelo 2024"
              value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Documento Exemplo *</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-sm px-4 py-2 rounded-lg transition-colors">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "Enviando..." : form.arquivo_url ? "Substituir" : "Enviar Arquivo"}
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
              {form.arquivo_url && (
                <a href={form.arquivo_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">Ver arquivo</a>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving || uploading || !form.arquivo_url}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar Modelo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ModelosDocumento() {
  const [modelos, setModelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const { toast } = useToast();

  useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    setLoading(true);
    const data = await base44.entities.ModeloDocumento.list();
    setModelos(data);
    setLoading(false);
  };

  const deletar = async (id) => {
    if (!confirm("Remover este modelo?")) return;
    await base44.entities.ModeloDocumento.delete(id);
    toast({ title: "🗑️ Modelo removido.", duration: 3000 });
    carregar();
  };

  const filtrados = filtroTipo === "todos" ? modelos : modelos.filter(m => m.tipo === filtroTipo);

  // Agrupa por tipo
  const porTipo = {};
  filtrados.forEach(m => {
    if (!porTipo[m.tipo]) porTipo[m.tipo] = [];
    porTipo[m.tipo].push(m);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modelos de Documento</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Envie documentos exemplo para treinar a IA a reconhecer certidões por estado/município
          </p>
        </div>
        <button
          onClick={() => { setEditando(null); setModalOpen(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          <Plus className="w-4 h-4" /> Novo Modelo
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 text-sm text-indigo-700 dark:text-indigo-300">
        <p className="font-medium mb-1">💡 Como funciona</p>
        <p>Ao fazer upload de certidões, a IA compara o novo documento com os modelos cadastrados aqui para identificar com mais precisão o tipo, estado e município — especialmente útil para alvarás e certidões estaduais/municipais que variam de região para região.</p>
      </div>

      {/* Filtro */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFiltroTipo("todos")}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filtroTipo === "todos" ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
          Todos ({modelos.length})
        </button>
        {TIPOS.map(t => {
          const count = modelos.filter(m => m.tipo === t.value).length;
          if (count === 0) return null;
          return (
            <button key={t.value} onClick={() => setFiltroTipo(t.value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filtroTipo === t.value ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}</div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-16 text-center">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">Nenhum modelo cadastrado ainda.</p>
          <button onClick={() => { setEditando(null); setModalOpen(true); }}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            <Plus className="w-4 h-4" /> Adicionar Primeiro Modelo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {TIPOS.map(({ value: tipo, label }) => {
            const items = porTipo[tipo];
            if (!items || items.length === 0) return null;
            return (
              <div key={tipo} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</span>
                  <span className="ml-2 text-xs text-gray-400">{items.length} modelo(s)</span>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {items.map(m => (
                    <div key={m.id} className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {m.descricao || label}
                            {m.subtipo && <span className="ml-2 text-xs text-gray-400">{m.subtipo}</span>}
                          </p>
                          {m.estado_municipio && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">📍 {m.estado_municipio}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <a href={m.arquivo_url} target="_blank" rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline">Ver arquivo</a>
                        <button onClick={() => { setEditando(m); setModalOpen(true); }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                          <Upload className="w-4 h-4" />
                        </button>
                        <button onClick={() => deletar(m.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <ModeloModal
          modelo={editando}
          onClose={() => setModalOpen(false)}
          onSave={() => { setModalOpen(false); carregar(); }}
        />
      )}
    </div>
  );
}