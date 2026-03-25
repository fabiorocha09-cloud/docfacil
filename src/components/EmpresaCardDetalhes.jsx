import { FileCheck2, Download, Building2, FileText, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";

const statusConfig = {
  regular: { label: "Regular", color: "text-green-700 bg-green-50 border-green-200", icon: CheckCircle2 },
  irregular: { label: "Irregular", color: "text-red-700 bg-red-50 border-red-200", icon: XCircle },
  pendente: { label: "Pendente", color: "text-yellow-700 bg-yellow-50 border-yellow-200", icon: Clock },
  processando: { label: "Processando", color: "text-blue-700 bg-blue-50 border-blue-200", icon: Clock },
  erro: { label: "Erro", color: "text-gray-700 bg-gray-50 border-gray-200", icon: AlertTriangle },
};

const tipoDocLabels = {
  cartao_cnpj: "Cartão CNPJ", procuracao_tj: "Procuração TJ", crc_contador: "CRC Contador",
  alvara_municipal: "Alvará Municipal", alvara_visa: "Alvará VISA", avcb_bombeiros: "AVCB Bombeiros",
};

const tipoLabels = { federal: "Federal", estadual: "Estadual", municipal: "Municipal", fgts: "FGTS", trabalhista: "Trabalhista" };

export default function EmpresaCardDetalhes({ empresa, certidoes, documentos }) {
  const certRegulares = certidoes.filter(c => c.status === "regular").length;
  const certIrregulares = certidoes.filter(c => c.status === "irregular").length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">{empresa.nome}</h2>
            {empresa.cnpj && <p className="text-sm text-gray-500">CNPJ: {empresa.cnpj}</p>}
            {empresa.responsavel && <p className="text-xs text-gray-400">{empresa.responsavel}</p>}
          </div>
        </div>
        <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center"><p className="text-lg font-bold text-gray-900">{certidoes.length}</p><p className="text-xs text-gray-500">Certidões</p></div>
          <div className="text-center"><p className="text-lg font-bold text-green-600">{certRegulares}</p><p className="text-xs text-gray-500">Regulares</p></div>
          {certIrregulares > 0 && <div className="text-center"><p className="text-lg font-bold text-red-600">{certIrregulares}</p><p className="text-xs text-gray-500">Irregulares</p></div>}
          <div className="text-center"><p className="text-lg font-bold text-gray-900">{documentos.length}</p><p className="text-xs text-gray-500">Documentos</p></div>
        </div>
      </div>

      {/* Certidões */}
      {certidoes.length > 0 && (
        <div>
          <p className="px-5 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-100 flex items-center gap-1.5">
            <FileCheck2 className="w-3.5 h-3.5" /> Certidões
          </p>
          <div className="divide-y divide-gray-100">
            {certidoes.map(cert => {
              const cfg = statusConfig[cert.status] || statusConfig.pendente;
              const StatusIcon = cfg.icon;
              return (
                <div key={cert.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">{tipoLabels[cert.tipo] || cert.tipo}</span>
                      {cert.subtipo && <span className="text-xs text-gray-400">{cert.subtipo}</span>}
                    </div>
                    {cert.data_vencimento && (
                      <p className="text-xs text-gray-500">Vence: {new Date(cert.data_vencimento).toLocaleDateString("pt-BR")}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />{cfg.label}
                    </div>
                    {cert.arquivo_url && (
                      <a href={cert.arquivo_url} target="_blank" rel="noreferrer"
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Download">
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Documentos */}
      {documentos.length > 0 && (
        <div>
          <p className="px-5 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-y border-gray-100 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Documentos
          </p>
          <div className="divide-y divide-gray-100">
            {documentos.map(doc => (
              <div key={doc.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-800 font-medium">{tipoDocLabels[doc.tipo] || doc.tipo}</span>
                </div>
                {doc.arquivo_url && (
                  <a href={doc.arquivo_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                    <Download className="w-3.5 h-3.5" /> Baixar
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {certidoes.length === 0 && documentos.length === 0 && (
        <div className="p-8 text-center text-gray-400 text-sm">Nenhum documento ou certidão disponível.</div>
      )}
    </div>
  );
}