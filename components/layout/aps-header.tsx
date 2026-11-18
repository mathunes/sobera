import { Building2 } from "lucide-react"
import { useIndicadores } from "@/lib/aps-indicadores-context"
import { PerfilUsuario } from "./perfil-usuario"

export function ApsHeader() {
  const { base } = useIndicadores()
  return <header className="flex min-h-18 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-2 md:px-8">
    <div className="flex items-center gap-3"><span className="hidden rounded-xl bg-slate-50 p-2.5 text-slate-500 sm:block"><Building2 className="h-5 w-5" /></span><div><p className="text-sm font-semibold text-slate-900">{base.municipio}</p><p className="mt-1 text-xs text-slate-500">Coordenação municipal da APS</p></div></div>
    <PerfilUsuario />
  </header>
}
