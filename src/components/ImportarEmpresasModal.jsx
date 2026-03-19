import { useState } from "react";
import { base44 } from "@/api/base44Client";
import * as XLSX from "xlsx";
import { X, Upload, Download, CheckCircle2, AlertTriangle, Loader2, Info } from "lucide-react";

export default function ImportarEmpresasModal({ onClose, onImportado }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null); // null | "processando" | "sucesso" | "erro"
  const [resultado, setResultado] = useState(null);

  const handleImportar = async () => {
    if (!file) return;
    setStatus("processando");

    // Lê o XLSX diretamente no frontend
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

    if (!rows.length) {
      setStatus("erro");
      setResultado({ erro: "Planilha vazia ou formato inválido." });
      return;
    }

    // Normaliza cabeçalhos (remove acentos, espaços extras, case insensitive)
    const normalize = (str) => String(str).trim().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const mapRow = (row) => {
      const get = (...keys) => {
        for (const k of Object.keys(row)) {
          if (keys.some(key => normalize(k) === normalize(key))) return String(row[k]).trim();
        }
        return "";
      };
      return {
        cnpj: get("cnpj"),
        nome: get("razao social", "nome", "razão social"),
        regime_tributario: get("regime tributario", "regime tributário"),
        inscricao_estadual: get("inscricao estadual", "inscrição estadual"),
        grupo_empresarial: get("grupo empresarial"),
      };
    };

    const empresas = rows.map(mapRow);
    const validas = empresas.filter(e => e.cnpj && e.nome);

    // Buscar grupos existentes para vincular pelo nome
    const grupos = await base44.entities.GrupoEmpresarial.list();
    const grupoMap = {};
    grupos.forEach(g => { grupoMap[g.nome.toLowerCase()] = g; });

    await base44.entities.Empresa.bulkCreate(validas.map(e => {
      const grupoNome = e.grupo_empresarial?.trim();
      const grupoEncontrado = grupoNome ? grupoMap[grupoNome.toLowerCase()] : null;
      return {
        cnpj: e.cnpj,
        nome: e.nome,
        regime_tributario: e.regime_tributario || undefined,
        inscricao_estadual: e.inscricao_estadual || undefined,
        grupo_id: grupoEncontrado?.id || undefined,
        grupo_nome: grupoEncontrado?.nome || undefined,
        status: "ativo",
        excluida: false,
      };
    }));

    setStatus("sucesso");
    setResultado({ total: empresas.length, importadas: validas.length, ignoradas: empresas.length - validas.length });
    onImportado();
  };

  const baixarModelo = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["CNPJ", "RAZÃO SOCIAL", "REGIME TRIBUTÁRIO", "INSCRIÇÃO ESTADUAL", "GRUPO EMPRESARIAL"],
      ["00.000.000/0001-00", "Empresa Exemplo Ltda", "simples_nacional", "123456789", "Grupo Exemplo"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Empresas");
    XLSX.writeFile(wb, "modelo_importacao.xlsx");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Importar Empresas em Lote</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Instruções */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-1">
            <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> Colunas esperadas no arquivo .xlsx
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-0.5 list-disc list-inside">
              <li><strong>CNPJ</strong> — obrigatório</li>
              <li><strong>RAZÃO SOCIAL</strong> — obrigatório</li>
              <li><strong>REGIME TRIBUTÁRIO</strong> — simples_nacional, lucro_presumido, lucro_real ou mei</li>
              <li><strong>INSCRIÇÃO ESTADUAL</strong> — opcional</li>
              <li><strong>GRUPO EMPRESARIAL</strong> — nome do grupo já cadastrado (opcional)</li>
            </ul>
          </div>

          <button
            onClick={baixarModelo}
            className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
          >
            <Download className="w-4 h-4" /> Baixar planilha modelo (.xlsx)
          </button>

          <div>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 cursor-pointer hover:border-blue-400 transition-colors">
              <Upload className="w-7 h-7 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{file ? file.name : "Selecionar arquivo .xlsx"}</span>
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={e => setFile(e.target.files[0])} />
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