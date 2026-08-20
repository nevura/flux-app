import SwiftUI

struct AccountEditView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    private var c: FluxColors { FluxColors(colorScheme) }

    let existingAccount: AccountBalance?
    var onSaved: () -> Void = {}

    @State private var name = ""
    @State private var paymentMethodId = "MP-EFECTIVO"
    @State private var currency = "MXN"
    @State private var exchangeRate = 1.0
    @State private var exchangeRateText = "1.00"
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var showCurrencyPicker = false

    private var isEditing: Bool { existingAccount != nil }

    private let paymentMethods: [(id: String, label: String, icon: String)] = [
        ("MP-EFECTIVO", "Efectivo",        "banknote"),
        ("MP-TDD",      "Tarjeta Débito",  "creditcard"),
        ("MP-TDC",      "Tarjeta Crédito", "creditcard.fill"),
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                c.bgElevated.ignoresSafeArea()
                ScrollView {
                    VStack(spacing: 20) {
                        nameField
                        methodPicker
                        currencyField
                        if currency != "MXN" { exchangeRateField }
                        if let error = errorMessage {
                            Text(error)
                                .font(.caption)
                                .foregroundStyle(FluxTheme.expense)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        saveButton
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 12)
                    .padding(.bottom, 40)
                }
            }
            .navigationTitle(isEditing ? "Editar cuenta" : "Nueva cuenta")
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
        .sheet(isPresented: $showCurrencyPicker) {
            CurrencyPickerView(selectedCode: $currency)
        }
        .onAppear { prefill() }
    }

    // MARK: - Fields

    private var nameField: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("NOMBRE").sectionLabel()
            TextField("Ej. Cuenta BBVA", text: $name)
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(c.text)
                .fluxInputStyle(c)
        }
    }

    private var methodPicker: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("TIPO").sectionLabel()
            HStack(spacing: 8) {
                ForEach(paymentMethods, id: \.id) { pm in
                    let isSelected = paymentMethodId == pm.id
                    Button { paymentMethodId = pm.id } label: {
                        VStack(spacing: 5) {
                            Image(systemName: pm.icon)
                                .font(.system(size: 16, weight: .bold))
                            Text(pm.label)
                                .font(.system(size: 10, weight: .black))
                                .lineLimit(2)
                                .multilineTextAlignment(.center)
                                .minimumScaleFactor(0.8)
                        }
                        .foregroundStyle(isSelected ? FluxTheme.accent : c.text3)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(
                            RoundedRectangle(cornerRadius: 14)
                                .fill(isSelected ? FluxTheme.accent.opacity(0.13) : c.bgInput)
                                .overlay(RoundedRectangle(cornerRadius: 14)
                                    .stroke(isSelected ? FluxTheme.accent.opacity(0.35) : c.line, lineWidth: 1))
                        )
                    }
                    .buttonStyle(ScaleButtonStyle(scale: 0.96))
                }
            }
        }
    }

    private var currencyField: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("DIVISA").sectionLabel()
            Button { showCurrencyPicker = true } label: {
                HStack {
                    let opt = SUPPORTED_CURRENCIES.first(where: { $0.code == currency })
                    Text("\(opt?.flag ?? "💱") \(currency)")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(c.text)
                    Spacer()
                    Image(systemName: "chevron.up.chevron.down")
                        .font(.system(size: 13))
                        .foregroundStyle(c.text3)
                }
                .fluxInputStyle(c)
            }
            .buttonStyle(.plain)
        }
    }

    private var exchangeRateField: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("TIPO DE CAMBIO (1 \(currency) = ? MXN)").sectionLabel()
            TextField("Ej. 17.50", text: $exchangeRateText)
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(c.text)
                .keyboardType(.decimalPad)
                .fluxInputStyle(c)
                .onChange(of: exchangeRateText) { _, val in
                    let clean = val.replacingOccurrences(of: ",", with: ".")
                    exchangeRate = Double(clean) ?? exchangeRate
                }
        }
    }

    private var saveButton: some View {
        Button { Task { await save() } } label: {
            Group {
                if isSaving {
                    ProgressView().tint(.white)
                } else {
                    Text(isEditing ? "Actualizar" : "Crear cuenta")
                        .font(.system(size: 16, weight: .black))
                        .foregroundStyle(.white)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 54)
            .background(FluxTheme.accent)
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(ScaleButtonStyle(scale: 0.97))
        .disabled(isSaving || name.trimmingCharacters(in: .whitespaces).isEmpty)
    }

    // MARK: - Logic

    private func prefill() {
        guard let acc = existingAccount else { return }
        name = acc.name
        paymentMethodId = acc.paymentMethodId
        currency = acc.currency
        exchangeRate = acc.displayExchangeRate
        exchangeRateText = String(format: "%.2f", acc.displayExchangeRate)
    }

    private func save() async {
        guard let uid = appState.userId else { return }
        isSaving = true
        errorMessage = nil
        let cleanName = name.trimmingCharacters(in: .whitespaces)
        let rate = currency == "MXN" ? 1.0 : exchangeRate

        do {
            if let acc = existingAccount {
                struct AccountPatch: Encodable {
                    let name: String; let paymentMethodId: String
                    let currency: String; let displayExchangeRate: Double
                }
                try await supabase.from("accounts")
                    .update(AccountPatch(name: cleanName, paymentMethodId: paymentMethodId,
                                        currency: currency, displayExchangeRate: rate))
                    .eq("id", value: acc.id)
                    .execute()
            } else {
                struct NewAccount: Encodable {
                    let userId: UUID; let name: String; let paymentMethodId: String
                    let currency: String; let displayExchangeRate: Double
                    let colorId: String; let isActive: Bool; let sortOrder: Int
                }
                try await supabase.from("accounts")
                    .insert(NewAccount(userId: uid, name: cleanName,
                                      paymentMethodId: paymentMethodId,
                                      currency: currency, displayExchangeRate: rate,
                                      colorId: "COL-01", isActive: true, sortOrder: 99))
                    .execute()
            }
            onSaved()
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
        isSaving = false
    }
}

// MARK: - View Modifiers Helpers

private extension Text {
    func sectionLabel() -> some View {
        self.font(.system(size: 11, weight: .black))
            .tracking(2)
            .foregroundStyle(Color(.tertiaryLabel))
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private extension View {
    func fluxInputStyle(_ c: FluxColors) -> some View {
        self.padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(c.bgInput)
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(c.line, lineWidth: 1))
            )
    }
}
