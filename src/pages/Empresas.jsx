import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Building2, Pencil, Trash2, FileCheck2, SearchCheck, FileSpreadsheet, Mail, Link2, Layers, RotateCcw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import EmpresaModal from "@/components/EmpresaModal";
import SolicitarBuscaModal from "@/components/SolicitarBuscaModal";
import ImportarEmpresasModal from "@/components/ImportarEmpresasModal";
import DocumentosEmpresa from "@/components/DocumentosEmpresa";
import SolicitarTJModal from "@/components/SolicitarTJModal";
import GerarLinkModal from "@/components/GerarLinkModal";

export default function Empresas() {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [buscaEmpresa, setBuscaEmpresa] = useState(null);
  const [tjEmpresa, setTjEmpresa] = useState(null);
  const [linkEmpresa, setLinkEmpresa] = useState(null);
  const [importarOpen, setImportarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [lixeira, setLixeira] = useState(false);
  const [selecionados, setSelecionados] = useState([]);
  const navigate = useNavigate();

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

  const moverLixeira = async (id) => {
    if (!confirm("Mover esta empresa para a lixeira?")) return;
    await base44.entities.Empresa.update(id, { excluida: true });
    carregar();
  };

  const restaurar = async (id) => {
    await base44.entities.Empresa.update(id, { excluida: false });
    carregar();
  };

  const excluirPermanente = async (id) => {
    if (!confirm("Excluir permanentemente esta empresa? Esta ação não pode ser desfeita.")) return;
    await base44.entities.Empresa.delete(id);
    carregar();
  };

  const moverLixeiraEmLote = async () => {
    if (!confirm(`Mover ${selecionados.length} empresa(s) para a lixeira?`)) return;
    await Promise.all(selecionados.map(id => base44.entities.Empresa.update(id, { excluida: true })));
    setSelecionados([]);
    carregar();
  };

  const restaurarEmLote = async () => {
    await Promise.all(selecionados.map(id => base44.entities.Empresa.update(id, { excluida: false })));
    setSelecionados([]);
    carregar();
  };

  const excluirPermanenteEmLote = async () => {
    if (!confirm(`Excluir permanentemente ${selecionados.length} empresa(s)? Esta ação não pode ser desfeita.`)) return;
    await Promise.all(selecionados.map(id => base44.entities.Empresa.delete(id)));
    setSelecionados([]);
    carregar();
  };

  const isAdmin = user?.role === "admin";

  const ativas = empresas.filter(e => !e.excluida);
  const naLixeira = empresas.filter(e => e.excluida);
  const listaAtual = lixeira ? naLixeira : ativas;

  const filtradas = listaAtual.filter(e =>
    e.nome?.toLowerCase().includes(search.toLowerCase()) ||
    e.cnpj?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
          <p className="text-gray-500 text-sm mt-1">
            {ativas.length} ativa(s){naLixeira.length > 0 && ` · ${naLixeira.length} na lixeira`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Ações em lote */}
          {!lixeira && selecionados.length > 0 && (
            <button
              onClick={moverLixeiraEmLote}
              className="flex items-center gap-2 border border-red-200 text-red-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" /> Lixeira ({selecionados.length})
            </button>
          )}
          {lixeira && selecionados.length > 0 && (
            <>
              <button
                onClick={restaurarEmLote}
                className="flex items-center gap-2 border border-blue-200 text-blue-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-50"
              >
                <RotateCcw className="w-4 h-4" /> Restaurar ({selecionados.length})
              </button>
              <button
                onClick={excluirPermanenteEmLote}
                className="flex items-center gap-2 border border-red-200 text-red-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" /> Excluir ({selecionados.length})
              </button>
            </>
          )}
          {/* Toggle lixeira */}
          <button
            onClick={() => { setLixeira(v => !v); setSelecionados([]); }}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${lixeira ? "bg-red-50 border-red-200 text-red-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            <Trash2 className="w-4 h-4" /> {lixeira ? "Sair da Lixeira" : "Lixeira"}
            {!lixeira && naLixeira.length > 0 && <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{naLixeira.length}</span>}
          </button>
          {isAdmin && !lixeira && (
            <>
              <button
                onClick={() => setImportarOpen(true)}
                className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" /> Importar Planilha
              </button>
              <button
                onClick={() => navigate("/GruposEmpresariais")}
                className="flex items-center gap-2 border border-indigo-200 hover:bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <Layers className="w-4 h-4" /> Grupos Empresariais
              </button>
              <button
                onClick={() => { setEditando(null); setModalOpen(true); }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Nova Empresa
              </button>
            </>
          )}
        </div>
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

      {lixeira && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          Você está na lixeira. Empresas aqui podem ser restauradas ou excluídas permanentemente.
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{lixeira ? "Lixeira vazia." : "Nenhuma empresa encontrada."}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Barra de seleção */}
          <div className="flex items-center justify-between px-5 py-2 border-b border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">{filtradas.length} resultado(s)</span>
            <button
              className="text-xs text-blue-600 hover:underline"
              onClick={() => {
                if (selecionados.length === filtradas.length) setSelecionados([]);
                else setSelecionados(filtradas.map(e => e.id));
              }}
            >
              {selecionados.length === filtradas.length ? "Desmarcar todos" : "Selecionar todos"}
            </button>
          </div>
          <div>
            {filtradas.map(empresa => {
              const isSel = selecionados.includes(empresa.id);
              return (
                <div key={empresa.id} className="border-b border-gray-100 last:border-b-0">
                  <div
                    className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 cursor-pointer ${isSel ? "bg-blue-50" : ""}`}
                    onClick={() => setSelecionados(prev => isSel ? prev.filter(id => id !== empresa.id) : [...prev, empresa.id])}
                  >
                    <div className="flex items-center gap-4">
                      {/* Checkbox */}
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSel ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
                        {isSel && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{empresa.nome}</p>
                        <p className="text-sm text-gray-500">{empresa.cnpj} · {empresa.responsavel || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      {!lixeira && (
                        <>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${empresa.status === "ativo" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {empresa.status === "ativo" ? "Ativo" : "Inativo"}
                          </span>
                          <button onClick={() => setBuscaEmpresa(empresa)} className="p-1.5 text-gray-400 hover:text-green-600 rounded" title="Solicitar busca de certidões">
                            <SearchCheck className="w-4 h-4" />
                          </button>
                          <button onClick={() => setTjEmpresa(empresa)} className="p-1.5 text-gray-400 hover:text-purple-600 rounded" title="Solicitar Certidão TJ-PA via email">
                            <Mail className="w-4 h-4" />
                          </button>
                          <button onClick={() => setLinkEmpresa(empresa)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded" title="Gerar link compartilhável">
                            <Link2 className="w-4 h-4" />
                          </button>
                          <Link to={`/Certidoes?empresa=${empresa.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Ver certidões">
                            <FileCheck2 className="w-4 h-4" />
                          </Link>
                          {isAdmin && (
                            <>
                              <button onClick={() => { setEditando(empresa); setModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => moverLixeira(empresa.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Mover para lixeira">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </>
                      )}
                      {lixeira && isAdmin && (
                        <>
                          <button onClick={() => restaurar(empresa.id)} className="flex items-center gap-1 text-xs text-blue-600 px-2 py-1 border border-blue-200 rounded-lg hover:bg-blue-50">
                            <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                          </button>
                          <button onClick={() => excluirPermanente(empresa.id)} className="flex items-center gap-1 text-xs text-red-600 px-2 py-1 border border-red-200 rounded-lg hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5" /> Excluir
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {!lixeira && <DocumentosEmpresa empresa={empresa} isAdmin={isAdmin} />}
                </div>
              );
            })}
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

      {buscaEmpresa && (
        <SolicitarBuscaModal
          empresa={buscaEmpresa}
          onClose={() => setBuscaEmpresa(null)}
          onSolicitado={() => { setBuscaEmpresa(null); }}
        />
      )}

      {tjEmpresa && (
        <SolicitarTJModal
          empresa={tjEmpresa}
          onClose={() => setTjEmpresa(null)}
        />
      )}

      {linkEmpresa && (
        <GerarLinkModal
          empresa={linkEmpresa}
          onClose={() => setLinkEmpresa(null)}
        />
      )}

      {importarOpen && (
        <ImportarEmpresasModal
          onClose={() => setImportarOpen(false)}
          onImportado={() => { setImportarOpen(false); carregar(); }}
        />
      )}
    </div>
  );
}