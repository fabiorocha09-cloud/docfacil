export default function PassivoKpiCard({ label, value, icon: Icon, color, bgColor, borderColor, sub }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: bgColor, border: `1px solid ${borderColor}` }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "#A0B1D4", fontFamily: "'Rethink Sans', sans-serif" }}>{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: bgColor }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color, fontFamily: "'Exo 2', sans-serif" }}>{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>{sub}</p>}
      </div>
    </div>
  );
}