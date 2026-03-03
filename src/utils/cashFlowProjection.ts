import { startOfMonth, endOfMonth, addMonths, format, isBefore, isAfter } from "date-fns";

interface Lancamento {
  tipo: string;
  valor: number;
  data_vencimento: string;
  status: string;
  descricao: string;
  recorrente: boolean;
  total_parcelas: number | null;
  recorrencia_fim: string | null;
}

interface MonthFlow {
  receitas: number;
  despesas: number;
}

/**
 * Calculates the monthly cash flow for a given month index (0 = current month, 1 = next, etc.)
 * considering both real pending transactions and virtual recurring projections.
 */
function calcularFluxoMensal(
  monthDate: Date,
  lancamentosFuturos: Lancamento[],
  recorrentes: Lancamento[]
): MonthFlow {
  const mStart = startOfMonth(monthDate);
  const mEnd = endOfMonth(monthDate);
  const mStartStr = format(mStart, "yyyy-MM-dd");
  const mEndStr = format(mEnd, "yyyy-MM-dd");

  // 1. Real pending transactions in this month
  let receitas = 0;
  let despesas = 0;
  const descInMonth = new Set<string>();

  for (const l of lancamentosFuturos) {
    if (l.data_vencimento >= mStartStr && l.data_vencimento <= mEndStr) {
      descInMonth.add(l.descricao.toLowerCase());
      if (l.tipo === "receita") {
        receitas += l.valor || 0;
      } else if (l.tipo === "despesa") {
        despesas += l.valor || 0;
      }
    }
  }

  // 2. Virtual recurring projections (recorrente=true, no total_parcelas)
  for (const r of recorrentes) {
    // Check if this month falls within the recurrence range
    const recStart = new Date(r.data_vencimento);
    const recEnd = r.recorrencia_fim
      ? new Date(r.recorrencia_fim)
      : addMonths(new Date(r.data_vencimento), 12);

    if (isAfter(mStart, recEnd) || isBefore(mEnd, recStart)) {
      continue; // outside range
    }

    // Check for duplicate: if there's already a real transaction with same description in this month
    if (descInMonth.has(r.descricao.toLowerCase())) {
      continue;
    }

    if (r.tipo === "receita") {
      receitas += r.valor || 0;
    } else if (r.tipo === "despesa") {
      despesas += r.valor || 0;
    }
  }

  return { receitas, despesas };
}

/**
 * Simulates cash flow month by month and returns how many months the cash stays positive.
 * Also returns projection data for charting.
 */
export function simularFluxoCaixa(
  caixaAtual: number,
  lancamentosFuturos: Lancamento[],
  recorrentes: Lancamento[],
  mesesProjecao: number = 12
): { mesesDeCaixa: number; projectionData: Array<{ name: string; caixa: number }> } {
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const hoje = new Date();

  const projectionData: Array<{ name: string; caixa: number }> = [
    { name: `${monthNames[hoje.getMonth()]} (Atual)`, caixa: caixaAtual },
  ];

  let runningCaixa = caixaAtual;
  let mesesDeCaixa = mesesProjecao; // default: survives all months

  for (let i = 1; i <= mesesProjecao; i++) {
    const monthDate = addMonths(hoje, i);
    const flow = calcularFluxoMensal(monthDate, lancamentosFuturos, recorrentes);

    runningCaixa = runningCaixa + flow.receitas - flow.despesas;
    projectionData.push({ name: monthNames[monthDate.getMonth()], caixa: runningCaixa });

    if (runningCaixa <= 0 && mesesDeCaixa === mesesProjecao) {
      mesesDeCaixa = i;
    }
  }

  return { mesesDeCaixa, projectionData };
}
