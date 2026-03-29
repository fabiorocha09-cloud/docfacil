import { jsPDF } from "jspdf";

const fmt = (v) => Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

export function gerarDanfePrevia({ nota, itens, empresa }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const margin = 8;
  let y = 8;

  const rect = (x, yy, w, h) => doc.rect(x, yy, w, h);
  const line = (x1, yy1, x2, yy2) => doc.line(x1, yy1, x2, yy2);
  const text = (t, x, yy, opts = {}) => doc.text(String(t || ""), x, yy, opts);
  const setFont = (size, style = "normal") => {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
  };

  // ===== MARCA D'ÁGUA =====
  doc.setTextColor(220, 50, 50);
  setFont(38, "bold");
  doc.setGState(doc.GState({ opacity: 0.12 }));
  text("PRÉVIA - SEM VALOR FISCAL", W / 2, 148, { align: "center", angle: 45 });
  doc.setGState(doc.GState({ opacity: 1 }));
  doc.setTextColor(0, 0, 0);

  // ===== CABEÇALHO =====
  rect(margin, y, W - margin * 2, 28);
  // Logo / Emitente (esq)
  setFont(11, "bold");
  text(empresa?.razao_social || nota?.empresa_nome || "—", margin + 2, y + 7);
  setFont(7, "normal");
  text(`CNPJ: ${empresa?.cnpj || ""}`, margin + 2, y + 12);
  text(`${empresa?.logradouro || ""}, ${empresa?.numero || ""}`, margin + 2, y + 16);
  text(`${empresa?.municipio || ""} - ${empresa?.uf || ""}  CEP: ${empresa?.cep || ""}`, margin + 2, y + 20);
  text(`Tel: ${empresa?.telefone || ""}`, margin + 2, y + 24);

  // Centro - DANFE
  setFont(10, "bold");
  text("DANFE", W / 2, y + 8, { align: "center" });
  setFont(6, "normal");
  text("DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA", W / 2, y + 12, { align: "center" });
  setFont(7, "bold");
  doc.setTextColor(200, 0, 0);
  text("PRÉVIA - SEM VALOR FISCAL", W / 2, y + 17, { align: "center" });
  doc.setTextColor(0, 0, 0);

  // Direita - NF-e box
  const bx = W - margin - 45;
  rect(bx, y, 45, 28);
  setFont(7, "bold");
  text("NF-e", bx + 22, y + 5, { align: "center" });
  setFont(6, "normal");
  text("Nº: 000.000.000", bx + 22, y + 10, { align: "center" });
  text("SÉRIE: 1", bx + 22, y + 14, { align: "center" });
  text("0 - Entrada", bx + 22, y + 19, { align: "center" });
  text("1 - Saída", bx + 22, y + 23, { align: "center" });

  y += 28;

  // Natureza da operação + chave
  rect(margin, y, W - margin * 2, 10);
  line(margin + 80, y, margin + 80, y + 10);
  setFont(5, "normal");
  text("NATUREZA DA OPERAÇÃO", margin + 1, y + 3);
  setFont(7, "normal");
  text(nota?.natureza_operacao || "—", margin + 1, y + 8);
  setFont(5, "normal");
  text("CHAVE DE ACESSO", margin + 82, y + 3);
  setFont(6, "bold");
  text("** PRÉVIA - CHAVE AINDA NÃO GERADA **", margin + 82, y + 8);
  y += 10;

  // Protocolo / IE / CNPJ emitente
  rect(margin, y, W - margin * 2, 8);
  line(margin + 60, y, margin + 60, y + 8);
  line(margin + 110, y, margin + 110, y + 8);
  setFont(5, "normal");
  text("INSCRIÇÃO ESTADUAL", margin + 1, y + 3);
  text("INSCRIÇÃO ESTADUAL SUB. TRIBUTARIA", margin + 62, y + 3);
  text("CNPJ", margin + 112, y + 3);
  setFont(7, "normal");
  text(empresa?.ie || nota?.empresa_ie || "—", margin + 1, y + 7);
  text(empresa?.cnpj || "—", margin + 112, y + 7);
  y += 8;

  // ===== DESTINATÁRIO =====
  doc.setFillColor(230, 230, 230);
  doc.rect(margin, y, W - margin * 2, 5, "F");
  setFont(7, "bold");
  text("DESTINATÁRIO / REMETENTE", margin + 1, y + 4);
  y += 5;

  rect(margin, y, W - margin * 2, 8);
  line(margin + 110, y, margin + 110, y + 8);
  line(W - margin - 30, y, W - margin - 30, y + 8);
  setFont(5, "normal");
  text("NOME / RAZÃO SOCIAL", margin + 1, y + 2);
  text("CNPJ / CPF", margin + 112, y + 2);
  text("DATA DA EMISSÃO", W - margin - 29, y + 2);
  setFont(7, "normal");
  text(nota?.destinatario_nome || "—", margin + 1, y + 7);
  text(nota?.destinatario_cnpj || "—", margin + 112, y + 7);
  setFont(6, "normal");
  text(new Date().toLocaleDateString("pt-BR"), W - margin - 29, y + 7);
  y += 8;

  rect(margin, y, W - margin * 2, 8);
  line(W - margin - 50, y, W - margin - 50, y + 8);
  line(W - margin - 25, y, W - margin - 25, y + 8);
  setFont(5, "normal");
  text("ENDEREÇO", margin + 1, y + 2);
  text("BAIRRO / DISTRITO", W - margin - 49, y + 2);
  text("CEP", W - margin - 24, y + 2);
  setFont(7, "normal");
  text(
    `${nota?.dest_logradouro || ""} ${nota?.dest_numero || ""}`.trim() || "—",
    margin + 1, y + 7
  );
  text(nota?.dest_bairro || "—", W - margin - 49, y + 7);
  text(nota?.dest_cep || "—", W - margin - 24, y + 7);
  y += 8;

  rect(margin, y, W - margin * 2, 8);
  line(margin + 70, y, margin + 70, y + 8);
  line(W - margin - 40, y, W - margin - 40, y + 8);
  line(W - margin - 20, y, W - margin - 20, y + 8);
  setFont(5, "normal");
  text("MUNICÍPIO", margin + 1, y + 2);
  text("FONE/FAX", margin + 72, y + 2);
  text("UF", W - margin - 39, y + 2);
  text("INSCRIÇÃO ESTADUAL", W - margin - 19, y + 2);
  setFont(7, "normal");
  text(nota?.dest_municipio || "—", margin + 1, y + 7);
  text(nota?.dest_uf || "—", W - margin - 39, y + 7);
  y += 8;

  // ===== CÁLCULO DO IMPOSTO =====
  doc.setFillColor(230, 230, 230);
  doc.rect(margin, y, W - margin * 2, 5, "F");
  setFont(7, "bold");
  text("CÁLCULO DO IMPOSTO", margin + 1, y + 4);
  y += 5;

  const impostoLabels = [
    ["BASE DE CÁLCULO DO ICMS", "0,00"],
    ["VALOR DO ICMS", "0,00"],
    ["BASE DE CÁLCULO ICMS ST", "0,00"],
    ["VALOR DO ICMS ST", "0,00"],
    ["VALOR TOTAL DOS PRODUTOS", fmt(nota?.valor_produtos)],
    ["VALOR DO FRETE", "0,00"],
    ["VALOR DO SEGURO", "0,00"],
    ["DESCONTO", "0,00"],
    ["OUTRAS DESPESAS", "0,00"],
    ["VALOR DO IPI", "0,00"],
    ["VALOR APROX. TRIBUTOS", "0,00"],
    ["VALOR TOTAL DA NOTA", fmt(nota?.valor_total)],
  ];

  const colW = (W - margin * 2) / 6;
  rect(margin, y, W - margin * 2, 16);
  for (let i = 0; i < 6; i++) {
    if (i > 0) line(margin + colW * i, y, margin + colW * i, y + 16);
    const [label, val] = impostoLabels[i];
    setFont(4.5, "normal");
    text(label, margin + colW * i + 1, y + 4);
    setFont(7, "bold");
    text(val, margin + colW * i + 1, y + 12);
  }
  y += 8;
  for (let i = 0; i < 6; i++) {
    const [label, val] = impostoLabels[i + 6];
    setFont(4.5, "normal");
    text(label, margin + colW * i + 1, y + 4);
    setFont(7, "bold");
    text(val, margin + colW * i + 1, y + 12);
  }
  y += 8;

  // ===== PRODUTOS =====
  doc.setFillColor(230, 230, 230);
  doc.rect(margin, y, W - margin * 2, 5, "F");
  setFont(7, "bold");
  text("DADOS DOS PRODUTOS / SERVIÇOS", margin + 1, y + 4);
  y += 5;

  // Cabeçalho tabela
  const cols = [8, 55, 18, 12, 12, 12, 18, 18, 21];
  const headers = ["CÓD.", "DESCRIÇÃO", "NCM", "CSOSN", "CFOP", "UNID.", "QTDE.", "VL. UNIT.", "VL. TOTAL"];
  let cx = margin;
  rect(margin, y, W - margin * 2, 7);
  for (let i = 0; i < cols.length; i++) {
    if (i > 0) line(cx, y, cx, y + 7);
    setFont(4.5, "bold");
    text(headers[i], cx + 1, y + 4);
    cx += cols[i];
  }
  y += 7;

  // Linhas de produtos
  itens.forEach((item, idx) => {
    rect(margin, y, W - margin * 2, 7);
    cx = margin;
    const cells = [
      String(idx + 1),
      (item.descricao || "").substring(0, 28),
      item.ncm || "—",
      item.icms_csosn || "—",
      item.cfop || "—",
      item.unidade || "UN",
      fmt(item.quantidade),
      fmt(item.valor_unitario),
      fmt(item.valor_total),
    ];
    for (let i = 0; i < cols.length; i++) {
      if (i > 0) line(cx, y, cx, y + 7);
      setFont(5.5, "normal");
      text(cells[i], cx + 1, y + 5);
      cx += cols[i];
    }
    y += 7;
  });

  // ===== DADOS ADICIONAIS =====
  y += 3;
  doc.setFillColor(230, 230, 230);
  doc.rect(margin, y, W - margin * 2, 5, "F");
  setFont(7, "bold");
  text("DADOS ADICIONAIS", margin + 1, y + 4);
  y += 5;

  rect(margin, y, W - margin * 2, 20);
  line(margin + 100, y, margin + 100, y + 20);
  setFont(5, "normal");
  text("INFORMAÇÕES COMPLEMENTARES", margin + 1, y + 3);
  text("RESERVADO AO FISCO", margin + 102, y + 3);
  setFont(6, "normal");
  const infos = [];
  infos.push('DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL');
  infos.push('NÃO GERA DIREITO A CRÉDITO FISCAL DE ICMS, ISS E IPI');
  if (nota?.observacoes) infos.push(nota.observacoes);
  infos.forEach((info, i) => {
    const lines = doc.splitTextToSize(info, 96);
    lines.forEach((l, j) => text(l, margin + 1, y + 8 + (i * 5) + j * 4));
  });

  y += 20;

  // ===== RODAPÉ =====
  y += 5;
  setFont(6, "bold");
  doc.setTextColor(200, 0, 0);
  text("*** PRÉVIA DA NF-e — DOCUMENTO SEM VALIDADE FISCAL ***", W / 2, y, { align: "center" });
  doc.setTextColor(0, 0, 0);
  setFont(5, "normal");
  text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, W / 2, y + 5, { align: "center" });

  doc.save(`previa-nfe-${nota?.destinatario_nome || "rascunho"}-${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.pdf`);
}