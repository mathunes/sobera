import { useState } from "react"
import { useIndicadores } from "@/lib/aps-indicadores-context"
import { FAIXAS_C1, numero, percentual, type FaixaC1 } from "@/lib/aps-indicadores"
import { FaixaBadge, FiltroSelect, FiltrosMunicipais, LinkAnalise, PageIntro, Panel } from "./indicadores-ui"

export function EquipesUnidades() {
  const { competencia, equipes, base, resumoC1, resultadoEquipe, persistenciaC1 } = useIndicadores()
  const [busca, setBusca] = useState("")
  const [faixa, setFaixa] = useState<FaixaC1 | "todas">("todas")
  const [tipo, setTipo] = useState("todos")
  const linhas = equipes.map(e => ({ ...e, ...resultadoEquipe(e.id, competencia) })).filter(e =>
    (faixa === "todas" || e.faixa === faixa) && (tipo === "todos" || e.tipo === tipo) &&
    `${e.nome} ${e.unidade} ${e.ine} ${e.cnes}`.toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR")),
  )
  const unidades = [...new Set(equipes.map(e => e.unidadeId))]
  return <div className="space-y-6 p-4 md:p-8">
    <PageIntro titulo="Equipes e unidades" descricao="Localize diferenças entre as equipes, consulte a disponibilidade dos dados e abra a análise do C1." />
    <FiltrosMunicipais />
    <div className="grid gap-4 md:grid-cols-3">{unidades.map(id => {
      const grupo = equipes.filter(e => e.unidadeId === id)
      const r = resumoC1(grupo, competencia)
      return <Panel key={id} titulo={grupo[0].unidade} descricao={`${grupo.length} equipes, CNES ${grupo[0].cnes}`}><p className="text-2xl font-semibold tabular-nums">{percentual(r.valor)}</p><p className="mt-2 text-xs leading-relaxed text-slate-500">C1 agregado SOBERA, {r.comDados} de {grupo.length} equipes com resultado. {numero(r.total)} atendimentos.</p></Panel>
    })}</div>
    <Panel titulo="Resultados por equipe" descricao={base.origem ? "Universo de equipes do arquivo importado; não representa cadastro completo ou elegibilidade para cofinanciamento." : "Equipes de exemplo. A classificação mensal não representa elegibilidade para cofinanciamento."}>
      <div className="mb-5 flex flex-wrap gap-3">
        <label className="flex flex-1 flex-col gap-1.5 text-xs text-slate-500">Buscar equipe, UBS ou identificador<input className="min-w-40 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Nome, INE ou CNES" /></label>
        <FiltroSelect label="Classificação" value={faixa} onValueChange={value => setFaixa(value as FaixaC1 | "todas")} options={[{ value: "todas", label: "Todas as faixas" }, ...FAIXAS_C1.map(f => ({ value: f, label: f }))]} className="w-full sm:w-44" />
        <FiltroSelect label="Tipo de equipe" value={tipo} onValueChange={setTipo} options={[{ value: "todos", label: "Todos" }, { value: "eSF", label: "eSF" }, { value: "eAP", label: "eAP" }]} className="w-full sm:w-40" />
      </div>
      <p className="mb-3 text-xs text-slate-500" role="status">{linhas.length} equipe(s) encontrada(s)</p>
      <div className="overflow-x-auto"><table className="w-full min-w-[880px] text-left text-sm"><thead className="border-b border-slate-100 text-xs text-slate-500"><tr>{['Equipe / unidade', 'Programados', 'Espontâneos', 'C1', 'Classificação', 'Situação', 'Análise'].map(t => <th key={t} className="px-3 py-3 font-medium">{t}</th>)}</tr></thead><tbody>{linhas.map(e => <tr key={e.id} className="border-b border-slate-100 last:border-0"><td className="px-3 py-4"><p className="font-semibold">{e.nome}</p><p className="mt-1 text-xs text-slate-500">{e.unidade}, {e.tipo}, INE {e.ine}</p></td><td className="px-3 py-4 tabular-nums">{e.registro ? numero(e.registro.programados) : "Sem dados"}</td><td className="px-3 py-4 tabular-nums">{e.registro ? numero(e.registro.espontaneos) : "Sem dados"}</td><td className="px-3 py-4 font-semibold tabular-nums">{percentual(e.valor)}</td><td className="px-3 py-4"><FaixaBadge faixa={e.faixa} /></td><td className="px-3 py-4 text-xs text-slate-500">{e.direcao === "sem-dados" ? e.registro ? "Total zerado" : "Produção ausente" : e.direcao === "equilibrio" ? "Na faixa ótima" : `${e.direcao === "acima" ? "Acima de 70%" : "Até 50%"}, ${persistenciaC1(e.id, competencia)} mês(es)`}</td><td className="px-3 py-4"><LinkAnalise equipeId={e.id} /></td></tr>)}{!linhas.length && <tr><td colSpan={7} className="py-10 text-center text-sm text-slate-500">Nenhuma equipe corresponde aos filtros. Ajuste a busca ou a classificação.</td></tr>}</tbody></table></div>
    </Panel>
  </div>
}
