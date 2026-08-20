import SwiftUI

struct BudgetSettingsView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.colorScheme) private var colorScheme
    @State private var budget: Budget?
    @State private var amountText = ""
    @State private var isLoading = false
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var successMessage: String?
    private var c: FluxColors { FluxColors(colorScheme) }

    private var currentMonth: Int { Calendar.current.component(.month, from: Date()) }
    private var currentYear: Int  { Calendar.current.component(.year,  from: Date()) }

    var body: some View {
        ZStack {
            c.bg.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 24) {
                    // Current budget display
                    budgetCard

                    // Edit field
                    VStack(alignment: .leading, spacing: 8) {
                        Text("NUEVO MONTO")
                            .font(.system(size: 11, weight: .black))
                            .tracking(2)
                            .foregroundStyle(c.text4)

                        HStack(alignment: .firstTextBaseline, spacing: 4) {
                            Text("$")
                                .font(.system(size: 22, weight: .black))
                                .foregroundStyle(amountText.isEmpty ? c.text4 : FluxTheme.accent)
                            TextField("0.00", text: $amountText)
                                .font(.system(size: 36, weight: .black, design: .rounded))
                                .monospacedDigit()
                                .foregroundStyle(amountText.isEmpty ? c.text4 : FluxTheme.accent)
                                .keyboardType(.decimalPad)
                        }
                        .padding(16)
                        .background(c.bgCard)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(amountText.isEmpty ? c.line : FluxTheme.accent.opacity(0.40), lineWidth: 1.5)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                    }

                    if let error = errorMessage {
                        Text(error).font(.caption).foregroundStyle(FluxTheme.expense)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    if let success = successMessage {
                        Text(success).font(.caption).foregroundStyle(FluxTheme.income)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    Button { Task { await save() } } label: {
                        Group {
                            if isSaving { ProgressView().tint(.white) }
                            else { Text(budget == nil ? "Crear presupuesto" : "Actualizar")
                                .font(.system(size: 16, weight: .black)).foregroundStyle(.white) }
                        }
                        .frame(maxWidth: .infinity).frame(height: 54)
                        .background(FluxTheme.accent)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                    }
                    .buttonStyle(ScaleButtonStyle(scale: 0.97))
                    .disabled(isSaving || amountText.isEmpty)
                }
                .padding(20)
            }
        }
        .navigationTitle("Presupuesto")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    private var budgetCard: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(monthLabel)
                .font(.system(size: 11, weight: .black))
                .tracking(2)
                .foregroundStyle(.white.opacity(0.60))

            if let b = budget {
                Text(formatCurrency(b.amount))
                    .font(.system(size: 38, weight: .black, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(.white)
                Text("presupuesto actual")
                    .font(.system(size: 13))
                    .foregroundStyle(.white.opacity(0.60))
            } else {
                Text("Sin presupuesto")
                    .font(.system(size: 24, weight: .black))
                    .foregroundStyle(.white.opacity(0.70))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background(FluxTheme.accent)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .shadow(color: FluxTheme.accent.opacity(0.30), radius: 10, x: 0, y: 4)
    }

    private var monthLabel: String {
        var comps = DateComponents(); comps.year = currentYear; comps.month = currentMonth; comps.day = 1
        guard let d = Calendar.current.date(from: comps) else { return "" }
        let f = DateFormatter(); f.dateFormat = "MMMM yyyy"; f.locale = Locale(identifier: "es_MX")
        return f.string(from: d).uppercased()
    }

    private func load() async {
        guard let uid = appState.userId else { return }
        isLoading = true
        do {
            let results: [Budget] = try await supabase
                .from("budgets")
                .select()
                .eq("user_id", value: uid)
                .eq("month", value: currentMonth)
                .eq("year", value: currentYear)
                .limit(1)
                .execute()
                .value
            budget = results.first
            if let b = budget { amountText = String(format: "%.0f", b.amount) }
        } catch {}
        isLoading = false
    }

    private func save() async {
        guard let uid = appState.userId else { return }
        let cleaned = amountText.replacingOccurrences(of: ",", with: ".")
        guard let amount = Double(cleaned), amount > 0 else { errorMessage = "Monto inválido"; return }

        isSaving = true; errorMessage = nil; successMessage = nil

        struct BudgetUpsert: Encodable {
            let userId: UUID; let month: Int; let year: Int; let amount: Double; let currency: String
        }
        let payload = BudgetUpsert(userId: uid, month: currentMonth, year: currentYear, amount: amount, currency: "MXN")

        do {
            if let existing = budget {
                struct Patch: Encodable { let amount: Double }
                try await supabase.from("budgets").update(Patch(amount: amount)).eq("id", value: existing.id).execute()
                budget = Budget(id: existing.id, userId: uid, month: currentMonth, year: currentYear, amount: amount, currency: "MXN")
            } else {
                let results: [Budget] = try await supabase.from("budgets").insert(payload).select().execute().value
                budget = results.first
            }
            successMessage = "Presupuesto guardado"
        } catch { errorMessage = error.localizedDescription }
        isSaving = false
    }
}
