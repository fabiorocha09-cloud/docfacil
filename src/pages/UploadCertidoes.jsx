import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, FileText, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";

const statusLabel = {
  aguardando: { label: "Aguardando", color: "text-gray-500", icon: FileText },
  processando: { label: "Processando", color: "text-blue-600", icon: Loader2 },
  sucesso: { label: "Identificado", color: "text-green-600", icon: CheckCircle2 },
  erro: { label: "Erro", color: "text-red-600", icon: XCircle },
  sem_empresa: { label: "Empresa não encontrada", color: "text-yellow-600", icon: AlertTriangle },
  revisar: { label: "Revisar CNPJ", color: "text-orange-600", icon: AlertTriangle },
};

// Extrai e tenta limpar CNPJ de strings com prefixos como "Nº64.682.031/0001-52"
function limparCnpj(raw) {
  if (!raw) return "";
  // Remove tudo que não é dígito
  const apenasDigitos = raw.replace(/\D/g, "");
  // Se tiver exatamente 14 dígitos, usa direto
  if (apenasDigitos.length === 14) return apenasDigitos;
  // Se tiver mais que 14, tenta pegar os últimos 14 (casos com prefixos numéricos)
  if (apenasDigitos.length > 14) return apenasDigitos.slice(-14);
  return apenasDigitos;
}

export default function UploadCertidoes() {
  const [arquivos, setArquivos] = useState([]);
  const [processando, setProcessando] = useState(false);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    const novos = files.map(f => ({ file: f, nome: f.name, status: "aguardando", dados: null }));
    setArquivos(prev => [...prev, ...novos]);
  };

  const processarTodos = async () => {
    setProcessando(true);
    const [empresas, modelos] = await Promise.all([
      base44.entities.Empresa.list(),
      base44.entities.ModeloDocumento.list(),
    ]);

    for (let i = 0; i < arquivos.length; i++) {
      if (arquivos[i].status === "sucesso") continue;

      setArquivos(prev => prev.map((a, idx) => idx === i ? { ...a, status: "processando" } : a));

      const { file_url } = await base44.integrations.Core.UploadFile({ file: arquivos[i].file });

      const modelosCtx = modelos.length > 0
        ? `\n\nModelos de referência cadastrados:\n` + modelos.map(m =>
            `- Tipo: ${m.tipo}${m.subtipo ? ` (${m.subtipo})` : ""}${m.estado_municipio ? ` | Estado/Município: ${m.estado_municipio}` : ""}${m.descricao ? ` | Desc: ${m.descricao}` : ""}`
          ).join("\n")
        : "";

      const resultado = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            cnpj: { type: "string", description: `CNPJ da empresa no documento, apenas números ou formatado${modelosCtx}` },
            tipo_certidao: {
              type: "string",
              description: "Tipo da certidão: federal, estadual, municipal, fgts, trabalhista, alvara_bombeiros, alvara_vigilancia_sanitaria, alvara_funcionamento ou alvara_meio_ambiente. Use os modelos de referência acima para ajudar a identificar o tipo correto."
            },
            subtipo: { type: "string", description: "Ex: Receita Federal, PGFN, CRF, CNDT, SEFAZ, ISS, nome do órgão emissor" },
            data_emissao: { type: "string", description: "Data de emissão no formato YYYY-MM-DD" },
            data_vencimento: { type: "string", description: "Data de validade/vencimento no formato YYYY-MM-DD" },
            situacao: { type: "string", description: "Situação fiscal da certidão: 'regular' ou 'irregular'. IMPORTANTE: considere como REGULAR (válida) certidões que contenham expressões como 'positiva com efeito de negativa', 'efeito negativa', 'exigibilidade suspensa', 'débitos suspensos', 'débitos parcelados' ou 'crédito tributário com exigibilidade suspensa' — isso significa que os débitos foram negociados e a certidão é válida." }
          }
        }
      });

      if (resultado.status !== "success" || !resultado.output?.cnpj) {
        setArquivos(prev => prev.map((a, idx) => idx === i ? { ...a, status: "erro", arquivo_url: file_url } : a));
        continue;
      }

      const dados = resultado.output;
      const cnpjLimpo = limparCnpj(dados.cnpj);
      const empresa = empresas.find(e => e.cnpj?.replace(/\D/g, "") === cnpjLimpo);

      // CNPJ incompleto ou duvidoso (menos de 14 dígitos após limpeza)
      if (!empresa && cnpjLimpo.length !== 14) {
        setArquivos(prev => prev.map((a, idx) => idx === i ? { ...a, status: "revisar", dados, arquivo_url: file_url, cnpjExtraido: dados.cnpj } : a));
        continue;
      }

      if (!empresa) {
        setArquivos(prev => prev.map((a, idx) => idx === i ? { ...a, status: "sem_empresa", dados, arquivo_url: file_url } : a));
        continue;
      }

      // Salvar certidão
      const existentes = await base44.entities.Certidao.filter({ empresa_id: empresa.id, tipo: dados.tipo_certidao });
      const certidaoData = {
        empresa_id: empresa.id,
        empresa_nome: empresa.nome,
        empresa_cnpj: empresa.cnpj,
        tipo: dados.tipo_certidao || "federal",
        subtipo: dados.subtipo || "",
        status: dados.situacao === "irregular" ? "irregular" : "regular",
        data_emissao: dados.data_emissao || "",
        data_vencimento: dados.data_vencimento || "",
        arquivo_url: file_url,
      };

      if (existentes.length > 0) {
        await base44.entities.Certidao.update(existentes[0].id, certidaoData);
      } else {
        await base44.entities.Certidao.create(certidaoData);
      }

      setArquivos(prev => prev.map((a, idx) => idx === i ? { ...a, status: "sucesso", dados, empresa, arquivo_url: file_url } : a));
    }

    setProcessando(false);
  };

  const remover = (i) => setArquivos(prev => prev.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload de Certidões</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Envie PDFs e a IA identificará automaticamente o tipo, validade e empresa</p>
      </div>

      {/* Drop zone */}
      <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors">
        <Upload className="w-10 h-10 text-gray-400" />
        <div className="text-center">
          <p className="font-medium text-gray-700 dark:text-gray-300">Clique para selecionar PDFs</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">ou arraste e solte aqui — múltiplos arquivos permitidos</p>
        </div>
        <input type="file" accept=".pdf" multiple className="hidden" onChange={handleFiles} />
      </label>

      {arquivos.length > 0 && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <span className="font-medium text-gray-900 dark:text-white">{arquivos.length} arquivo(s) selecionado(s)</span>
              <button
                onClick={processarTodos}
                disabled={processando}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {processando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {processando ? "Processando..." : "Processar com IA"}
              </button>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {arquivos.map((arq, i) => {
                const cfg = statusLabel[arq.status];
                const Icon = cfg.icon;
                return (
                  <div key={i} className="flex items-start justify-between px-5 py-4 gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{arq.nome}</p>
                        {arq.dados && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
                            {arq.empresa && <p>Empresa: <span className="font-medium text-gray-700 dark:text-gray-300">{arq.empresa.nome}</span></p>}
                            {arq.dados.tipo_certidao && <p>Tipo: <span className="capitalize">{arq.dados.tipo_certidao}</span> {arq.dados.subtipo && `— ${arq.dados.subtipo}`}</p>}
                            {arq.dados.data_vencimento && <p>Vencimento: {new Date(arq.dados.data_vencimento).toLocaleDateString("pt-BR")}</p>}
                            {arq.dados.situacao && <p>Situação: <span className="capitalize">{arq.dados.situacao}</span></p>}
                          </div>
                        )}
                        {arq.status === "sem_empresa" && arq.dados?.cnpj && (
                          <p className="text-xs text-yellow-600 mt-1">CNPJ {arq.dados.cnpj} não cadastrado no sistema.</p>
                        )}
                        {arq.status === "revisar" && (
                          <p className="text-xs text-orange-600 mt-1">CNPJ extraído com possível erro: <strong>{arq.cnpjExtraido}</strong>. Verifique e vincule manualmente.</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
                        <Icon className={`w-4 h-4 ${arq.status === "processando" ? "animate-spin" : ""}`} />
                        {cfg.label}
                      </span>
                      {arq.status !== "processando" && (
                        <button onClick={() => remover(i)} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}