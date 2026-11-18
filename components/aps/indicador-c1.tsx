import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VariacoesC1, EstabilidadeC1, PrioridadesAcoesC1 } from "./c1-analises"
import { useSearchParams } from "react-router-dom"
import { useIndicadores } from "@/lib/aps-indicadores-context"
import { classificarC1, direcaoC1, distanciaC1, FONTE_C1, formatarCompetencia, numero, orientacaoC1, percentual } from "@/lib/aps-indicadores"
import { AcaoPrioridade } from "./acao-prioridade"
import { EvolucaoC1, VolumesC1 } from "./c1-graficos"
import { FaixaBadge, FiltroSelect, FiltrosMunicipais, MetricCard, PageIntro, Panel } from "./indicadores-ui"

export function IndicadorC1() {
  const { competencia, equipes, competencias, resumoC1, resultadoEquipe, persistenciaC1, competenciaAnterior } = useIndicadores()
  const [params, setParams] = useSearchParams()
  const aba = ["analise", "variacoes", "estabilidade", "prioridades"].includes(params.get("aba") ?? "") ? params.get("aba")! : "analise"
  const equipeId = params.get("equipe") ?? "todas"
  const equipe = equipes.find(e => e.id === equipeId)
  const selecionadas = equipeId === "todas" ? equipes : equipe ? [equipe] : []
  const resumo = resumoC1(selecionadas, competencia)
  const anterior = competenciaAnterior(competencia)
  const passado = anterior ? resumoC1(selecionadas, anterior) : null
  // Comparações de volume usam o mesmo conjunto de equipes com resultado nos dois períodos.
  const comparaveis = anterior ? selecionadas.filter(e => resultadoEquipe(e.id, competencia).valor !== null && resultadoEquipe(e.id, anterior).valor !== null) : []
  const atualComparavel = resumoC1(comparaveis, competencia)
  const passadoComparavel = anterior ? resumoC1(comparaveis, anterior) : null
  const variacao = passadoComparavel?.valor != null && atualComparavel.valor !== null ? atualComparavel.valor - passadoComparavel.valor : null
  const distancia = distanciaC1(resumo.valor)
  const incompleto = resumo.semDados > 0

  return <div className="space-y-6 p-4 md:p-8">
    <PageIntro titulo="C1, Mais acesso à APS" descricao="Analise a composição dos atendimentos, acompanhe os volumes e investigue o que merece atenção em cada equipe." />
    <FiltrosMunicipais />
    <FiltroSelect label="Analisar equipe" value={equipeId} onValueChange={value => { const next = new URLSearchParams(params); if (value === "todas") next.delete("equipe"); else next.set("equipe", value); setParams(next) }} options={[{ value: "todas", label: "Todas as equipes do recorte" }, ...(!equipe && equipeId !== "todas" ? [{ value: equipeId, label: "Equipe fora do recorte" }] : []), ...equipes.map(e => ({ value: e.id, label: e.nome + ", " + e.unidade }))]} className="w-full max-w-sm" />
    {equipe && <AcaoPrioridade equipeId={equipe.id} direcao={direcaoC1(resumo.valor)} />}
    {!selecionadas.length ? <Panel titulo="Equipe indisponível neste recorte"><p className="text-sm text-slate-500">Selecione outra equipe ou ajuste o filtro de unidade para consultar a análise.</p></Panel> : <Tabs value={aba} onValueChange={value => { const next = new URLSearchParams(params); if (value === "analise") next.delete("aba"); else next.set("aba", value); setParams(next) }} className="gap-6">
      <div className="overflow-x-auto"><TabsList className="h-11">{[["analise", "Análise do C1"], ["variacoes", "Variações"], ["estabilidade", "Estabilidade"], ["prioridades", "Prioridades e ações"]].map(([value, label]) => <TabsTrigger key={value} value={value} className="px-4">{label}</TabsTrigger>)}</TabsList></div>
      <TabsContent value="analise" className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard titulo={equipe ? "C1 da equipe" : "C1 agregado do recorte"} valor={percentual(resumo.valor)} descricao={equipe ? `${equipe.tipo}, ${equipe.unidade}` : "Agregado analítico SOBERA, ponderado pelo total de atendimentos."}>{equipe && <div className="mt-3"><FaixaBadge faixa={classificarC1(resumo.valor)} /></div>}</MetricCard>
        <MetricCard titulo="Atendimentos programados" valor={resumo.comRegistro ? numero(resumo.programados) : "Sem dados"} descricao="Consulta agendada programada, cuidado continuado e consulta agendada." />
        <MetricCard titulo="Atendimentos espontâneos" valor={resumo.comRegistro ? numero(resumo.espontaneos) : "Sem dados"} descricao="Escuta inicial/orientação, consulta no dia e atendimento de urgência." />
        <MetricCard titulo="Variação mensal do C1" valor={variacao === null ? "Sem dados" : `${variacao > 0 ? "+" : ""}${variacao.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} p.p.`} descricao={`${comparaveis.length} equipe(s) com resultado nos dois meses. Aumento não significa, por si só, melhora.`} />
      </div>
      {incompleto && <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Recorte incompleto: {resumo.semDados} de {selecionadas.length} equipe(s) sem resultado. Os totais incluem somente a produção disponível.</p>}
      <div className="grid gap-6 xl:grid-cols-2"><Panel titulo="Evolução do C1" descricao="Mensal, Área de referência > 50% até 70%. Observe mudanças na disponibilidade das equipes."><EvolucaoC1 equipes={selecionadas} competencia={competencia} /></Panel><Panel titulo="Composição e volume dos atendimentos" descricao="Leia os volumes junto ao percentual para compreender as variações."><VolumesC1 equipes={selecionadas} competencia={competencia} /></Panel></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel titulo="Leitura para a gestão" descricao={equipe ? "Hipóteses para investigação com a equipe." : "Leitura do agregado; consulte as equipes para localizar os desequilíbrios."}><p className="text-sm leading-relaxed text-slate-600">{orientacaoC1(resumo.valor)}</p><dl className="mt-5 space-y-3 text-xs"><div className="flex justify-between gap-4"><dt className="text-slate-500">Distância até o intervalo ótimo</dt><dd className="font-semibold">{distancia === null ? "Sem resultado" : `${distancia.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} p.p.${resumo.valor !== null && resumo.valor <= 50 ? " até 50%*" : ""}`}</dd></div>{equipe && <div className="flex justify-between gap-4"><dt className="text-slate-500">Persistência na mesma direção fora da faixa</dt><dd>{persistenciaC1(equipe.id, competencia)} mês(es)</dd></div>}<div className="flex justify-between"><dt className="text-slate-500">Equipes com resultado</dt><dd>{resumo.comDados} de {selecionadas.length}</dd></div></dl><p className="mt-4 text-xs leading-relaxed text-slate-500">* O limite inferior é estrito: 50% ainda é Bom. É necessário superar 50% e não ultrapassar 70%. Não reduza atendimentos para alterar a classificação.</p>{passado && passado.total > 0 && atualComparavel.total < (passadoComparavel?.total ?? 0) && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">O total de atendimentos caiu entre as equipes comparáveis. Verifique oferta, procura e registros antes de interpretar a variação como melhora do acesso.</p>}</Panel>
        <Panel titulo="Metodologia e faixas oficiais" descricao="Referência: nota metodológica C1, SEI 0054814890, junho de 2026."><p className="rounded-xl bg-slate-50 p-3 text-sm font-medium">C1 = programados ÷ (programados + espontâneos) × 100</p><div className="my-4 grid grid-cols-2 gap-3">{([['Ótimo', '> 50% até 70%'], ['Bom', '> 30% até 50%'], ['Suficiente', '> 10% até 30%'], ['Regular', '≤ 10% ou > 70%']] as const).map(([faixa, texto]) => <div key={faixa} className="flex flex-col items-start gap-2"><FaixaBadge faixa={faixa} /><span className="text-xs text-slate-500">{texto}</span></div>)}</div><p className="text-xs leading-relaxed text-slate-500">Monitoramento mensal por eSF/eAP. A avaliação federal é quadrimestral e não é reproduzida neste painel. O C1 conta atendimentos, não pessoas únicas, e não mede espera, cobertura ou qualidade clínica isoladamente.</p><a href={FONTE_C1} target="_blank" rel="noreferrer" className="mt-4 inline-block text-xs font-semibold text-emerald-700 hover:underline">Consultar nota metodológica oficial ↗</a></Panel>
      </div>
      <Panel titulo="Histórico mensal" descricao="Valores disponíveis até a competência selecionada. Agregações e comparações deste painel são análises do SOBERA."><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b border-slate-100 text-xs text-slate-500"><tr>{['Competência', 'Programados', 'Espontâneos', 'Total', 'C1', 'Equipes com resultado'].map(t => <th key={t} className="px-3 py-3 font-medium">{t}</th>)}</tr></thead><tbody>{competencias.filter(c => c <= competencia).map(c => { const r = resumoC1(selecionadas, c); return <tr key={c} className="border-b border-slate-100 last:border-0"><td className="px-3 py-3">{formatarCompetencia(c)}</td><td className="px-3 py-3 tabular-nums">{r.comRegistro ? numero(r.programados) : "Sem dados"}</td><td className="px-3 py-3 tabular-nums">{r.comRegistro ? numero(r.espontaneos) : "Sem dados"}</td><td className="px-3 py-3 tabular-nums">{r.comRegistro ? numero(r.total) : "Sem dados"}</td><td className="px-3 py-3 font-semibold tabular-nums">{percentual(r.valor)}</td><td className="px-3 py-3">{r.comDados} de {selecionadas.length}</td></tr> })}</tbody></table></div></Panel>
      </TabsContent>
      <TabsContent value="variacoes"><VariacoesC1 equipes={selecionadas} /></TabsContent>
      <TabsContent value="estabilidade"><EstabilidadeC1 equipes={selecionadas} /></TabsContent>
      <TabsContent value="prioridades"><PrioridadesAcoesC1 equipes={selecionadas} /></TabsContent>
    </Tabs>}
  </div>
}
