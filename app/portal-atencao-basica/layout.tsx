import { useState } from "react"
import { ApsSidebarNav } from "@/components/layout/aps-sidebar-nav"
import { ApsHeader } from "@/components/layout/aps-header"
import { GestaoMunicipalProvider } from "@/lib/gestao-municipal-context"
import { IndicadoresProvider } from "@/lib/aps-indicadores-context"

export default function PortalAtencaoBasicaLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  return <IndicadoresProvider><GestaoMunicipalProvider><div className="flex h-screen w-full overflow-hidden bg-slate-50">
    <ApsSidebarNav collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <ApsHeader />
      <main className="flex-1 overflow-auto"><div className="mx-auto flex min-h-full max-w-[1600px] flex-col"><div className="flex-1">{children}</div><footer className="px-4 py-5 text-center text-[11px] text-slate-400">SOBERA: Inteligência em Saúde, Desenvolvido pela KAminer © 2026</footer></div></main>
    </div>
  </div></GestaoMunicipalProvider></IndicadoresProvider>
}
