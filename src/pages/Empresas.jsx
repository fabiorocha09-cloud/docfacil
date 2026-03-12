import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Building2, Pencil, Trash2, FileCheck2, SearchCheck } from "lucide-react";
import { Link } from "react-router-dom";
import EmpresaModal from "@/components/EmpresaModal";
import SolicitarBuscaModal from "@/components/SolicitarBuscaModal";

export default function Empresas() {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    carregar();
  }, []);

  const carregar = () => {
    base44.entities.Empresa.list().then(data => {
      setEmpresas(data);
      setLoading(false);
    });
  };

  const deletar = async (id) => {
    if (!confirm("Deseja remover esta empresa?")) return;
    await base44.entities.Empresa.delete(id);
    carregar();
  };

  const isAdmin = user?.role === "admin";

  const filtradas = empresas.filter(e =>
    e.nome?.toLowerCase().includes(search.toLowerCase()) ||
    e.cnpj?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
          <p className="text-gray-500 text-sm mt-1">{empresas.length} empresa(s) cadastrada(s)</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditando(null); setModalOpen(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Nova Empresa
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Buscar por nome ou CNPJ..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma empresa encontrada.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filtradas.map(empresa => (
              <div key={empresa.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{empresa.nome}</p>
                    <p className="text-sm text-gray-500">{empresa.cnpj} · {empresa.responsavel || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${empresa.status === "ativo" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {empresa.status === "ativo" ? "Ativo" : "Inativo"}
                  </span>
                  <Link to={`/Certidoes?empresa=${empresa.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Ver certidões">
                    <FileCheck2 className="w-4 h-4" />
                  </Link>
                  {isAdmin && (
                    <>
                      <button onClick={() => { setEditando(empresa); setModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deletar(empresa.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {modalOpen && (
        <EmpresaModal
          empresa={editando}
          onClose={() => setModalOpen(false)}
          onSave={() => { setModalOpen(false); carregar(); }}
        />
      )}
    </div>
  );
}