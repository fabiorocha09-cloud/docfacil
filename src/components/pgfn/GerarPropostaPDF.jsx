import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmtCNPJ = (cnpj) => cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');

export default function GerarPropostaPDF({ resultado, desconto }) {
  const [gerando, setGerando] = useState(false);

  const valorComDesconto = resultado.valor_divida_total * (1 - desconto / 100);
  const economia = resultado.valor_divida_total - valorComDesconto;
  const dataConsulta = new Date().toLocaleDateString("pt-BR");

  const gerar = () => {
    setGerando(true);

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210;
    const margem = 18;
    const largura = W - margem * 2;
    let y = 0;

    // ── Cabeçalho azul escuro ──────────────────────────────────────
    doc.setFillColor(17, 38, 74);
    doc.rect(0, 0, W, 38, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("PROPOSTA DE REGULARIZAÇÃO FISCAL", margem, 16);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 177, 212);
    doc.text("Dívida Ativa da União — PGFN · Consultado via SERPRO", margem, 24);
    doc.text(`Data da Consulta: ${dataConsulta}`, margem, 30);

    // Logo texto direita
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(94, 155, 255);
    doc.text("Scala Contabilidade", W - margem, 20, { align: "right" });

    y = 48;

    // ── Dados da empresa ──────────────────────────────────────────
    doc.setFillColor(241, 245, 255);
    doc.roundedRect(margem, y, largura, 28, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(17, 38, 74);
    doc.text(resultado.empresa_nome || "Empresa não identificada", margem + 5, y + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 100, 140);
    doc.text(`CNPJ: ${fmtCNPJ(resultado.cnpj)}`, margem + 5, y + 18);
    doc.text(`Situação PGFN: DEVEDOR — Inscrito na Dívida Ativa da União`, margem + 5, y + 24);

    y += 36;

    // ── Título seção ──────────────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(17, 38, 74);
    doc.text("RESUMO DA DÍVIDA E PROPOSTA DE NEGOCIAÇÃO", margem, y);

    y += 6;
    doc.setDrawColor(11, 95, 255);
    doc.setLineWidth(0.5);
    doc.line(margem, y, margem + largura, y);

    y += 8;

    // ── 3 cards de valores ────────────────────────────────────────
    const cardW = (largura - 8) / 3;

    // Card 1 — Dívida original (vermelho)
    doc.setFillColor(255, 240, 240);
    doc.roundedRect(margem, y, cardW, 26, 3, 3, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(150, 50, 50);
    doc.text("DÍVIDA ORIGINAL", margem + cardW / 2, y + 8, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(200, 30, 30);
    doc.text(fmt(resultado.valor_divida_total), margem + cardW / 2, y + 18, { align: "center" });

    // Card 2 — Valor com desconto (verde)
    const x2 = margem + cardW + 4;
    doc.setFillColor(235, 255, 243);
    doc.roundedRect(x2, y, cardW, 26, 3, 3, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(20, 100, 60);
    doc.text(`VALOR COM ${desconto}% DESCONTO`, x2 + cardW / 2, y + 8, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(20, 140, 80);
    doc.text(fmt(valorComDesconto), x2 + cardW / 2, y + 18, { align: "center" });

    // Card 3 — Economia (azul)
    const x3 = margem + cardW * 2 + 8;
    doc.setFillColor(235, 243, 255);
    doc.roundedRect(x3, y, cardW, 26, 3, 3, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(20, 60, 140);
    doc.text("ECONOMIA GERADA", x3 + cardW / 2, y + 8, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(11, 95, 255);
    doc.text(fmt(economia), x3 + cardW / 2, y + 18, { align: "center" });

    y += 34;

    // ── Texto da proposta ─────────────────────────────────────────
    doc.setFillColor(248, 250, 255);
    doc.roundedRect(margem, y, largura, 54, 3, 3, "F");
    doc.setDrawColor(200, 215, 255);
    doc.setLineWidth(0.3);
    doc.roundedRect(margem, y, largura, 54, 3, 3, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(17, 38, 74);
    doc.text("Resumo da Proposta", margem + 5, y + 9);

    const textoP1 = `A empresa ${resultado.empresa_nome} (CNPJ: ${fmtCNPJ(resultado.cnpj)}) possui dívida inscrita`;
    const textoP2 = `na Dívida Ativa da União (PGFN) no valor total de ${fmt(resultado.valor_divida_total)}.`;
    const textoP3 = `Através dos programas de regularização disponibilizados pela PGFN — como o REGULARIZE —`;
    const textoP4 = `é possível negociar essa dívida com até ${desconto}% de desconto, resultando em um pagamento`;
    const textoP5 = `de apenas ${fmt(valorComDesconto)}, gerando uma economia de ${fmt(economia)}.`;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(60, 80, 120);
    doc.text(textoP1, margem + 5, y + 18);
    doc.text(textoP2, margem + 5, y + 25);
    doc.text(textoP3, margem + 5, y + 33);
    doc.text(textoP4, margem + 5, y + 40);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 38, 74);
    doc.text(textoP5, margem + 5, y + 47);

    y += 62;

    // ── Próximos passos ───────────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(17, 38, 74);
    doc.text("COMO REGULARIZAR", margem, y);

    y += 6;
    doc.setDrawColor(11, 95, 255);
    doc.setLineWidth(0.5);
    doc.line(margem, y, margem + largura, y);
    y += 8;

    const passos = [
      ["1.", "Acesse o portal REGULARIZE: www.regularize.pgfn.gov.br"],
      ["2.", "Informe o CPF/CNPJ do devedor e identifique as inscrições ativas."],
      ["3.", "Escolha a modalidade de negociação disponível (parcelamento, desconto, transação)."],
      ["4.", "Emita o boleto e regularize a situação fiscal da empresa."],
    ];

    passos.forEach(([num, texto]) => {
      doc.setFillColor(11, 95, 255);
      doc.circle(margem + 3, y + 2, 3, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(num, margem + 3, y + 3.5, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(50, 70, 110);
      doc.text(texto, margem + 9, y + 3.5);
      y += 9;
    });

    y += 6;

    // ── Aviso legal ───────────────────────────────────────────────
    doc.setFillColor(255, 248, 235);
    doc.roundedRect(margem, y, largura, 18, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(160, 100, 10);
    doc.text("⚠  AVISO:", margem + 5, y + 7);
    doc.setFont("helvetica", "normal");
    doc.text("Os valores apresentados são baseados na consulta à Lista de Devedores da PGFN via SERPRO e podem variar", margem + 5, y + 13);
    doc.text("com acréscimo de juros, multas e encargos legais. Consulte sempre o portal oficial da PGFN para valores atualizados.", margem + 5, y + 18);

    // ── Rodapé ────────────────────────────────────────────────────
    doc.setFillColor(17, 38, 74);
    doc.rect(0, 280, W, 17, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(160, 177, 212);
    doc.text("Scala Contabilidade · Proposta gerada automaticamente via Sistema Interno", W / 2, 287, { align: "center" });
    doc.text(`Gerado em ${dataConsulta} · Dados: PGFN / SERPRO`, W / 2, 292, { align: "center" });

    const nomeArquivo = `Proposta_PGFN_${resultado.cnpj}_${desconto}pct.pdf`;
    doc.save(nomeArquivo);
    setGerando(false);
  };

  return (
    <button
      onClick={gerar}
      disabled={gerando}
      className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl disabled:opacity-50"
      style={{ background: "linear-gradient(135deg,#0B5FFF,#1A3FA0)", color: "#fff" }}>
      {gerando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
      {gerando ? "Gerando PDF..." : "Baixar Proposta PDF"}
    </button>
  );
}