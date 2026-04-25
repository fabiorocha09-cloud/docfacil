export default function RiscoScoreBadge({ score }) {
  const s = Math.round(score || 0);
  const color = s >= 70 ? "#E63946" : s >= 40 ? "#FF9F1C" : "#1E9B5B";
  const bg = s >= 70 ? "rgba(230,57,70,0.12)" : s >= 40 ? "rgba(255,159,28,0.12)" : "rgba(30,155,91,0.12)";
  const border = s >= 70 ? "rgba(230,57,70,0.3)" : s >= 40 ? "rgba(255,159,28,0.3)" : "rgba(30,155,91,0.3)";
  const label = s >= 70 ? "Alto" : s >= 40 ? "Médio" : "Baixo";
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: bg, border: `1px solid ${border}`, color, fontFamily: "'Outfit', sans-serif" }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
      {label} · {s}
    </span>
  );
}