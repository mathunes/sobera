import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Building2, ChevronLeft, ChevronRight, ClipboardList, Database, LayoutDashboard, UsersRound } from "lucide-react"
import { SoberaLogo } from "@/components/sobera-logo"
import { cn } from "@/lib/utils"

const secoes = [
  { titulo: "Gestão da APS", itens: [
    { titulo: "Visão geral", url: "/portal-atencao-basica/dashboard", icone: LayoutDashboard },
    { titulo: "Indicadores", url: "/portal-atencao-basica/indicadores", icone: BarChart3 },
    { titulo: "Equipes e unidades", url: "/portal-atencao-basica/equipes", icone: Building2 },
    { titulo: "Plano de ação", url: "/portal-atencao-basica/plano-acao", icone: ClipboardList },
  ] },
  { titulo: "Administração", itens: [
    { titulo: "Dados e importação", url: "/portal-atencao-basica/administracao/dados", icone: Database },
    { titulo: "Gestão de usuários", url: "/portal-atencao-basica/administracao/usuarios", icone: UsersRound },
  ] },
]

export function ApsSidebarNav({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname()
  return <aside className={cn("relative z-20 flex shrink-0 flex-col border-r border-slate-100 bg-white transition-all", collapsed ? "w-16" : "w-16 md:w-60")}>
    <Link href="/portal-atencao-basica/dashboard" aria-label="SOBERA: Visão geral" className="flex h-24 shrink-0 items-center justify-center px-3">
      <SoberaLogo compact className={cn("h-8 w-8 shrink-0", !collapsed && "md:hidden")} />
      {!collapsed && <SoberaLogo className="hidden h-auto w-40 md:block" />}
    </Link>
    <nav aria-label="Navegação principal" className="min-h-0 flex-1 space-y-6 overflow-y-auto px-2 pb-4 md:px-3">
      {secoes.map((secao, index) => <section key={secao.titulo} aria-label={secao.titulo} className={index ? "border-t border-slate-100 pt-5" : ""}>
        {!collapsed && <p className="mb-3 hidden px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 md:block">{secao.titulo}</p>}
        <div className="space-y-2">{secao.itens.map(({ titulo, url, icone: Icone }) => <Link key={url} href={url} title={titulo} aria-label={titulo} aria-current={pathname === url ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors", pathname === url ? "bg-emerald-50 font-semibold text-emerald-800" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")}><Icone className="h-5 w-5 shrink-0" />{!collapsed && <span className="hidden md:block">{titulo}</span>}</Link>)}</div>
      </section>)}
    </nav>
    <button type="button" onClick={onToggle} className="absolute -right-4 top-14 hidden size-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 md:flex" aria-label={collapsed ? "Expandir menu" : "Recolher menu"} title={collapsed ? "Expandir menu" : "Recolher menu"} aria-expanded={!collapsed}>{collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</button>
  </aside>
}
