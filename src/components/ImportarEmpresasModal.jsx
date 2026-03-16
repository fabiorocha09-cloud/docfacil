import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Upload, Download, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export default function ImportarEmpresasModal({ onClose, onImportado }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null); // null | "processando" | "sucesso" | "erro"
  const [resultado, setResultado] = useState(null);

  const handleImportar = async () => {
    if (!file) return;
    setStatus("processando");

    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    const res = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          empresas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                cnpj: { type: "string" },
                nome: { type: "string" },
                regime_tributario: { type: "string", description: "simples_nacional, lucro_presumido, lucro_real ou mei" },
                inscricao_estadual: { type: "string" }
              }
            }
          }
        }
      }
    });

    if (res.status !== "success" || !res.output?.empresas?.length) {
      setStatus("erro");
      setResultado({ erro: "Não foi possível extrair os dados da planilha." });
      return;
    }

    const empresas = res.output.empresas;
    const validas = empresas.filter(e => e.cnpj && e.nome);

    await base44.entities.Empresa.bulkCreate(validas.map(e => ({
      cnpj: e.cnpj,
      nome: e.nome,
      regime_tributario: e.regime_tributario || undefined,
      inscricao_estadual: e.inscricao_estadual || undefined,
      status: "ativo"
    })));

    setStatus("sucesso");
    setResultado({ total: empresas.length, importadas: validas.length, ignoradas: empresas.length - validas.length });
    onImportado();
  };

  const baixarModelo = () => {
    const csv = "CNPJ;RAZÃO SOCIAL;REGIME TRIBUTÁRIO;INSCRIÇÃO ESTADUAL\n00.000.000/0001-00;Empresa Exemplo Ltda;simples_nacional;123456789\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo_importacao.csv";
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Importar Empresas em Lote</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          <button
            onClick={baixarModelo}
            className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
          >
            <Download className="w-4 h-4" /> Baixar planilha modelo (.csv)
          </button>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Colunas esperadas: <strong>CNPJ | RAZÃO SOCIAL | REGIME TRIBUTÁRIO | INSCRIÇÃO ESTADUAL</strong></p>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 cursor-pointer hover:border-blue-400 transition-colors">
              <Upload className="w-7 h-7 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{file ? file.name : "Selecionar arquivo .csv ou .xlsx"}</span>
              <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => setFile(e.target.files[0])} />
            </label>
          </div>

          {status === "sucesso" && resultado && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
              <p className="text-sm text-green-800">
                <strong>{resultado.importadas}</strong> empresa(s) importada(s) com sucesso.
                {resultado.ignoradas > 0 && <span className="text-yellow-700"> {resultado.ignoradas} ignorada(s) por dados incompletos.</span>}
              </p>
            </div>
          )}

          {status === "erro" && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800">{resultado?.erro}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100 dark:border-gray-700">
          <button onClick={onClose} className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            {status === "sucesso" ? "Fechar" : "Cancelar"}
          </button>
          {status !== "sucesso" && (
            <button
              onClick={handleImportar}
              disabled={!file || status === "processando"}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50"
            >
              {status === "processando" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {status === "processando" ? "Importando..." : "Importar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}