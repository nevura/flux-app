-- Expand the notifications type check constraint to include all notification
-- types used by the app (several were missing, causing 500 errors on insert).
ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type = ANY (ARRAY[
  'friend_request',
  'friend_accepted',
  'friend_declined',
  'shared_expense_invite',
  'shared_expense_sent',
  'shared_expense_accepted',
  'expense_settled_confirm',
  'expense_settled',
  'expense_settle_rejected'
]));
