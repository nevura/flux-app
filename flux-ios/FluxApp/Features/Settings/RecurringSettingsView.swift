import SwiftUI

struct RecurringSettingsView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.colorScheme) private var colorScheme
    @State private var scheduled: [ScheduledTransaction] = []
    @State private var isLoading = false
    private var c: FluxColors { FluxColors(colorScheme) }

    var body: some View {
        ZStack {
            c.bg.ignoresSafeArea()

            Group {
                if isLoading && scheduled.isEmpty {
                    ProgressView().tint(FluxTheme.accent)
                } else if scheduled.isEmpty {
                    emptyState
                } else {
                    List {
                        ForEach(scheduled) { item in
                            recurringRow(item)
                                .listRowBackground(c.bgCard)
                                .listRowSeparator(.hidden)
                                .swipeActions(edge: .trailing) {
                                    Button {
                                        Task { await toggleStatus(item) }
                                    } label: {
                                        Label(
                                            item.status == "ACTIVO" ? "Pausar" : "Activar",
                                            systemImage: item.status == "ACTIVO" ? "pause.circle" : "play.circle"
                                        )
                                    }
                                    .tint(item.status == "ACTIVO" ? FluxTheme.warning : FluxTheme.income)
                                }
                        }
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                    .background(c.bg)
                }
            }
        }
        .navigationTitle("Recurrentes")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable { await load() }
        .task { await load() }
    }

    private func recurringRow(_ item: ScheduledTransaction) -> some View {
        let meta = categoryMeta(for: item.categoryId)
        let amountColor: Color = item.type == "TR-INGRESO" ? FluxTheme.income
            : item.type == "TR-TRANSFER" ? FluxTheme.transfer : FluxTheme.expense
        let prefix = item.type == "TR-INGRESO" ? "+" : item.type == "TR-GASTO" ? "−" : ""

        return HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color(hex: meta?.colorHex ?? "#94a3b8").opacity(0.15))
                    .frame(width: 40, height: 40)
                Image(systemName: meta?.sfSymbol ?? "arrow.clockwise")
                    .font(.system(size: 16))
                    .foregroundStyle(Color(hex: meta?.colorHex ?? "#94a3b8"))
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(item.name)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(c.text)
                    .lineLimit(1)
                HStack(spacing: 6) {
                    if let dateStr = item.nextChargeDate {
                        Text(formattedDate(dateStr))
                            .font(.system(size: 13))
                            .foregroundStyle(c.text3)
                    }
                    statusBadge(item.status)
                }
            }

            Spacer()

            Text(prefix + formatCurrency(item.amount, currency: item.currency ?? "MXN"))
                .font(.system(size: 14, weight: .black))
                .monospacedDigit()
                .foregroundStyle(amountColor)
        }
        .padding(.vertical, 6)
        .opacity(item.status == "ACTIVO" ? 1.0 : 0.50)
    }

    private func statusBadge(_ status: String) -> some View {
        let isPaused = status != "ACTIVO"
        return Text(isPaused ? "Pausado" : "")
            .font(.system(size: 10, weight: .black))
            .foregroundStyle(FluxTheme.warning)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(FluxTheme.warning.opacity(0.15))
            .clipShape(Capsule())
            .opacity(isPaused ? 1 : 0)
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "arrow.clockwise")
                .font(.system(size: 44))
                .foregroundStyle(c.text4)
            Text("Sin recurrentes configurados")
                .font(.system(size: 17, weight: .bold))
                .foregroundStyle(c.text3)
        }
    }

    private func load() async {
        guard let uid = appState.userId else { return }
        isLoading = true
        do {
            scheduled = try await supabase
                .from("scheduled_transactions")
                .select()
                .eq("user_id", value: uid)
                .order("next_charge_date", ascending: true)
                .execute()
                .value
        } catch {}
        isLoading = false
    }

    private func toggleStatus(_ item: ScheduledTransaction) async {
        let newStatus = item.status == "ACTIVO" ? "PAUSADO" : "ACTIVO"
        do {
            struct Patch: Encodable { let status: String }
            try await supabase.from("scheduled_transactions")
                .update(Patch(status: newStatus))
                .eq("id", value: item.id)
                .execute()
            if let i = scheduled.firstIndex(where: { $0.id == item.id }) {
                scheduled[i] = ScheduledTransaction(
                    id: item.id, name: item.name, type: item.type,
                    amount: item.amount, categoryId: item.categoryId,
                    accountId: item.accountId, status: newStatus,
                    nextChargeDate: item.nextChargeDate, currency: item.currency,
                    originalCurrency: item.originalCurrency
                )
            }
        } catch {}
    }

    private func formattedDate(_ s: String) -> String {
        let inp = DateFormatter(); inp.dateFormat = "yyyy-MM-dd"; inp.locale = Locale(identifier: "es_MX")
        guard let d = inp.date(from: s) else { return s }
        let out = DateFormatter(); out.dateFormat = "EEE d MMM"; out.locale = Locale(identifier: "es_MX")
        return out.string(from: d).capitalized
    }
}
