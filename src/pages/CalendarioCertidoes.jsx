import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, AlertTriangle, Calendar } from "lucide-react";

const TIPOS_LABEL = {
  federal: "Federal", estadual: "Estadual", municipal: "Municipal",
  fgts: "FGTS", trabalhista: "Trabalhista",
  alvara_bombeiros: "Alvará - Bombeiros",
  alvara_vigilancia_sanitaria: "Alvará - Vigilância Sanitária",
  alvara_funcionamento: "Alvará - Funcionamento",
  alvara_meio_ambiente: "Alvará - Meio Ambiente",
};

const statusColor = {
  regular: "bg-green-500",
  irregular: "bg-red-500",
  pendente: "bg-yellow-400",
  processando: "bg-blue-400",
  erro: "bg-gray-400",
};

const statusIcon = {
  regular: CheckCircle2,
  irregular: XCircle,
  pendente: Clock,
  processando: Clock,
  erro: AlertTriangle,
};

function getStatusEfetivo(cert) {
  if (cert.data_vencimento && new Date(cert.data_vencimento) < new Date()) return "irregular";
  return cert.status;
}

export default function CalendarioCertidoes() {
  const [certidoes, setCertidoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoje] = useState(new Date());
  const [mes, setMes] = useState(new Date().getMonth());
  const [ano, setAno] = useState(new Date().getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState(null);

  useEffect(() => {
    base44.entities.Certidao.list("-data_vencimento", 300).then(data => {
      setCertidoes(data.filter(c => !c.excluida && c.data_vencimento));
      setLoading(false);
    });
  }, []);

  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const primeiroDia = new Date(ano, mes, 1).getDay(); // 0=Dom
  const nomeMes = new Date(ano, mes, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const certidoesDoDia = (dia) => {
    const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    return certidoes.filter(c => c.data_vencimento === dataStr);
  };

  const certidoesSelecionadas = diaSelecionado ? certidoesDoDia(diaSelecionado) : [];

  const navMes = (delta) => {
    let nm = mes + delta;
    let na = ano;
    if (nm < 0) { nm = 11; na--; }
    if (nm > 11) { nm = 0; na++; }
    setMes(nm);
    setAno(na);
    setDiaSelecionado(null);
  };

  // Resumo do mês atual
  const certidoesDoMes = certidoes.filter(c => {
    if (!c.data_vencimento) return false;
    const d = new Date(c.data_vencimento);
    return d.getMonth() === mes && d.getFullYear() === ano;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendário de Vencimentos</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Visão mensal de todas as certidões por data de vencimento</p>
      </div>

      {/* Resumo do mês */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Vencem este mês", value: certidoesDoMes.length, color: "text-blue-600" },
          { label: "Regulares", value: certidoesDoMes.filter(c => getStatusEfetivo(c) === "regular").length, color: "text-green-600" },
          { label: "Irregulares/Vencidas", value: certidoesDoMes.filter(c => getStatusEfetivo(c) === "irregular").length, color: "text-red-600" },
          { label: "Pendentes", value: certidoesDoMes.filter(c => getStatusEfetivo(c) === "pendente").length, color: "text-yellow-600" },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <button onClick={() => navMes(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h2 className="font-semibold text-gray-900 dark:text-white capitalize">{nomeMes}</h2>
            <button onClick={() => navMes(1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          <div className="p-4">
            {/* Cabeçalho dias */}
            <div className="grid grid-cols-7 mb-2">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
                <div key={d} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1">{d}</div>
              ))}
            </div>

            {/* Grid de dias */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: primeiroDia }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: diasNoMes }).map((_, i) => {
                const dia = i + 1;
                const certs = certidoesDoDia(dia);
                const isHoje = hoje.getDate() === dia && hoje.getMonth() === mes && hoje.getFullYear() === ano;
                const isSel = diaSelecionado === dia;
                const temIrregular = certs.some(c => getStatusEfetivo(c) === "irregular");
                const temPendente = certs.some(c => getStatusEfetivo(c) === "pendente");

                return (
                  <button
                    key={dia}
                    onClick={() => setDiaSelecionado(isSel ? null : dia)}
                    className={`relative aspect-square flex flex-col items-center justify-start pt-1 rounded-lg text-sm transition-colors
                      ${isSel ? "bg-blue-600 text-white" : isHoje ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold" : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"}
                    `}
                  >
                    <span>{dia}</span>
                    {certs.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                        {temIrregular && <span className={`w-1.5 h-1.5 rounded-full ${isSel ? "bg-white" : "bg-red-500"}`} />}
                        {temPendente && <span className={`w-1.5 h-1.5 rounded-full ${isSel ? "bg-white" : "bg-yellow-400"}`} />}
                        {!temIrregular && !temPendente && <span className={`w-1.5 h-1.5 rounded-full ${isSel ? "bg-white" : "bg-green-500"}`} />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-5 pb-4 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Regular</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Pendente</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Irregular/Vencida</span>
          </div>
        </div>

        {/* Painel lateral */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {diaSelecionado ? (
            <>
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {diaSelecionado}/{String(mes + 1).padStart(2, "0")}/{ano}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{certidoesSelecionadas.length} certidão(ões)</p>
              </div>
              {certidoesSelecionadas.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">Nenhuma certidão neste dia.</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {certidoesSelecionadas.map(cert => {
                    const status = getStatusEfetivo(cert);
                    const cor = statusColor[status] || "bg-gray-400";
                    const Icon = statusIcon[status] || AlertTriangle;
                    return (
                      <div key={cert.id} className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cor}`} />
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{cert.empresa_nome}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{TIPOS_LABEL[cert.tipo]}{cert.subtipo ? ` — ${cert.subtipo}` : ""}</p>
                            <div className={`inline-flex items-center gap-1 mt-1 text-xs font-medium px-1.5 py-0.5 rounded`}>
                              <Icon className="w-3 h-3" />
                              <span className="capitalize">{status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center">
              <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Clique em um dia para ver as certidões que vencem</p>
            </div>
          )}
        </div>
      </div>

      {/* Próximos vencimentos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Próximos 30 dias</h3>
        </div>
        {loading ? (
          <div className="p-5 space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {certidoes
              .filter(c => {
                const d = new Date(c.data_vencimento);
                const diff = (d - hoje) / (1000 * 60 * 60 * 24);
                return diff >= 0 && diff <= 30;
              })
              .sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento))
              .map(cert => {
                const diff = Math.round((new Date(cert.data_vencimento) - hoje) / (1000 * 60 * 60 * 24));
                const status = getStatusEfetivo(cert);
                const urgencia = diff <= 7 ? "text-red-600 bg-red-50 border-red-200" : diff <= 15 ? "text-yellow-600 bg-yellow-50 border-yellow-200" : "text-blue-600 bg-blue-50 border-blue-200";
                return (
                  <div key={cert.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{cert.empresa_nome}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{TIPOS_LABEL[cert.tipo]}{cert.subtipo ? ` — ${cert.subtipo}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${urgencia}`}>
                        {diff === 0 ? "Hoje" : `${diff}d`}
                      </span>
                      <span className="text-xs text-gray-400">{new Date(cert.data_vencimento).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                );
              })}
            {certidoes.filter(c => {
              const diff = (new Date(c.data_vencimento) - hoje) / (1000 * 60 * 60 * 24);
              return diff >= 0 && diff <= 30;
            }).length === 0 && (
              <div className="p-8 text-center text-sm text-gray-400">Nenhuma certidão vencendo nos próximos 30 dias.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}