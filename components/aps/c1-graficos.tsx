import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, ReferenceArea, ResponsiveContainer, Text, Tooltip, XAxis, YAxis } from "recharts"
import { useIndicadores } from "@/lib/aps-indicadores-context"
import { contagem, formatarCompetencia, NOME_INDICADOR_C1, percentual, type EquipeAps } from "@/lib/aps-indicadores"
import { CORES_FAIXA } from "./indicadores-ui"

const COR_ACIMA_DA_FAIXA = "#FDE047"
const LARGURA_EIXO_EQUIPES = 145
const LEGENDA_COMPARACAO_C1 = [
  { rotulo: "Regular, até 10%", cor: CORES_FAIXA.Regular },
  { rotulo: "Suficiente, > 10% até 30%", cor: CORES_FAIXA.Suficiente },
  { rotulo: "Bom, > 30% até 50%", cor: CORES_FAIXA.Bom },
  { rotulo: "Ótimo, > 50% até 70%", cor: CORES_FAIXA["Ótimo"] },
  { rotulo: "Regular, acima de 70%", cor: COR_ACIMA_DA_FAIXA },
]

export function ComparacaoEquipesC1() {
  const { equipes, competencia, resultadoEquipe } = useIndicadores()
  const dados = equipes
    .map(e => ({ id: e.id, nome: e.nome, ...resultadoEquipe(e.id, competencia) }))
    .filter(e => e.valor !== null)
  if (!dados.length) return <p className="py-12 text-center text-sm text-slate-500">Não há resultados disponíveis para comparar neste recorte.</p>
  return <div>
    <div className="w-full" style={{ height: Math.max(180, dados.length * 44) }} role="img" aria-label={`Comparação de ${NOME_INDICADOR_C1} por equipe. Faixa ótima acima de 50% até 70%. Em amarelo, resultados acima da faixa ótima.`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="nome"
            width={LARGURA_EIXO_EQUIPES}
            axisLine={false}
            tickLine={false}
            tick={({ x, y, payload }) => (
              <Text
                x={x}
                y={y}
                width={LARGURA_EIXO_EQUIPES - 10}
                maxLines={1}
                textAnchor="end"
                verticalAnchor="middle"
                style={{ fontSize: "11px" }}
                fill="#475569"
                aria-label={payload.value}
              >
                {payload.value}
              </Text>
            )}
          />
          <Tooltip formatter={(valor, _nome, item) => [
            percentual(Number(valor)),
            item.payload.direcao === "acima" ? "Regular, acima da faixa ótima" : item.payload.faixa,
          ]} />
          <ReferenceArea x1={50} x2={70} fill="none" stroke={CORES_FAIXA["Ótimo"]} strokeWidth={1.5} strokeDasharray="4 3" />
          <Bar dataKey="valor" maxBarSize={22} radius={[0, 4, 4, 0]}>
            {dados.map(e => <Cell key={e.id} fill={e.direcao === "acima" ? COR_ACIMA_DA_FAIXA : CORES_FAIXA[e.faixa]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    <ul aria-label={`Legenda de ${NOME_INDICADOR_C1} por equipe`} className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-700">
      {LEGENDA_COMPARACAO_C1.map(({ rotulo, cor }) => (
        <li key={rotulo} className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3 shrink-0 rounded-sm" style={{ backgroundColor: cor }} />
          {rotulo}
        </li>
      ))}
    </ul>
    <p className="mt-3 text-xs text-slate-500">{contagem(equipes.length - dados.length, "equipe sem resultado", "equipes sem resultado")} fora do gráfico. Valores acima da faixa ótima indicam necessidade de atenção ao equilíbrio dos atendimentos.</p>
  </div>
}

export function EvolucaoC1({ equipes, competencia }: { equipes: EquipeAps[]; competencia: string }) {
  const { competencias, resumoC1 } = useIndicadores()
  const dados = competencias.filter(c => c <= competencia).map(c => ({ mes: formatarCompetencia(c), ...resumoC1(equipes, c) }))
  return <div className="h-64 w-full" role="img" aria-label={`Evolução mensal de ${NOME_INDICADOR_C1}. O contorno azul delimita o intervalo acima de 50% até 70%.`}><ResponsiveContainer width="100%" height="100%"><ComposedChart data={dados} margin={{ top: 8, right: 8, left: -20, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={v => [`${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`, NOME_INDICADOR_C1]} /><ReferenceArea y1={50} y2={70} fill="none" stroke={CORES_FAIXA["Ótimo"]} strokeWidth={1.5} strokeDasharray="4 3" /><Line type="linear" dataKey="valor" name={NOME_INDICADOR_C1} stroke="#475569" strokeWidth={3} dot={{ r: 4 }} connectNulls={false} /></ComposedChart></ResponsiveContainer></div>
}

export function VolumesC1({ equipes, competencia }: { equipes: EquipeAps[]; competencia: string }) {
  const { competencias, resumoC1 } = useIndicadores()
  const dados = competencias.filter(c => c <= competencia).map(c => ({ mes: formatarCompetencia(c), ...resumoC1(equipes, c) }))
  return <div className="h-64 w-full" role="img" aria-label="Volumes mensais de atendimentos programados e espontâneos"><ResponsiveContainer width="100%" height="100%"><BarChart data={dados} margin={{ top: 8, right: 8, left: -12, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={v => Number(v).toLocaleString("pt-BR")} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="programados" name="Programados" fill="#059669" stackId="volume" /><Bar dataKey="espontaneos" name="Espontâneos" fill="#94a3b8" stackId="volume" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
}
