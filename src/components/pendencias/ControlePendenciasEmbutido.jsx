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

const MES_ATUAL = new Date().toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" }).replace("/", "/");

export default function ControlePendenciasEmbutido({ empresaNome, empresaCnpj }) {
  const [debitos, setDebitos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mesReferencia, setMesReferencia] = useState(MES_ATUAL);
  const [novoDebitoOpen, setNovoDebitoOpen] = useState(false);
  const [relatorioOpen, setRelatorioOpen] = useState(false);
  const [importarOpen, setImportarOpen] = useState(false);
  const [aba, setAba] = useState("dashboard");
  const [filtros, setFiltros] = useState({ status: "todos", tributo: "todos" });

  const carregar = async () => {
    setLoading(true);
    const todos = await base44.entities.DebitoFiscal.list("-created_date", 2000);
    setDebitos(todos);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const debitosFiltrados = useMemo(() => {
    return debitos.filter(d => {
      if (d.empresa_nome !== empresaNome) return false;
      if (d.mes_referencia !== mesReferencia) return false;
      if (filtros.status !== "todos" && d.status !== filtros.status) return false;
      if (filtros.tributo !== "todos" && d.tributo !== filtros.tributo) return false;
      return true;
    });
  }, [debitos, empresaNome, mesReferencia, filtros]);

  const debitosPagos = useMemo(() => {
    return debitos.filter(d => d.empresa_nome === empresaNome && d.status === "Pago");
  }, [debitos, empresaNome]);

  const tributosDisponiveis = useMemo(() => {
    return [...new Set(debitosFiltrados.map(d => d.tributo))];
  }, [debitosFiltrados]);

  const handlePagarDebito = async (id) => {
    await base44.entities.DebitoFiscal.update(id, { status: "Pago", data_pagamento: new Date().toISOString().slice(0, 10) });
    carregar();
  };

  const handleDesfazerPagamento = async (id) => {
    await base44.entities.DebitoFiscal.update(id, { status: "Em aberto", data_pagamento: null });
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

  return (
    <div style={{ fontFamily: "Arial, sans-serif", background: "#f5f6fa", borderRadius: 12, overflow: "hidden" }}>
      {/* Mini cabeçalho */}
      <div style={{ background: "#1B2A4A", color: "#fff", padding: "14px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 10, color: "#8eafd4", marginBottom: 3 }}>MÊS DE REFERÊNCIA</label>
              <input
                type="text"
                value={mesReferencia}
                onChange={e => setMesReferencia(e.target.value)}
                placeholder="MM/AAAA"
                style={{ background: "#243558", color: "#fff", border: "1px solid #3a5075", borderRadius: 6, padding: "5px 10px", fontSize: 13, width: 100 }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setImportarOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#16a085", color: "#fff", border: "none", borderRadius: 6, padding: "7px 13px", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
              <FileText size={13} /> Importar Report
            </button>
            <button onClick={() => setRelatorioOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#C0392B", color: "#fff", border: "none", borderRadius: 6, padding: "7px 13px", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
              <FileText size={13} /> Gerar Relatório
            </button>
            <button onClick={() => setNovoDebitoOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#2980b9", color: "#fff", border: "none", borderRadius: 6, padding: "7px 13px", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
              <Plus size={13} /> Novo Débito
            </button>
          </div>
        </div>

        {/* Abas */}
        <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
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
                padding: "7px 14px", cursor: "pointer", fontWeight: 600, fontSize: 12,
              }}>
              <TabIcon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{ padding: "20px" }}>
        {aba === "dashboard" && (
          <>
            <ResumoCards debitos={debitosFiltrados} />
            <FiltrosDebitos filtros={filtros} onChange={setFiltros} tributosDisponiveis={tributosDisponiveis} />
            {loading ? (
              <div style={{ textAlign: "center", padding: 40, color: "#888" }}>Carregando...</div>
            ) : (
              <TabelaDebitos
                debitos={debitosFiltrados}
                onPagar={handlePagarDebito}
                onDesfazer={handleDesfazerPagamento}
                onAlterarStatus={handleAlterarStatus}
                onDeletar={handleDeletar}
              />
            )}
          </>
        )}
        {aba === "historico" && <HistoricoDebitos debitos={debitosPagos} />}
      </div>

      {novoDebitoOpen && (
        <NovoDebitoModal
          empresaNome={empresaNome}
          empresaCnpj={empresaCnpj}
          mesReferencia={mesReferencia}
          onClose={() => setNovoDebitoOpen(false)}
          onSalvo={() => { setNovoDebitoOpen(false); carregar(); }}
        />
      )}
      {relatorioOpen && (
        <GerarRelatorioModal
          debitos={debitosFiltrados}
          empresaNome={empresaNome}
          empresaCnpj={empresaCnpj}
          mesReferencia={mesReferencia}
          onClose={() => setRelatorioOpen(false)}
        />
      )}
      {importarOpen && (
        <ImportarReportModal
          mesReferencia={mesReferencia}
          onClose={() => setImportarOpen(false)}
          onImportado={() => { setImportarOpen(false); carregar(); }}
        />
      )}
    </div>
  );
}