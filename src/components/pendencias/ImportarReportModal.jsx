import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Upload, Loader2, CheckCircle2, AlertTriangle, FileText } from "lucide-react";

export default function ImportarReportModal({ mesReferencia, onClose, onImportado }) {
  const [file, setFile] = useState(null);
  const [mesRef, setMesRef] = useState(mesReferencia || "");
  const [status, setStatus] = useState("idle"); // idle | uploading | extraindo | sucesso | erro
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const [dragging, setDragging] = useState(false);

  const handleFile = (f) => {
    if (f && f.type === "application/pdf") {
      setFile(f);
      setErro("");
    } else {
      setErro("Selecione um arquivo PDF válido.");
    }
  };

  const handleImportar = async () => {
    if (!file) { setErro("Selecione o PDF do relatório."); return; }
    if (!mesRef) { setErro("Informe o mês de referência."); return; }

    setStatus("uploading");
    setErro("");

    // Upload do PDF
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    setStatus("extraindo");

    // Chamar função de backend
    const res = await base44.functions.invoke("importarReportFiscal", {
      file_url,
      mes_referencia: mesRef,
    });

    if (res.data?.sucesso) {
      setResultado(res.data);
      setStatus("sucesso");
    } else {
      setErro(res.data?.error || "Erro ao processar o relatório.");
      setStatus("erro");
    }
  };

  const inp = {
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    padding: "8px 10px",
    fontSize: 13,
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#1B2A4A", borderRadius: "12px 12px 0 0" }}>
          <h2 style={{ margin: 0, color: "#fff", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <Upload size={16} /> Importar Report Fiscal (PDF)
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8eafd4", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {status === "sucesso" ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <CheckCircle2 size={48} style={{ color: "#1B7A3E", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 16, fontWeight: 700, color: "#1B2A4A", margin: "0 0 6px" }}>Importação Concluída!</p>
              <p style={{ fontSize: 13, color: "#555", margin: "0 0 4px" }}><strong>{resultado.empresa_nome}</strong></p>
              <p style={{ fontSize: 13, color: "#555", margin: "0 0 16px" }}>
                <strong>{resultado.total_importado}</strong> débitos importados para <strong>{resultado.mes_referencia}</strong>
              </p>
              <button onClick={() => { onImportado(); onClose(); }}
                style={{ background: "#1B2A4A", color: "#fff", border: "none", borderRadius: 6, padding: "10px 24px", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
                Ver Pendências
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: "#555" }}>
                Faça upload do <strong>Report Fiscal (PDF)</strong> gerado pelo sistema. A IA irá extrair automaticamente todas as pendências e cadastrá-las.
              </p>

              {/* Mês de referência */}
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#555", fontWeight: 600, marginBottom: 4, textTransform: "uppercase" }}>
                  Mês de Referência *
                </label>
                <input style={inp} value={mesRef} onChange={e => setMesRef(e.target.value)} placeholder="MM/AAAA" />
              </div>

              {/* Drop Zone PDF */}
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#555", fontWeight: 600, marginBottom: 4, textTransform: "uppercase" }}>
                  Arquivo PDF *
                </label>
                <label
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: 8, padding: 24, borderRadius: 8, cursor: "pointer",
                    border: `2px dashed ${dragging ? "#1B2A4A" : "#d1d5db"}`,
                    background: dragging ? "#f0f4fa" : "#fafafa",
                    transition: "all 0.2s",
                  }}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
                >
                  {file ? (
                    <>
                      <FileText size={28} style={{ color: "#1B2A4A" }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1B2A4A" }}>{file.name}</span>
                      <span style={{ fontSize: 11, color: "#888" }}>Clique para trocar</span>
                    </>
                  ) : (
                    <>
                      <Upload size={28} style={{ color: "#aaa" }} />
                      <span style={{ fontSize: 13, color: "#888" }}>Clique ou arraste o PDF do relatório aqui</span>
                    </>
                  )}
                  <input type="file" accept=".pdf" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
                </label>
              </div>

              {erro && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#C0392B", fontSize: 12, fontWeight: 600 }}>
                  <AlertTriangle size={14} /> {erro}
                </div>
              )}

              {/* Status de progresso */}
              {(status === "uploading" || status === "extraindo") && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#1B2A4A", fontSize: 13 }}>
                  <Loader2 size={16} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
                  {status === "uploading" ? "Enviando arquivo..." : "Extraindo dados com IA..."}
                </div>
              )}

              {/* Botões */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={onClose} disabled={status === "uploading" || status === "extraindo"}
                  style={{ border: "1px solid #d1d5db", background: "#fff", borderRadius: 6, padding: "8px 18px", cursor: "pointer", fontSize: 13 }}>
                  Cancelar
                </button>
                <button onClick={handleImportar}
                  disabled={!file || !mesRef || status === "uploading" || status === "extraindo"}
                  style={{ background: "#1B2A4A", color: "#fff", border: "none", borderRadius: 6, padding: "8px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, opacity: (!file || !mesRef) ? 0.5 : 1 }}>
                  {(status === "uploading" || status === "extraindo")
                    ? <><Loader2 size={14} /> Processando...</>
                    : <><Upload size={14} /> Importar</>
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}