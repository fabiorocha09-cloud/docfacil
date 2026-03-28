import { useEffect, useState } from "react";
import { useNavigate, Link, useNavigate as useNav } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { FileText, Search, Download, RotateCcw, CheckCircle2, XCircle, Clock, Send, Ban, Plus, ChevronRight, MoreVertical, Eye, ExternalLink, RefreshCw, Mail, Copy, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const STATUS = {
  rascunho: { label: "Rascunho", cls: "bg-gray-100 text-gray-600", Icon: FileText },
  validada: { label: "Validada", cls: "bg-blue-100 text-blue-700", Icon: CheckCircle2 },
  transmitindo: { label: "Transmitindo", cls: "bg-amber-100 text-amber-700", Icon: Send },
  transmitida: { label: "Transmitida", cls: "bg-emerald-100 text-emerald-700", Icon: CheckCircle2 },
  rejeitada: { label: "Rejeitada", cls: "bg-red-100 text-red-700", Icon: XCircle },
  cancelada: { label: "Cancelada", cls: "bg-gray-200 text-gray-500", Icon: Ban },
};

export default function HistoricoNotas() {
  const navigate = useNavigate();
  const goToNota = (id) => navigate(`/emissor/nota?id=${id}`);
  const [client, setClient] = useState(null);
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const handleCancelar = async (nota, e) => {
    e.stopPropagation();
    if (!confirm("Confirmar cancelamento desta NF-e?")) return;
    await base44.entities.NotaFiscal55.update(nota.id, { status_sefaz: "cancelada" });
    setNotas(prev => prev.map(n => n.id === nota.id ? { ...n, status_sefaz: "cancelada" } : n));
  };

  const handleClonar = async (nota, e) => {
    e.stopPropagation();
    const { id, created_date, updated_date, numero, chave_acesso, protocolo, status_sefaz, ...rest } = nota;
    await base44.entities.NotaFiscal55.create({ ...rest, status_sefaz: "rascunho" });
    const data = await base44.entities.NotaFiscal55.filter({ empresa_id: nota.empresa_id });
    setNotas(data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
  };

  const handleCopiarChave = (nota, e) => {
    e.stopPropagation();
    if (nota.chave_acesso) {
      navigator.clipboard.writeText(nota.chave_acesso);
      alert("Chave de acesso copiada!");
    }
  };

  useEffect(() => {
    try {
      const c = localStorage.getItem("emissor_current_client");
      if (!c) { navigate("/emissor/painel"); return; }
      const parsed = JSON.parse(c);
      setClient(parsed);
      base44.entities.NotaFiscal55.filter({ empresa_id: parsed.id }).then(data => {
        setNotas(data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
        setLoading(false);
      });
    } catch { navigate("/emissor/painel"); }
  }, []);

  const filtradas = notas.filter(n => {
    const matchSearch = !search || n.destinatario_nome?.toLowerCase().includes(search.toLowerCase()) || n.destinatario_cnpj?.includes(search) || n.chave_acesso?.includes(search);
    const matchStatus = filtroStatus === "todos" || n.status_sefaz === filtroStatus;
    return matchSearch && matchStatus;
  });

  const fmt = v => Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Histórico de Notas</h1>
          <p className="text-gray-500 text-sm">{client?.razao_social} · {notas.length} nota(s)</p>
        </div>
        <Link to="/emissor/emitir" className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm" style={{ backgroundColor: "#0B63D4" }}>
          <Plus className="w-4 h-4" /> Nova NF-e
        </Link>
      </div>

      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4] shadow-sm"
            placeholder="Buscar por destinatário, CNPJ ou chave de acesso..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4] shadow-sm"
          value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="todos">Todos os status</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>
        ) : filtradas.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">{notas.length === 0 ? "Nenhuma nota emitida." : "Nenhum resultado encontrado."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Destinatário</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Data</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtradas.map(nota => {
              const cfg = STATUS[nota.status_sefaz] || STATUS.rascunho;
              const Icon = cfg.Icon;
              return (
                <tr key={nota.id}
                  onClick={() => goToNota(nota.id)}
                  className="hover:bg-blue-50 cursor-pointer transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">{nota.destinatario_nome || '—'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{nota.destinatario_cnpj || '—'}</p>
                  </td>
                  <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{new Date(nota.created_date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-4 text-right font-semibold text-gray-900">
                    {nota.valor_total ? `R$ ${Number(nota.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium w-fit ${cfg.cls}`}>
                      <Icon className="w-3 h-3" />{cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => goToNota(nota.id)}>
                          <Eye className="w-4 h-4 mr-2" /> Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(`/emissor/nota?id=${nota.id}`, "_blank")}>
                          <ExternalLink className="w-4 h-4 mr-2" /> Abrir outra aba
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled>
                          <RefreshCw className="w-4 h-4 mr-2" /> Sincronizar
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>
                          <Mail className="w-4 h-4 mr-2" /> Enviar por e-mail
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {nota.danfe_pdf_url && (
                          <DropdownMenuItem asChild>
                            <a href={nota.danfe_pdf_url} target="_blank" rel="noreferrer">
                              <Download className="w-4 h-4 mr-2" /> Baixar DANFE
                            </a>
                          </DropdownMenuItem>
                        )}
                        {nota.retorno_xml_url && (
                          <DropdownMenuItem asChild>
                            <a href={nota.retorno_xml_url} target="_blank" rel="noreferrer">
                              <FileText className="w-4 h-4 mr-2" /> Baixar XML
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem disabled>
                          <Edit className="w-4 h-4 mr-2" /> Carta de Correção
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => handleClonar(nota, e)}>
                          <Copy className="w-4 h-4 mr-2" /> Clonar nota
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => handleCopiarChave(nota, e)}
                          disabled={!nota.chave_acesso}>
                          <Copy className="w-4 h-4 mr-2" /> Copiar chave
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => handleCancelar(nota, e)}
                          disabled={nota.status_sefaz === "cancelada"}
                          className="text-red-600 focus:text-red-600">
                          <Ban className="w-4 h-4 mr-2" /> Cancelar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
          </table>
          </div>
          )}
      </div>
    </div>
  );
}