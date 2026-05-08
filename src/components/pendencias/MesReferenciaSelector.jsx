import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function MesReferenciaSelector({ value, onChange, dark = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Parse "MM/YYYY" → { month, year }
  const parseValue = (v) => {
    if (!v) return { month: new Date().getMonth(), year: new Date().getFullYear() };
    const parts = v.split("/");
    if (parts.length !== 2) return { month: new Date().getMonth(), year: new Date().getFullYear() };
    return { month: parseInt(parts[0], 10) - 1, year: parseInt(parts[1], 10) };
  };

  const { month: selMonth, year: selYear } = parseValue(value);
  const [navYear, setNavYear] = useState(selYear);

  useEffect(() => {
    setNavYear(selYear);
  }, [selYear]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const select = (month, year) => {
    onChange(`${String(month + 1).padStart(2, "0")}/${year}`);
    setOpen(false);
  };

  const bgInput = dark ? "#243558" : "#fff";
  const colorInput = dark ? "#fff" : "#1B2A4A";
  const borderInput = dark ? "1px solid #3a5075" : "1px solid #d1d5db";

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: bgInput, color: colorInput,
          border: borderInput, borderRadius: 6,
          padding: "7px 12px", fontSize: 13, cursor: "pointer",
          minWidth: 130, fontFamily: "Arial, sans-serif",
        }}
      >
        <CalendarDays size={14} style={{ opacity: 0.6, flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: "left" }}>{value || "MM/AAAA"}</span>
        <ChevronRight size={13} style={{ opacity: 0.5, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 9999,
          background: "#1B2A4A", border: "1px solid #3a5075", borderRadius: 10,
          padding: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.35)", minWidth: 220,
        }}>
          {/* Nav de ano */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button type="button" onClick={() => setNavYear(y => y - 1)}
              style={{ background: "none", border: "none", color: "#8eafd4", cursor: "pointer", padding: 4, borderRadius: 4 }}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{navYear}</span>
            <button type="button" onClick={() => setNavYear(y => y + 1)}
              style={{ background: "none", border: "none", color: "#8eafd4", cursor: "pointer", padding: 4, borderRadius: 4 }}>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Grid de meses */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            {MESES.map((nome, idx) => {
              const isSelected = idx === selMonth && navYear === selYear;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => select(idx, navYear)}
                  style={{
                    padding: "7px 4px", borderRadius: 6, fontSize: 13, fontWeight: isSelected ? 700 : 400,
                    cursor: "pointer", border: "none",
                    background: isSelected ? "#2980b9" : "rgba(255,255,255,0.07)",
                    color: isSelected ? "#fff" : "#8eafd4",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                >
                  {nome}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}