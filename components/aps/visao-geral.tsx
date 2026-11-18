import Link from "next/link"
import { ArrowRight, ShieldCheck } from "lucide-react"
import { useIndicadores } from "@/lib/aps-indicadores-context"
import { contagem, FAIXAS_C1, NOME_INDICADOR_C1, numero, orientacaoC1, percentual } from "@/lib/aps-indicadores"
import { CORES_FAIXA, FaixaBadge, FiltrosMunicipais, LinkAnalise, MetricCard, PageIntro, Panel } from "./indicadores-ui"
import { AcaoPrioridade } from "./acao-prioridade"
import { InsightsC1 } from "./insights-c1"
import { ComparacaoEquipesC1, EvolucaoC1 } from "./c1-graficos"

export function VisaoGeral() {
  const { competencia, equipes, unidadeId, resumoC1, resultadoEquipe, persistenciaC1, competenciaAnterior } = useIndicadores()
  const resumo = resumoC1(equipes, competencia)
  const resultados = equipes.map(e => ({ ...e, ...resultadoEquipe(e.id, competencia), meses: persistenciaC1(e.id, competencia) }))
  const otimas = resultados.filter(e => e.faixa === "Ótimo").length
  const fora = resultados.filter(e => e.direcao === "abaixo" || e.direcao === "acima")
  const volumeFora = fora.reduce((s, e) => s + (e.registro ? e.registro.programados + e.registro.espontaneos : 0), 0)
  const anterior = competenciaAnterior(competencia)
  const mudancas = anterior ? resultados.filter(e => {
    const passado = resultadoEquipe(e.id, anterior).faixa
    return e.faixa !== "Sem dados" && passado !== "Sem dados" && ((e.faixa === "Ótimo") !== (passado === "Ótimo"))
  }) : []
  const prioridades = resultados.filter(e => e.faixa !== "Ótimo").sort((a, b) => {
    if (a.faixa === "Sem dados") return b.faixa === "Sem dados" ? 0 : -1
    if (b.faixa === "Sem dados") return 1
    return b.meses - a.meses || a.nome.localeCompare(b.nome)
  })

  return <div className="space-y-6 p-4 md:p-8">
    <PageIntro titulo="Visão geral da APS" descricao="Identifique prioridades de apoio às equipes e acompanhe o equilíbrio entre o cuidado programado e a demanda espontânea." />
    <FiltrosMunicipais />
    <InsightsC1 key={competencia + unidadeId} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard titulo={`${NOME_INDICADOR_C1} ${unidadeId === "todas" ? "no município" : "na unidade"}`} ajuda="indicador" valor={percentual(resumo.valor)} descricao="Cálculo SOBERA: soma dos programados ÷ soma dos atendimentos. Não é uma nota oficial municipal." />
      <MetricCard
        titulo="Equipes na faixa ótima" ajuda="faixaOtima"
        valor={`${otimas} de ${equipes.length}`}
        descricao={resumo.comDados > 0
          ? `${percentual(otimas / resumo.comDados * 100)} das equipes com resultado nesta competência.`
          : "Nenhuma equipe do recorte tem resultado nesta competência."}
      />
      <MetricCard titulo="Equipes fora da faixa ótima" valor={String(fora.length)} descricao="Resultado ≤ 50% ou > 70%. Investigar as duas direções do desequilíbrio." />
      <MetricCard titulo="Equipes sem resultado" valor={String(resumo.semDados)} descricao="Produção ausente ou total zerado. Não recebem classificação de desempenho." />
    </div>
    <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      <Panel titulo="Evolução da composição dos atendimentos" descricao="Resultado agregado de Mais acesso (C1), com a faixa ótima delimitada em azul (acima de 50% até 70%)."><EvolucaoC1 equipes={equipes} competencia={competencia} /><Link href="/portal-atencao-basica/indicadores" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">Explorar indicador e volumes<ArrowRight className="h-4 w-4" /></Link></Panel>
      <Panel titulo="Distribuição das equipes" descricao="Classificação mensal por equipe; ausências são apresentadas separadamente."><div className="space-y-4">{FAIXAS_C1.map(faixa => {
        const quantidade = resultados.filter(e => e.faixa === faixa).length
        return <div key={faixa}><div className="mb-2 flex items-center justify-between text-xs"><FaixaBadge faixa={faixa} /><span className="tabular-nums text-slate-500">{quantidade} de {equipes.length}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full transition-all" style={{ width: `${equipes.length ? quantidade / equipes.length * 100 : 0}%`, background: CORES_FAIXA[faixa] }} /></div></div>
      })}</div></Panel>
    </div>
    <Panel titulo={`${NOME_INDICADOR_C1} por equipe`} ajuda="indicador" descricao="Compare os resultados mensais das equipes do recorte, sem ocultar os extremos do indicador."><ComparacaoEquipesC1 /></Panel>
    <Panel titulo="Prioridades para a gestão" descricao="Ausências primeiro; depois, maior persistência na mesma direção fora da faixa ótima. São sinais para investigação, não diagnósticos das causas.">
      <div className="divide-y divide-slate-100">{prioridades.map(e => <div key={e.id} className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0"><div className="min-w-0 flex-1"><div className="mb-1 flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">{e.nome}</h3><FaixaBadge faixa={e.faixa} /><span className="text-sm font-semibold tabular-nums">{percentual(e.valor)}</span></div><p className="text-xs text-slate-500">{e.unidade}, {e.faixa === "Sem dados" ? e.registro ? "Total de atendimentos zerado" : "Sem registro na competência" : `${contagem(e.meses, "mês consecutivo", "meses consecutivos")} ${e.direcao === "acima" ? "acima de 70%" : "em até 50%"}`}</p><p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-600">{orientacaoC1(e.valor)}</p></div><div className="flex shrink-0 flex-col gap-3"><LinkAnalise equipeId={e.id} /><AcaoPrioridade equipeId={e.id} direcao={e.direcao} /></div></div>)}{prioridades.length === 0 && <p className="flex items-center gap-2 text-sm text-slate-700"><ShieldCheck className="h-4 w-4" style={{ color: CORES_FAIXA["Ótimo"] }} />Todas as equipes do recorte estão na faixa ótima.</p>}</div>
    </Panel>
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard titulo="Atendimentos no período" valor={numero(resumo.total)} descricao={`${numero(resumo.programados)} programados, ${numero(resumo.espontaneos)} espontâneos. Atendimentos não equivalem a pessoas únicas.`} />
      <MetricCard titulo="Volume em equipes fora da faixa" valor={percentual(resumo.total ? volumeFora / resumo.total * 100 : null)} descricao={`${contagem(volumeFora, "atendimento", "atendimentos")} em equipes com resultado fora da faixa ótima.`} />
      <Panel titulo="Mudanças na faixa ótima" descricao={anterior ? "Comparação com o mês anterior, apenas para equipes com resultado nos dois meses." : "Não há competência anterior nesta série."}>{mudancas.length ? <ul className="space-y-2">{mudancas.map(e => <li key={e.id} className="text-xs"><LinkAnalise equipeId={e.id}>{e.nome}: {e.faixa === "Ótimo" ? "entrou" : "saiu"}</LinkAnalise></li>)}</ul> : <p className="text-xs text-slate-500">Nenhuma transição comparável neste recorte.</p>}</Panel>
    </div>
  </div>
}
