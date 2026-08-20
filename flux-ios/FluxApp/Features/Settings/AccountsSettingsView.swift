import SwiftUI

struct AccountsSettingsView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.colorScheme) private var colorScheme
    @State private var accounts: [AccountBalance] = []
    @State private var isLoading = false
    @State private var showCreate = false
    @State private var editingAccount: AccountBalance?
    private var c: FluxColors { FluxColors(colorScheme) }

    var body: some View {
        ZStack {
            c.bg.ignoresSafeArea()

            Group {
                if isLoading && accounts.isEmpty {
                    ProgressView().tint(FluxTheme.accent)
                } else if accounts.isEmpty {
                    emptyState
                } else {
                    List {
                        ForEach(accounts) { account in
                            Button { editingAccount = account } label: {
                                accountRow(account)
                            }
                            .buttonStyle(.plain)
                            .listRowBackground(c.bgCard)
                            .listRowSeparator(.hidden)
                        }
                        .onDelete { indexSet in
                            Task { await toggleActive(at: indexSet) }
                        }
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                    .background(c.bg)
                }
            }
        }
        .navigationTitle("Cuentas")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button { showCreate = true } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(FluxTheme.accent)
                }
            }
        }
        .refreshable { await load() }
        .task { await load() }
        .sheet(isPresented: $showCreate, onDismiss: { Task { await load() } }) {
            AccountEditView(existingAccount: nil, onSaved: {})
                .environmentObject(appState)
        }
        .sheet(item: $editingAccount, onDismiss: { Task { await load() } }) { acc in
            AccountEditView(existingAccount: acc, onSaved: {})
                .environmentObject(appState)
        }
    }

    private func accountRow(_ account: AccountBalance) -> some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(FluxTheme.accountColor(paymentMethodId: account.paymentMethodId).opacity(0.20))
                    .frame(width: 40, height: 40)
                Image(systemName: FluxTheme.paymentMethodIcon(paymentMethodId: account.paymentMethodId))
                    .font(.system(size: 16))
                    .foregroundStyle(FluxTheme.accountColor(paymentMethodId: account.paymentMethodId))
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(account.name)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(c.text)
                HStack(spacing: 6) {
                    Text(pmLabel(account.paymentMethodId))
                        .font(.system(size: 13))
                        .foregroundStyle(c.text3)
                    if account.currency != "MXN" {
                        Text("·").foregroundStyle(c.text4)
                        Text(account.currency)
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(FluxTheme.accent)
                    }
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text(formatCurrency(account.balance, currency: account.currency))
                    .font(.system(size: 15, weight: .black))
                    .monospacedDigit()
                    .foregroundStyle(account.balance >= 0 ? c.text : FluxTheme.expense)
                if account.currency != "MXN" && account.displayExchangeRate > 0 {
                    Text("≈ \(formatCurrency(account.balance * account.displayExchangeRate))")
                        .font(.system(size: 11))
                        .foregroundStyle(c.text4)
                }
            }

            Image(systemName: "chevron.right")
                .font(.system(size: 11))
                .foregroundStyle(c.text4)
        }
        .padding(.vertical, 6)
        .opacity(account.isActive ? 1.0 : 0.45)
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "wallet.pass")
                .font(.system(size: 44))
                .foregroundStyle(c.text4)
            Text("Sin cuentas configuradas")
                .font(.system(size: 17, weight: .bold))
                .foregroundStyle(c.text3)
            Button { showCreate = true } label: {
                Text("Agregar cuenta")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(FluxTheme.accent)
                    .clipShape(Capsule())
            }
        }
    }

    private func load() async {
        guard let uid = appState.userId else { return }
        isLoading = true
        do {
            accounts = try await supabase
                .from("account_balances")
                .select()
                .eq("user_id", value: uid)
                .order("sort_order", ascending: true)
                .execute()
                .value
        } catch {}
        isLoading = false
    }

    private func toggleActive(at indexSet: IndexSet) async {
        for i in indexSet {
            let acc = accounts[i]
            do {
                struct Patch: Encodable { let isActive: Bool }
                try await supabase.from("accounts")
                    .update(Patch(isActive: !acc.isActive))
                    .eq("id", value: acc.id)
                    .execute()
                accounts[i] = AccountBalance(
                    id: acc.id, userId: acc.userId, name: acc.name,
                    paymentMethodId: acc.paymentMethodId, colorId: acc.colorId,
                    paymentDay: acc.paymentDay, isActive: !acc.isActive,
                    sortOrder: acc.sortOrder, balance: acc.balance,
                    creditLimit: acc.creditLimit, currency: acc.currency,
                    displayExchangeRate: acc.displayExchangeRate
                )
            } catch {}
        }
    }

    private func pmLabel(_ id: String) -> String {
        switch id {
        case "MP-EFECTIVO": return "Efectivo"
        case "MP-TDD":      return "Tarjeta Débito"
        case "MP-TDC":      return "Tarjeta Crédito"
        default:            return id
        }
    }
}
