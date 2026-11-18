import { useEffect, useRef, useState, type FormEvent } from "react"
import { useSearchParams } from "react-router-dom"
import Link from "next/link"
import { ClipboardList, Pencil, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useIndicadores } from "@/lib/aps-indicadores-context"
import { useGestaoMunicipal } from "@/lib/gestao-municipal-context"
import { acaoAberta, acaoAtrasada, dataLocal, STATUS_ACAO, type AcaoMunicipal, type DadosAcao, type StatusAcao } from "@/lib/gestao-municipal"
import { gerarInsightsC1 } from "@/lib/c1-insights"
import { contagem, formatarCompetencia, NOME_INDICADOR_C1, percentual } from "@/lib/aps-indicadores"
import { FiltroSelect, LinkAnalise, MetricCard, PageIntro, Panel } from "./indicadores-ui"
import { ErroGestao, INPUT_GESTAO, StatusAcaoBadge, TEXTAREA_GESTAO } from "./gestao-ui"

const formatarData = (value: string) => value.split("-").reverse().join("/")
const sinal = { abaixo: "Até 50%", acima: "Acima de 70%", equilibrio: "Na faixa ótima", "sem-dados": "Sem resultado" }

export function PlanoAcao() {
  const { base, equipesTodas, competencia, competencias, resultadoEquipe } = useIndicadores()
  const { dados, salvarAcao, erro } = useGestaoMunicipal()
  const [params, setParams] = useSearchParams()
  const consulta = params.toString()
  const processada = useRef<string | null>(null)
  const [form, setForm] = useState<DadosAcao | null>(null)
  const [busca, setBusca] = useState("")
  const [status, setStatus] = useState("todos")
  const [responsavel, setResponsavel] = useState("todos")
  const [equipeFiltro, setEquipeFiltro] = useState("todas")
  const [prazoFiltro, setPrazoFiltro] = useState("todos")
  const [falha, setFalha] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)

  function novaAcao(equipeId = equipesTodas[0]?.id) {
    const equipe = equipesTodas.find(e => e.id === equipeId)
    if (!equipe) { setFalha("Equipe não encontrada na base atual. Selecione outra equipe."); return }
    const mesOrigem = params.get("insight") && competencias.includes(params.get("competencia") ?? "") ? params.get("competencia") : competencia
    const resultado = resultadoEquipe(equipe.id, mesOrigem!)
    const aberta = acaoAberta(dados.acoes, equipe.id, resultado.direcao)
    if (aberta) { editar(aberta); setMensagem("Já existe uma ação aberta para esta prioridade. Atualize-a abaixo."); return }
    const prazo = new Date(); prazo.setDate(prazo.getDate() + 14)
    setFalha(null)
    const insight = params.get("insight") ? gerarInsightsC1([equipe], mesOrigem!, base).find(i => i.id === params.get("insight")) : undefined
    setForm({ titulo: insight?.titulo ?? `${sinal[resultado.direcao]}, ${equipe.nome}`, descricao: insight?.acao ?? "", equipeId: equipe.id, equipeNome: equipe.nome, unidadeNome: equipe.unidade, ine: equipe.ine, competenciaInicial: mesOrigem!, valorInicial: resultado.valor, fonteInicial: base.origem?.sha256 ?? "base-exemplo", direcao: resultado.direcao, prazo: dataLocal(prazo), status: "Pendente", responsavelId: "", observacao: "" })
  }
  function editar(acao: AcaoMunicipal) {
    setFalha(null)
    const mes = competencia >= acao.competenciaInicial ? competencia : acao.competenciaInicial
    setForm({ ...acao, observacao: "", revisao: acao.revisao ?? { competencia: mes, valor: resultadoEquipe(acao.equipeId, mes).valor, observacao: "" } })
  }
  useEffect(() => {
    if (processada.current === consulta) return
    processada.current = consulta
    const id = params.get("acao")
    if (id) {
      const acao = dados.acoes.find(a => a.id === id)
      if (acao) editar(acao)
      else setFalha("Ação não encontrada nos cadastros deste município.")
    } else if (params.get("nova") === "1") novaAcao(params.get("equipe") ?? undefined)
    // A consulta só é consumida uma vez; salvar ou trocar filtros não reabre o diálogo.
  }, [consulta, params, dados.acoes, base, competencia, equipesTodas])

  function fechar() { setForm(null); setFalha(null); if (consulta) setParams({}, { replace: true }) }
  function mudarEquipe(id: string) {
    if (!form || form.id) return
    const equipe = equipesTodas.find(e => e.id === id)
    if (!equipe) return
    const r = resultadoEquipe(id, competencia)
    setForm({ ...form, equipeId: id, equipeNome: equipe.nome, ine: equipe.ine, unidadeNome: equipe.unidade, competenciaInicial: competencia, valorInicial: r.valor, direcao: r.direcao, titulo: `${sinal[r.direcao]}, ${equipe.nome}` })
  }
  function salvar(event: FormEvent) {
    event.preventDefault()
    if (!form) return
    try { salvarAcao(form); setMensagem(form.id ? "Ação atualizada e registrada no histórico." : "Ação criada e vinculada à equipe."); fechar() }
    catch (error) { setFalha(error instanceof Error ? error.message : "Não foi possível salvar a ação.") }
  }

  const ativas = dados.usuarios.filter(u => u.ativo || u.id === form?.responsavelId)
  const existentes = [...new Map(dados.acoes.map(a => [a.equipeId, a.equipeNome])).entries()]
  const linhas = dados.acoes.filter(a =>
    (status === "todos" || a.status === status) && (responsavel === "todos" || a.responsavelId === responsavel) && (equipeFiltro === "todas" || a.equipeId === equipeFiltro) &&
    (prazoFiltro === "todos" || (prazoFiltro === "atrasadas" ? acaoAtrasada(a) : a.status !== "Concluída" && !acaoAtrasada(a))) &&
    `${a.titulo} ${a.equipeNome} ${a.unidadeNome} ${a.responsavelNome}`.toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR")),
  ).sort((a, b) => Number(acaoAtrasada(b)) - Number(acaoAtrasada(a)) || a.prazo.localeCompare(b.prazo))
  const duplicada = form && form.status !== "Concluída" ? acaoAberta(dados.acoes, form.equipeId, form.direcao, form.id) : undefined
  const existente = dados.acoes.find(a => a.id === form?.id)
  const mesRevisao = form?.revisao?.competencia ?? (form && competencia < form.competenciaInicial ? form.competenciaInicial : competencia)
  const opcoesRevisao = form ? [...new Set([form.competenciaInicial, ...(form.revisao ? [form.revisao.competencia] : []), ...competencias])].filter(c => c >= form.competenciaInicial).sort() : []

  return <div className="space-y-6 p-4 md:p-8">
    <PageIntro titulo="Plano de ação" descricao="Transforme prioridades em intervenções, acompanhe responsáveis e prazos e registre a revisão dos resultados."><Button onClick={() => { setMensagem(null); novaAcao() }} disabled={!!erro} className="gap-2 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"><Plus className="h-4 w-4" />Nova ação</Button></PageIntro>
    <ErroGestao />
    <p className="text-xs leading-relaxed text-slate-500">Ações do município atual, salvas neste navegador. O resultado de origem é preservado mesmo após atualizar a base de indicadores.</p>
    {mensagem && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{mensagem}</p>}
    {falha && !form && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{falha}</p>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard titulo="Pendentes" valor={String(dados.acoes.filter(a => a.status === "Pendente").length)} descricao="Aguardando início da intervenção." /><MetricCard titulo="Em andamento" valor={String(dados.acoes.filter(a => a.status === "Em andamento").length)} descricao="Intervenções em execução." /><MetricCard titulo="Em atraso" valor={String(dados.acoes.filter(a => acaoAtrasada(a)).length)} descricao="Abertas com prazo anterior a hoje." /><MetricCard titulo="Concluídas" valor={String(dados.acoes.filter(a => a.status === "Concluída").length)} descricao="Com resultado e revisão registrados." /></div>
    <Panel titulo="Intervenções do município" descricao="Uma ação aberta por equipe e situação de prioridade. A conclusão preserva o histórico e permite novas intervenções.">
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500">Buscar ação<input className={INPUT_GESTAO} value={busca} onChange={e => setBusca(e.target.value)} placeholder="Título, equipe ou responsável" /></label><FiltroSelect label="Status" value={status} onValueChange={setStatus} options={[{ value: "todos", label: "Todos" }, ...STATUS_ACAO.map(s => ({ value: s, label: s }))]} /><FiltroSelect label="Responsável" value={responsavel} onValueChange={setResponsavel} options={[{ value: "todos", label: "Todos" }, ...dados.usuarios.map(u => ({ value: u.id, label: u.nome + (u.ativo ? "" : " (inativo)") }))]} /><FiltroSelect label="Equipe" value={equipeFiltro} onValueChange={setEquipeFiltro} options={[{ value: "todas", label: "Todas" }, ...existentes.map(([id, nome]) => ({ value: id, label: nome }))]} /><FiltroSelect label="Prazo" value={prazoFiltro} onValueChange={setPrazoFiltro} options={[{ value: "todos", label: "Todos" }, { value: "atrasadas", label: "Em atraso" }, { value: "em-dia", label: "Abertas no prazo" }]} /></div>
      <p role="status" className="mb-4 text-xs text-slate-500">{contagem(linhas.length, "ação encontrada", "ações encontradas")}</p>
      <div className="space-y-4">{linhas.map(acao => {
        const atual = resultadoEquipe(acao.equipeId, competencia)
        const usuario = dados.usuarios.find(u => u.id === acao.responsavelId)
        const possuiEquipe = equipesTodas.some(e => e.id === acao.equipeId)
        return <article key={acao.id} className="rounded-2xl border border-slate-100 p-4 md:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><div className="mb-2 flex flex-wrap items-center gap-2"><StatusAcaoBadge status={acao.status} />{acaoAtrasada(acao) && <span className="text-xs font-semibold text-rose-700">Em atraso</span>}</div><h3 className="text-base font-semibold">{acao.titulo}</h3><p className="mt-1 text-xs text-slate-500">{acao.equipeNome}, {acao.unidadeNome}, {sinal[acao.direcao]}</p></div><Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => editar(acao)} disabled={!!erro} aria-label={`Atualizar ${acao.titulo}`}><Pencil className="h-3.5 w-3.5" />Atualizar / detalhes</Button></div><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{acao.descricao}</p><dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2 xl:grid-cols-4"><div><dt className="text-slate-500">Responsável</dt><dd className="mt-1 font-medium">{usuario?.nome ?? acao.responsavelNome}{usuario && !usuario.ativo && <span className="ml-1 text-amber-700">(inativo)</span>}</dd></div><div><dt className="text-slate-500">Prazo</dt><dd className="mt-1 font-medium">{formatarData(acao.prazo)}</dd></div><div><dt className="text-slate-500">{NOME_INDICADOR_C1} na origem, {formatarCompetencia(acao.competenciaInicial)}</dt><dd className="mt-1 font-medium">{percentual(acao.valorInicial)}</dd></div><div><dt className="text-slate-500">{NOME_INDICADOR_C1} na competência selecionada, {formatarCompetencia(competencia)}</dt><dd className="mt-1 font-medium">{percentual(atual.valor)}{!possuiEquipe && ", Equipe ausente na base atual"}</dd></div></dl>{acao.revisao && <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><p className="font-medium">Revisão registrada, {formatarCompetencia(acao.revisao.competencia)}, {NOME_INDICADOR_C1} {percentual(acao.revisao.valor)}</p><p className="mt-1 whitespace-pre-wrap">{acao.revisao.observacao}</p></div>}{possuiEquipe && <div className="mt-4"><LinkAnalise equipeId={acao.equipeId} /></div>}</article>
      })}{!linhas.length && <div className="py-10 text-center"><ClipboardList className="mx-auto mb-3 h-8 w-8 text-slate-300" /><p className="text-sm text-slate-500">{dados.acoes.length ? "Nenhuma ação corresponde aos filtros." : "Nenhuma ação cadastrada. Comece por uma prioridade na visão geral ou crie uma nova ação."}</p></div>}</div>
    </Panel>
    <Dialog open={!!form} onOpenChange={open => { if (!open) fechar() }}><DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl"><DialogHeader><DialogTitle>{form?.id ? "Atualizar ação" : "Nova ação"}</DialogTitle><DialogDescription>Defina a intervenção e acompanhe sua execução. Uma mudança em Mais acesso (C1), isoladamente, não comprova melhora do acesso.</DialogDescription></DialogHeader>{form && <form onSubmit={salvar} className="space-y-4">
      {falha && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{falha}</p>}
      {form.id ? <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{form.equipeNome}, {form.unidadeNome}, {formatarCompetencia(form.competenciaInicial)}, {NOME_INDICADOR_C1} na origem {percentual(form.valorInicial)}</p> : <FiltroSelect label="Equipe vinculada" value={form.equipeId} onValueChange={mudarEquipe} options={equipesTodas.map(e => ({ value: e.id, label: `${e.nome}, ${e.unidade}` }))} />}
      {!form.id && <p className="text-xs text-slate-500">Origem: {formatarCompetencia(form.competenciaInicial)}, {sinal[form.direcao]}, {NOME_INDICADOR_C1} {percentual(form.valorInicial)}</p>}
      {duplicada && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Já existe uma ação aberta para esta prioridade. <button type="button" onClick={() => editar(duplicada)} className="font-semibold underline">Abrir ação existente</button></p>}
      <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500">Título *<input required maxLength={160} className={INPUT_GESTAO} value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} /></label>
      <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500">Intervenção planejada *<textarea required maxLength={4000} className={TEXTAREA_GESTAO} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Descreva o que será feito e como será acompanhado." /></label>
      <div className="grid gap-4 sm:grid-cols-2"><FiltroSelect label="Responsável *" value={form.responsavelId || "__selecionar__"} onValueChange={value => setForm({ ...form, responsavelId: value === "__selecionar__" ? "" : value })} options={[{ value: "__selecionar__", label: "Selecione um responsável" }, ...ativas.map(u => ({ value: u.id, label: u.nome + (u.ativo ? "" : " (inativo)") }))]} /><label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500">Prazo *<input type="date" required className={INPUT_GESTAO} value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })} /></label></div>
      {!dados.usuarios.some(u => u.ativo) && <p className="text-xs text-amber-800">Cadastre um responsável ativo antes de salvar uma nova ação. <Link href="/portal-atencao-basica/administracao/usuarios" className="font-semibold underline">Gerenciar usuários</Link></p>}
      <FiltroSelect label="Status" value={form.status} onValueChange={value => {
        const mes = competencia >= form.competenciaInicial ? competencia : form.competenciaInicial
        setForm({ ...form, status: value as StatusAcao, revisao: form.revisao ?? { competencia: mes, valor: resultadoEquipe(form.equipeId, mes).valor, observacao: "" } })
      }} options={STATUS_ACAO.map(s => ({ value: s, label: s }))} />
      {form.status === "Concluída" && <div className="space-y-3 rounded-xl bg-emerald-50/60 p-4"><h3 className="text-sm font-semibold">Revisão do resultado</h3><FiltroSelect label="Competência da revisão" ajuda="competencia" value={mesRevisao} onValueChange={value => setForm({ ...form, revisao: { competencia: value, valor: resultadoEquipe(form.equipeId, value).valor, observacao: form.revisao?.observacao ?? "" } })} options={opcoesRevisao.map(c => ({ value: c, label: formatarCompetencia(c) }))} /><p className="text-xs text-slate-600">{NOME_INDICADOR_C1} na revisão: {percentual(form.revisao?.valor ?? null)}. Sem resultado disponível, a conclusão registra apenas a avaliação textual.</p><label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500">Resultado e avaliação da intervenção *<textarea required maxLength={4000} className={TEXTAREA_GESTAO} value={form.revisao?.observacao ?? ""} onChange={e => setForm({ ...form, revisao: { competencia: mesRevisao, valor: form.revisao?.valor ?? null, observacao: e.target.value } })} /></label></div>}
      <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500">Observação de acompanhamento (opcional)<textarea maxLength={4000} className={TEXTAREA_GESTAO} value={form.observacao ?? ""} onChange={e => setForm({ ...form, observacao: e.target.value })} placeholder="Registre andamento, decisões ou justificativas para alterações." /></label>
      {existente && <details className="rounded-xl bg-slate-50 p-3"><summary className="cursor-pointer text-xs font-semibold text-slate-600">Histórico de acompanhamento ({existente.historico.length})</summary><ol className="mt-3 space-y-3">{[...existente.historico].reverse().map(h => <li key={h.id} className="text-xs text-slate-600"><time className="font-medium">{new Date(h.data).toLocaleString("pt-BR")}</time><p className="mt-1 whitespace-pre-wrap">{h.texto}</p></li>)}</ol></details>}
      <DialogFooter><Button type="button" variant="outline" className="rounded-xl" onClick={fechar}>Cancelar</Button><Button type="submit" disabled={!!erro || !!duplicada || !form.responsavelId} className="rounded-xl bg-emerald-700 text-white hover:bg-emerald-800">Salvar ação</Button></DialogFooter>
    </form>}</DialogContent></Dialog>
  </div>
}
