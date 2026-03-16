import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Mail, Shield, UserPlus, Loader2 } from "lucide-react";

const roleLabel = { admin: "Administrador", user: "Operador" };
const roleColor = { admin: "bg-purple-50 text-purple-700 border-purple-200", user: "bg-gray-100 text-gray-600 border-gray-200" };

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
    base44.entities.User.list().then(data => {
      setUsuarios(data);
      setLoading(false);
    });
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Membros do Escritório</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gerencie os acessos da sua equipe</p>
      </div>

      {isAdmin && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" /> Convidar novo membro
          </h2>
          <form onSubmit={convidar} className="flex flex-col sm:flex-row gap-3">
            <input
              required
              type="email"
              placeholder="email@escritorio.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="user">Operador</option>
              <option value="admin">Administrador</option>
            </select>
            <button
              type="submit"
              disabled={convidando}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg disabled:opacity-50"
            >
              {convidando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Enviar convite
            </button>
          </form>
          {msg && (
            <p className={`mt-3 text-sm ${msg.tipo === "sucesso" ? "text-green-600" : "text-red-600"}`}>{msg.texto}</p>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-900 dark:text-white">{usuarios.length} membro(s)</span>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {usuarios.map(u => (
              <div key={u.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm">
                    {u.full_name?.[0] || u.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{u.full_name || "—"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1 ${roleColor[u.role] || roleColor.user}`}>
                    <Shield className="w-3 h-3" />
                    {roleLabel[u.role] || u.role}
                  </span>
                  {u.id === user?.id && (
                    <span className="text-xs text-gray-400">(você)</span>
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