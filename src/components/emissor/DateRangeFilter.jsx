import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { startOfMonth, endOfMonth, subMonths, subDays } from "date-fns";

const PRESETS = [
  { key: "mes_atual", label: "Mês Atual" },
  { key: "mes_passado", label: "Mês Passado" },
  { key: "30d", label: "Últimos 30 dias" },
  { key: "90d", label: "Últimos 90 dias" },
  { key: "personalizado", label: "Personalizado" },
];

export function getDateRange(preset) {
  const hoje = new Date();
  if (preset === "mes_atual") return { start: startOfMonth(hoje), end: endOfMonth(hoje) };
  if (preset === "mes_passado") {
    const m = subMonths(hoje, 1);
    return { start: startOfMonth(m), end: endOfMonth(m) };
  }
  if (preset === "30d") return { start: subDays(hoje, 30), end: hoje };
  if (preset === "90d") return { start: subDays(hoje, 90), end: hoje };
  return null;
}

export default function DateRangeFilter({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const preset = value?.preset || "mes_atual";

  const handlePreset = (key) => {
    if (key === "personalizado") {
      onChange({ preset: "personalizado", range: null });
    } else {
      onChange({ preset: key, range: getDateRange(key) });
      setOpen(false);
    }
  };

  const handleCustomApply = () => {
    if (!customStart || !customEnd) return;
    onChange({
      preset: "personalizado",
      range: { start: new Date(customStart + "T00:00:00"), end: new Date(customEnd + "T23:59:59") },
    });
    setOpen(false);
  };

  const currentLabel = PRESETS.find(p => p.key === preset)?.label || "Período";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:border-[#0B63D4] shadow-sm whitespace-nowrap transition-colors"
      >
        <Calendar className="w-4 h-4 text-gray-400" />
        {currentLabel}
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-2 min-w-[200px]">
            {PRESETS.map(p => (
              <button
                key={p.key}
                onClick={() => handlePreset(p.key)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                  preset === p.key
                    ? "bg-[#E6F0FF] text-[#0B63D4] font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {p.label}
              </button>
            ))}
            {preset === "personalizado" && (
              <div className="mt-2 pt-2 border-t border-gray-100 space-y-2 px-1">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">De</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={e => setCustomStart(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Até</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={e => setCustomEnd(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B63D4]"
                  />
                </div>
                <button
                  onClick={handleCustomApply}
                  disabled={!customStart || !customEnd}
                  className="w-full text-white text-sm font-semibold py-2 rounded-xl disabled:opacity-40"
                  style={{ backgroundColor: "#0B63D4" }}
                >
                  Aplicar
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}