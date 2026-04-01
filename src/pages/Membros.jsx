import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Mail, Shield, UserPlus, Loader2 } from "lucide-react";

const roleLabel = { admin: "Administrador", user: "Operador" };
const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };
const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" };

export default function Membros() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [convidando, setConvidando] = useState(false);
  const [msg, setMsg] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    carregar();
  }, []);

  const carregar = () => {
    base44.entities.User.list().then(data => { setUsuarios(data); setLoading(false); });
  };

  const convidar = async (e) => {
    e.preventDefault();
    setConvidando(true);
    setMsg(null);
    await base44.users.inviteUser(email, role);
    setMsg({ tipo: "sucesso", texto: `Convite enviado para ${email}` });
    setEmail("");
    setConvidando(false);
    carregar();
  };

  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Exo 2', sans-serif", letterSpacing: "-0.02em" }}>Membros do Escritório</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>Gerencie os acessos da sua equipe</p>
      </div>

      {isAdmin && (
        <div className="rounded-2xl p-5" style={cardStyle}>
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
            <UserPlus className="w-5 h-5" style={{ color: "#5E9BFF" }} /> Convidar novo membro
          </h2>
          <form onSubmit={convidar} className="flex flex-col sm:flex-row gap-3">
            <input required type="email" placeholder="email@escritorio.com"
              value={email} onChange={e => setEmail(e.target.value)}
              className="flex-1 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              style={{ ...inputStyle, fontFamily: "'Rethink Sans', sans-serif" }} />
            <select value={role} onChange={e => setRole(e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              style={{ ...inputStyle, fontFamily: "'Rethink Sans', sans-serif" }}>
              <option value="user" style={{ background: "#0A0D14" }}>Operador</option>
              <option value="admin" style={{ background: "#0A0D14" }}>Administrador</option>
            </select>
            <button type="submit" disabled={convidando}
              className="flex items-center justify-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#3A8DFF,#1A58CC)" }}>
              {convidando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Enviar convite
            </button>
          </form>
          {msg && (
            <p className="mt-3 text-sm" style={{ color: msg.tipo === "sucesso" ? "#4ade80" : "#f87171", fontFamily: "'Rethink Sans', sans-serif" }}>{msg.texto}</p>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />)}</div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <div className="p-4 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <Users className="w-5 h-5" style={{ color: "#6B7FA3" }} />
            <span className="font-medium text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>{usuarios.length} membro(s)</span>
          </div>
          <div>
            {usuarios.map(u => (
              <div key={u.id} className="flex items-center justify-between px-5 py-4 transition-colors"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{ background: "rgba(58,141,255,0.15)", color: "#5E9BFF", fontFamily: "'Manrope', sans-serif" }}>
                    {u.full_name?.[0] || u.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>{u.full_name || "—"}</p>
                    <p className="text-xs" style={{ color: "#6B7FA3", fontFamily: "'Rethink Sans', sans-serif" }}>{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1"
                    style={{
                      background: u.role === "admin" ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.07)",
                      color: u.role === "admin" ? "#c084fc" : "#A0B1D4",
                      border: u.role === "admin" ? "1px solid rgba(168,85,247,0.3)" : "1px solid rgba(255,255,255,0.1)",
                      fontFamily: "'Outfit', sans-serif",
                    }}>
                    <Shield className="w-3 h-3" />
                    {roleLabel[u.role] || u.role}
                  </span>
                  {u.id === user?.id && (
                    <span className="text-xs" style={{ color: "#6B7FA3", fontFamily: "'Outfit', sans-serif" }}>(você)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}