import { calcularC1, classificarC1, competenciaAnterior, distanciaC1, persistenciaC1, resultadoEquipe, resumoC1, type BaseC1, type EquipeAps } from "./aps-indicadores"
import { acaoAberta, acaoAtrasada, type AcaoMunicipal, type UsuarioMunicipal } from "./gestao-municipal"

export function deslocarMes(mes: string, quantidade: number) {
  const data = new Date(`${mes}-01T12:00:00Z`)
  data.setUTCMonth(data.getUTCMonth() + quantidade)
  return data.toISOString().slice(0, 7)
}
export function janelaMensal(fim: string, meses: number) {
  return Array.from({ length: meses }, (_, i) => deslocarMes(fim, i - meses + 1))
}
export function variacaoVolume(atual: number, anterior: number) {
  return { absoluta: atual - anterior, percentual: anterior > 0 ? (atual - anterior) / anterior * 100 : null }
}
export function analisarVariacao(equipes: EquipeAps[], competencia: string, base: BaseC1) {
  const anterior = competenciaAnterior(competencia, base.competencias)
  const comparaveis = anterior ? equipes.filter(e => resultadoEquipe(e.id, competencia, base).valor !== null && resultadoEquipe(e.id, anterior, base).valor !== null) : []
  const atual = resumoC1(comparaveis, competencia, base)
  const passado = anterior ? resumoC1(comparaveis, anterior, base) : null
  const delta = passado?.valor != null && atual.valor !== null ? atual.valor - passado.valor : null
  const programados = passado ? variacaoVolume(atual.programados, passado.programados) : null
  const espontaneos = passado ? variacaoVolume(atual.espontaneos, passado.espontaneos) : null
  const total = passado ? variacaoVolume(atual.total, passado.total) : null
  let leitura = "Não há equipes com resultado nos dois meses. Não é possível explicar uma variação comparável."
  if (delta !== null && programados && espontaneos && total) {
    const movimento = (n: number) => n > 0 ? "aumentaram" : n < 0 ? "diminuíram" : "permaneceram estáveis"
    leitura = `Os programados ${movimento(programados.absoluta)} e os espontâneos ${movimento(espontaneos.absoluta)}. `
    leitura += delta > 0 && total.absoluta < 0 ? "O C1 aumentou enquanto o total caiu. Verifique oferta, procura e registros antes de interpretar como melhora do acesso." : "Leia a mudança do percentual junto aos dois volumes; ela descreve a composição dos atendimentos, sem explicar sozinha suas causas."
  }
  return { anterior, comparaveis, atual, passado, delta, programados, espontaneos, total, leitura }
}

export function analisarEstabilidade(equipe: EquipeAps, competencia: string, base: BaseC1, meses = 6) {
  const historico = janelaMensal(competencia, meses).map(mes => ({ competencia: mes, ...resultadoEquipe(equipe.id, mes, base) }))
  const validos = historico.filter(r => r.valor !== null).length
  const otimos = historico.filter(r => r.faixa === "Ótimo").length
  let recuperacoes = 0, reincidencias = 0, sequenciaOtima = 0, houveDesvio = false, houveEquilibrioAposDesvio = false
  for (const mes of historico) {
    if (mes.valor === null) { sequenciaOtima = 0; houveDesvio = false; houveEquilibrioAposDesvio = false; continue }
    if (mes.faixa === "Ótimo") {
      sequenciaOtima++
      if (houveDesvio) houveEquilibrioAposDesvio = true
      if (houveDesvio && sequenciaOtima === 3) recuperacoes++
    } else {
      if (houveEquilibrioAposDesvio) reincidencias++
      sequenciaOtima = 0; houveDesvio = true; houveEquilibrioAposDesvio = false
    }
  }
  return { equipe, historico, validos, otimos, estabilidade: validos ? otimos / validos * 100 : null, recuperacoes, reincidencias, sequenciaOtima, historicoCurto: validos < 4 }
}

export function dimensaoPrioridades(equipes: EquipeAps[], competencia: string, base: BaseC1) {
  return equipes.map(equipe => {
    const r = resultadoEquipe(equipe.id, competencia, base)
    return { equipe, ...r, meses: persistenciaC1(equipe.id, competencia, base), distancia: distanciaC1(r.valor), volume: r.registro ? r.registro.programados + r.registro.espontaneos : null }
  }).filter(r => r.direcao !== "equilibrio")
}

function resumirPeriodo(equipeId: string, meses: string[], ate: string, base: BaseC1) {
  const elegiveis = meses.filter(m => m <= ate)
  const resultados = elegiveis.map(m => resultadoEquipe(equipeId, m, base)).filter(r => r.valor !== null)
  const programados = resultados.reduce((s, r) => s + r.registro!.programados, 0)
  const espontaneos = resultados.reduce((s, r) => s + r.registro!.espontaneos, 0)
  const validos = resultados.length
  return { meses, disponiveis: validos, aguardando: 3 - elegiveis.length, valor: calcularC1(programados, espontaneos), programados, espontaneos, mediaProgramados: validos ? programados / validos : null, mediaEspontaneos: validos ? espontaneos / validos : null, otimos: resultados.filter(r => r.faixa === "Ótimo").length }
}
export function acompanharIntervencao(acao: AcaoMunicipal, competencia: string, base: BaseC1) {
  const inicio = acao.criadoEm.slice(0, 7)
  const referencia = (acao.status === "Concluída" && acao.concluidaEm ? acao.concluidaEm : acao.criadoEm).slice(0, 7)
  const antes = resumirPeriodo(acao.equipeId, [-3, -2, -1].map(n => deslocarMes(inicio, n)), competencia, base)
  const depois = resumirPeriodo(acao.equipeId, [1, 2, 3].map(n => deslocarMes(referencia, n)), competencia, base)
  const completo = antes.disponiveis === 3 && depois.disponiveis === 3
  const delta = antes.valor !== null && depois.valor !== null ? depois.valor - antes.valor : null
  const retornoSustentado = completo && classificarC1(antes.valor) !== "Ótimo" && depois.otimos === 3
  return { acao, inicio, referencia, antes, depois, completo, delta, retornoSustentado }
}

export function respostaGestao(equipes: EquipeAps[], competencia: string, base: BaseC1, acoes: AcaoMunicipal[], usuarios: UsuarioMunicipal[], hoje?: string) {
  const prioridades = dimensaoPrioridades(equipes, competencia, base).map(p => {
    const acao = acaoAberta(acoes.filter(a => a.competenciaInicial <= competencia), p.equipe.id, p.direcao)
    const usuario = acao ? usuarios.find(u => u.id === acao.responsavelId) : undefined
    return { ...p, acao, responsavelAtivo: !!usuario?.ativo }
  })
  const comAcao = prioridades.filter(p => p.acao).length
  const ids = new Set(equipes.map(e => e.id))
  const acompanhamento = acoes.filter(a => ids.has(a.equipeId) && a.competenciaInicial <= competencia).map(a => acompanharIntervencao(a, competencia, base))
  return { prioridades, comAcao, semAcao: prioridades.length - comAcao, cobertura: prioridades.length ? comAcao / prioridades.length * 100 : null,
    semResponsavelAtivo: prioridades.filter(p => p.meses >= 3 && (!p.acao || !p.responsavelAtivo)).length,
    vencidas: prioridades.filter(p => p.acao && acaoAtrasada(p.acao, hoje)).length,
    acompanhamento, retornos: new Set(acompanhamento.filter(a => a.retornoSustentado).map(a => a.acao.equipeId)).size }
}
