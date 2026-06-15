// ── Database row types ────────────────────────────────────────────────────────

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  username: string | null
  phone: string | null
  timezone: string
  currency: string
  default_monthly_budget: number | null
  subscription_status: 'trialing' | 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  trial_ends_at: string | null
  subscription_ends_at: string | null
  theme_preference: 'dark' | 'light'
  created_at: string
  updated_at: string
}

export interface ShortcutToken {
  id: string
  user_id: string
  token: string
  name: string
  last_used_at: string | null
  created_at: string
}

export interface Category {
  id: string
  user_id: string | null
  name: string
  icon_id: string
  color_id: string
  is_default: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Account {
  id: string
  user_id: string
  name: string
  payment_method_id: string
  color_id: string
  currency: string
  display_exchange_rate: number
  payment_day: number | null
  credit_limit: number | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface AccountWithBalance extends Account {
  balance: number
}

export interface Person {
  id: string
  user_id: string
  name: string
  phone: string | null
  is_me: boolean
  linked_user_id: string | null
  linked_profile?: { id: string; username: string | null; full_name: string | null } | null
  created_at: string
  updated_at: string
}

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  updated_at: string
}

export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'friend_declined'
  | 'shared_expense_invite'
  | 'shared_expense_sent'
  | 'shared_expense_updated'
  | 'shared_expense_accepted'
  | 'shared_expense_declined'
  | 'expense_settled_confirm'
  | 'expense_settled'
  | 'expense_settle_rejected'
  | 'receivable_invite'
  | 'receivable_abono'
  | 'receivable_settled'
  | 'sync_proposal'
  | 'sync_accepted'
  | 'sync_declined'
  | 'scheduled_due'
  | 'tdc_due'
  | 'budget_alert'
  | 'trial_expiring'
  | 'shortcut_reminder'
  | 'reengagement'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  data: Record<string, unknown>
  read: boolean
  created_at: string
}

export interface PublicProfile {
  id: string
  username: string
  full_name: string | null
}

export interface SplitParticipant {
  id: string
  nombre: string
  value: number
  paidAmount: number
  paidStatus: boolean
}

export interface SplitData {
  mode: 'AMT' | 'PCT'
  splitMode: 'DIV' | 'IOWE' | 'THEY'
  data: SplitParticipant[]
  // For IOWE transactions created via shared_expense_invite acceptance:
  // reference back to the creator's original transaction for bidirectional updates
  linked_tx_id?: string
  linked_participant_id?: string
}

export interface Transaction {
  id: string
  user_id: string
  concept: string
  type: 'TR-GASTO' | 'TR-INGRESO' | 'TR-TRANSFER'
  amount: number
  adjustment: number
  currency: string
  exchange_rate: number
  category_id: string | null
  account_id: string
  destination_account_id: string | null
  transaction_date: string
  is_validated: boolean
  scheduled_id: string | null
  split_data: SplitData | null
  exclude_from_budget: boolean
  exclude_mode: 'none' | 'all' | 'shared_only'
  is_receivable: boolean
  is_payable: boolean
  notes: string | null
  original_amount: number | null
  original_currency: string | null
  created_at: string
  updated_at: string
}

export interface ScheduledTransaction {
  id: string
  user_id: string
  name: string
  type: 'TR-GASTO' | 'TR-INGRESO' | 'TR-TRANSFER'
  amount: number
  category_id: string | null
  account_id: string
  destination_account_id: string | null
  frequency_num: number
  frequency_unit: 'dia' | 'semana' | 'mes' | 'año'
  payment_day: number | null
  notification_days: number
  status: 'ACTIVO' | 'PAUSADO' | 'CANCELADO'
  next_charge_date: string | null
  last_charge_date: string | null
  last_notification_date: string | null
  split_data: SplitData | null
  original_currency: string | null
  created_at: string
  updated_at: string
}

export interface Budget {
  id: string
  user_id: string
  month: number
  year: number
  amount: number
  currency: string
  created_at: string
  updated_at: string
}

export interface CreditPayment {
  id: string
  user_id: string
  account_id: string
  year: number
  month: number
  amount: number
  payment_type: 'transfer' | 'deposit'
  source_account_id: string | null
  notes: string | null
  paid_at: string
  created_at: string
  updated_at: string
}

// ── Form types ────────────────────────────────────────────────────────────────

export interface TransactionForm {
  concept: string
  type: 'TR-GASTO' | 'TR-INGRESO' | 'TR-TRANSFER'
  amount: string
  category_id: string
  account_id: string
  destination_account_id?: string
  transaction_date: string
  split_data?: SplitData | null
  exclude_mode?: 'none' | 'all' | 'shared_only'
  notes?: string
  scheduled_id?: string
  is_payable?: boolean
  is_receivable?: boolean
  exchange_rate?: number
  original_amount?: number
  original_currency?: string
}

// ── UI / Computed types ────────────────────────────────────────────────────────

export interface MonthlySummary {
  year: number
  month: number
  income: number
  expenses: number
  net: number
}

export interface StaticIcon {
  id_icon: string
  icon_base: string
}

export interface StaticColor {
  id_color: string
  hex: string
  tailwind: string
  bg: string
}

export interface PaymentMethod {
  id_metodo_pago: string
  nombre: string
  icon: string
  id_color: string
}

// ── Shortcut API payload ──────────────────────────────────────────────────────

export interface ShortcutPayload {
  concept: string
  amount: number | string
  type?: 'Gasto' | 'Ingreso' | 'Transferencia'
  category?: string      // category name or id
  account?: string       // account name or id
  destination?: string   // for transfers
  date?: string
  validated?: 0 | 1
  notes?: string
  // Identifies which shortcut made the call: 'apple_pay' | 'quick_register'
  // Add this field to both iCloud shortcuts so usage can be tracked separately.
  source?: string
  original_currency?: string
}
