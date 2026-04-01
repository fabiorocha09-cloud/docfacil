import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileCheck2, Zap, Briefcase, Lightbulb, RefreshCcw,
  CheckCircle2, Shield, Lock, Globe, ArrowRight,
  Send, ChevronRight, Star, Building2, FileText, Bell
} from "lucide-react";

// ─── FONTS via Google Fonts inline style ────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Exo+2:wght@400;600;700;900&family=Outfit:wght@300;400;500&family=Rethink+Sans:wght@400;500;600;700&display=swap";
if (!document.querySelector('link[href*="Manrope"]')) document.head.appendChild(fontLink);

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const D = {
  bg: "#0A0D14",
  bgCard: "rgba(255,255,255,0.04)",
  bgCardHover: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(94,155,255,0.4)",
  blue: "#3A8DFF",
  blueLight: "#5E9BFF",
  blueDark: "#1A58CC",
  textPrimary: "#FFFFFF",
  textSecondary: "#A0B1D4",
  textMuted: "#6B7FA3",
  success: "#22c55e",
  sectionDark: "#060810",
  sectionAlt: "#0D1117",
  gradBlue: "linear-gradient(135deg, #3A8DFF 0%, #1A58CC 100%)",
  gradBlueSoft: "linear-gradient(135deg, rgba(58,141,255,0.15) 0%, rgba(26,88,204,0.05) 100%)",
};

const fadeUp = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22,1,0.36,1] } } };
const fadeIn = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.5 } } };

// ─── BADGE ──────────────────────────────────────────────────────────────────
function Badge({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase"
      style={{ background: "rgba(58,141,255,0.12)", border: "1px solid rgba(58,141,255,0.25)", color: D.blueLight, fontFamily: "'Outfit', sans-serif" }}>
      {children}
    </span>
  );
}

// ─── BUTTON ─────────────────────────────────────────────────────────────────
function PrimaryBtn({ children, large }) {
  return (
    <button
      className={`inline-flex items-center gap-2 font-bold text-white rounded-2xl transition-all hover:scale-[1.03] active:scale-[0.98]`}
      style={{
        background: D.gradBlue,
        boxShadow: "0 0 32px rgba(58,141,255,0.35), 0 4px 16px rgba(0,0,0,0.4)",
        padding: large ? "18px 36px" : "13px 28px",
        fontSize: large ? "17px" : "15px",
        fontFamily: "'Manrope', sans-serif",
      }}>
      {children}
    </button>
  );
}

function GhostBtn({ children }) {
  return (
    <button className="inline-flex items-center gap-2 rounded-2xl font-semibold transition-all hover:bg-white/5"
      style={{ border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "13px 28px", fontSize: "15px", fontFamily: "'Manrope', sans-serif" }}>
      {children}
    </button>
  );
}

// ─── NAVBAR ─────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50"
      style={{ background: "rgba(6,8,16,0.8)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${D.border}` }}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: D.gradBlue }}>
            <FileCheck2 className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
          </div>
          <span className="font-bold text-white text-lg" style={{ fontFamily: "'Manrope', sans-serif", letterSpacing: "-0.02em" }}>DocFácil</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {["Hub", "Emissor", "Planos", "Segurança"].map(item => (
            <a key={item} href="#" className="text-sm font-medium transition-colors"
              style={{ color: D.textSecondary, fontFamily: "'Rethink Sans', sans-serif" }}
              onMouseEnter={e => e.target.style.color = "#fff"}
              onMouseLeave={e => e.target.style.color = D.textSecondary}>
              {item}
            </a>
          ))}
        </div>

        <PrimaryBtn>Começar grátis</PrimaryBtn>
      </div>
    </nav>
  );
}

// ─── HERO ───────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20"
      style={{ background: `radial-gradient(ellipse 80% 60% at 50% -10%, rgba(58,141,255,0.18) 0%, transparent 60%), ${D.sectionDark}` }}>

      {/* Grid texture */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

      {/* Glow orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(58,141,255,0.12) 0%, transparent 70%)", filter: "blur(40px)" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        {/* Center hero */}
        <motion.div className="text-center max-w-4xl mx-auto" variants={fadeUp} initial="hidden" animate="show">
          <Badge><Star className="w-3 h-3" /> Agora com IA Conversacional</Badge>

          <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight"
            style={{ fontFamily: "'Exo 2', sans-serif" }}>
            Gestão documental{" "}
            <span className="relative inline-block">
              <span style={{ background: "linear-gradient(90deg, #3A8DFF, #7EC8FF, #3A8DFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                inteligente
              </span>
            </span>{" "}
            para contadores
          </h1>

          <p className="mt-6 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
            style={{ color: D.textSecondary, fontFamily: "'Rethink Sans', sans-serif" }}>
            DocFácil combina gestão de certidões, alvarás e emissão de NF-e com IA conversacional — respostas instantâneas sobre seus processos fiscais, sem complexidade.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <PrimaryBtn large>
              Teste grátis por 14 dias <ArrowRight className="w-5 h-5" />
            </PrimaryBtn>
            <GhostBtn>Ver demonstração</GhostBtn>
          </div>

          {/* Social proof */}
          <div className="mt-10 flex items-center justify-center gap-8 flex-wrap">
            {["+500 empresas", "99.9% uptime", "LGPD compliant"].map(s => (
              <div key={s} className="flex items-center gap-2 text-sm" style={{ color: D.textMuted, fontFamily: "'Outfit', sans-serif" }}>
                <CheckCircle2 className="w-4 h-4" style={{ color: D.success }} />
                {s}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Dashboard preview */}
        <motion.div className="mt-20 max-w-5xl mx-auto" variants={fadeIn} initial="hidden" animate="show"
          transition={{ delay: 0.3 }}>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(13,17,35,0.9)", border: `1px solid ${D.border}`, boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 80px rgba(58,141,255,0.08)" }}>
            {/* Browser bar */}
            <div className="flex items-center gap-2 px-5 py-3" style={{ background: "rgba(255,255,255,0.03)", borderBottom: `1px solid ${D.border}` }}>
              <div className="flex gap-1.5">
                {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />)}
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-lg text-xs" style={{ background: "rgba(255,255,255,0.05)", color: D.textMuted, fontFamily: "'Outfit', sans-serif" }}>
                  app.docfacil.com.br/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Certidões Regulares", val: "47", color: D.success, icon: CheckCircle2 },
                { label: "Vencendo em 7 dias", val: "3", color: "#f59e0b", icon: Bell },
                { label: "NF-e Emitidas/mês", val: "128", color: D.blue, icon: FileText },
                { label: "Empresas Ativas", val: "12", color: "#a855f7", icon: Building2 },
              ].map(stat => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="rounded-xl p-4" style={{ background: D.bgCard, border: `1px solid ${D.border}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <Icon className="w-4 h-4" style={{ color: stat.color }} />
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${stat.color}22`, color: stat.color, fontFamily: "'Outfit', sans-serif" }}>↑ 12%</span>
                    </div>
                    <p className="text-2xl font-extrabold" style={{ color: stat.color, fontFamily: "'Manrope', sans-serif" }}>{stat.val}</p>
                    <p className="text-xs mt-0.5" style={{ color: D.textMuted, fontFamily: "'Rethink Sans', sans-serif" }}>{stat.label}</p>
                  </div>
                );
              })}
            </div>

            {/* AI bar */}
            <div className="mx-6 mb-6 rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: "rgba(58,141,255,0.08)", border: "1px solid rgba(58,141,255,0.2)" }}>
              <Zap className="w-4 h-4 flex-shrink-0" style={{ color: D.blueLight }} />
              <p className="text-sm" style={{ color: D.textSecondary, fontFamily: "'Rethink Sans', sans-serif" }}>
                <span style={{ color: D.blueLight, fontWeight: 600 }}>IA DocFácil:</span> 3 certidões da Empresa Alfa vencem em 5 dias. Deseja agendar a renovação automática?
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── STATS ──────────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { val: "+500", label: "Empresas gerenciadas" },
    { val: "99.9%", label: "Uptime garantido" },
    { val: "+12k", label: "NF-e emitidas/mês" },
    { val: "<2min", label: "Para começar" },
  ];

  return (
    <section style={{ background: D.sectionAlt, borderTop: `1px solid ${D.border}`, borderBottom: `1px solid ${D.border}` }}>
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((s, i) => (
          <motion.div key={s.label} variants={fadeUp} initial="hidden" whileInView="show"
            viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
            <p className="text-4xl font-extrabold" style={{ color: D.blueLight, fontFamily: "'Exo 2', sans-serif" }}>{s.val}</p>
            <p className="text-sm mt-1" style={{ color: D.textMuted, fontFamily: "'Rethink Sans', sans-serif" }}>{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── MODULES ────────────────────────────────────────────────────────────────
function ModulesSection() {
  const modules = [
    {
      icon: FileCheck2, tag: "DocFácil Hub", tagColor: D.blue,
      title: "Gestão Inteligente de Certidões e Documentos",
      desc: "Centralize certidões, alvarás, inscrições estaduais e documentos fiscais de todas as suas empresas em um único painel. Monitore vencimentos, receba alertas e compartilhe com clientes via link seguro.",
      features: ["Monitoramento automático de vencimentos", "Upload com identificação por IA", "Links seguros para clientes", "Gestão de grupos empresariais e filiais"],
    },
    {
      icon: Zap, tag: "DocFácil Emissor", tagColor: "#a855f7",
      title: "Emissão de NF-e com IA Integrada",
      desc: "Emita notas fiscais eletrônicas (NF-e Modelo 55) com total integração SEFAZ, gestão de tributação inteligente e histórico completo. Conectado diretamente ao NFE.io.",
      features: ["Transmissão direta via SEFAZ/NFE.io", "Regras de tributação automáticas", "DANFE e XML gerados automaticamente", "Histórico completo e cancelamento"],
    },
  ];

  return (
    <section className="py-32 px-6" style={{ background: D.sectionDark }}>
      <div className="max-w-7xl mx-auto">
        <motion.div className="text-center mb-16" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <Badge>Plataforma completa</Badge>
          <h2 className="mt-5 text-4xl sm:text-5xl font-extrabold text-white"
            style={{ fontFamily: "'Exo 2', sans-serif", letterSpacing: "-0.02em" }}>
            Dois módulos. Uma plataforma.
          </h2>
          <p className="mt-4 text-lg max-w-xl mx-auto" style={{ color: D.textSecondary, fontFamily: "'Rethink Sans', sans-serif" }}>
            Hub para gestão documental e Emissor para NF-e — integrados, inteligentes, feitos para contadores.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {modules.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <motion.div key={mod.tag} variants={fadeUp} initial="hidden" whileInView="show"
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="group rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1"
                style={{ background: D.bgCard, border: `1px solid ${D.border}`, backdropFilter: "blur(12px)" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${mod.tagColor}44`}
                onMouseLeave={e => e.currentTarget.style.borderColor = D.border}>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: `${mod.tagColor}18`, border: `1px solid ${mod.tagColor}33` }}>
                    <Icon className="w-6 h-6" style={{ color: mod.tagColor }} />
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: `${mod.tagColor}15`, color: mod.tagColor, border: `1px solid ${mod.tagColor}30`, fontFamily: "'Outfit', sans-serif", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    {mod.tag}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Manrope', sans-serif", letterSpacing: "-0.02em" }}>{mod.title}</h3>
                <p className="leading-relaxed mb-6" style={{ color: D.textSecondary, fontFamily: "'Rethink Sans', sans-serif" }}>{mod.desc}</p>

                <ul className="space-y-2.5">
                  {mod.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: D.textSecondary, fontFamily: "'Rethink Sans', sans-serif" }}>
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: `${mod.tagColor}20` }}>
                        <CheckCircle2 className="w-3 h-3" style={{ color: mod.tagColor }} />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── WHY ────────────────────────────────────────────────────────────────────
function WhySection() {
  const cards = [
    { icon: Briefcase, title: "Centraliza e Conecta", desc: "Certidões, alvarás, NF-e e sistemas fiscais em um só lugar. Fim das planilhas e emails perdidos." },
    { icon: Lightbulb, title: "Inteligência Personalizada", desc: "A IA responde suas dúvidas em linguagem humana e sugere ações para conformidade fiscal e documental." },
    { icon: RefreshCcw, title: "Atualização Automática", desc: "Monitore vencimentos, status de NF-e e regulamentações automaticamente — você só toma decisões." },
  ];

  return (
    <section className="py-32 px-6" style={{ background: D.sectionAlt }}>
      <div className="max-w-7xl mx-auto">
        <motion.div className="text-center mb-16" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <Badge>Diferenciais</Badge>
          <h2 className="mt-5 text-4xl sm:text-5xl font-extrabold text-white"
            style={{ fontFamily: "'Exo 2', sans-serif", letterSpacing: "-0.02em" }}>
            Por que DocFácil?
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.title} variants={fadeUp} initial="hidden" whileInView="show"
                viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                className="rounded-3xl p-8 group hover:-translate-y-1 transition-all duration-300"
                style={{ background: D.bgCard, border: `1px solid ${D.border}` }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(58,141,255,0.3)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = D.border}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: "rgba(58,141,255,0.1)", border: "1px solid rgba(58,141,255,0.2)" }}>
                  <Icon className="w-7 h-7" style={{ color: D.blueLight }} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "'Manrope', sans-serif" }}>{card.title}</h3>
                <p style={{ color: D.textSecondary, lineHeight: 1.65, fontFamily: "'Rethink Sans', sans-serif" }}>{card.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── AI CHAT ────────────────────────────────────────────────────────────────
function AISection() {
  const [hovered, setHovered] = useState(null);
  const prompts = [
    "Quais certidões da empresa X vencem este mês?",
    "Qual o status do processo Y da empresa Z?",
    "Como posso otimizar a emissão das minhas NF-e?",
    "Preciso de um alvará de funcionamento, quais os passos?",
    "Como posso automatizar o upload de documentos?",
  ];

  return (
    <section className="py-32 px-6 relative overflow-hidden" style={{ background: D.sectionDark }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(58,141,255,0.06) 0%, transparent 70%)" }} />

      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.div className="text-center mb-14" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <Badge>IA Conversacional</Badge>
          <h2 className="mt-5 text-4xl sm:text-5xl font-extrabold text-white"
            style={{ fontFamily: "'Exo 2', sans-serif", letterSpacing: "-0.02em" }}>
            Você pergunta, o DocFácil responde
          </h2>
          <p className="mt-4" style={{ color: D.textSecondary, fontFamily: "'Rethink Sans', sans-serif" }}>
            IA treinada em gestão documental e fiscal brasileira
          </p>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="rounded-3xl overflow-hidden"
          style={{ background: "rgba(10,13,20,0.95)", border: `1px solid ${D.border}`, boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: `1px solid ${D.border}`, background: D.bgCard }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: D.gradBlue }}>
              <FileCheck2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>DocFácil IA</p>
              <p className="text-xs" style={{ color: D.success, fontFamily: "'Outfit', sans-serif" }}>● Disponível</p>
            </div>
          </div>

          {/* Messages */}
          <div className="px-6 py-7 space-y-5">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: D.gradBlue }}>
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="rounded-2xl rounded-tl-none px-4 py-3 text-sm max-w-sm"
                style={{ background: "rgba(58,141,255,0.12)", border: "1px solid rgba(58,141,255,0.18)", color: D.textSecondary, fontFamily: "'Rethink Sans', sans-serif" }}>
                Olá! Como posso ajudar com sua gestão documental e fiscal hoje?
              </div>
            </div>

            <div className="ml-11">
              <p className="text-xs mb-3" style={{ color: D.textMuted, fontFamily: "'Outfit', sans-serif" }}>Sugestões:</p>
              <div className="space-y-2">
                {prompts.map((prompt, i) => (
                  <motion.button key={i}
                    onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                    whileHover={{ scale: 1.015, x: 4 }} transition={{ duration: 0.15 }}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm flex items-center justify-between gap-3 group"
                    style={{
                      background: hovered === i ? "rgba(58,141,255,0.12)" : D.bgCard,
                      border: `1px solid ${hovered === i ? "rgba(58,141,255,0.35)" : D.border}`,
                      color: hovered === i ? D.blueLight : D.textSecondary,
                      transition: "all 0.18s ease",
                      boxShadow: hovered === i ? "0 0 20px rgba(58,141,255,0.1)" : "none",
                      fontFamily: "'Rethink Sans', sans-serif",
                    }}>
                    <span>{prompt}</span>
                    <ChevronRight className="w-4 h-4 flex-shrink-0 transition-all" style={{ color: D.blueLight, opacity: hovered === i ? 1 : 0, transform: hovered === i ? "translateX(2px)" : "none" }} />
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="px-6 pb-6">
            <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: D.bgCard, border: `1px solid ${D.border}` }}>
              <input readOnly placeholder="Pergunte sobre seus documentos ou emissões..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: D.textSecondary, fontFamily: "'Rethink Sans', sans-serif" }} />
              <button className="p-2.5 rounded-xl transition-transform hover:scale-110" style={{ background: D.gradBlue }}>
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── SAFETY ─────────────────────────────────────────────────────────────────
function SafetySection() {
  const items = [
    { icon: Shield, text: "Conformidade total com LGPD e regulamentações do setor" },
    { icon: Lock, text: "Mesma segurança que seu internet banking" },
    { icon: Globe, text: "Seus dados nunca saem do Brasil" },
    { icon: CheckCircle2, text: "Criptografia de ponta a ponta em todos os dados" },
  ];

  return (
    <section className="py-32 px-6 relative overflow-hidden" style={{ background: D.sectionAlt }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <Badge>Segurança</Badge>
          <h2 className="mt-5 text-4xl sm:text-5xl font-extrabold text-white leading-tight"
            style={{ fontFamily: "'Exo 2', sans-serif", letterSpacing: "-0.02em" }}>
            Seus dados estão{" "}
            <span style={{ background: "linear-gradient(90deg,#22c55e,#4ade80)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              seguros
            </span>{" "}
            conosco
          </h2>
          <p className="mt-4 text-lg leading-relaxed" style={{ color: D.textSecondary, fontFamily: "'Rethink Sans', sans-serif" }}>
            Construído com os mais altos padrões de segurança para proteger as informações fiscais e documentais dos seus clientes.
          </p>
        </motion.div>

        <motion.div className="space-y-3" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ delay: 0.15 }}>
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.text} variants={fadeUp} initial="hidden" whileInView="show"
                viewport={{ once: true }} transition={{ delay: 0.1 + i * 0.08 }}
                className="flex items-center gap-4 p-4 rounded-2xl transition-all"
                style={{ background: D.bgCard, border: `1px solid ${D.border}` }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = D.border}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(34,197,94,0.12)" }}>
                  <Icon className="w-5 h-5" style={{ color: D.success }} />
                </div>
                <p className="font-medium" style={{ color: D.textSecondary, fontFamily: "'Rethink Sans', sans-serif" }}>{item.text}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

// ─── CTA ────────────────────────────────────────────────────────────────────
function CTASection() {
  const perks = [
    "14 dias grátis — cancele quando quiser",
    "Conecte documentos e sistemas fiscais em minutos",
    "Emita NF-e e gerencie certidões sem burocracia",
  ];

  return (
    <section className="py-32 px-6 relative overflow-hidden" style={{ background: D.sectionDark }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(58,141,255,0.09) 0%, transparent 70%)" }} />

      <motion.div className="relative z-10 max-w-3xl mx-auto text-center"
        variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <Badge>Comece agora</Badge>
        <h2 className="mt-5 text-4xl sm:text-5xl font-extrabold text-white leading-tight"
          style={{ fontFamily: "'Exo 2', sans-serif", letterSpacing: "-0.02em" }}>
          Retome o controle da sua gestão documental e fiscal
        </h2>

        <div className="mt-8 flex flex-col items-center gap-3">
          {perks.map(p => (
            <div key={p} className="flex items-center gap-2.5 text-base" style={{ color: D.textSecondary, fontFamily: "'Rethink Sans', sans-serif" }}>
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: D.success }} />
              {p}
            </div>
          ))}
        </div>

        <div className="mt-10">
          <PrimaryBtn large>Teste grátis agora <ArrowRight className="w-5 h-5" /></PrimaryBtn>
        </div>
      </motion.div>
    </section>
  );
}

// ─── FOOTER ─────────────────────────────────────────────────────────────────
function Footer() {
  const nav = {
    Produto: ["DocFácil Hub", "DocFácil Emissor", "Planos", "Novidades"],
    Empresa: ["Sobre nós", "Blog", "Carreiras", "Contato"],
    Legal: ["Política de Privacidade", "Termos de Uso", "LGPD"],
  };

  return (
    <footer style={{ background: D.sectionDark, borderTop: `1px solid ${D.border}` }}>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: D.gradBlue }}>
                <FileCheck2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>DocFácil</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: D.textMuted, fontFamily: "'Rethink Sans', sans-serif" }}>
              Gestão documental e emissão fiscal inteligente com IA para contadores.
            </p>
          </div>

          {Object.entries(nav).map(([section, items]) => (
            <div key={section}>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: D.textMuted, fontFamily: "'Outfit', sans-serif" }}>{section}</p>
              <ul className="space-y-3">
                {items.map(item => (
                  <li key={item}>
                    <a href="#" className="text-sm transition-colors" style={{ color: D.textSecondary, fontFamily: "'Rethink Sans', sans-serif" }}
                      onMouseEnter={e => e.target.style.color = "#fff"}
                      onMouseLeave={e => e.target.style.color = D.textSecondary}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 gap-4"
          style={{ borderTop: `1px solid ${D.border}` }}>
          <p className="text-sm" style={{ color: D.textMuted, fontFamily: "'Outfit', sans-serif" }}>© 2026 DocFácil. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            {["Política de Privacidade", "Termos de Uso"].map(item => (
              <a key={item} href="#" className="text-sm transition-colors" style={{ color: D.textMuted, fontFamily: "'Rethink Sans', sans-serif" }}
                onMouseEnter={e => e.target.style.color = "#fff"}
                onMouseLeave={e => e.target.style.color = D.textMuted}>
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Rethink Sans', sans-serif", background: D.sectionDark }}>
      <Navbar />
      <HeroSection />
      <StatsBar />
      <ModulesSection />
      <WhySection />
      <AISection />
      <SafetySection />
      <CTASection />
      <Footer />
    </div>
  );
}