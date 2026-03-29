import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { base44 } from "@/api/base44Client";
import {
  FileText, Search, Download, CheckCircle2, XCircle, Clock,
  Send, Ban, Plus, MoreVertical, Eye, ExternalLink, RefreshCw,
  Copy, Edit, Trash2
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import DateRangeFilter, { getDateRange } from "@/components/emissor/DateRangeFilter";

const STATUS = {
  rascunho:    { label: "Rascunho",    cls: "bg-gray-100 text-gray-600",     Icon: FileText },
  validada:    { label: "Validada",    cls: "bg-blue-100 text-blue-700",      Icon: CheckCircle2 },
  transmitindo:{ label: "Transmitindo",cls: "bg-amber-100 text-amber-700",    Icon: Send },
  transmitida: { label: "Transmitida", cls: "bg-emerald-100 text-emerald-700",Icon: CheckCircle2 },
  rejeitada:   { label: "Rejeitada",   cls: "bg-red-100 text-red-700",        Icon: XCircle },
  cancelada:   { label: "Cancelada",   cls: "bg-gray-200 text-gray-500",      Icon: Ban },
};

// Campos copiados no clone — apenas dados pré-transmissão, sem anexos/retorno SEFAZ
const CAMPOS_CLONE = [
  "empresa_id","empresa_nome","natureza_operacao","destinatario_id","destinatario_nome",
  "destinatario_cnpj","destinatario_email","dest_logradouro","dest_numero","dest_complemento",
  "dest_bairro","dest_municipio","dest_uf","dest_cep","dest_codigo_municipio","dest_ie",
  "dest_indicador_ie","forma_pagamento","forma_pagamento_codigo","tipo_cliente",
  "regra_tributacao_id","regra_tributacao_nome","valor_produtos","valor_frete","valor_seguro",
  "outras_despesas","valor_desconto","valor_impostos","valor_total","observacoes",
];

export default function HistoricoNotas() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [client, setClient] = useState(null);
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [dateFilter, setDateFilter] = useState({ preset: "mes_atual", range: getDateRange("mes_atual") });

  // Lê filtro de status da URL (ex: ?status=transmitida)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const s = params.get("status");
    if (s) setFiltroStatus(s);
  }, [location.search]);

  useEffect(() => {
    try {
      const c = localStorage.getItem("emissor_current_client");
      if (!c) { navigate("/emissor/painel"); return; }
      const parsed = JSON.parse(c);
      setClient(parsed);
      carregar(parsed.id);
    } catch { navigate("/emissor/painel"); }
  }, []);

  const carregar = async (id) => {
    setLoading(true);
    const data = await base44.entities.NotaFiscal55.filter({ empresa_id: id || client?.id });
    setNotas(data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    setLoading(false);
  };

  const handleCancelar = async (nota, e) => {
    e.stopPropagation();
    const justificativa = prompt("Informe a justificativa do cancelamento (mínimo 15 caracteres):");
    if (!justificativa || justificativa.trim().length < 15) {
      alert("Justificativa deve ter pelo menos 15 caracteres.");
      return;
    }
    try {
      const res = await base44.functions.invoke("cancelarNfe", {
        notaId: nota.id, empresaId: nota.empresa_id, justificativa: justificativa.trim(),
      });
      if (res.data?.error) { alert("Erro ao cancelar: " + res.data.error); return; }
      setNotas(prev => prev.map(n => n.id === nota.id ? { ...n, status_sefaz: "cancelada" } : n));
    } catch (err) {
      alert("Erro ao cancelar: " + (err?.response?.data?.error || err?.message));
    }
  };

  const handleClonar = async (nota, e) => {
    e.stopPropagation();
    // Copia apenas os campos pré-transmissão
    const dadosClone = {};
    CAMPOS_CLONE.forEach(k => { if (nota[k] !== undefined) dadosClone[k] = nota[k]; });
    dadosClone.status_sefaz = "rascunho";

    const novaNotaData = await base44.entities.NotaFiscal55.create(dadosClone);

    // Clona os itens da nota original
    const itens = await base44.entities.ItemNota.filter({ nota_id: nota.id });
    await Promise.all(itens.map(item => {
      const { id, created_date, updated_date, nota_id, ...resto } = item;
      return base44.entities.ItemNota.create({ ...resto, nota_id: novaNotaData.id });
    }));

    alert("Nota clonada com sucesso! Você será redirecionado para ela.");
    navigate(`/emissor/nota?id=${novaNotaData.id}`);
  };

  const handleExcluirRascunho = async (nota, e) => {
    e.stopPropagation();
    if (!confirm("Excluir este rascunho permanentemente?")) return;
    await base44.entities.NotaFiscal55.delete(nota.id);
    setNotas(prev => prev.filter(n => n.id !== nota.id));
  };

  const handleSincronizar = async (nota, e) => {
    e.stopPropagation();
    try {
      const res = await base44.functions.invoke("sincronizarNfe", {
        notaId: nota.id, empresaId: nota.empresa_id,
      });
      if (res.data?.error) { alert("Erro ao sincronizar: " + res.data.error); return; }
      await carregar(nota.empresa_id);
      alert("Nota sincronizada!");
    } catch (err) {
      alert("Erro ao sincronizar: " + (err?.response?.data?.error || err?.message));
    }
  };

  const handleCopiarChave = (nota, e) => {
    e.stopPropagation();
    if (nota.chave_acesso) {
      navigator.clipboard.writeText(nota.chave_acesso);
      alert("Chave de acesso copiada!");
    }
  };

  // Filtragem combinada: status + datas + busca
  const filtradas = useMemo(() => {
    return notas.filter(n => {
      if (filtroStatus !== "todos" && n.status_sefaz !== filtroStatus) return false;
      if (dateFilter.range) {
        const d = new Date(n.created_date);
        if (d < dateFilter.range.start || d > dateFilter.range.end) return false;
      }
      if (search) {
        const s = search.toLowerCase();
        return (
          n.destinatario_nome?.toLowerCase().includes(s) ||
          n.destinatario_cnpj?.includes(s) ||
          n.chave_acesso?.includes(s)
        );
      }
      return true;
    });
  }, [notas, filtroStatus, dateFilter, search]);

  const fmt = v => Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Histórico de Notas</h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{client?.razao_social} · {filtradas.length} nota(s)</p>
        </div>
        <Link to="/emissor/emitir"
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm"
          style={{ backgroundColor: "#0B63D4" }}>
          <Plus className="w-4 h-4" /> Nova NF-e
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-col sm:flex-row flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4] shadow-sm ${theme === 'dark' ? 'bg-white/10 border border-white/20 text-white' : 'bg-white border border-gray-200'}`}
            placeholder="Buscar destinatário, CNPJ ou chave..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className={`rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4] shadow-sm ${theme === 'dark' ? 'bg-white/10 border border-white/20 text-white' : 'bg-white border border-gray-200'}`}
          value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="todos">Todos os status</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
      </div>

      {/* Tabela */}
      <div className={`rounded-2xl shadow-sm overflow-hidden ${theme === 'dark' ? 'bg-white/5 border border-white/10 backdrop-blur-md' : 'bg-white border border-gray-100'}`}>
        {loading ? (
          <div className={`p-8 text-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>Carregando...</div>
        ) : filtradas.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">{notas.length === 0 ? "Nenhuma nota emitida." : "Nenhum resultado encontrado."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className={`border-b ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Destinatário</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Data</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/10' : 'divide-gray-50'}`}>
                {filtradas.map(nota => {
                  const cfg = STATUS[nota.status_sefaz] || STATUS.rascunho;
                  const Icon = cfg.Icon;
                  return (
                    <tr key={nota.id}
                      onClick={() => navigate(`/emissor/nota?id=${nota.id}`)}
                      className={`cursor-pointer transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-blue-50'}`}>
                      <td className="px-5 py-4">
                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{nota.destinatario_nome || "—"}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{nota.destinatario_cnpj || "—"}</p>
                      </td>
                      <td className={`px-4 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date(nota.created_date).toLocaleDateString("pt-BR")}
                      </td>
                      <td className={`px-4 py-4 text-right font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {nota.valor_total ? `R$ ${fmt(nota.valor_total)}` : "—"}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium w-fit ${cfg.cls}`}>
                          <Icon className="w-3 h-3" />{cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {nota.danfe_pdf_url ? (
                            <a href={nota.danfe_pdf_url} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors whitespace-nowrap">
                              <Download className="w-3.5 h-3.5" /> DANFE
                            </a>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-lg bg-gray-100 text-gray-400 whitespace-nowrap cursor-not-allowed">
                              <Download className="w-3.5 h-3.5" /> DANFE
                            </span>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => navigate(`/emissor/nota?id=${nota.id}`)}>
                                <Eye className="w-4 h-4 mr-2" /> Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.open(`/emissor/nota?id=${nota.id}`, "_blank")}>
                                <ExternalLink className="w-4 h-4 mr-2" /> Abrir outra aba
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e) => handleSincronizar(nota, e)}>
                                <RefreshCw className="w-4 h-4 mr-2" /> Sincronizar
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
                                disabled={nota.status_sefaz === "cancelada" || nota.status_sefaz === "rascunho"}
                                className="text-red-600 focus:text-red-600">
                                <Ban className="w-4 h-4 mr-2" /> Cancelar
                              </DropdownMenuItem>
                              {nota.status_sefaz === "rascunho" && (
                                <DropdownMenuItem
                                  onClick={(e) => handleExcluirRascunho(nota, e)}
                                  className="text-red-600 focus:text-red-600">
                                  <Trash2 className="w-4 h-4 mr-2" /> Excluir rascunho
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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