import { useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronLeft, ChevronRight, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NOME_INDICADOR_C1 } from "@/lib/aps-indicadores"
import { useIndicadores } from "@/lib/aps-indicadores-context"
import { useGestaoMunicipal } from "@/lib/gestao-municipal-context"
import { acaoAberta } from "@/lib/gestao-municipal"
import { gerarInsightsC1 } from "@/lib/c1-insights"

export function InsightsC1() {
  const { base, equipes, competencia } = useIndicadores()
  const { dados } = useGestaoMunicipal()
  const insights = gerarInsightsC1(equipes, competencia, base)
  const [posicao, setPosicao] = useState(0)
  const indice = Math.min(posicao, Math.max(0, insights.length - 1))
  const insight = insights[indice]
  if (!insight) return null
  const existente = acaoAberta(dados.acoes, insight.equipeId, insight.direcao)
  const destino = existente ? `/portal-atencao-basica/plano-acao?acao=${encodeURIComponent(existente.id)}` : `/portal-atencao-basica/plano-acao?nova=1&equipe=${encodeURIComponent(insight.equipeId)}&competencia=${insight.competencia}&insight=${encodeURIComponent(insight.id)}`
  return <details className="group rounded-2xl bg-white shadow-soft">
    <summary className="block cursor-pointer list-none rounded-2xl px-5 py-4 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-emerald-700 md:px-6 [&::-webkit-details-marker]:hidden">
      <h2 className="flex items-center justify-between gap-3 text-base font-semibold">
        <span className="flex items-center gap-2">
          <Lightbulb aria-hidden="true" className="h-5 w-5 shrink-0 text-emerald-700" />
          Insights da APS
        </span>
        <span aria-hidden="true" className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <span className="group-open:hidden">Expandir</span>
          <span className="hidden group-open:inline">Recolher</span>
          <ChevronDown className="h-4 w-4 group-open:rotate-180" />
        </span>
      </h2>
    </summary>
    <section aria-label="Sugestões para a gestão" aria-roledescription="carrossel" className="border-t border-slate-100 p-5 md:p-6">
      <span className="mb-4 inline-block rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500">Análise por regras de {NOME_INDICADOR_C1}</span>
      <div aria-live="polite" aria-atomic="true">
        <p className="mb-2 text-xs text-slate-400">Sugestão {indice + 1} de {insights.length}</p>
        <h3 className="text-lg font-semibold">{insight.titulo}</h3>
        <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-medium leading-relaxed text-emerald-900">{insight.evidencia}</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{insight.interpretacao}</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600"><strong className="font-semibold text-slate-800">Próxima verificação: </strong>{insight.acao}</p>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <Button asChild className="rounded-xl bg-emerald-700 text-white hover:bg-emerald-800">
          <Link href={destino}>{existente ? "Acompanhar plano de ação" : "Gerar plano de ação"}</Link>
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="rounded-full" aria-label="Sugestão anterior" disabled={insights.length < 2} onClick={() => setPosicao((indice - 1 + insights.length) % insights.length)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs tabular-nums text-slate-500">{indice + 1}/{insights.length}</span>
          <Button variant="outline" size="icon" className="rounded-full" aria-label="Próxima sugestão" disabled={insights.length < 2} onClick={() => setPosicao((indice + 1) % insights.length)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-slate-400">Sugestões automáticas para revisão da gestão. Nenhum serviço de IA está conectado. O botão prepara um rascunho; a ação só é criada após definir responsável, prazo e salvar.</p>
    </section>
  </details>
}
