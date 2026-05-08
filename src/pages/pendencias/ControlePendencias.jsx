import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, FileText, History, LayoutDashboard } from "lucide-react";
import TabelaDebitos from "@/components/pendencias/TabelaDebitos";
import NovoDebitoModal from "@/components/pendencias/NovoDebitoModal";
import ResumoCards from "@/components/pendencias/ResumoCards";
import FiltrosDebitos from "@/components/pendencias/FiltrosDebitos";
import GerarRelatorioModal from "@/components/pendencias/GerarRelatorioModal";
import HistoricoDebitos from "@/components/pendencias/HistoricoDebitos";
import ImportarReportModal from "@/components/pendencias/ImportarReportModal";
import EditarDebitoModal from "@/components/pendencias/EditarDebitoModal";
import MesReferenciaSelector from "@/components/pendencias/MesReferenciaSelector";

const EMPRESA_PADRAO = "QUERUBIM VET 24 HORAS LTDA";
const CNPJ_PADRAO = "26.391.272/0001-53";
const MES_ATUAL = "04/2026";

export default function ControlePendencias() {
  const [debitos, setDebitos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [empresaSelecionada, setEmpresaSelecionada] = useState(EMPRESA_PADRAO);
  const [mesReferencia, setMesReferencia] = useState(MES_ATUAL);
  const [empresas, setEmpresas] = useState([]);
  const [novoDebitoOpen, setNovoDebitoOpen] = useState(false);
  const [relatorioOpen, setRelatorioOpen] = useState(false);
  const [importarOpen, setImportarOpen] = useState(false);
  const [editarDebito, setEditarDebito] = useState(null);
  const [rolandoMes, setRolandoMes] = useState(false);
  const [aba, setAba] = useState("dashboard");
  const [filtros, setFiltros] = useState({ status: "todos", tributo: "todos" });

  const carregar = async () => {
    setLoading(true);
    const todos = await base44.entities.DebitoFiscal.list("-created_date", 2000);
    setDebitos(todos);
    const nomes = [...new Set(todos.map(d => d.empresa_nome).filter(Boolean))];
    setEmpresas(nomes);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const debitosFiltrados = useMemo(() => {
    return debitos.filter(d => {
      if (d.empresa_nome !== empresaSelecionada) return false;
      if (d.mes_referencia !== mesReferencia) return false;
      if (filtros.status !== "todos" && d.status !== filtros.status) return false;
      if (filtros.tributo !== "todos" && d.tributo !== filtros.tributo) return false;
      return true;
    });
  }, [debitos, empresaSelecionada, mesReferencia, filtros]);

  const debitosPagos = useMemo(() => {
    return debitos.filter(d => d.empresa_nome === empresaSelecionada && d.status === "Pago");
  }, [debitos, empresaSelecionada]);

  const tributosDisponiveis = useMemo(() => {
    return [...new Set(debitosFiltrados.map(d => d.tributo))];
  }, [debitosFiltrados]);

  const cnpjEmpresa = useMemo(() => {
    const d = debitos.find(x => x.empresa_nome === empresaSelecionada);
    return d?.empresa_cnpj || "";
  }, [debitos, empresaSelecionada]);

  const handlePagarDebito = async (id) => {
    await base44.entities.DebitoFiscal.update(id, {
      status: "Pago",
      data_pagamento: new Date().toISOString().slice(0, 10),
    });
    carregar();
  };

  const handleDesfazerPagamento = async (id) => {
    await base44.entities.DebitoFiscal.update(id, {
      status: "Em aberto",
      data_pagamento: null,
    });
    carregar();
  };

  const handleAlterarStatus = async (id, status) => {
    const update = { status };
    if (status === "Pago") update.data_pagamento = new Date().toISOString().slice(0, 10);
    if (status !== "Pago") update.data_pagamento = null;
    await base44.entities.DebitoFiscal.update(id, update);
    carregar();
  };

  const handleDeletar = async (id) => {
    if (!confirm("Remover este débito?")) return;
    await base44.entities.DebitoFiscal.delete(id);
    carregar();
  };

  const handleRolarMes = async () => {
    if (!confirm(`Rolar débitos não pagos de ${mesReferencia} para o próximo mês?`)) return;
    setRolandoMes(true);
    const res = await base44.functions.invoke("rolarDebitosMes", { mes_origem: mesReferencia });
    setRolandoMes(false);
    alert(res.data?.sucesso ? `✅ ${res.data.rolados} débito(s) rolados para ${res.data.mesAtual}.` : `Erro: ${res.data?.error}`);
    carregar();
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", background: "#f5f6fa", minHeight: "100vh" }}>
      {/* Cabeçalho */}
      <div style={{ background: "#1B2A4A", color: "#fff", padding: "16px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "#8eafd4", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
              COM VOCÊ SCALA LTDA
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Controle de Pendências Fiscais</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setImportarOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#16a085", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              <FileText size={15} /> Importar Report
            </button>
            <button
              onClick={() => setRelatorioOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#C0392B", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              <FileText size={15} /> Gerar Relatório
            </button>
            <button
              onClick={handleRolarMes}
              disabled={rolandoMes}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#8e44ad", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13, opacity: rolandoMes ? 0.6 : 1 }}>
              {rolandoMes ? "Rolando..." : "↻ Rolar Mês"}
            </button>
            <button
              onClick={() => setNovoDebitoOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#2980b9", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              <Plus size={15} /> Novo Débito
            </button>
          </div>
        </div>

        {/* Seletores */}
        <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "#8eafd4", marginBottom: 4 }}>EMPRESA CLIENTE</label>
            <select
              value={empresaSelecionada}
              onChange={e => setEmpresaSelecionada(e.target.value)}
              style={{ background: "#243558", color: "#fff", border: "1px solid #3a5075", borderRadius: 6, padding: "7px 12px", fontSize: 13, minWidth: 280 }}>
              {empresas.map(e => <option key={e} value={e}>{e}</option>)}
              {!empresas.includes(EMPRESA_PADRAO) && (
                <option value={EMPRESA_PADRAO}>{EMPRESA_PADRAO}</option>
              )}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "#8eafd4", marginBottom: 4 }}>MÊS DE REFERÊNCIA</label>
            <MesReferenciaSelector value={mesReferencia} onChange={setMesReferencia} dark={true} />
          </div>
        </div>

        {/* Abas */}
        <div style={{ display: "flex", gap: 4, marginTop: 16 }}>
          {[
            { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { key: "historico", label: "Histórico de Pagamentos", icon: History },

          ].map(({ key, label, icon: TabIcon }) => (
            <button key={key} onClick={() => setAba(key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: aba === key ? "#fff" : "transparent",
                color: aba === key ? "#1B2A4A" : "#8eafd4",
                border: "none", borderRadius: "6px 6px 0 0",
                padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13,
              }}>
              <TabIcon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{ padding: "24px 32px" }}>
        {aba === "dashboard" && (
          <>
            <ResumoCards debitos={debitosFiltrados} />
            <FiltrosDebitos
              filtros={filtros}
              onChange={setFiltros}
              tributosDisponiveis={tributosDisponiveis}
            />
            {loading ? (
              <div style={{ textAlign: "center", padding: 40, color: "#888" }}>Carregando...</div>
            ) : (
              <TabelaDebitos
                debitos={debitosFiltrados}
                onPagar={handlePagarDebito}
                onDesfazer={handleDesfazerPagamento}
                onAlterarStatus={handleAlterarStatus}
                onDeletar={handleDeletar}
                onEditar={setEditarDebito}
              />
            )}
          </>
        )}

        {aba === "historico" && (
          <HistoricoDebitos debitos={debitosPagos} />
        )}
      </div>

      {novoDebitoOpen && (
        <NovoDebitoModal
          empresaNome={empresaSelecionada}
          empresaCnpj={cnpjEmpresa}
          mesReferencia={mesReferencia}
          onClose={() => setNovoDebitoOpen(false)}
          onSalvo={() => { setNovoDebitoOpen(false); carregar(); }}
        />
      )}

      {importarOpen && (
        <ImportarReportModal
          mesReferencia={mesReferencia}
          onClose={() => setImportarOpen(false)}
          onImportado={() => { setImportarOpen(false); carregar(); }}
        />
      )}

      {editarDebito && (
        <EditarDebitoModal
          debito={editarDebito}
          onClose={() => setEditarDebito(null)}
          onSalvo={() => { setEditarDebito(null); carregar(); }}
        />
      )}

      {relatorioOpen && (
        <GerarRelatorioModal
          debitos={debitosFiltrados}
          empresaNome={empresaSelecionada}
          empresaCnpj={cnpjEmpresa}
          mesReferencia={mesReferencia}
          onClose={() => setRelatorioOpen(false)}
        />
      )}
    </div>
  );
}