import SwiftUI

struct AddTransactionView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme

    let existingTransaction: FluxTransaction?

    @State private var concept = ""
    @State private var amountText = ""
    @State private var type = "TR-GASTO"
    @State private var selectedCategoryId = "CAT-DEF-OTHER"
    @State private var selectedAccountId = ""
    @State private var destAccountId = ""
    @State private var date = Date()
    @State private var notes = ""

    @State private var accounts: [AccountBalance] = []
    @State private var activeCurrency = "MXN"
    @State private var activeExchangeRate = 1.0
    @State private var exchangeRateText = "1.00"
    @State private var isLoading = false
    @State private var isSaving = false
    @State private var errorMessage: String?

    private var c: FluxColors { FluxColors(colorScheme) }

    init(existingTransaction: FluxTransaction? = nil) {
        self.existingTransaction = existingTransaction
    }

    private var allCategories: [CategoryMeta] {
        DEFAULT_CATEGORIES.filter { $0.id != "CAT-AUDIT" && $0.id != "CAT-APPLE" }
    }

    private let types: [(id: String, label: String, icon: String)] = [
        ("TR-GASTO",    "Gasto",        "arrow.up.right"),
        ("TR-INGRESO",  "Ingreso",      "arrow.down.left"),
        ("TR-TRANSFER", "Transferencia","arrow.left.arrow.right"),
    ]

    private var typeColor: Color {
        switch type {
        case "TR-INGRESO":  return FluxTheme.income
        case "TR-TRANSFER": return FluxTheme.transfer
        default:            return FluxTheme.expense
        }
    }

    private var isEditing: Bool { existingTransaction != nil }

    var body: some View {
        NavigationStack {
            ZStack {
                c.bgElevated.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        typeSelector
                        amountField
                        conceptField
                        if type != "TR-TRANSFER" { categoryGrid }
                        if !accounts.isEmpty { accountPicker }
                        if type == "TR-TRANSFER" && !accounts.isEmpty { destAccountPicker }
                        if activeCurrency != "MXN" { exchangeRateField }
                        datePicker
                        notesField

                        if let error = errorMessage {
                            Text(error)
                                .font(.caption)
                                .foregroundStyle(FluxTheme.expense)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }

                        saveButton
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 8)
                    .padding(.bottom, 40)
                }
            }
            .navigationTitle(isEditing ? "Editar movimiento" : "Nuevo movimiento")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                        .foregroundStyle(c.text3)
                }
            }
        }
        .presentationBackground(c.bgElevated)
        .presentationDragIndicator(.visible)
        .task { await loadData() }
        .onChange(of: selectedAccountId) { _, id in
            if let acc = accounts.first(where: { $0.id == id }) {
                activeCurrency = acc.currency
                activeExchangeRate = acc.displayExchangeRate
                exchangeRateText = String(format: "%.2f", acc.displayExchangeRate)
            }
        }
    }

    // MARK: - Type Selector

    private var typeSelector: some View {
        HStack(spacing: 8) {
            ForEach(types, id: \.id) { t in
                let isSelected = type == t.id
                let tColor: Color = t.id == "TR-INGRESO" ? FluxTheme.income
                    : t.id == "TR-TRANSFER" ? FluxTheme.transfer : FluxTheme.expense
                Button {
                    withAnimation(.spring(response: 0.25)) { type = t.id }
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: t.icon)
                            .font(.system(size: 15, weight: .bold))
                        Text(t.label)
                            .font(.system(size: 11, weight: .black))
                            .lineLimit(1)
                            .minimumScaleFactor(0.8)
                    }
                    .foregroundStyle(isSelected ? tColor : c.text3)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .fill(isSelected ? tColor.opacity(0.13) : c.bgInput)
                            .overlay(
                                RoundedRectangle(cornerRadius: 14)
                                    .stroke(isSelected ? tColor.opacity(0.35) : c.line, lineWidth: 1)
                            )
                    )
                }
                .buttonStyle(ScaleButtonStyle(scale: 0.96))
            }
        }
    }

    // MARK: - Amount

    private var amountField: some View {
        VStack(spacing: 6) {
            HStack {
                Text("MONTO")
                    .font(.system(size: 11, weight: .black))
                    .tracking(2)
                    .foregroundStyle(c.text4)
                Spacer()
                if activeCurrency != "MXN" {
                    Text(activeCurrency)
                        .font(.system(size: 11, weight: .black))
                        .tracking(1)
                        .foregroundStyle(typeColor.opacity(0.70))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(typeColor.opacity(0.10))
                        .clipShape(Capsule())
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(currencySymbol(for: activeCurrency))
                    .font(.system(size: 28, weight: .black))
                    .foregroundStyle(amountText.isEmpty ? c.text4 : typeColor)

                TextField("0.00", text: $amountText)
                    .font(.system(size: 44, weight: .black, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(amountText.isEmpty ? c.text4 : typeColor)
                    .keyboardType(.decimalPad)
                    .multilineTextAlignment(.leading)
            }

            Rectangle()
                .fill(LinearGradient(colors: [.clear, typeColor], startPoint: .leading, endPoint: .trailing))
                .frame(width: 160, height: 2)
                .clipShape(Capsule())
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.bottom, 4)
    }

    // MARK: - Exchange Rate Field

    private var exchangeRateField: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("TIPO DE CAMBIO (1 \(activeCurrency) = ? MXN)")
                .font(.system(size: 11, weight: .black))
                .tracking(1)
                .foregroundStyle(c.text4)
                .frame(maxWidth: .infinity, alignment: .leading)

            TextField("Ej. 17.50", text: $exchangeRateText)
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(c.text)
                .keyboardType(.decimalPad)
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(c.bgInput)
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(c.line, lineWidth: 1))
                )
                .onChange(of: exchangeRateText) { _, val in
                    let clean = val.replacingOccurrences(of: ",", with: ".")
                    activeExchangeRate = Double(clean) ?? activeExchangeRate
                }
        }
    }

    // MARK: - Concept

    private var conceptField: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("CONCEPTO")
                .font(.system(size: 11, weight: .black))
                .tracking(2)
                .foregroundStyle(c.text4)

            TextField("Descripción", text: $concept)
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(c.text)
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(c.bgInput)
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(c.line, lineWidth: 1))
                )
        }
    }

    // MARK: - Category Grid

    private var categoryGrid: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("CATEGORÍA")
                .font(.system(size: 11, weight: .black))
                .tracking(2)
                .foregroundStyle(c.text4)

            LazyVGrid(columns: Array(repeating: .init(.flexible()), count: 4), spacing: 4) {
                ForEach(allCategories, id: \.id) { cat in
                    let isSelected = selectedCategoryId == cat.id
                    Button { selectedCategoryId = cat.id } label: {
                        VStack(spacing: 6) {
                            Image(systemName: cat.sfSymbol)
                                .font(.system(size: 20))
                                .foregroundStyle(isSelected ? typeColor : c.text3)
                                .frame(height: 24)

                            Text(cat.name.components(separatedBy: " ").first ?? cat.name)
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(isSelected ? typeColor : c.text4)
                                .lineLimit(1)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(isSelected ? typeColor.opacity(0.10) : .clear)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(isSelected ? typeColor.opacity(0.30) : Color.clear, lineWidth: 1)
                                )
                        )
                    }
                    .buttonStyle(ScaleButtonStyle(scale: 0.92))
                }
            }
        }
    }

    // MARK: - Account Pickers

    private var accountPicker: some View {
        accountPickerView(
            label: type == "TR-TRANSFER" ? "DE" : "CUENTA",
            selectedId: $selectedAccountId,
            excludeId: type == "TR-TRANSFER" ? destAccountId : nil
        )
    }

    private var destAccountPicker: some View {
        accountPickerView(
            label: "A",
            selectedId: $destAccountId,
            excludeId: selectedAccountId
        )
    }

    private func accountPickerView(label: String, selectedId: Binding<String>, excludeId: String?) -> some View {
        let filtered = accounts.filter { excludeId == nil || $0.id != excludeId }
        return VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.system(size: 11, weight: .black))
                .tracking(2)
                .foregroundStyle(c.text4)

            Menu {
                ForEach(filtered) { acc in
                    Button(acc.name) { selectedId.wrappedValue = acc.id }
                }
            } label: {
                HStack {
                    Text(accounts.first(where: { $0.id == selectedId.wrappedValue })?.name ?? "Seleccionar")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(c.text)
                    Spacer()
                    Image(systemName: "chevron.up.chevron.down")
                        .font(.system(size: 13))
                        .foregroundStyle(c.text3)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(c.bgInput)
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(c.line, lineWidth: 1))
                )
            }
        }
    }

    // MARK: - Date Picker

    private var datePicker: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("FECHA")
                .font(.system(size: 11, weight: .black))
                .tracking(2)
                .foregroundStyle(c.text4)

            DatePicker("", selection: $date, displayedComponents: .date)
                .datePickerStyle(.compact)
                .labelsHidden()
                .tint(typeColor)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(c.bgInput)
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(c.line, lineWidth: 1))
                )
        }
    }

    // MARK: - Notes

    private var notesField: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("NOTAS")
                .font(.system(size: 11, weight: .black))
                .tracking(2)
                .foregroundStyle(c.text4)

            TextField("Opcional", text: $notes, axis: .vertical)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(c.text)
                .lineLimit(3)
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(c.bgInput)
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(c.line, lineWidth: 1))
                )
        }
    }

    // MARK: - Save Button

    private var saveButton: some View {
        Button { Task { await save() } } label: {
            Group {
                if isSaving {
                    ProgressView().tint(.white)
                } else {
                    Text(isEditing ? "Actualizar" : "Guardar")
                        .font(.system(size: 16, weight: .black))
                        .foregroundStyle(.white)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 54)
            .background(typeColor)
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(ScaleButtonStyle(scale: 0.97))
        .disabled(isSaving || concept.isEmpty || amountText.isEmpty)
    }

    // MARK: - Data loading & save

    private func loadData() async {
        guard let uid = appState.userId else { return }
        isLoading = true
        do {
            let accs: [AccountBalance] = try await supabase
                .from("account_balances")
                .select()
                .eq("user_id", value: uid)
                .eq("is_active", value: true)
                .order("sort_order", ascending: true)
                .execute()
                .value
            accounts = accs

            if let tx = existingTransaction {
                concept = tx.concept
                amountText = String(format: "%.2f", tx.amount)
                type = tx.type
                selectedCategoryId = tx.categoryId ?? "CAT-DEF-OTHER"
                selectedAccountId = tx.accountId ?? ""
                date = tx.transactionDate
                notes = tx.notes ?? ""

                // For transfers, find the partner row (same id, opposite adjustment)
                if tx.type == "TR-TRANSFER" {
                    let partnerRows: [FluxTransaction] = (try? await supabase
                        .from("transactions")
                        .select()
                        .eq("id", value: tx.id)
                        .neq("account_id", value: tx.accountId ?? "")
                        .execute()
                        .value) ?? []
                    if let partner = partnerRows.first {
                        destAccountId = partner.accountId ?? ""
                    } else if let second = accs.dropFirst().first {
                        destAccountId = second.id
                    }
                }
            } else {
                if selectedAccountId.isEmpty, let first = accs.first {
                    selectedAccountId = first.id
                }
                if destAccountId.isEmpty, let second = accs.dropFirst().first {
                    destAccountId = second.id
                }
            }
            // Initialize currency from selected account
            if let acc = accs.first(where: { $0.id == selectedAccountId }) {
                activeCurrency = acc.currency
                activeExchangeRate = acc.displayExchangeRate
                exchangeRateText = String(format: "%.2f", acc.displayExchangeRate)
            }
        } catch {}
        isLoading = false
    }

    private func save() async {
        guard let uid = appState.userId else { return }
        let cleanedAmount = amountText
            .replacingOccurrences(of: ",", with: ".")
            .replacingOccurrences(of: "$", with: "")
            .trimmingCharacters(in: .whitespaces)
        guard let amount = Double(cleanedAmount) else {
            errorMessage = "Monto inválido"
            return
        }

        isSaving = true
        errorMessage = nil

        let currency = activeCurrency
        let exchangeRate = currency == "MXN" ? 1.0 : activeExchangeRate

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate, .withDashSeparatorInDate]
        let dateStr = formatter.string(from: date)

        do {
            if let tx = existingTransaction {
                struct TxUpdate: Encodable {
                    let concept: String; let type: String; let amount: Double
                    let adjustment: Double; let categoryId: String?; let accountId: String?
                    let transactionDate: String; let currency: String
                    let exchangeRate: Double; let notes: String?
                }
                let update = TxUpdate(
                    concept: concept, type: type, amount: amount,
                    adjustment: type == "TR-TRANSFER" ? -amount : adjustmentFor(type: type, amount: amount),
                    categoryId: type == "TR-TRANSFER" ? nil : selectedCategoryId,
                    accountId: selectedAccountId.isEmpty ? nil : selectedAccountId,
                    transactionDate: dateStr, currency: currency,
                    exchangeRate: exchangeRate, notes: notes.isEmpty ? nil : notes
                )
                try await supabase.from("transactions").update(update).eq("id", value: tx.id).execute()

                // For transfer edits, update or create the partner row
                if type == "TR-TRANSFER" && !destAccountId.isEmpty {
                    let destAccount = accounts.first(where: { $0.id == destAccountId })
                    let destCurrency = destAccount?.currency ?? currency
                    let destRate = destAccount?.displayExchangeRate ?? 1.0
                    let partnerUpdate = TxUpdate(
                        concept: concept, type: type, amount: amount, adjustment: amount,
                        categoryId: nil, accountId: destAccountId,
                        transactionDate: dateStr, currency: destCurrency,
                        exchangeRate: destRate, notes: notes.isEmpty ? nil : notes
                    )
                    // Try to update partner row (same id, positive adjustment)
                    try await supabase.from("transactions")
                        .update(partnerUpdate)
                        .eq("id", value: tx.id)
                        .eq("adjustment", value: tx.adjustment >= 0 ? tx.amount : -tx.amount)
                        .execute()
                }
            } else if type == "TR-TRANSFER" {
                // Transfers create two rows sharing the same UUID
                let transferId = UUID()
                let srcAccount = accounts.first(where: { $0.id == selectedAccountId })
                let dstAccount = accounts.first(where: { $0.id == destAccountId })
                let srcRow = NewTransferRow(
                    id: transferId, userId: uid, concept: concept, type: "TR-TRANSFER",
                    amount: amount, adjustment: -amount,
                    accountId: selectedAccountId.isEmpty ? nil : selectedAccountId,
                    transactionDate: dateStr, isValidated: false,
                    currency: srcAccount?.currency ?? currency,
                    exchangeRate: srcAccount?.displayExchangeRate ?? exchangeRate,
                    notes: notes.isEmpty ? nil : notes
                )
                let dstRow = NewTransferRow(
                    id: transferId, userId: uid, concept: concept, type: "TR-TRANSFER",
                    amount: amount, adjustment: amount,
                    accountId: destAccountId.isEmpty ? nil : destAccountId,
                    transactionDate: dateStr, isValidated: false,
                    currency: dstAccount?.currency ?? currency,
                    exchangeRate: dstAccount?.displayExchangeRate ?? exchangeRate,
                    notes: notes.isEmpty ? nil : notes
                )
                try await supabase.from("transactions").insert([srcRow, dstRow]).execute()
            } else {
                let newTx = NewTransaction(
                    userId: uid, concept: concept, type: type, amount: amount,
                    adjustment: adjustmentFor(type: type, amount: amount),
                    categoryId: selectedCategoryId,
                    accountId: selectedAccountId.isEmpty ? nil : selectedAccountId,
                    transactionDate: dateStr, isValidated: false,
                    currency: currency, exchangeRate: exchangeRate,
                    notes: notes.isEmpty ? nil : notes
                )
                try await supabase.from("transactions").insert(newTx).execute()
            }
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
        isSaving = false
    }

    private func currencySymbol(for code: String) -> String {
        let locale = Locale(identifier: "en_US")
        return locale.localizedString(forCurrencyCode: code).flatMap { _ in
            let f = NumberFormatter()
            f.numberStyle = .currency
            f.currencyCode = code
            f.locale = Locale(identifier: "en_US")
            return f.currencySymbol
        } ?? "$"
    }
}
