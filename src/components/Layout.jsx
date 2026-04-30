import { Link, Outlet, useLocation } from "react-router-dom";
import ModuloDropdown from "@/components/ModuloDropdown";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/context/ThemeContext";
import {
  LayoutDashboard, Building2, FileCheck2, Settings, Menu, X, LogOut, ChevronRight, ClipboardList, Upload, Users, Sun, Moon, Layers, MessageSquare, FolderOpen, BadgeCheck, CalendarDays, BookOpen, Zap, ChevronDown, Phone, ShieldAlert, TrendingUp, AlertTriangle, SlidersHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", path: "/Dashboard", icon: LayoutDashboard },
  { label: "Empresas", path: "/Empresas", icon: Building2 },
  { label: "Certidões", path: "/Certidoes", icon: FileCheck2 },
  { label: "Upload de Certidões", path: "/UploadCertidoes", icon: Upload },
  { label: "Upload Outros Docs", path: "/UploadOutrosDocumentos", icon: FolderOpen },
  { label: "Configurações", path: "/Configuracoes", icon: Settings },
  { label: "Logs do Robô", path: "/LogsRobo", icon: ClipboardList },
  { label: "Membros", path: "/Membros", icon: Users },
  { label: "Grupos Empresariais", path: "/GruposEmpresariais", icon: Layers },
  { label: "Central de Respostas", path: "/CentralRespostas", icon: MessageSquare },
  { label: "Controle de IE", path: "/ControleIE", icon: BadgeCheck },
  { label: "Calendário de Vencimentos", path: "/CalendarioCertidoes", icon: CalendarDays },
  { label: "Modelos de Documento", path: "/ModelosDocumento", icon: BookOpen },
  { label: "Contatos WhatsApp", path: "/ContatosWhatsApp", icon: Phone },
];

const passivoNavItems = [
  { label: "Painel Fiscal", path: "/passivo/dashboard", icon: TrendingUp },
  { label: "Raio-X por Empresa", path: "/passivo/empresa", icon: ShieldAlert },
  { label: "Pendências Fiscais", path: "/passivo/pendencias", icon: AlertTriangle },
  { label: "Modelos de Documentos", path: "/passivo/modelos", icon: BookOpen },
];

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const sidebarBg = "#08090F";
  const borderColor = "rgba(255,255,255,0.07)";

  return (
    <div className="min-h-screen flex" style={{ background: "#0A0D14" }}>
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300",
        "lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )} style={{ background: sidebarBg, borderRight: `1px solid ${borderColor}` }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <ModuloDropdown moduloAtual="certidaohub" />
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden" style={{ color: "#6B7FA3" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ label, path, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link key={path} to={path} onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: isActive ? "rgba(58,141,255,0.12)" : "transparent",
                  color: isActive ? "#5E9BFF" : "#6B7FA3",
                  fontFamily: "'Rethink Sans', sans-serif",
                  borderLeft: isActive ? "2px solid #3A8DFF" : "2px solid transparent",
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#A0B1D4"; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7FA3"; } }}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: "#5E9BFF" }} />}
              </Link>
            );
          })}

          {/* Módulo Passivo & Raio-X */}
          <div className="pt-3 pb-1">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "#3B4B6B", fontFamily: "'Outfit', sans-serif" }}>
              Passivo & Raio-X
            </p>
            {passivoNavItems.map(({ label, path, icon: Icon }) => {
              const isActive = location.pathname === path || location.pathname.startsWith(path);
              return (
                <Link key={path} to={path} onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: isActive ? "rgba(230,57,70,0.1)" : "transparent",
                    color: isActive ? "#f87171" : "#6B7FA3",
                    fontFamily: "'Rethink Sans', sans-serif",
                    borderLeft: isActive ? "2px solid #E63946" : "2px solid transparent",
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#A0B1D4"; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7FA3"; } }}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: "#f87171" }} />}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 flex-shrink-0" style={{ borderTop: `1px solid ${borderColor}` }}>
          {user && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold" style={{ background: "rgba(58,141,255,0.15)", color: "#5E9BFF", fontFamily: "'Manrope', sans-serif" }}>
                {user.full_name?.[0] || user.email[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate" style={{ fontFamily: "'Manrope', sans-serif" }}>{user.full_name || user.email}</p>
                <p className="text-xs capitalize" style={{ color: "#6B7FA3", fontFamily: "'Outfit', sans-serif" }}>{user.role || "operador"}</p>
              </div>
            </div>
          )}
          <button onClick={toggleTheme} className="flex items-center gap-2 text-sm w-full mb-2 transition-colors" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}
            onMouseEnter={e => e.currentTarget.style.color = "#A0B1D4"} onMouseLeave={e => e.currentTarget.style.color = "#6B7FA3"}>
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
          </button>
          <button onClick={() => base44.auth.logout('/')} className="flex items-center gap-2 text-sm transition-colors" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}
            onMouseEnter={e => e.currentTarget.style.color = "#f87171"} onMouseLeave={e => e.currentTarget.style.color = "#6B7FA3"}>
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 py-3 flex items-center gap-3 lg:hidden" style={{ background: sidebarBg, borderBottom: `1px solid ${borderColor}` }}>
          <button onClick={() => setSidebarOpen(true)} style={{ color: "#A0B1D4" }}>
            <Menu className="w-6 h-6" />
          </button>
          <ModuloDropdown moduloAtual="certidaohub" />
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}