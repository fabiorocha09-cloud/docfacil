import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import ModuloDropdown from "@/components/ModuloDropdown";
import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { LayoutDashboard, FileText, History, Users, ShieldCheck, ArrowLeft, Menu, ChevronDown, BookOpen, CreditCard, Layers, Package, Settings, Building2, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Dashboard", path: "/emissor/dashboard", icon: LayoutDashboard },
  { label: "Emitir NF-e", path: "/emissor/emitir", icon: FileText },
  { label: "Histórico", path: "/emissor/historico", icon: History },
  { label: "Destinatários", path: "/emissor/destinatarios", icon: Users },
  { label: "Certificados", path: "/emissor/certificados", icon: ShieldCheck },
];

const cadastros = [
  { label: "Produtos", path: "/emissor/produtos", icon: Package },
  { label: "Tributação", path: "/emissor/tributacao", icon: BookOpen },
  { label: "Formas de Pagamento", path: "/emissor/formas-pagamento", icon: CreditCard },
  { label: "Naturezas", path: "/emissor/naturezas", icon: Layers },
  { label: "Configurações NF-e", path: "/emissor/configuracao", icon: Settings },
  { label: "Editar Empresa", path: "/emissor/empresa", icon: Building2 },
];

export default function EmissorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [client, setClient] = useState(null);
  const [cadastrosOpen, setCadastrosOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    try {
      const c = localStorage.getItem("emissor_current_client");
      if (c) setClient(JSON.parse(c));
      else navigate("/emissor/painel");
    } catch {
      navigate("/emissor/painel");
    }
  }, []);

  const voltar = () => {
    navigate("/Dashboard");
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <header className={`h-14 flex items-center px-4 gap-3 shadow-md z-30 relative ${theme === 'dark' ? 'bg-gray-800 border-b border-gray-700' : 'bg-white border-b border-gray-200'}`}>
        <button onClick={() => setOpen(v => !v)} className={`lg:hidden ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <ModuloDropdown moduloAtual="emissor" dark={theme === 'dark'} />
        </div>
        {client && (
          <div className={`hidden sm:flex items-center gap-2 rounded-lg px-3 py-1.5 max-w-xs backdrop-blur-md ${theme === 'dark' ? 'bg-white/10 border border-white/20' : 'bg-white/20 border border-white/30'}`}>
            <div className="min-w-0">
              <p className={`text-xs font-semibold truncate leading-none ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{client.razao_social}</p>
              <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>{client.cnpj}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-lg transition-all backdrop-blur-md" style={theme === 'dark' ? { backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' } : { backgroundColor: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}>
            {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-300" /> : <Moon className="w-4 h-4 text-gray-700" />}
          </button>
          <button onClick={voltar} className={`flex items-center gap-1.5 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Painel</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <aside className={cn(
          `fixed top-14 bottom-0 left-0 z-20 w-52 transition-transform duration-300 ${theme === 'dark' ? 'bg-gray-800 border-r border-gray-700' : 'bg-white border-r border-gray-100'}`,
          "lg:static lg:top-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}>
          <nav className="p-3 space-y-1">
            {nav.map(({ label, path, icon: Icon }) => (
              <Link key={path} to={path} onClick={() => setOpen(false)}
                className={cn(
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors`,
                    location.pathname === path ? (theme === 'dark' ? "text-blue-400 bg-blue-900/30" : "text-[#0B63D4] bg-[#E6F0FF]") : (theme === 'dark' ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100")
                 )}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            ))}
            {/* Submenu Cadastros */}
            <div>
              <button
               onClick={() => setCadastrosOpen(v => !v)}
               className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
               <BookOpen className="w-4 h-4 flex-shrink-0" />
               Cadastros
                <ChevronDown className={cn("w-4 h-4 ml-auto transition-transform", cadastrosOpen && "rotate-180")} />
              </button>
              {cadastrosOpen && (
                <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-2">
                  {cadastros.map(({ label, path, icon: Icon }) => (
                    <Link key={path} to={path} onClick={() => setOpen(false)}
                      className={cn(
                        `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors`,
                        location.pathname === path ? (theme === 'dark' ? "text-blue-400 bg-blue-900/30" : "text-[#0B63D4] bg-[#E6F0FF]") : (theme === 'dark' ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100")
                      )}>
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </aside>

        {open && <div className="fixed inset-0 z-10 bg-black/20 lg:hidden" onClick={() => setOpen(false)} />}

        <main className={`flex-1 p-4 lg:p-6 overflow-auto min-w-0 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}