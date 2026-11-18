import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useIndicadores } from "@/lib/aps-indicadores-context"
import { formatarCompetencia, type EquipeAps } from "@/lib/aps-indicadores"
import { CORES_FAIXA } from "./indicadores-ui"

export function ComparacaoEquipesC1() {
  const { equipes, competencia, resultadoEquipe } = useIndicadores()
  const dados = equipes.map(e => ({ nome: e.nome, ...resultadoEquipe(e.id, competencia) })).filter(e => e.valor !== null)
  if (!dados.length) return <p className="py-12 text-center text-sm text-slate-500">Não há resultados disponíveis para comparar neste recorte.</p>
  return <div><div className="w-full" style={{ height: Math.max(180, dados.length * 44) }} role="img" aria-label="Comparação do C1 por equipe, com referência entre 50 e 70 por cento"><ResponsiveContainer width="100%" height="100%"><BarChart data={dados} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" /><XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="nome" width={145} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={v => [`${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`, "C1"]} /><ReferenceArea x1={50} x2={70} fill="#10b981" fillOpacity={0.1} /><Bar dataKey="valor" maxBarSize={22} radius={[0, 4, 4, 0]}>{dados.map(e => <Cell key={e.nome} fill={CORES_FAIXA[e.faixa]} />)}</Bar></BarChart></ResponsiveContainer></div><p className="mt-3 text-xs text-slate-500">{equipes.length - dados.length} equipe(s) sem resultado não têm barra. A faixa ótima é acima de 50% até 70%; valores maiores não significam melhor desempenho.</p></div>
}

export function EvolucaoC1({ equipes, competencia }: { equipes: EquipeAps[]; competencia: string }) {
  const { competencias, resumoC1 } = useIndicadores()
  const dados = competencias.filter(c => c <= competencia).map(c => ({ mes: formatarCompetencia(c), ...resumoC1(equipes, c) }))
  return <div className="h-64 w-full" role="img" aria-label="Evolução mensal do C1. A área verde indica o intervalo acima de 50% até 70%."><ResponsiveContainer width="100%" height="100%"><ComposedChart data={dados} margin={{ top: 8, right: 8, left: -20, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={v => [`${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`, "C1"]} /><ReferenceArea y1={50} y2={70} fill="#10b981" fillOpacity={0.1} /><Line type="linear" dataKey="valor" name="C1" stroke="#047857" strokeWidth={3} dot={{ r: 4 }} connectNulls={false} /></ComposedChart></ResponsiveContainer></div>
}

export function VolumesC1({ equipes, competencia }: { equipes: EquipeAps[]; competencia: string }) {
  const { competencias, resumoC1 } = useIndicadores()
  const dados = competencias.filter(c => c <= competencia).map(c => ({ mes: formatarCompetencia(c), ...resumoC1(equipes, c) }))
  return <div className="h-64 w-full" role="img" aria-label="Volumes mensais de atendimentos programados e espontâneos"><ResponsiveContainer width="100%" height="100%"><BarChart data={dados} margin={{ top: 8, right: 8, left: -12, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={v => Number(v).toLocaleString("pt-BR")} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="programados" name="Programados" fill="#059669" stackId="volume" /><Bar dataKey="espontaneos" name="Espontâneos" fill="#94a3b8" stackId="volume" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
}
