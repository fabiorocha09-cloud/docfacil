import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Layers, Pencil, Trash2, Building2, Link2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import GrupoEmpresarialModal from "@/components/GrupoEmpresarialModal";
import GerarLinkModal from "@/components/GerarLinkModal";

const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };

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
    Promise.all([base44.entities.GrupoEmpresarial.list(), base44.entities.Empresa.list()])
      .then(([g, e]) => { setGrupos(g); setEmpresas(e); setLoading(false); });
  };

  const deletar = async (id) => {
    if (!confirm("Remover este grupo? As empresas vinculadas não serão excluídas.")) return;
    await base44.entities.GrupoEmpresarial.delete(id);
    toast({ title: "🗑️ Grupo removido." });
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
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Exo 2', sans-serif", letterSpacing: "-0.02em" }}>Grupos Empresariais</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>{grupos.length} grupo(s) cadastrado(s)</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditando(null); setModalOpen(true); }}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl"
            style={{ background: "linear-gradient(135deg,#3A8DFF,#1A58CC)" }}>
            <Plus className="w-4 h-4" /> Novo Grupo
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />)}</div>
      ) : grupos.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={cardStyle}>
          <Layers className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: "#A0B1D4" }} />
          <p style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>Nenhum grupo cadastrado.</p>
          <p className="text-xs mt-1" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>Crie um grupo para organizar suas empresas e compartilhar documentos em conjunto.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grupos.map(grupo => {
            const membros = empresasDoGrupo(grupo.id);
            const exp = expandidos[grupo.id];
            return (
              <div key={grupo.id} className="rounded-2xl overflow-hidden" style={cardStyle}>
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.15)" }}>
                      <Layers className="w-5 h-5" style={{ color: "#818cf8" }} />
                    </div>
                    <div>
                      <p className="font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>{grupo.nome}</p>
                      <p className="text-sm" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>
                        {membros.length} empresa(s) vinculada(s){grupo.responsavel && ` · ${grupo.responsavel}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        background: grupo.status === "ativo" ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.07)",
                        color: grupo.status === "ativo" ? "#4ade80" : "#6B7FA3",
                        fontFamily: "'Outfit', sans-serif",
                      }}>
                      {grupo.status === "ativo" ? "Ativo" : "Inativo"}
                    </span>
                    <button onClick={() => setLinkGrupo(grupo)} className="p-1.5 rounded-lg transition-colors" style={{ color: "#6B7FA3" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#818cf8"}
                      onMouseLeave={e => e.currentTarget.style.color = "#6B7FA3"} title="Gerar link compartilhável">
                      <Link2 className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <>
                        <button onClick={() => { setEditando(grupo); setModalOpen(true); }} className="p-1.5 rounded-lg transition-colors" style={{ color: "#6B7FA3" }}
                          onMouseEnter={e => e.currentTarget.style.color = "#5E9BFF"}
                          onMouseLeave={e => e.currentTarget.style.color = "#6B7FA3"}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => deletar(grupo.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: "#6B7FA3" }}
                          onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                          onMouseLeave={e => e.currentTarget.style.color = "#6B7FA3"}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button onClick={() => toggleExpandir(grupo.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: "#6B7FA3" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#A0B1D4"}
                      onMouseLeave={e => e.currentTarget.style.color = "#6B7FA3"}>
                      {exp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {exp && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    {membros.length === 0 ? (
                      <div className="px-5 py-4 flex items-center gap-2 text-sm" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>
                        <Building2 className="w-4 h-4" />
                        Nenhuma empresa vinculada a este grupo.
                      </div>
                    ) : (
                      <div>
                        {membros.map(emp => (
                          <Link key={emp.id} to={`/Empresas?empresa=${emp.id}`}
                            className="flex items-center gap-3 px-5 py-3 group transition-colors"
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(58,141,255,0.06)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <Building2 className="w-4 h-4 flex-shrink-0" style={{ color: "#5E9BFF" }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate" style={{ fontFamily: "'Manrope', sans-serif" }}>{emp.nome}</p>
                              <p className="text-xs" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>{emp.cnpj}</p>
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: emp.status === "ativo" ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.07)",
                                color: emp.status === "ativo" ? "#4ade80" : "#6B7FA3",
                              }}>
                              {emp.status === "ativo" ? "Ativo" : "Inativo"}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#6B7FA3" }} />
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
        <div className="rounded-2xl p-4" style={{ border: "1px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
          <p className="text-xs font-medium mb-2" style={{ color: "#6B7FA3", fontFamily: "'Outfit', sans-serif" }}>{semGrupo.length} empresa(s) sem grupo vinculado</p>
          <div className="flex flex-wrap gap-2">
            {semGrupo.map(e => (
              <span key={e.id} className="text-xs rounded-lg px-2 py-1"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#A0B1D4" }}>
                {e.nome}
              </span>
            ))}
          </div>
        </div>
      )}

      {modalOpen && (
        <GrupoEmpresarialModal grupo={editando} onClose={() => setModalOpen(false)} onSave={() => { setModalOpen(false); carregar(); }} />
      )}
      {linkGrupo && (
        <GerarLinkModal grupo={linkGrupo} empresasDoGrupo={empresasDoGrupo(linkGrupo.id)} onClose={() => setLinkGrupo(null)} />
      )}
    </div>
  );
}