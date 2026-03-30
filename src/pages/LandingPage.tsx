import { Link } from "react-router-dom";
import { Bot, Shield, Zap, BarChart3, FileText, Users, ChevronRight, Check, Globe, Smartphone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PWAInstallButton from "@/components/PWAInstallButton";

const features = [
  { icon: Bot, title: "IA Contábil Avançada", desc: "GPT-5, Gemini Pro e mais integrados para automatizar lançamentos, classificações e consultas fiscais." },
  { icon: Zap, title: "Automação Total", desc: "Importação de XML, conciliação bancária e geração de obrigações acessórias 100% automatizadas." },
  { icon: Shield, title: "Segurança & Compliance", desc: "Dados criptografados, backup automático e conformidade com LGPD e normas contábeis." },
  { icon: BarChart3, title: "BI & Relatórios", desc: "Dashboards inteligentes com insights em tempo real sobre o seu escritório." },
  { icon: FileText, title: "Gestão Documental", desc: "Assinatura digital, armazenamento em nuvem e organização automática de documentos." },
  { icon: Users, title: "Portal do Cliente", desc: "Seus clientes acessam documentos, enviam arquivos e acompanham obrigações em um único lugar." },
];

const plans = [
  { name: "Starter", price: "R$ 197", period: "/mês", features: ["Até 50 clientes", "5 módulos", "1 usuário", "Suporte por email", "IA básica"], highlighted: false },
  { name: "Professional", price: "R$ 497", period: "/mês", features: ["Até 200 clientes", "Todos os módulos", "5 usuários", "Suporte prioritário", "IA avançada", "Portal do cliente"], highlighted: true },
  { name: "Enterprise", price: "R$ 997", period: "/mês", features: ["Clientes ilimitados", "Todos os módulos", "Usuários ilimitados", "Suporte 24/7", "IA premium", "API completa", "White-label"], highlighted: false },
];

const stats = [
  { value: "90mil+", label: "Escritórios no Brasil" },
  { value: "530mil+", label: "Contadores Ativos" },
  { value: "99.9%", label: "Uptime Garantido" },
  { value: "10x", label: "Mais Produtividade" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">Seu Contador IA</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Recursos</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Planos</a>
            <a href="#ai" className="hover:text-foreground transition-colors">IA</a>
          </nav>
          <div className="flex items-center gap-3">
            <PWAInstallButton />
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="gap-1">Começar grátis <ArrowRight className="w-3.5 h-3.5" /></Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-28 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full">
              <Zap className="w-3.5 h-3.5" /> Potencializado por IA de última geração
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              O ERP contábil com{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Inteligência Artificial
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Automatize seu escritório contábil com as melhores IAs do mercado. 
              GPT-5, Gemini Pro e mais — tudo integrado em uma única plataforma.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/login">
                <Button size="lg" className="text-base px-8 gap-2 h-12">
                  Começar agora <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="text-base px-8 h-12">
                  Conhecer recursos
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <div className="font-display text-3xl md:text-4xl font-bold text-primary">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold">Tudo que seu escritório precisa</h2>
          <p className="text-muted-foreground mt-3 text-lg">15+ módulos integrados com inteligência artificial</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(f => (
            <div key={f.title} className="group bg-card border rounded-2xl p-6 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Section */}
      <section id="ai" className="bg-gradient-to-b from-muted/50 to-background">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold">As melhores IAs integradas</h2>
            <p className="text-muted-foreground mt-3 text-lg">Escolha o modelo ideal para cada tarefa</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "GPT-5 (OpenAI)", desc: "Raciocínio avançado para análise fiscal complexa, pareceres e consultoria tributária.", badge: "Premium" },
              { name: "Gemini Pro (Google)", desc: "Processamento multimodal: analisa documentos, imagens de notas fiscais e extratos.", badge: "Recomendado" },
              { name: "Gemini Flash", desc: "Respostas ultrarrápidas para classificação automática, resumos e tarefas do dia-a-dia.", badge: "Rápido" },
            ].map(ai => (
              <div key={ai.name} className="bg-card border rounded-2xl p-6 relative">
                <span className="absolute top-4 right-4 text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold">{ai.badge}</span>
                <Bot className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-display font-semibold text-lg mb-2">{ai.name}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{ai.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold">Planos para cada escritório</h2>
          <p className="text-muted-foreground mt-3 text-lg">Comece grátis, escale quando precisar</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map(p => (
            <div key={p.name} className={`rounded-2xl border p-8 flex flex-col ${p.highlighted ? "border-primary bg-primary/5 shadow-xl shadow-primary/10 scale-[1.02]" : "bg-card"}`}>
              <h3 className="font-display font-semibold text-xl">{p.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold">{p.price}</span>
                <span className="text-muted-foreground text-sm">{p.period}</span>
              </div>
              <ul className="mt-6 space-y-3 flex-1">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/login" className="mt-8">
                <Button className="w-full" variant={p.highlighted ? "default" : "outline"}>
                  {p.highlighted ? "Começar agora" : "Selecionar plano"}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <span className="font-display font-bold">Seu Contador IA</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 Seu Contador IA. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
