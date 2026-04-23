// Centraliza a lógica de status de lançamentos para evitar regressões.
// "vencido" e "atrasado" são sub-estados de pendente: continuam contando
// como obrigação até serem pagos, ignorados ou excluídos.

export const PENDING_STATUSES = ['pendente', 'aberto', 'vencido', 'atrasado'] as const;
export const EXECUTED_STATUSES = ['pago', 'recebido'] as const;

export type PendingStatus = typeof PENDING_STATUSES[number];
export type ExecutedStatus = typeof EXECUTED_STATUSES[number];

export const isPending = (s?: string | null): boolean =>
  PENDING_STATUSES.includes((s ?? '') as PendingStatus);

export const isExecuted = (s?: string | null): boolean =>
  EXECUTED_STATUSES.includes((s ?? '') as ExecutedStatus);
