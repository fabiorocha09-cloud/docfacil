import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Layers, Pencil, Trash2, Building2, Link2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import GrupoEmpresarialModal from "@/components/GrupoEmpresarialModal";
import GerarLinkModal from "@/components/GerarLinkModal";

export default function GruposEmpresariais() {
  const [grupos, setGrupos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [linkGrupo, setLinkGrupo] = useState(null);
  const [expandidos, setExpandidos] = useState({});
  const [user, setUser] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    carregar();
  }, []);

  const carregar = () => {
    Promise.all([
      base44.entities.GrupoEmpresarial.list(),
      base44.entities.Empresa.list(),
    ]).then(([g, e]) => {
      setGrupos(g);
      setEmpresas(e);
      setLoading(false);
    });
  };

  const deletar = async (id) => {
    if (!confirm("Remover este grupo? As empresas vinculadas não serão excluídas.")) return;
    await base44.entities.GrupoEmpresarial.delete(id);
    toast({ title: "🗑️ Grupo removido.", description: "O grupo foi excluído com sucesso." });
    carregar();
  };

  const toggleExpandir = (id) => setExpandidos(prev => ({ ...prev, [id]: !prev[id] }));

  const isAdmin = user?.role === "admin";

  const empresasDoGrupo = (grupoId) => empresas.filter(e => e.grupo_id === grupoId);
  const semGrupo = empresas.filter(e => !e.grupo_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Grupos Empresariais</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{grupos.length} grupo(s) cadastrado(s)</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditando(null); setModalOpen(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Grupo
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : grupos.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-16 text-center">
          <Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum grupo cadastrado.</p>
          <p className="text-gray-400 text-xs mt-1">Crie um grupo para organizar suas empresas e compartilhar documentos em conjunto.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grupos.map(grupo => {
            const membros = empresasDoGrupo(grupo.id);
            const exp = expandidos[grupo.id];
            return (
              <div key={grupo.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                      <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{grupo.nome}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {membros.length} empresa(s) vinculada(s)
                        {grupo.responsavel && ` · ${grupo.responsavel}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${grupo.status === "ativo" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {grupo.status === "ativo" ? "Ativo" : "Inativo"}
                    </span>
                    <button
                      onClick={() => setLinkGrupo(grupo)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 rounded"
                      title="Gerar link compartilhável do grupo"
                    >
                      <Link2 className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <>
                        <button onClick={() => { setEditando(grupo); setModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => deletar(grupo.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => toggleExpandir(grupo.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                    >
                      {exp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {exp && (
                  <div className="border-t border-gray-100 dark:border-gray-700">
                    {membros.length === 0 ? (
                      <div className="px-5 py-4 text-sm text-gray-400 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Nenhuma empresa vinculada a este grupo. Edite uma empresa para vinculá-la.
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {membros.map(emp => (
                          <Link
                            key={emp.id}
                            to={`/Empresas?empresa=${emp.id}`}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                          >
                            <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-700 dark:group-hover:text-blue-400">{emp.nome}</p>
                              <p className="text-xs text-gray-500">{emp.cnpj}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${emp.status === "ativo" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                              {emp.status === "ativo" ? "Ativo" : "Inativo"}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 flex-shrink-0" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {semGrupo.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4">
          <p className="text-xs text-gray-400 font-medium mb-2">{semGrupo.length} empresa(s) sem grupo vinculado</p>
          <div className="flex flex-wrap gap-2">
            {semGrupo.map(e => (
              <span key={e.id} className="text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 text-gray-600 dark:text-gray-300">{e.nome}</span>
            ))}
          </div>
        </div>
      )}

      {modalOpen && (
        <GrupoEmpresarialModal
          grupo={editando}
          onClose={() => setModalOpen(false)}
          onSave={() => { setModalOpen(false); carregar(); }}
        />
      )}

      {linkGrupo && (
        <GerarLinkModal
          grupo={linkGrupo}
          empresasDoGrupo={empresasDoGrupo(linkGrupo.id)}
          onClose={() => setLinkGrupo(null)}
        />
      )}
    </div>
  );
}