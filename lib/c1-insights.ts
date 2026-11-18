import { competenciaAnterior, direcaoC1, numero, percentual, persistenciaC1, resultadoEquipe, type BaseC1, type DirecaoC1, type EquipeAps } from "./aps-indicadores"

export interface InsightC1 {
  id: string
  equipeId: string
  competencia: string
  direcao: DirecaoC1
  titulo: string
  evidencia: string
  interpretacao: string
  acao: string
  prioridade: number
}

// Motor local e determinístico. Não representa geração por um serviço de IA.
export function gerarInsightsC1(equipes: EquipeAps[], competencia: string, base: BaseC1): InsightC1[] {
  return equipes.map(equipe => {
    const r = resultadoEquipe(equipe.id, competencia, base)
    const direcao = direcaoC1(r.valor)
    const mesAnterior = competenciaAnterior(competencia, base.competencias)
    const anterior = mesAnterior ? resultadoEquipe(equipe.id, mesAnterior, base) : null
    const meses = persistenciaC1(equipe.id, competencia, base)
    const comum = { id: `${equipe.id}:${competencia}:${direcao}`, equipeId: equipe.id, competencia, direcao }
    if (direcao === "sem-dados") return { ...comum, prioridade: 0, titulo: `Conferir a produção da ${equipe.nome}`, evidencia: r.registro ? "O total de atendimentos da competência é zero." : "Não há registro da equipe na competência selecionada.", interpretacao: "A ausência de resultado não permite avaliar o desempenho. Confira o recorte e o envio antes de atribuir uma causa assistencial.", acao: `Conferir o arquivo e o envio da produção da ${equipe.nome}, validar INE/CNES e identificar o motivo da ausência de resultado. Registrar a correção ou justificativa e revisar o C1 após atualizar a base.` }
    const total = r.registro!.programados + r.registro!.espontaneos
    const totalAnterior = anterior?.registro ? anterior.registro.programados + anterior.registro.espontaneos : 0
    if (totalAnterior > 0 && total < totalAnterior && anterior?.valor !== null && r.valor! > anterior!.valor!) return { ...comum, prioridade: 1, titulo: `Investigar aumento do C1 com queda de volume`, evidencia: `${equipe.nome}: C1 de ${percentual(anterior!.valor)} para ${percentual(r.valor)}, enquanto o total passou de ${numero(totalAnterior)} para ${numero(total)} atendimentos.`, interpretacao: "O percentual aumentou com redução do volume. Isso, isoladamente, não comprova melhora do acesso nem explica se houve mudança na procura, na oferta ou nos registros.", acao: `Comparar os volumes programados e espontâneos da ${equipe.nome} com o mês anterior. Verificar agenda, disponibilidade de profissionais, procura e transmissão dos registros. Documentar as causas verificadas e revisar os volumes junto ao C1.` }
    if (direcao === "acima") return { ...comum, prioridade: 1, titulo: `Revisar o acolhimento da demanda espontânea`, evidencia: `${equipe.nome}: C1 ${percentual(r.valor)}, acima de 70% por ${meses} mês(es) consecutivo(s).`, interpretacao: "A participação elevada de programados é um sinal para investigar o equilíbrio da agenda. Não comprova, por si só, que a equipe esteja restringindo o acesso.", acao: `Revisar com a ${equipe.nome} o acolhimento no mesmo dia, possíveis barreiras à demanda espontânea e a classificação dos registros. Pactuar ajustes conforme as necessidades do território e acompanhar os volumes sem restringir atendimentos para alterar o percentual.` }
    if (direcao === "abaixo") return { ...comum, prioridade: 2, titulo: `Fortalecer o acompanhamento programado`, evidencia: `${equipe.nome}: C1 ${percentual(r.valor)}, em até 50% por ${meses} mês(es) consecutivo(s).`, interpretacao: "O resultado sugere investigar a oferta de cuidado programado e a continuidade dos acompanhamentos. Organização da agenda e qualidade dos registros precisam ser verificadas com a equipe.", acao: `Revisar a agenda da ${equipe.nome}, a oferta de consultas programadas e a continuidade dos acompanhamentos prioritários. Conferir a classificação dos atendimentos, pactuar ajustes com responsável e prazo e reavaliar o C1 junto aos volumes programados e espontâneos.` }
    return { ...comum, prioridade: 3, titulo: `Manter o equilíbrio e acompanhar os volumes`, evidencia: `${equipe.nome}: C1 ${percentual(r.valor)}, no intervalo acima de 50% até 70%.`, interpretacao: "A composição está na faixa ótima do C1. Isso não mede, isoladamente, espera, cobertura ou qualidade clínica.", acao: `Manter o monitoramento mensal da ${equipe.nome}, preservando o acolhimento e a continuidade do cuidado. Revisar os volumes e a disponibilidade dos dados para identificar alterações relevantes.` }
  }).sort((a, b) => a.prioridade - b.prioridade || a.titulo.localeCompare(b.titulo))
}
