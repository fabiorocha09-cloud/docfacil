import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileCheck2, Zap, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const MODULOS = [
  {
    id: "certidaohub",
    label: "DocFácil Hub",
    desc: "Gestão de certidões",
    path: "/Dashboard",
    icon: FileCheck2,
    color: "bg-blue-600",
  },
  {
    id: "emissor",
    label: "DocFácil Emissor",
    desc: "Emissão de NF-e",
    path: "/emissor/painel",
    icon: Zap,
    color: "bg-[#0B63D4]",
  },
];

export default function ModuloDropdown({ moduloAtual = "certidaohub", dark = false }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const atual = MODULOS.find(m => m.id === moduloAtual) || MODULOS[0];
  const Icon = atual.icon;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          "flex items-center gap-2 group rounded-xl px-2 py-1.5 transition-colors",
          dark ? "hover:bg-white/10" : "hover:bg-gray-100 dark:hover:bg-gray-700"
        )}
      >
        <div className={`w-8 h-8 ${dark ? "bg-white/20" : atual.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="text-left hidden sm:block">
          <p className={cn("font-bold text-sm leading-none", dark ? "text-white" : "text-gray-900 dark:text-white")}>{atual.label}</p>
          <p className={cn("text-xs mt-0.5", dark ? "text-white/60" : "text-gray-400")}>{atual.desc}</p>
        </div>
        <ChevronDown className={cn("w-4 h-4 transition-transform ml-1", dark ? "text-white/60" : "text-gray-400", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
          <p className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Módulos</p>
          {MODULOS.map(m => {
            const MIcon = m.icon;
            const isAtual = m.id === moduloAtual;
            return (
              <button
                key={m.id}
                onClick={() => { setOpen(false); navigate(m.path); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 text-left transition-colors",
                  isAtual ? "bg-blue-50 dark:bg-blue-900/30" : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                )}
              >
                <div className={`w-8 h-8 ${m.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <MIcon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-semibold", isAtual ? "text-blue-700 dark:text-blue-400" : "text-gray-800 dark:text-gray-200")}>{m.label}</p>
                  <p className="text-xs text-gray-400">{m.desc}</p>
                </div>
                {isAtual && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}