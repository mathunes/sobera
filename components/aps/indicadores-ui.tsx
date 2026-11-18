import { useId, type ReactNode } from "react"
import Link from "next/link"
import { ArrowUpRight, Building2, CalendarDays } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useIndicadores } from "@/lib/aps-indicadores-context"
import { formatarCompetencia, type FaixaC1 } from "@/lib/aps-indicadores"

export const CORES_FAIXA: Record<FaixaC1, string> = { "Ótimo": "#047857", "Bom": "#0369a1", "Suficiente": "#a16207", "Regular": "#be123c", "Sem dados": "#64748b" }

export function FaixaBadge({ faixa }: { faixa: FaixaC1 }) {
  return <span className="inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold" style={{ color: CORES_FAIXA[faixa], backgroundColor: `${CORES_FAIXA[faixa]}12` }}>{faixa}</span>
}

export function PageIntro({ titulo, descricao, children }: { titulo: string; descricao: string; children?: ReactNode }) {
  return <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Gestão municipal, Atenção Primária</p><h1 className="text-2xl font-semibold md:text-3xl">{titulo}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">{descricao}</p></div>{children}</div>
}

export function FiltroSelect({ label, value, onValueChange, options, icon, className = "" }: {
  label: string
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  icon?: ReactNode
  className?: string
}) {
  const id = useId()
  return <div className={"flex min-w-0 flex-col gap-1.5 " + className}>
    <label htmlFor={id} className="text-xs font-medium text-slate-500">{label}</label>
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id={id} className="w-full cursor-pointer rounded-xl border-slate-200 bg-slate-50 shadow-none transition-colors hover:bg-slate-100 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/15 data-[state=open]:border-emerald-600 data-[state=open]:bg-white data-[size=default]:h-11">
        <span className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-left text-slate-900">{icon}<SelectValue className="min-w-0 flex-1 truncate" title={options.find(option => option.value === value)?.label}><span className="block truncate">{options.find(option => option.value === value)?.label}</span></SelectValue></span>
      </SelectTrigger>
      <SelectContent className="rounded-xl border-slate-100 bg-white p-1 shadow-lg">
        {options.map(option => <SelectItem key={option.value} value={option.value} className="cursor-pointer rounded-lg py-2.5 focus:bg-emerald-50 focus:text-emerald-800 data-[state=checked]:bg-emerald-50 data-[state=checked]:font-medium data-[state=checked]:text-emerald-800">{option.label}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>
}

export function FiltrosMunicipais() {
  const { competencia, competencias, equipesTodas, base, setCompetencia, unidadeId, setUnidadeId } = useIndicadores()
  const unidades = [...new Map(equipesTodas.map(e => [e.unidadeId, e.unidade])).entries()]
  return <div className="flex flex-wrap items-end gap-4 rounded-2xl bg-white p-4 shadow-soft">
    <FiltroSelect label="Competência" value={competencia} onValueChange={setCompetencia} options={competencias.map(c => ({ value: c, label: formatarCompetencia(c) }))} icon={<CalendarDays className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />} className="w-full sm:w-44" />
    <FiltroSelect label="Unidade de saúde" value={unidadeId} onValueChange={setUnidadeId} options={[{ value: "todas", label: "Todas as unidades" }, ...unidades.map(([id, nome]) => ({ value: id, label: nome }))]} icon={<Building2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />} className="w-full sm:w-56" />
    <p className="pb-2 text-xs text-slate-500">Monitoramento mensal, C1: Mais acesso{base.origem && <span className="mt-1 block">Universo do arquivo importado, <Link href="/portal-atencao-basica/administracao/dados" className="text-emerald-700 hover:underline">Ver origem</Link></span>}</p>
  </div>
}

export function MetricCard({ titulo, valor, descricao, children }: { titulo: string; valor: string; descricao: string; children?: ReactNode }) {
  return <Card className="shadow-soft"><CardContent className="p-5"><p className="text-xs font-medium text-slate-500">{titulo}</p><p className="my-3 text-3xl font-semibold tabular-nums tracking-tight text-slate-900">{valor}</p><p className="text-xs leading-relaxed text-slate-500">{descricao}</p>{children}</CardContent></Card>
}

export function Panel({ titulo, descricao, children }: { titulo: string; descricao?: string; children: ReactNode }) {
  return <Card className="min-w-0 shadow-soft"><CardHeader><CardTitle className="text-base">{titulo}</CardTitle>{descricao && <p className="text-xs leading-relaxed text-slate-500">{descricao}</p>}</CardHeader><CardContent>{children}</CardContent></Card>
}

export function LinkAnalise({ equipeId, children = "Analisar equipe" }: { equipeId: string; children?: ReactNode }) {
  return <Link href={`/portal-atencao-basica/indicadores?equipe=${encodeURIComponent(equipeId)}`} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">{children}<ArrowUpRight className="h-3.5 w-3.5" /></Link>
}
