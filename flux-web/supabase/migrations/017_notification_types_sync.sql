-- Add sync_proposal, sync_accepted, sync_declined notification types
-- for the "Sincronizar gasto" feature (link unlinked shared expenses between users)

ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type = ANY (ARRAY[
  'friend_request',
  'friend_accepted',
  'friend_declined',
  'shared_expense_invite',
  'shared_expense_sent',
  'shared_expense_updated',
  'shared_expense_accepted',
  'shared_expense_declined',
  'expense_settled_confirm',
  'expense_settled',
  'expense_settle_rejected',
  'receivable_invite',
  'receivable_abono',
  'receivable_settled',
  'sync_proposal',
  'sync_accepted',
  'sync_declined',
  'scheduled_due',
  'tdc_due',
  'budget_alert',
  'trial_expiring',
  'shortcut_reminder',
  'reengagement'
]::text[]));
