"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  ChefHat,
  CircleUserRound,
  ClipboardList,
  Menu,
  QrCode,
  Store,
  UtensilsCrossed,
  X,
} from "lucide-react"

import Logo from "../../../public/assets/Icons/logo-horizontal.svg"
import Symbol from "../../../public/assets/Icons/simbolo-branco.svg"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

type LandingExperienceProps = {
  onJoinWaitlist: () => void
  onAskQuestion: () => void
}

const journey = [
  { title: "QR da mesa", description: "O cliente lê o QR vinculado à mesa e ao restaurante.", icon: QrCode },
  { title: "Cardápio no celular", description: "Consulta os itens no navegador, sem instalar aplicativo.", icon: UtensilsCrossed },
  { title: "Pedido com contexto", description: "Envia a seleção vinculada à mesa e ao estabelecimento.", icon: ClipboardList },
  { title: "Cozinha recebe", description: "A operação visualiza o pedido e conduz o preparo.", icon: ChefHat },
  { title: "Status visível", description: "A equipe atualiza o andamento e o cliente acompanha o estado atual.", icon: Check },
]

const audiences = [
  { label: "Gestão", title: "Visão clara da operação", description: "Configure cardápio e mesas e acompanhe o fluxo do restaurante em um só lugar.", icon: Store },
  { label: "Operação", title: "Pedidos com contexto", description: "Receba mesa, itens, observações e status sem depender de repasses manuais.", icon: ChefHat },
  { label: "Cliente", title: "Uma jornada sem atrito", description: "Acesse, peça e acompanhe pelo próprio celular, sem baixar aplicativo.", icon: CircleUserRound },
]

const capabilities = [
  "Cardápio digital sem instalação",
  "QR associado a cada mesa",
  "Pedido vinculado ao restaurante",
  "Recebimento pela operação",
  "Atualização do andamento",
  "Gestão de cardápio e mesas",
]

const faqs = [
  { question: "O cliente precisa instalar um aplicativo?", answer: "Não. O cardápio é acessado no navegador do celular a partir do QR da mesa." },
  { question: "Como o pedido chega à cozinha?", answer: "O pedido é enviado com o contexto do restaurante e da mesa para a operação acompanhar e atualizar." },
  { question: "O cliente consegue acompanhar o pedido?", answer: "Sim. O fluxo permite consultar o estado atual do pedido durante o atendimento, quando aplicável." },
  { question: "O restaurante pode gerenciar cardápio e mesas?", answer: "Sim. O Cheffia contempla a gestão do cardápio, das mesas com QR e do fluxo operacional." },
]

function Header({ onJoinWaitlist }: Pick<LandingExperienceProps, "onJoinWaitlist">) {
  const [menuOpen, setMenuOpen] = useState(false)
  const links = [
    ["Como funciona", "#como-funciona"],
    ["Para a operação", "#operacao"],
    ["Dúvidas", "#duvidas"],
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#111614]/90 backdrop-blur-xl">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8" aria-label="Navegação principal">
        <Link href="/" aria-label="Cheffia — página inicial">
          <Image src={Logo} alt="Cheffia" width={151} height={42} priority />
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="text-sm text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#01FBA1]">
              {label}
            </Link>
          ))}
          <Button onClick={onJoinWaitlist} className="rounded-full bg-[#01FBA1] px-5 text-sm font-semibold text-[#09251b] hover:bg-[#52ffc0]">
            Entrar na lista de espera
          </Button>
        </div>
        <button type="button" className="flex size-11 items-center justify-center rounded-full border border-white/15 text-white md:hidden" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </nav>
      {menuOpen ? (
        <div className="border-t border-white/10 bg-[#111614] px-5 py-5 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {links.map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 text-base text-white/80 hover:bg-white/5">{label}</Link>
            ))}
            <Button onClick={() => { setMenuOpen(false); onJoinWaitlist() }} className="mt-2 min-h-11 rounded-full bg-[#01FBA1] font-semibold text-[#09251b] hover:bg-[#52ffc0]">Entrar na lista de espera</Button>
          </div>
        </div>
      ) : null}
    </header>
  )
}

function Hero({ onJoinWaitlist }: Pick<LandingExperienceProps, "onJoinWaitlist">) {
  const reduceMotion = useReducedMotion()
  const words = "Pedidos à mesa em um fluxo digital que sua operação acompanha.".split(" ")

  return (
    <section className="relative overflow-hidden border-b border-white/10 px-5 pb-20 pt-16 sm:pt-24 lg:px-8 lg:pb-28">
      <div className="landing-glow" aria-hidden="true" />
      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.05fr_.95fr]">
        <div className="relative z-10">
          <p className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#01FBA1]"><span className="size-1.5 rounded-full bg-[#01FBA1]" />Da mesa à cozinha, sem perder o contexto.</p>
          <h1 aria-label="Pedidos à mesa em um fluxo digital que sua operação acompanha." className="max-w-4xl font-clash text-5xl font-medium leading-[0.98] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
            {words.map((word, index) => (
              <motion.span key={`${word}-${index}`} className="inline-block" initial={reduceMotion ? false : { opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: reduceMotion ? 0 : index * 0.035 }}>{`${word} `}</motion.span>
            ))}
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">O cliente acessa o cardápio pelo QR da mesa, envia o pedido pelo celular e acompanha o andamento enquanto a equipe recebe e atualiza cada etapa.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button onClick={onJoinWaitlist} className="min-h-12 rounded-full bg-[#01FBA1] px-7 text-base font-semibold text-[#09251b] hover:bg-[#52ffc0]">Entrar na lista de espera<ArrowRight data-icon="inline-end" /></Button>
            <Button asChild variant="outline" className="min-h-12 rounded-full border-white/20 bg-transparent px-7 text-base text-white hover:bg-white/10 hover:text-white"><Link href="#como-funciona">Ver como funciona<ArrowDown data-icon="inline-end" /></Link></Button>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[520px]" aria-label="Representação do fluxo do pedido">
          <div className="absolute inset-8 rounded-full bg-[#01FBA1]/15 blur-3xl" />
          <div className="relative rounded-[2rem] border border-white/10 bg-[#17201c] p-5 shadow-2xl shadow-black/30 sm:p-7">
            <div className="mb-7 flex items-center justify-between border-b border-white/10 pb-5">
              <div><p className="text-xs uppercase tracking-[0.18em] text-white/40">Pedido #024</p><p className="mt-1 font-clash text-xl text-white">Mesa 08</p></div>
              <span className="rounded-full bg-[#01FBA1]/10 px-3 py-1.5 text-xs font-medium text-[#01FBA1]">Em preparo</span>
            </div>
            <div className="flex flex-col gap-3">
              {["2× Smash da casa", "1× Batata rústica", "Sem cebola no lanche"].map((item, index) => <div key={item} className={cn("flex items-center justify-between rounded-2xl border p-4", index === 2 ? "border-dashed border-white/10 text-white/45" : "border-white/10 bg-white/[0.03] text-white/80")}><span className="text-sm">{item}</span>{index < 2 ? <Check className="size-4 text-[#01FBA1]" aria-hidden="true" /> : null}</div>)}
            </div>
            <div className="mt-7 grid grid-cols-4 gap-2" aria-hidden="true">{[0, 1, 2, 3].map((step) => <div key={step} className={cn("h-1 rounded-full", step < 3 ? "bg-[#01FBA1]" : "bg-white/10")} />)}</div>
            <div className="mt-4 flex items-center justify-between text-xs text-white/40"><span>Pedido enviado</span><span>Próximo: pronto</span></div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Journey() {
  const [active, setActive] = useState(0)
  const reduceMotion = useReducedMotion()

  return (
    <section id="como-funciona" className="scroll-mt-24 px-5 py-20 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl"><p className="section-kicker">Como funciona</p><h2 className="section-title">Um pedido, cinco etapas conectadas.</h2><p className="section-copy">Do primeiro acesso ao status final, mesa, itens e andamento permanecem associados ao pedido.</p></div>
        <div className="mt-12 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <ol className="flex flex-col gap-2" aria-label="Etapas do pedido">
            {journey.map((step, index) => (
              <li key={step.title}>
                <button type="button" onClick={() => setActive(index)} aria-current={active === index ? "step" : undefined} className={cn("group flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#01FBA1]", active === index ? "border-[#01FBA1]/35 bg-[#01FBA1]/10" : "border-transparent text-white/45 hover:bg-white/[0.03] hover:text-white/80")}>
                  <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full border text-sm", active === index ? "border-[#01FBA1] bg-[#01FBA1] text-[#09251b]" : "border-white/15")}>{String(index + 1).padStart(2, "0")}</span>
                  <span><span className="block text-base font-medium text-white">{step.title}</span><span className="mt-1 block text-sm leading-5">{step.description}</span></span>
                </button>
              </li>
            ))}
          </ol>
          <div className="relative min-h-[390px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#17201c] p-7 sm:p-10">
            <div className="absolute -right-16 -top-16 size-64 rounded-full bg-[#01FBA1]/10 blur-3xl" />
            <motion.div key={active} initial={reduceMotion ? false : { opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.28 }} className="relative flex h-full flex-col justify-between">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-[#01FBA1] text-[#09251b]">{(() => { const Icon = journey[active].icon; return <Icon className="size-8" aria-hidden="true" /> })()}</div>
              <div className="mt-20"><p className="text-sm font-semibold text-[#01FBA1]">Etapa {active + 1} de {journey.length}</p><h3 className="mt-3 font-clash text-4xl font-medium text-white sm:text-5xl">{journey[active].title} em foco</h3><p className="mt-4 max-w-lg text-base leading-7 text-white/60">{journey[active].description}</p></div>
              <div className="mt-10 flex gap-2">{journey.map((step, index) => <button key={step.title} type="button" className={cn("h-1.5 rounded-full transition-all", index === active ? "w-12 bg-[#01FBA1]" : "w-6 bg-white/15")} onClick={() => setActive(index)} aria-label={`Ir para ${step.title}`} />)}</div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Operation() {
  return (
    <section id="operacao" className="scroll-mt-24 border-y border-white/10 bg-[#141a17] px-5 py-20 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl"><p className="section-kicker">Uma operação, três perspectivas</p><h2 className="section-title">Clareza para quem gerencia, prepara e pede.</h2></div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">{audiences.map(({ label, title, description, icon: Icon }, index) => <article key={label} className="group rounded-[1.75rem] border border-white/10 bg-[#111614] p-7 transition-colors hover:border-[#01FBA1]/30"><div className="flex items-start justify-between"><div className="flex size-12 items-center justify-center rounded-2xl bg-white/[0.05] text-[#01FBA1]"><Icon className="size-6" aria-hidden="true" /></div><span className="text-xs text-white/25">0{index + 1}</span></div><p className="mt-10 text-xs font-semibold uppercase tracking-[0.18em] text-[#01FBA1]">{label}</p><h3 className="mt-3 font-clash text-2xl font-medium text-white">{title}</h3><p className="mt-4 text-sm leading-6 text-white/55">{description}</p></article>)}</div>
      </div>
    </section>
  )
}

function Capabilities() {
  return (
    <section className="px-5 py-20 sm:py-28 lg:px-8"><div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:items-center"><div><p className="section-kicker">Capacidades atuais</p><h2 className="section-title">O essencial para operar o pedido à mesa.</h2><p className="section-copy">Uma base direta para digitalizar o atendimento sem prometer mais do que sua operação precisa.</p></div><div className="grid gap-px overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/10 sm:grid-cols-2">{capabilities.map((item) => <div key={item} className="flex min-h-24 items-center gap-3 bg-[#111614] p-5"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#01FBA1]/10 text-[#01FBA1]"><Check className="size-4" aria-hidden="true" /></span><span className="text-sm leading-5 text-white/75">{item}</span></div>)}</div></div></section>
  )
}

function Principle() {
  return <section className="px-5 py-12 lg:px-8"><div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#01FBA1] px-6 py-16 text-[#09251b] sm:px-12 sm:py-20 lg:px-20"><div className="max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[0.2em]">Princípio operacional</p><h2 className="mt-5 font-clash text-4xl font-medium leading-[1.05] tracking-[-0.03em] sm:text-6xl">O pedido não perde o contexto no caminho.</h2><p className="mt-6 max-w-2xl text-base leading-7 text-[#09251b]/70 sm:text-lg">Mesa, itens, observações e andamento permanecem claros para que cliente, cozinha e gestão enxerguem o mesmo fluxo.</p></div></div></section>
}

function FAQ({ onAskQuestion }: Pick<LandingExperienceProps, "onAskQuestion">) {
  return <section id="duvidas" className="scroll-mt-24 px-5 py-20 sm:py-28 lg:px-8"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.7fr_1.3fr]"><div><p className="section-kicker">Dúvidas frequentes</p><h2 className="section-title">Antes de começar.</h2><p className="section-copy">Não encontrou sua resposta?</p><Button variant="link" onClick={onAskQuestion} className="mt-2 h-auto p-0 text-[#01FBA1]">Faça uma pergunta<ArrowRight data-icon="inline-end" /></Button></div><div className="border-t border-white/10">{faqs.map((faq) => <FAQItem key={faq.question} {...faq} />)}</div></div></section>
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return <Collapsible open={open} onOpenChange={setOpen} className="border-b border-white/10"><CollapsibleTrigger className="flex min-h-20 w-full items-center justify-between gap-5 py-5 text-left text-base font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#01FBA1]"><span>{question}</span><ChevronDown className={cn("size-5 shrink-0 text-[#01FBA1] transition-transform", open && "rotate-180")} aria-hidden="true" /></CollapsibleTrigger><CollapsibleContent><p className="max-w-2xl pb-6 pr-10 text-sm leading-6 text-white/55">{answer}</p></CollapsibleContent></Collapsible>
}

function Footer({ onJoinWaitlist }: Pick<LandingExperienceProps, "onJoinWaitlist">) {
  return <footer className="border-t border-white/10 bg-[#0d110f] px-5 lg:px-8"><div className="mx-auto max-w-7xl py-16"><div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-center"><div><Image src={Symbol} alt="Símbolo Cheffia" width={40} height={48} /><p className="mt-5 max-w-sm text-sm leading-6 text-white/45">Pedidos à mesa em um fluxo digital que sua operação acompanha.</p></div><Button onClick={onJoinWaitlist} className="min-h-12 rounded-full bg-[#01FBA1] px-7 font-semibold text-[#09251b] hover:bg-[#52ffc0]">Entrar na lista de espera<ArrowRight data-icon="inline-end" /></Button></div><div className="mt-14 flex flex-col gap-5 border-t border-white/10 pt-7 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} Cheffia. Todos os direitos reservados.</p><div className="flex gap-5"><Link href="mailto:contato@cheffia.com" className="hover:text-white">Contato</Link><Link href="https://www.instagram.com/cheffia.app/" target="_blank" rel="noreferrer" className="hover:text-white">Instagram</Link><Link href="/sign-in" className="hover:text-white">Entrar no app</Link></div></div></div></footer>
}

export function LandingExperience({ onJoinWaitlist, onAskQuestion }: LandingExperienceProps) {
  return <div className="min-h-screen overflow-x-hidden bg-[#111614] font-inter text-white"><Header onJoinWaitlist={onJoinWaitlist} /><main><Hero onJoinWaitlist={onJoinWaitlist} /><Journey /><Operation /><Capabilities /><Principle /><FAQ onAskQuestion={onAskQuestion} /><section className="px-5 pb-24 pt-8 text-center lg:px-8"><div className="mx-auto max-w-3xl"><p className="section-kicker">Conheça o Cheffia</p><h2 className="font-clash text-4xl font-medium leading-tight tracking-[-0.03em] text-white sm:text-6xl">Leve o fluxo da mesa à cozinha para o digital.</h2><p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/55">Entre na lista de espera e acompanhe a evolução do produto.</p><Button onClick={onJoinWaitlist} className="mt-8 min-h-12 rounded-full bg-[#01FBA1] px-8 text-base font-semibold text-[#09251b] hover:bg-[#52ffc0]">Entrar na lista de espera<ArrowRight data-icon="inline-end" /></Button></div></section></main><Footer onJoinWaitlist={onJoinWaitlist} /></div>
}
