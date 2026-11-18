import { useMemo, useRef, useState, type ChangeEvent } from "react"
import Link from "next/link"
import { CheckCircle2, Download, FileUp, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useIndicadores } from "@/lib/aps-indicadores-context"
import { CAMPOS_C1, lerCsv, LIMITE_ARQUIVO, sugerirMapeamento, validarImportacao, type ArquivoCsv, type MapeamentoC1 } from "@/lib/c1-importacao"
import { calcularC1, formatarCompetencia, numero, percentual } from "@/lib/aps-indicadores"
import { FiltroSelect, MetricCard, PageIntro, Panel } from "./indicadores-ui"

interface ArquivoLido { nome: string; sha256: string; csv: ArquivoCsv; codificacao: string }
const CAMPO_VAZIO = "__sem_coluna__"
const INPUT = "h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900"
const DATA_HORA = (value: string) => new Date(value).toLocaleString("pt-BR")

export function ImportarC1() {
  const { base, importarBase, usarExemplo, erroArmazenamento } = useIndicadores()
  const [arquivo, setArquivo] = useState<ArquivoLido | null>(null)
  const [mapa, setMapa] = useState<MapeamentoC1>({})
  const [municipio, setMunicipio] = useState("")
  const [fonte, setFonte] = useState("Siaps: Monitoramento mensal C1")
  const [dataExtracao, setDataExtracao] = useState("")
  const [competenciaFixa, setCompetenciaFixa] = useState("")
  const [carregando, setCarregando] = useState(false)
  const [revisado, setRevisado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const leituraAtual = useRef(0)
  const revisao = useMemo(() => arquivo ? validarImportacao(arquivo.csv, mapa, {
    municipio, fonte, arquivo: arquivo.nome, sha256: arquivo.sha256, dataExtracao, competenciaFixa: mapa.competencia ? undefined : competenciaFixa,
  }) : null, [arquivo, mapa, municipio, fonte, dataExtracao, competenciaFixa])

  function alterar() { setRevisado(false); setSucesso(false); setErro(null) }

  async function selecionarArquivo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    const leitura = ++leituraAtual.current
    setArquivo(null); setMapa({}); setCarregando(false); alterar()
    if (!file) return
    if (!/\.csv$/i.test(file.name)) { setErro("Selecione um arquivo CSV. Para planilhas XLSX, salve uma cópia como CSV UTF-8."); return }
    if (file.size > LIMITE_ARQUIVO) { setErro("O arquivo excede o limite de 10 MB."); return }
    setCarregando(true)
    try {
      const buffer = await file.arrayBuffer()
      let texto: string, codificacao = "UTF-8"
      try { texto = new TextDecoder("utf-8", { fatal: true }).decode(buffer) }
      catch { texto = new TextDecoder("windows-1252", { fatal: true }).decode(buffer); codificacao = "Windows-1252" }
      const csv = lerCsv(texto)
      const hash = await crypto.subtle.digest("SHA-256", buffer)
      if (leitura !== leituraAtual.current) return
      const sha256 = [...new Uint8Array(hash)].map(n => n.toString(16).padStart(2, "0")).join("")
      const sugerido = sugerirMapeamento(csv.cabecalhos)
      const nomes = sugerido.municipio ? [...new Set(csv.linhas.map(l => l.valores[csv.cabecalhos.indexOf(sugerido.municipio!)].trim()).filter(Boolean))] : []
      setMunicipio(nomes.length === 1 ? nomes[0] : "")
      setCompetenciaFixa("")
      setMapa(sugerido)
      setArquivo({ nome: file.name, sha256, csv, codificacao })
    } catch (error) {
      if (leitura === leituraAtual.current) setErro(error instanceof Error ? error.message : "Não foi possível ler o arquivo.")
    } finally { if (leitura === leituraAtual.current) setCarregando(false) }
  }

  function aplicar() {
    if (!revisao?.base || !revisado || carregando) return
    try {
      importarBase(revisao.base)
      setSucesso(true); setArquivo(null); setRevisado(false); setErro(null)
    } catch (error) { setErro(error instanceof Error ? error.message : "Não foi possível importar a base.") }
  }

  function restaurar() {
    try { usarExemplo(); setSucesso(false); setErro(null) }
    catch (error) { setErro(error instanceof Error ? error.message : "Não foi possível restaurar a base de exemplo.") }
  }

  function baixarRelatorio() {
    if (!revisao) return
    const blob = new Blob([JSON.stringify({ arquivo: arquivo?.nome, erros: revisao.erros, avisos: revisao.avisos }, null, 2)], { type: "application/json;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url; link.download = "validacao-c1.json"; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return <div className="space-y-6 p-4 md:p-8">
    <PageIntro titulo="Dados e importação" descricao="Carregue a produção mensal do C1, revise as colunas e atualize os painéis do município." />
    {(erro || erroArmazenamento) && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{erro || erroArmazenamento}</p>}
    {sucesso && <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="h-5 w-5" />Base importada e salva neste navegador.<Link href="/portal-atencao-basica/dashboard" className="font-semibold underline">Abrir visão geral</Link></div>}
    <Panel titulo="Base ativa" descricao={base.origem ? "Dados do arquivo carregado pelo usuário. A origem declarada não é verificada automaticamente com o Ministério da Saúde." : "Dados de exemplo do SOBERA."}>
      <dl className="grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
        <div><dt className="text-xs text-slate-500">Município</dt><dd className="mt-1 font-medium">{base.municipio}{base.codigoMunicipio ? `, IBGE ${base.codigoMunicipio}` : ""}</dd></div>
        <div><dt className="text-xs text-slate-500">Universo da base</dt><dd className="mt-1">{base.equipes.length} equipes, {base.producao.length} registros</dd></div>
        <div><dt className="text-xs text-slate-500">Período</dt><dd className="mt-1">{formatarCompetencia(base.competencias[0])} a {formatarCompetencia(base.competencias.at(-1)!)}</dd></div>
        {base.origem && <>
          <div><dt className="text-xs text-slate-500">Arquivo / fonte declarada</dt><dd className="mt-1 break-words">{base.origem.arquivo}<br />{base.origem.fonte}</dd></div>
          <div><dt className="text-xs text-slate-500">Importado em</dt><dd className="mt-1">{DATA_HORA(base.origem.importadoEm)}</dd></div>
          <div><dt className="text-xs text-slate-500">Data de extração declarada</dt><dd className="mt-1">{base.origem.dataExtracao ? base.origem.dataExtracao.split("-").reverse().join("/") : "Não informada"}</dd></div>
          <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Identificador do arquivo (SHA-256)</dt><dd className="mt-1 break-all font-mono text-xs">{base.origem.sha256}</dd></div>
          <div><dt className="text-xs text-slate-500">Metodologia do recálculo SOBERA</dt><dd className="mt-1">{base.origem.versaoMetodologia}</dd></div>
        </>}
      </dl>
      <p className="mt-5 text-xs leading-relaxed text-slate-500">A base importada substitui a anterior; não há mesclagem automática. Os dados são processados e salvos localmente neste navegador. Para atualizar o histórico, envie um arquivo com todas as competências desejadas.</p>
      {base.origem && <p className="mt-2 text-xs leading-relaxed text-slate-500">O universo contém os INE presentes no arquivo, sem confirmação de equipes ativas ou elegíveis. Os vínculos usam a competência importada; na ausência de registro, mostram o vínculo conhecido mais próximo. O histórico acompanha os mesmos INE do recorte selecionado.</p>}
      {(base.origem || erroArmazenamento) && <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" className="mt-4 gap-2 rounded-xl"><RotateCcw className="h-4 w-4" />Usar base de exemplo</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Substituir pela base de exemplo?</AlertDialogTitle><AlertDialogDescription>A base importada será removida deste navegador. O arquivo original não será alterado e poderá ser importado novamente.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={restaurar}>Usar exemplo</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
    </Panel>
    <Panel titulo="1. Selecionar arquivo" descricao="CSV de monitoramento mensal, uma linha por INE e competência. Não use avaliação quadrimestral ou listas de pacientes.">
      <div className="flex flex-wrap items-center gap-4"><label className="flex max-w-full flex-col gap-2 text-xs font-medium text-slate-500">Arquivo CSV, até 10 MB e 20.000 linhas<input type="file" accept=".csv,text/csv" onChange={selecionarArquivo} className="max-w-full rounded-xl bg-slate-50 p-3 text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-2 file:text-emerald-800" /></label><a href={import.meta.env.BASE_URL + "exemplos/c1-modelo.csv"} download className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 hover:underline"><Download className="h-4 w-4" />Baixar modelo de exemplo</a></div>
      <p className="mt-4 text-xs leading-relaxed text-slate-500">Separadores aceitos: ponto e vírgula, vírgula ou tabulação. Codificações: UTF-8 e Windows-1252. INE e CNES devem preservar zeros à esquerda. O modelo é do SOBERA; a compatibilidade com um arquivo oficial real ainda precisa ser homologada.</p>
      <a href="https://sisaps.saude.gov.br/sistemas/siaps/docs/manual/transferencia-arquivos/" target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-emerald-700 hover:underline">Orientações oficiais para exportação no Siaps ↗</a>
      {carregando && <p role="status" className="mt-4 text-sm text-slate-500">Lendo e validando o arquivo…</p>}
    </Panel>
    {arquivo && <>
      <Panel titulo="2. Revisar identificação e colunas" descricao={`${arquivo.nome}, ${numero(arquivo.csv.linhas.length)} linhas, ${arquivo.codificacao}. Confira as sugestões de mapeamento antes de aplicar.`}>
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500">Município da base *<input className={INPUT} value={municipio} onChange={e => { alterar(); setMunicipio(e.target.value) }} placeholder="Nome do município" /></label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500">Origem do arquivo *<input className={INPUT} value={fonte} onChange={e => { alterar(); setFonte(e.target.value) }} /></label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500">Data de extração (opcional)<input type="date" className={INPUT} value={dataExtracao} onChange={e => { alterar(); setDataExtracao(e.target.value) }} /></label>
          {!mapa.competencia && <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-500">Competência única (se não houver coluna)<input type="month" min="2000-01" max="2100-12" className={INPUT} value={competenciaFixa} onChange={e => { alterar(); setCompetenciaFixa(e.target.value) }} /></label>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{CAMPOS_C1.map(campo => <FiltroSelect key={campo.id} label={campo.label + ("obrigatorio" in campo ? " *" : "")} value={mapa[campo.id] || CAMPO_VAZIO} onValueChange={value => { alterar(); setMapa(atual => ({ ...atual, [campo.id]: value === CAMPO_VAZIO ? undefined : value })) }} options={[{ value: CAMPO_VAZIO, label: "Não mapear" }, ...arquivo.csv.cabecalhos.map((c, i) => ({ value: c, label: `${i + 1}. ${c}` }))]} />)}</div>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">O numerador deve ser de demanda programada. O denominador é o total de programados + espontâneos. Se o CSV reunir outros indicadores, mapeie a coluna Indicador para selecionar apenas C1. Campos sem nome de equipe/unidade usam INE/CNES como identificação.</p>
      </Panel>
      {revisao && <Panel titulo="3. Validar e aplicar" descricao="Nenhuma linha é aplicada enquanto houver erros. As divergências do percentual publicado são apresentadas para revisão; o painel usa os volumes para recalcular o C1.">
        <div aria-live="polite" className="mb-5 grid gap-3 sm:grid-cols-3"><MetricCard titulo="Erros impeditivos" valor={String(revisao.erros.length)} descricao="Devem ser corrigidos no arquivo ou no mapeamento." /><MetricCard titulo="Observações" valor={String(revisao.avisos.length)} descricao="Confira antes de substituir a base." /><MetricCard titulo="Registros prontos" valor={revisao.base ? String(revisao.base.producao.length) : "Sem dados"} descricao="Uma linha por equipe e mês." /></div>
        {(revisao.erros.length > 0 || revisao.avisos.length > 0) && <div className="mb-5 space-y-3"><ul className="max-h-64 space-y-2 overflow-auto text-xs">{revisao.erros.slice(0, 50).map((p, i) => <li key={`erro-${i}`} className="rounded-lg bg-rose-50 p-3 text-rose-800">{p.linha ? `Linha ${p.linha}: ` : ""}{p.mensagem}</li>)}{revisao.avisos.slice(0, 50).map((p, i) => <li key={`aviso-${i}`} className="rounded-lg bg-amber-50 p-3 text-amber-900">{p.linha ? `Linha ${p.linha}: ` : ""}{p.mensagem}</li>)}</ul><Button variant="outline" className="rounded-xl" onClick={baixarRelatorio}>Baixar relatório completo da validação</Button></div>}
        {revisao.base && <>
          <p className="mb-4 text-sm text-slate-600">{revisao.base.equipes.length} equipes, {revisao.base.competencias.length} competências, {revisao.base.municipio}</p>
          <div className="mb-5 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-xs"><caption className="pb-3 text-left text-slate-500">Prévia dos primeiros 10 registros normalizados</caption><thead><tr>{["Competência", "INE", "Programados", "Espontâneos", "C1 recalculado", "C1 publicado"].map(t => <th key={t} scope="col" className="p-3 font-medium text-slate-500">{t}</th>)}</tr></thead><tbody>{revisao.base.producao.slice(0, 10).map(r => <tr key={`${r.equipeId}-${r.competencia}`} className="border-t border-slate-100"><td className="p-3">{formatarCompetencia(r.competencia)}</td><td className="p-3 font-mono">{r.equipeId}</td><td className="p-3">{numero(r.programados)}</td><td className="p-3">{numero(r.espontaneos)}</td><td className="p-3">{percentual(calcularC1(r.programados, r.espontaneos))}</td><td className="p-3">{percentual(r.resultadoPublicado ?? null)}</td></tr>)}</tbody></table></div>
          <label className="mb-4 flex items-start gap-2 text-sm text-slate-600"><input type="checkbox" checked={revisado} onChange={e => setRevisado(e.target.checked)} className="mt-1 accent-emerald-700" />Revisei o município, a competência mensal e o mapeamento do numerador/denominador do C1, incluindo as observações acima.</label>
        </>}
        <Button onClick={aplicar} disabled={!revisao.base || !revisado || carregando} className="gap-2 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"><FileUp className="h-4 w-4" />Substituir base e atualizar painéis</Button>
      </Panel>}
    </>}
  </div>
}
