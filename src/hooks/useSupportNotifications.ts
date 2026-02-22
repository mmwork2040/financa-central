// Support notifications are now handled by the database trigger (notify_suporte_update)
// and displayed via the NotificacoesDropdown component.
export const useSupportNotifications = () => {
  // No-op: notifications are persisted in the notificacoes table
};
