import { CircleHelp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { NOME_INDICADOR_C1 } from "@/lib/aps-indicadores"

const termos = {
  indicador: {
    titulo: NOME_INDICADOR_C1,
    descricao: "Percentual de atendimentos programados entre todos os atendimentos programados e espontâneos da competência. Ajuda a avaliar o equilíbrio entre o cuidado agendado e o atendimento de quem procura a unidade sem agendamento.",
  },
  competencia: {
    titulo: "Competência",
    descricao: "Mês de referência dos atendimentos. Por exemplo, a competência de setembro reúne a produção atribuída a setembro, independentemente de quando o arquivo foi importado.",
  },
  faixaOtima: {
    titulo: "Faixa ótima",
    descricao: "Resultados acima de 50% até 70%. Acima de 70%, o resultado fica na faixa Regular e sinaliza que vale investigar o acesso à demanda espontânea.",
  },
  classificacao: {
    titulo: "Classificação",
    descricao: "O resultado de cada equipe cai em uma faixa. Regular até 10% ou acima de 70%, Suficiente acima de 10% até 30%, Bom acima de 30% até 50% e Ótimo acima de 50% até 70%. Equipes sem resultado não recebem classificação.",
  },
  programados: {
    titulo: "Atendimentos programados",
    descricao: "Incluem consultas agendadas e cuidado continuado. Essa quantidade é o numerador, ou seja, a parte de cima da divisão usada para calcular o indicador.",
  },
  espontaneos: {
    titulo: "Atendimentos espontâneos",
    descricao: "Incluem escuta inicial ou orientação, consulta no dia e atendimento de urgência.",
  },
  total: {
    titulo: "Denominador",
    descricao: "É o total de atendimentos programados e espontâneos, usado na parte de baixo da divisão. Se o total for zero, o indicador fica sem resultado.",
  },
  pontosPercentuais: {
    titulo: "Pontos percentuais (p.p.)",
    descricao: "Unidade usada para a diferença entre dois percentuais. Se o indicador passa de 40% para 45%, a diferença é de 5 pontos percentuais.",
  },
  comparaveis: {
    titulo: "Equipes comparáveis",
    descricao: "Equipes com resultado válido na competência selecionada e no mês anterior. Usar o mesmo conjunto ajuda a interpretar variações de percentual e volume.",
  },
  persistencia: {
    titulo: "Persistência",
    descricao: "Quantidade de meses consecutivos em que uma equipe fica do mesmo lado da faixa ótima. Uma mudança de direção ou um mês sem resultado interrompe a sequência.",
  },
  coberturaHistorico: {
    titulo: "Cobertura do histórico",
    descricao: "Percentual dos meses esperados que têm resultado válido. Com seis meses esperados e dados em três, por exemplo, a cobertura é de 50%.",
  },
  retorno: {
    titulo: "Retorno sustentado",
    descricao: "O resultado agregado dos três meses antes da criação da ação ficou fora da faixa ótima, e a equipe voltou à faixa em cada um dos três meses de acompanhamento. O painel precisa de dados válidos em todos esses meses.",
  },
  ine: {
    titulo: "INE",
    descricao: "Identificador Nacional de Equipe. É o código da equipe que realizou os atendimentos.",
  },
  cnes: {
    titulo: "CNES",
    descricao: "Cadastro Nacional de Estabelecimentos de Saúde. O código CNES identifica a unidade de saúde à qual a equipe está vinculada.",
  },
  tipoEquipe: {
    titulo: "Tipos de equipe",
    descricao: "eSF significa equipe de Saúde da Família. eAP significa equipe de Atenção Primária.",
  },
} as const

export type TermoAjuda = keyof typeof termos

export function AjudaTecnica({ termo }: { termo: TermoAjuda }) {
  const { titulo, descricao } = termos[termo]
  return <Dialog>
    <DialogTrigger asChild>
      <button
        type="button"
        aria-label={`Ajuda sobre ${titulo}`}
        className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-emerald-700"
      >
        <CircleHelp aria-hidden="true" className="size-4" />
      </button>
    </DialogTrigger>
    <DialogContent className="rounded-2xl sm:max-w-md" showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>{titulo}</DialogTitle>
        <DialogDescription className="leading-relaxed">{descricao}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
}
