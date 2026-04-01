import { useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase, Lightbulb, RefreshCcw, CheckCircle2,
  Shield, Lock, Globe, FileCheck2, Zap,
  ArrowRight, Send, ChevronRight, Star
} from "lucide-react";

// ─── NAV ────────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
      style={{ background: "rgba(13,17,28,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#3A8DFF,#1A58CC)" }}>
          <FileCheck2 className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-white text-lg tracking-tight">DocFácil</span>
      </div>
      <div className="hidden md:flex items-center gap-8">
        {["Soluções", "Planos", "Segurança", "Contato"].map(item => (
          <a key={item} href="#" className="text-sm font-medium transition-colors" style={{ color: "#A0B1D4" }}
            onMouseEnter={e => e.target.style.color = "#fff"}
            onMouseLeave={e => e.target.style.color = "#A0B1D4"}>
            {item}
          </a>
        ))}
      </div>
      <button className="text-sm font-semibold px-5 py-2 rounded-xl text-white transition-all hover:scale-105"
        style={{ background: "linear-gradient(135deg,#3A8DFF,#1A58CC)", boxShadow: "0 0 20px rgba(58,141,255,0.4)" }}>
        Começar grátis
      </button>
    </nav>
  );
}

// ─── HERO ───────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20"
      style={{ background: "linear-gradient(135deg, #080C15 0%, #0D111C 50%, #1A253A 100%)" }}>
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #3A8DFF, transparent)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #5E9BFF, transparent)" }} />
        {/* Stars */}
        {[...Array(40)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1 + "px",
              height: Math.random() * 2 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: Math.random() * 0.6 + 0.1,
            }} />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-8 py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: "rgba(58,141,255,0.15)", border: "1px solid rgba(58,141,255,0.3)", color: "#5E9BFF" }}>
            <Star className="w-3 h-3" /> Novo: DocFácil Emissor com IA integrada
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
            O primeiro assistente de{" "}
            <span style={{ background: "linear-gradient(90deg,#3A8DFF,#7EC8FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              gestão documental
            </span>{" "}
            com IA que entende seu negócio
          </h1>
          <p className="text-lg mb-10" style={{ color: "#A0B1D4", lineHeight: "1.7" }}>
            O DocFácil combina gestão inteligente de certidões, alvarás e emissão de NF-e com IA conversacional — respostas instantâneas sobre seus documentos e processos fiscais, sem complexidade.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-base transition-all hover:scale-105 hover:shadow-2xl"
              style={{ background: "linear-gradient(135deg,#3A8DFF,#1A58CC)", boxShadow: "0 0 32px rgba(58,141,255,0.5)" }}>
              Teste grátis por 14 dias <ArrowRight className="w-5 h-5" />
            </button>
            <button className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base transition-all hover:bg-white/10"
              style={{ border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}>
              Ver demonstração
            </button>
          </div>
        </motion.div>

        {/* Right - UI Mock */}
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, delay: 0.2 }}>
          <div className="rounded-2xl p-1" style={{ background: "linear-gradient(135deg, rgba(58,141,255,0.4), rgba(26,37,58,0.1))" }}>
            <div className="rounded-xl p-6" style={{ background: "rgba(13,17,28,0.9)", backdropFilter: "blur(24px)" }}>
              {/* Mock Dashboard */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs ml-2" style={{ color: "#A0B1D4" }}>DocFácil Hub · Dashboard</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Certidões Regulares", value: "47", color: "#22c55e" },
                  { label: "Vencendo em 7 dias", value: "3", color: "#f59e0b" },
                  { label: "NF-e Emitidas", value: "128", color: "#3A8DFF" },
                  { label: "Empresas Ativas", value: "12", color: "#a855f7" },
                ].map(stat => (
                  <div key={stat.label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#A0B1D4" }}>{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-3 text-xs" style={{ background: "rgba(58,141,255,0.1)", border: "1px solid rgba(58,141,255,0.2)" }}>
                <span style={{ color: "#5E9BFF" }}>⚡ IA: </span>
                <span style={{ color: "#A0B1D4" }}>3 certidões da Empresa X vencem em 5 dias. Deseja agendar a renovação?</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── MODULES ────────────────────────────────────────────────────────────────
function ModulesSection() {
  const modules = [
    {
      icon: FileCheck2,
      tag: "DocFácil Hub",
      title: "Gestão de Certidões e Documentos",
      desc: "Centralize certidões, alvarás, inscrições estaduais e documentos fiscais de todas as suas empresas em um único painel inteligente. Monitore vencimentos, receba alertas e compartilhe com clientes via link seguro.",
      features: ["Monitoramento automático de vencimentos", "Upload com identificação por IA", "Links seguros para clientes", "Grupos empresariais e filiais"],
      color: "#3A8DFF",
    },
    {
      icon: Zap,
      tag: "DocFácil Emissor",
      title: "Emissão de NF-e com IA",
      desc: "Emita notas fiscais eletrônicas (NF-e Modelo 55) com total integração SEFAZ, gestão de tributação inteligente e histórico completo. Conectado diretamente ao NFE.io para transmissão segura.",
      features: ["Transmissão direta via SEFAZ", "Regras de tributação por IA", "Gestão de destinatários e produtos", "DANFE e XML automáticos"],
      color: "#a855f7",
    },
  ];

  return (
    <section className="py-32 px-8" style={{ background: "#0D111C" }}>
      <div className="max-w-7xl mx-auto">
        <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-4xl font-bold text-white mb-4">Dois módulos. Uma plataforma.</h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "#A0B1D4" }}>
            DocFácil Hub para gestão documental completa e DocFácil Emissor para NF-e — integrados, inteligentes e feitos para contadores.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {modules.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <motion.div key={mod.tag} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="rounded-2xl p-8 group hover:scale-[1.02] transition-all duration-300"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `${mod.color}22`, border: `1px solid ${mod.color}44` }}>
                    <Icon className="w-6 h-6" style={{ color: mod.color }} />
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: `${mod.color}22`, color: mod.color, border: `1px solid ${mod.color}33` }}>
                    {mod.tag}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{mod.title}</h3>
                <p className="mb-6 leading-relaxed" style={{ color: "#A0B1D4" }}>{mod.desc}</p>
                <ul className="space-y-2">
                  {mod.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "#A0B1D4" }}>
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: mod.color }} />
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
    { icon: Briefcase, title: "Centraliza e Conecta", desc: "Conecta automaticamente todos os seus documentos — certidões, alvarás, NF-e — e sistemas fiscais em um só lugar." },
    { icon: Lightbulb, title: "Inteligência Personalizada", desc: "A IA responde suas dúvidas em linguagem humana e sugere ações para sua conformidade fiscal e documental." },
    { icon: RefreshCcw, title: "Atualização Automática", desc: "Monitore vencimentos de certidões, status de NF-e e novas regulamentações — você só toma decisões." },
  ];

  return (
    <section className="py-32 px-8" style={{ background: "#080C15" }}>
      <div className="max-w-7xl mx-auto">
        <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-4xl font-bold text-white mb-4">Por que DocFácil?</h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "#A0B1D4" }}>
            Desenvolvido para contadores e gestores que precisam de controle total, sem a complexidade burocrática.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="rounded-2xl p-8 text-center hover:scale-[1.03] transition-all duration-300 group"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all group-hover:scale-110"
                  style={{ background: "rgba(58,141,255,0.15)", border: "1px solid rgba(58,141,255,0.3)" }}>
                  <Icon className="w-7 h-7" style={{ color: "#5E9BFF" }} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
                <p style={{ color: "#A0B1D4", lineHeight: "1.6" }}>{card.desc}</p>
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
    <section className="py-32 px-8" style={{ background: "linear-gradient(180deg, #0D1B1A 0%, #0A1714 100%)" }}>
      <div className="max-w-5xl mx-auto">
        <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-4xl font-bold text-white mb-4">Você tem perguntas, o DocFácil tem respostas</h2>
          <p style={{ color: "#A0B1D4" }}>IA treinada para gestão documental e fiscal brasileira</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" }}>
          {/* Chat header */}
          <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#3A8DFF,#1A58CC)" }}>
              <FileCheck2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">DocFácil IA</p>
              <p className="text-xs" style={{ color: "#22c55e" }}>● Online</p>
            </div>
          </div>

          {/* Chat body */}
          <div className="px-6 py-8 space-y-4">
            {/* AI message */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#3A8DFF,#1A58CC)" }}>
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="rounded-2xl rounded-tl-none px-4 py-3 text-sm max-w-md" style={{ background: "rgba(58,141,255,0.15)", border: "1px solid rgba(58,141,255,0.2)", color: "#A0B1D4" }}>
                Olá! Como posso ajudar com sua gestão documental e fiscal hoje?
              </div>
            </div>

            {/* Prompt suggestions */}
            <div>
              <p className="text-xs mb-3 ml-11" style={{ color: "#A0B1D4" }}>Sugestões de perguntas:</p>
              <div className="space-y-2 ml-11">
                {prompts.map((prompt, i) => (
                  <motion.button key={i}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.15 }}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm flex items-center justify-between group"
                    style={{
                      background: hovered === i ? "rgba(58,141,255,0.15)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${hovered === i ? "rgba(58,141,255,0.4)" : "rgba(255,255,255,0.08)"}`,
                      color: hovered === i ? "#7EC8FF" : "#A0B1D4",
                      transition: "all 0.2s ease",
                      boxShadow: hovered === i ? "0 0 16px rgba(58,141,255,0.15)" : "none",
                    }}>
                    <span>{prompt}</span>
                    <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#5E9BFF" }} />
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="px-6 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <input readOnly placeholder="Pergunte-me qualquer coisa sobre seus documentos ou emissões..."
                className="flex-1 bg-transparent text-sm outline-none" style={{ color: "#A0B1D4" }} />
              <button className="p-2 rounded-lg transition-colors hover:scale-110" style={{ background: "linear-gradient(135deg,#3A8DFF,#1A58CC)" }}>
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── STATS ──────────────────────────────────────────────────────────────────
function StatsSection() {
  const stats = [
    { value: "+500", label: "Empresas gerenciadas" },
    { value: "99.9%", label: "Uptime garantido" },
    { value: "+12k", label: "NF-e emitidas/mês" },
    { value: "<2min", label: "Para começar" },
  ];

  return (
    <section className="py-20 px-8" style={{ background: "linear-gradient(90deg,#080C15,#0D111C,#080C15)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
            <p className="text-4xl font-extrabold mb-1" style={{ color: "#5E9BFF" }}>{s.value}</p>
            <p className="text-sm" style={{ color: "#A0B1D4" }}>{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── SAFETY ─────────────────────────────────────────────────────────────────
function SafetySection() {
  const items = [
    { icon: Shield, text: "Conformidade com LGPD e regulamentações do setor" },
    { icon: Lock, text: "Mesma segurança que seu internet banking" },
    { icon: Globe, text: "Seus dados nunca saem do Brasil" },
    { icon: CheckCircle2, text: "Criptografia de ponta a ponta" },
  ];

  return (
    <section className="py-32 px-8" style={{ background: "linear-gradient(135deg, #EBE8D8 0%, #DDD9C4 100%)", position: "relative", overflow: "hidden" }}>
      {/* Texture overlay */}
      <div className="absolute inset-0 opacity-30"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.08) 1px, transparent 0)", backgroundSize: "24px 24px" }} />
      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <h2 className="text-4xl font-bold mb-4" style={{ color: "#1A253A" }}>
            Seus dados e documentos estão seguros conosco
          </h2>
          <p style={{ color: "#4A5568" }}>
            Construído com os mais altos padrões de segurança para proteger as informações fiscais e documentais dos seus clientes.
          </p>
        </motion.div>
        <motion.div className="grid grid-cols-1 gap-4" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.text} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.8)", backdropFilter: "blur(8px)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(34,197,94,0.15)" }}>
                  <Icon className="w-5 h-5" style={{ color: "#16a34a" }} />
                </div>
                <p className="font-medium" style={{ color: "#1A253A" }}>{item.text}</p>
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
  const items = [
    "14 dias grátis — cancele quando quiser",
    "Conecte sistemas fiscais e documentos em minutos",
    "Emita NF-e e gerencie certidões sem burocracia",
  ];

  return (
    <section className="py-32 px-8 text-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0A1714 0%, #0D1B1A 100%)" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #3A8DFF, transparent)" }} />
      </div>
      <div className="relative z-10 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-4xl font-bold text-white mb-6">
            Retome o controle da sua gestão documental e fiscal
          </h2>
          <div className="flex flex-col items-center gap-3 mb-10">
            {items.map(item => (
              <div key={item} className="flex items-center gap-2 text-base" style={{ color: "#A0B1D4" }}>
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "#22c55e" }} />
                {item}
              </div>
            ))}
          </div>
          <button className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl text-white font-bold text-lg transition-all hover:scale-105 hover:shadow-2xl"
            style={{ background: "linear-gradient(135deg,#3A8DFF,#1A58CC)", boxShadow: "0 0 40px rgba(58,141,255,0.5)" }}>
            Teste grátis agora <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}

// ─── FOOTER ─────────────────────────────────────────────────────────────────
function Footer() {
  const links = {
    Produto: ["DocFácil Hub", "DocFácil Emissor", "Planos", "Roadmap"],
    Empresa: ["Sobre nós", "Blog", "Carreiras", "Contato"],
    Legal: ["Política de Privacidade", "Termos de Uso", "LGPD"],
  };

  return (
    <footer className="py-16 px-8" style={{ background: "#080C15", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#3A8DFF,#1A58CC)" }}>
                <FileCheck2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">DocFácil</span>
            </div>
            <p className="text-sm" style={{ color: "#A0B1D4", lineHeight: "1.6" }}>
              Gestão documental e emissão fiscal inteligente com IA para contadores e empresas.
            </p>
          </div>
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <p className="text-sm font-bold text-white mb-4">{section}</p>
              <ul className="space-y-3">
                {items.map(item => (
                  <li key={item}>
                    <a href="#" className="text-sm transition-colors"
                      style={{ color: "#A0B1D4" }}
                      onMouseEnter={e => e.target.style.color = "#fff"}
                      onMouseLeave={e => e.target.style.color = "#A0B1D4"}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-sm" style={{ color: "#A0B1D4" }}>© 2026 DocFácil. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            {["Política de Privacidade", "Termos e Condições"].map(item => (
              <a key={item} href="#" className="text-sm transition-colors"
                style={{ color: "#A0B1D4" }}
                onMouseEnter={e => e.target.style.color = "#fff"}
                onMouseLeave={e => e.target.style.color = "#A0B1D4"}>
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
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <HeroSection />
      <StatsSection />
      <ModulesSection />
      <WhySection />
      <AISection />
      <SafetySection />
      <CTASection />
      <Footer />
    </div>
  );
}