import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import EditarItemModal from "@/components/emissor/EditarItemModal";
import {
  ArrowLeft, Download, Copy, FileEdit, Ban, Mail, FileText,
  CheckCircle2, XCircle, Clock, Send, AlertTriangle, Loader2,
  Package, User, Settings2, ChevronDown, ChevronUp, Printer, RotateCcw, Edit, Trash2, Plus,
  Search, Calculator, Layers
} from "lucide-react";
import { gerarDanfePrevia } from "@/components/emissor/DanfePdfPreview";
import { motion } from "framer-motion";

const FORMAS_PAGAMENTO = [
  "Dinheiro","Cheque","Cartão de Crédito","Cartão de Débito","Crédito Loja",
  "Vale Alimentação","Vale Refeição","Vale Presente","Vale Combustível",
  "Duplicata Mercantil","Boleto Bancário","Depósito Bancário",
  "Pagamento Instantâneo (PIX)","Transferência Bancária","Sem Pagamento","Outros",
];
const PAGAMENTO_CODIGO = {
  "Dinheiro": "01", "Cheque": "02", "Cartão de Crédito": "03", "Cartão de Débito": "04",
  "Crédito Loja": "05", "Vale Alimentação": "10", "Vale Refeição": "11",
  "Vale Presente": "12", "Vale Combustível": "13", "Duplicata Mercantil": "14",
  "Boleto Bancário": "15", "Depósito Bancário": "16",
  "Pagamento Instantâneo (PIX)": "17", "Transferência Bancária": "18",
  "Sem Pagamento": "90", "Outros": "99",
};

const STATUS_CFG = {
  rascunho:    { label: "Rascunho",    cls: "bg-gray-100 text-gray-600" },
  validada:    { label: "Validada",    cls: "bg-blue-100 text-blue-700" },
  transmitindo:{ label: "Transmitindo",cls: "bg-amber-100 text-amber-700" },
  transmitida: { label: "Autorizada",  cls: "bg-emerald-100 text-emerald-700" },
  rejeitada:   { label: "Rejeitada",   cls: "bg-red-100 text-red-700" },
  cancelada:   { label: "Cancelada",   cls: "bg-gray-200 text-gray-500" },
};

const fmt = v => Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

function ActionBtn({ icon: Icon, label, onClick, danger, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-40
        ${danger ? "text-red-600 hover:bg-red-50" : "text-gray-600 hover:bg-gray-100"}`}>
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold text-gray-400 sm:w-48 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value}</span>
    </div>
  );
}

export default function DetalhesNota() {
  const navigate = useNavigate();
  const [nota, setNota] = useState(null);
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState("cliente");
  const [errosOpen, setErrosOpen] = useState(true);
  const [cancelando, setCancelando] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [empresa, setEmpresa] = useState(null);
  const [editando, setEditando] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [destinatarios, setDestinatarios] = useState([]);
  const [naturezas, setNaturezas] = useState([]);
  const [regras, setRegras] = useState([]);
  const [searchDest, setSearchDest] = useState("");

  const params = new URLSearchParams(window.location.search);
  const notaId = params.get("id");

  // Carrega empresa ao montar
  useEffect(() => {
    try {
      const c = localStorage.getItem("emissor_current_client");
      if (c) setEmpresa(JSON.parse(c));
    } catch { }
  }, []);

  // Carrega a nota quando notaId muda
  useEffect(() => {
    if (notaId) carregar();
  }, [notaId]);

  // Calcula totais dinamicamente baseado nos itens
  const totais = useMemo(() => {
    const produtos = itens.reduce((s, i) => s + Number(i.valor_total || 0), 0);
    const icms = itens.reduce((s, i) => s + Number(i.valor_icms || 0), 0);
    const pis = itens.reduce((s, i) => s + Number(i.valor_pis || 0), 0);
    const cofins = itens.reduce((s, i) => s + Number(i.valor_cofins || 0), 0);
    const impostos = icms + pis + cofins;
    const total = produtos + Number(nota?.valor_frete || 0) + Number(nota?.valor_seguro || 0) + 
                  Number(nota?.outras_despesas || 0) - Number(nota?.valor_desconto || 0);
    return { produtos, impostos, icms, pis, cofins, total };
  }, [itens, nota?.valor_frete, nota?.valor_seguro, nota?.outras_despesas, nota?.valor_desconto]);

  // Sincroniza totais calculados com a nota
  useEffect(() => {
    if (nota) {
      setNota(n => ({
        ...n,
        valor_produtos: totais.produtos,
        valor_impostos: totais.impostos,
        valor_total: totais.total
      }));
    }
  }, [totais]);

  useEffect(() => {
    if (!empresa?.id) return;
    Promise.all([
      base44.entities.Destinatario.filter({ empresa_id: empresa.id }),
      base44.entities.NaturezaTributaria.filter({ empresa_id: empresa.id }),
      base44.entities.RegraTributacao.filter({ empresa_id: empresa.id }),
    ]).then(([dests, nats, regs]) => {
      setDestinatarios(dests);
      setNaturezas(nats);
      setRegras(regs.filter(r => r.ativo !== false));
    });
  }, [empresa?.id]);

  const carregar = async () => {
    setLoading(true);
    const [notas, items] = await Promise.all([
      base44.entities.NotaFiscal55.filter({ id: notaId }),
      base44.entities.ItemNota.filter({ nota_id: notaId }),
    ]);
    if (notas.length > 0) setNota(notas[0]);
    setItens(items);
    setLoading(false);
  };

  const handleCancelar = async () => {
    const justificativa = prompt("Informe a justificativa do cancelamento (mínimo 15 caracteres):");
    if (!justificativa || justificativa.trim().length < 15) {
      alert("Justificativa deve ter pelo menos 15 caracteres.");
      return;
    }
    setCancelando(true);
    try {
      const res = await base44.functions.invoke('cancelarNfe', {
        notaId: nota.id,
        empresaId: nota.empresa_id,
        justificativa: justificativa.trim(),
      });
      if (res.data?.error) {
        alert('Erro ao cancelar: ' + res.data.error);
      }
    } catch (err) {
      alert('Erro ao cancelar: ' + (err?.response?.data?.error || err?.message));
    } finally {
      setCancelando(false);
      await carregar();
    }
  };

  const handleReenviar = async () => {
    if (!nota) return;
    setReenviando(true);
    try {
      await base44.entities.NotaFiscal55.update(notaId, { status_sefaz: 'transmitindo', erros: [] });
      const res = await base44.functions.invoke('emitirNfe', {
        notaId: nota.id,
        empresaId: nota.empresa_id,
        ambiente: empresa?.nfe_ambiente || nota.empresa_id,
      });
      if (res.data?.error) {
        await base44.entities.NotaFiscal55.update(notaId, {
          status_sefaz: 'rejeitada',
          erros: [{ message: res.data.error, details: res.data.details }],
        });
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Erro desconhecido';
      await base44.entities.NotaFiscal55.update(notaId, {
        status_sefaz: 'rejeitada',
        erros: [{ message: msg }],
      });
    } finally {
      setReenviando(false);
      await carregar();
    }
  };

  const CAMPOS_CLONE = [
    "empresa_id","empresa_nome","natureza_operacao","destinatario_id","destinatario_nome",
    "destinatario_cnpj","destinatario_email","dest_logradouro","dest_numero","dest_complemento",
    "dest_bairro","dest_municipio","dest_uf","dest_cep","dest_codigo_municipio","dest_ie",
    "dest_indicador_ie","forma_pagamento","forma_pagamento_codigo","tipo_cliente",
    "regra_tributacao_id","regra_tributacao_nome","valor_produtos","valor_frete","valor_seguro",
    "outras_despesas","valor_desconto","valor_impostos","valor_total","observacoes",
  ];

  const handleClonar = async () => {
    if (!nota) return;
    const dadosClone = {};
    CAMPOS_CLONE.forEach(k => { if (nota[k] !== undefined) dadosClone[k] = nota[k]; });
    dadosClone.status_sefaz = "rascunho";

    const novaNotaData = await base44.entities.NotaFiscal55.create(dadosClone);

    await Promise.all(itens.map(item => {
      const { id, created_date, updated_date, nota_id, ...resto } = item;
      return base44.entities.ItemNota.create({ ...resto, nota_id: novaNotaData.id });
    }));

    alert("Nota clonada! Redirecionando para o rascunho.");
    navigate(`/emissor/nota?id=${novaNotaData.id}`);
  };

  const handleEnviarEmail = async () => {
    if (!nota?.destinatario_id) return;
    setEnviandoEmail(true);
    await new Promise(r => setTimeout(r, 1200));
    setEnviandoEmail(false);
    alert("E-mail enviado com sucesso!");
  };

  const handleSalvarNota = async () => {
    await base44.entities.NotaFiscal55.update(nota.id, nota);
    setEditando(false);
    alert("Nota salva!");
    await carregar();
  };

  const handleSalvarItem = async (dados) => {
    if (itemEditando?.id) {
      await base44.entities.ItemNota.update(itemEditando.id, dados);
    } else {
      await base44.entities.ItemNota.create({ ...dados, nota_id: nota.id, empresa_id: nota.empresa_id });
    }
    setItemModalOpen(false);
    setItemEditando(null);
    await carregar();
  };

  const handleExcluirItem = async (id) => {
    if (!confirm("Excluir este item?")) return;
    await base44.entities.ItemNota.delete(id);
    await carregar();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
    </div>
  );

  if (!nota) return (
    <div className="text-center py-16 text-gray-400 text-sm">Nota não encontrada.</div>
  );

  const cfg = STATUS_CFG[nota.status_sefaz] || STATUS_CFG.rascunho;
  const podeAgir = ["transmitida"].includes(nota.status_sefaz);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate("/emissor/historico")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 font-medium">
          <ArrowLeft className="w-4 h-4" /> Histórico
        </button>
        <div className="flex-1" />
        <span className="text-lg font-bold text-gray-900">
          NF-e {nota.numero ? `nº ${nota.numero}` : "(rascunho)"}
        </span>
        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${cfg.cls}`}>{cfg.label}</span>
      </div>

      {/* Barra de Ações */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
        <div className="flex items-center gap-1 flex-wrap">
          <ActionBtn
            icon={Printer}
            label="Prévia PDF"
            onClick={() => gerarDanfePrevia({ nota, itens, empresa })}
          />
          {nota.danfe_pdf_url && (
            <a href={nota.danfe_pdf_url} target="_blank" rel="noreferrer">
              <ActionBtn icon={Download} label="DANFE PDF" />
            </a>
          )}
          {nota.retorno_xml_url && (
            <a href={nota.retorno_xml_url} target="_blank" rel="noreferrer">
              <ActionBtn icon={FileText} label="XML" />
            </a>
          )}
          {nota.status_sefaz === 'rejeitada' && (
            <ActionBtn
              icon={reenviando ? Loader2 : RotateCcw}
              label={reenviando ? 'Reenviando...' : 'Reenviar'}
              onClick={handleReenviar}
              disabled={reenviando}
            />
          )}
          <ActionBtn icon={Copy} label="Clonar nota" onClick={handleClonar} />
          <ActionBtn icon={FileEdit} label="Carta de Correção" disabled={!podeAgir} />
          <ActionBtn icon={enviandoEmail ? Loader2 : Mail} label="Enviar e-mail"
            onClick={handleEnviarEmail} disabled={enviandoEmail} />
          {nota.status_sefaz === 'rascunho' && (
            <>
              {editando ? (
                <ActionBtn
                  icon={CheckCircle2}
                  label="Salvar"
                  onClick={handleSalvarNota}
                />
              ) : (
                <ActionBtn
                  icon={FileEdit}
                  label="Editar"
                  onClick={() => setEditando(true)}
                />
              )}
              {!editando && (
                <ActionBtn
                  icon={Send}
                  label="Transmitir"
                  onClick={async () => {
                    if (!empresa) return;
                    setReenviando(true);
                    try {
                      await base44.entities.NotaFiscal55.update(notaId, { status_sefaz: 'transmitindo', erros: [] });
                      const res = await base44.functions.invoke('emitirNfe', {
                        notaId: nota.id,
                        empresaId: nota.empresa_id,
                        ambiente: empresa?.nfe_ambiente,
                      });
                      if (res.data?.error) {
                        await base44.entities.NotaFiscal55.update(notaId, { status_sefaz: 'rejeitada', erros: [{ message: res.data.error }] });
                      }
                    } catch (err) {
                      const msg = err?.response?.data?.error || err?.message || 'Erro';
                      await base44.entities.NotaFiscal55.update(notaId, { status_sefaz: 'rejeitada', erros: [{ message: msg }] });
                    } finally {
                      setReenviando(false);
                      await carregar();
                    }
                  }}
                  disabled={reenviando}
                />
              )}
            </>
          )}
          <ActionBtn icon={Ban} label="Cancelar" danger
            onClick={handleCancelar} disabled={cancelando || !podeAgir} />
        </div>
      </div>

      {/* Retorno SEFAZ / Erros */}
      {(nota.protocolo || (nota.erros && nota.erros.length > 0) || nota.status_sefaz === "rejeitada") && (
        <div className={`rounded-2xl border shadow-sm overflow-hidden ${
          nota.status_sefaz === "transmitida" ? "border-emerald-200" :
          nota.status_sefaz === "rejeitada" ? "border-red-200" : "border-gray-200"
        }`}>
          <button onClick={() => setErrosOpen(v => !v)}
            className={`w-full flex items-center justify-between px-5 py-3 text-sm font-semibold ${
              nota.status_sefaz === "transmitida" ? "bg-emerald-50 text-emerald-800" :
              nota.status_sefaz === "rejeitada" ? "bg-red-50 text-red-800" : "bg-gray-50 text-gray-700"
            }`}>
            <span className="flex items-center gap-2">
              {nota.status_sefaz === "transmitida"
                ? <CheckCircle2 className="w-4 h-4" />
                : <AlertTriangle className="w-4 h-4" />}
              Retorno da SEFAZ
            </span>
            {errosOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {errosOpen && (
            <div className="bg-white px-5 py-4 space-y-2 text-sm">
              {nota.protocolo && (
                <div className="flex gap-2">
                  <span className="text-gray-400 font-medium w-32">Protocolo:</span>
                  <span className="font-mono text-gray-800">{nota.protocolo}</span>
                </div>
              )}
              {nota.chave_acesso && (
                <div className="flex gap-2">
                  <span className="text-gray-400 font-medium w-32">Chave de Acesso:</span>
                  <span className="font-mono text-xs text-gray-700 break-all">{nota.chave_acesso}</span>
                </div>
              )}
              {nota.erros && nota.erros.length > 0 && (
                <div>
                  <p className="font-semibold text-red-600 mb-2">Erros encontrados:</p>
                  {nota.erros.map((e, i) => (
                    <div key={i} className="bg-red-50 border border-red-100 rounded-xl p-3 mb-2">
                      <p className="text-xs text-red-700 font-mono">{typeof e === "string" ? e : JSON.stringify(e)}</p>
                    </div>
                  ))}
                </div>
              )}
              {nota.status_sefaz === "transmitida" && !nota.erros?.length && (
                <p className="text-emerald-700 text-sm">✓ Autorizado o uso da NF-e</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tabs de dados */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {[
            { id: "cliente", label: "Cliente", icon: User },
            { id: "produtos", label: "Produtos", icon: Package },
            { id: "impostos", label: "Impostos", icon: Calculator },
            { id: "avancado", label: "Avançado", icon: Settings2 },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setAba(id)}
              className={`flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors border-b-2 px-4 whitespace-nowrap ${
                aba === id ? "border-[#0B63D4] text-[#0B63D4]" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Aba Cliente */}
          {aba === "cliente" && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Destinatário</h3>
              {editando ? (
                <div className="space-y-4">
                  {destinatarios.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">Buscar Destinatário Existente</label>
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                          placeholder="Buscar por nome ou CNPJ..." value={searchDest}
                          onChange={e => setSearchDest(e.target.value)} />
                      </div>
                      {searchDest && (
                        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl shadow-lg">
                          {destinatarios.filter(d => d.nome?.toLowerCase().includes(searchDest.toLowerCase()) || d.cnpj?.includes(searchDest)).map(d => (
                            <button key={d.id} onClick={() => {
                              setNota(n => ({
                                ...n, destinatario_id: d.id, destinatario_nome: d.nome,
                                destinatario_cnpj: d.cnpj, destinatario_email: d.email,
                                dest_logradouro: d.logradouro, dest_numero: d.numero,
                                dest_complemento: d.complemento, dest_bairro: d.bairro,
                                dest_municipio: d.municipio, dest_uf: d.uf, dest_cep: d.cep,
                                dest_codigo_municipio: d.codigo_ibge_municipio, dest_ie: d.ie,
                                dest_indicador_ie: d.indIEDest || "NonTaxPayer"
                              }));
                              setSearchDest("");
                            }}
                              className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0 text-sm">
                              <p className="font-medium text-gray-900">{d.nome}</p>
                              <p className="text-xs text-gray-400">{d.cnpj}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-700">Razão Social *</label>
                    <input required className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                      value={nota.destinatario_nome || ""} onChange={e => setNota(n => ({ ...n, destinatario_nome: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">CNPJ / CPF</label>
                    <input className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                      value={nota.destinatario_cnpj || ""} onChange={e => setNota(n => ({ ...n, destinatario_cnpj: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">E-mail</label>
                    <input type="email" className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                      value={nota.destinatario_email || ""} onChange={e => setNota(n => ({ ...n, destinatario_email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Observações</label>
                    <textarea className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4] resize-none"
                      rows={3} value={nota.observacoes || ""} onChange={e => setNota(n => ({ ...n, observacoes: e.target.value }))} />
                  </div>
                </div>
              ) : (
                <>
                  <InfoRow label="Razão Social / Nome" value={nota.destinatario_nome} />
                  <InfoRow label="CNPJ / CPF" value={nota.destinatario_cnpj} />
                  <InfoRow label="Data de Emissão" value={nota.created_date ? new Date(nota.created_date).toLocaleDateString("pt-BR") : null} />
                  <InfoRow label="Série" value={nota.serie} />
                  <InfoRow label="Observações" value={nota.observacoes} />
                </>
              )}
            </div>
          )}

          {/* Aba Produtos */}
          {aba === "produtos" && (
            <div>
              {editando && (
                <button onClick={() => { setItemEditando(null); setItemModalOpen(true); }}
                  className="mb-3 flex items-center gap-2 text-sm font-semibold text-white px-3 py-2 rounded-xl"
                  style={{ backgroundColor: "#0B63D4" }}>
                  <Plus className="w-4 h-4" /> Adicionar Item
                </button>
              )}
              {itens.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  <Package className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                  Nenhum item encontrado.
                </div>
              ) : (
                <div className="space-y-3">
                  {itens.map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{item.descricao}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            NCM: {item.ncm || "—"} · CFOP: {item.cfop || "—"} · {item.unidade}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {item.quantidade} × R$ {fmt(item.valor_unitario)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">R$ {fmt(item.valor_total)}</p>
                          <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                            {item.aliquota_icms > 0 && <p>ICMS: {item.aliquota_icms}%</p>}
                            {item.aliquota_pis > 0 && <p>PIS: {item.aliquota_pis}%</p>}
                            {item.aliquota_cofins > 0 && <p>COFINS: {item.aliquota_cofins}%</p>}
                          </div>
                        </div>
                        {editando && (
                          <div className="flex gap-1">
                            <button onClick={() => { setItemEditando(item); setItemModalOpen(true); }}
                              className="p-1 text-gray-400 hover:text-blue-600 rounded">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleExcluirItem(item.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {/* Totais */}
                  <div className="rounded-xl p-4 mt-2" style={{ backgroundColor: "#E6F0FF" }}>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Produtos</span>
                      <span className="font-bold" style={{ color: "#0B63D4" }}>R$ {fmt(totais.produtos)}</span>
                    </div>
                    {totais.impostos > 0 && (
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-600">Total Impostos</span>
                        <span className="font-semibold text-gray-700">R$ {fmt(totais.impostos)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold mt-2 border-t border-blue-200 pt-2">
                      <span style={{ color: "#0B63D4" }}>Total da Nota</span>
                      <span style={{ color: "#0B63D4" }}>R$ {fmt(totais.total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Aba Impostos */}
          {aba === "impostos" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Revisão de Impostos</h3>
              {editando ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[["valor_frete","Frete"],["valor_seguro","Seguro"],["outras_despesas","Outras Desp."],["valor_desconto","Desconto"]].map(([k, l]) => (
                      <div key={k}>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">{l}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs text-gray-400">R$</span>
                          <input type="number" min="0" step="0.01"
                            className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                            value={nota[k] || 0} onChange={e => setNota(n => ({ ...n, [k]: parseFloat(e.target.value) || 0 }))} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="rounded-2xl overflow-hidden border border-gray-100 mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tributo</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {[["Total de Produtos", fmt(totais.produtos)],["ICMS", fmt(totais.icms)],["PIS", fmt(totais.pis)],["COFINS", fmt(totais.cofins)]].map(([lbl, val]) => (
                      <tr key={lbl}>
                        <td className="px-5 py-3 text-gray-700">{lbl}</td>
                        <td className="px-5 py-3 text-right font-medium">R$ {val}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: "#E6F0FF" }}>
                      <td className="px-5 py-4 font-bold" style={{ color: "#0B63D4" }}>Total da Nota</td>
                      <td className="px-5 py-4 text-right font-bold text-lg" style={{ color: "#0B63D4" }}>R$ {fmt(totais.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Aba Avançado */}
          {aba === "avancado" && (
            <div className="space-y-4">
              {editando ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Natureza da Operação</label>
                      <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                        value={nota.natureza_operacao || ""} onChange={e => setNota(n => ({ ...n, natureza_operacao: e.target.value }))}>
                        {naturezas.map(n => <option key={n.id} value={n.nome}>{n.nome}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Forma de Pagamento</label>
                      <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                        value={nota.forma_pagamento || "Dinheiro"} onChange={e => setNota(n => ({ ...n, forma_pagamento: e.target.value, forma_pagamento_codigo: PAGAMENTO_CODIGO[e.target.value] || "01" }))}>
                        {FORMAS_PAGAMENTO.map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Informações Complementares</label>
                    <textarea rows={3} value={nota.observacoes || ""}
                      onChange={e => setNota(n => ({ ...n, observacoes: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4] resize-none" />
                  </div>
                </div>
              ) : null}
              <InfoRow label="Status SEFAZ" value={cfg.label} />
              <InfoRow label="Natureza" value={nota.natureza_operacao} />
              <InfoRow label="Forma de Pagamento" value={nota.forma_pagamento} />
              <InfoRow label="Série" value={nota.serie} />
              <InfoRow label="Número" value={nota.numero?.toString()} />
              <InfoRow label="Certificado" value={nota.certificado_id} />
            </div>
          )}
        </div>
      </div>

      {itemModalOpen && (
        <EditarItemModal
          item={itemEditando}
          onClose={() => { setItemModalOpen(false); setItemEditando(null); }}
          onSave={handleSalvarItem}
        />
      )}
    </div>
  );
}