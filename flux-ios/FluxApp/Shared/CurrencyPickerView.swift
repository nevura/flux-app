import SwiftUI

struct CurrencyOption: Identifiable {
    let code: String
    let name: String
    let flag: String
    var id: String { code }
}

let SUPPORTED_CURRENCIES: [CurrencyOption] = [
    CurrencyOption(code: "MXN", name: "Peso mexicano",      flag: "🇲🇽"),
    CurrencyOption(code: "USD", name: "Dólar estadounidense",flag: "🇺🇸"),
    CurrencyOption(code: "EUR", name: "Euro",                flag: "🇪🇺"),
    CurrencyOption(code: "GBP", name: "Libra esterlina",     flag: "🇬🇧"),
    CurrencyOption(code: "CAD", name: "Dólar canadiense",    flag: "🇨🇦"),
    CurrencyOption(code: "ARS", name: "Peso argentino",      flag: "🇦🇷"),
    CurrencyOption(code: "COP", name: "Peso colombiano",     flag: "🇨🇴"),
    CurrencyOption(code: "CLP", name: "Peso chileno",        flag: "🇨🇱"),
    CurrencyOption(code: "BRL", name: "Real brasileño",      flag: "🇧🇷"),
    CurrencyOption(code: "JPY", name: "Yen japonés",         flag: "🇯🇵"),
    CurrencyOption(code: "CNY", name: "Yuan chino",          flag: "🇨🇳"),
]

struct CurrencyPickerView: View {
    @Binding var selectedCode: String
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @State private var searchText = ""
    private var c: FluxColors { FluxColors(colorScheme) }

    private var filtered: [CurrencyOption] {
        guard !searchText.isEmpty else { return SUPPORTED_CURRENCIES }
        return SUPPORTED_CURRENCIES.filter {
            $0.code.localizedCaseInsensitiveContains(searchText) ||
            $0.name.localizedCaseInsensitiveContains(searchText)
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                c.bg.ignoresSafeArea()
                List {
                    ForEach(filtered) { option in
                        Button {
                            selectedCode = option.code
                            dismiss()
                        } label: {
                            HStack(spacing: 14) {
                                Text(option.flag).font(.title2)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(option.code)
                                        .font(.system(size: 15, weight: .bold))
                                        .foregroundStyle(c.text)
                                    Text(option.name)
                                        .font(.system(size: 13))
                                        .foregroundStyle(c.text3)
                                }
                                Spacer()
                                if option.code == selectedCode {
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 14, weight: .bold))
                                        .foregroundStyle(FluxTheme.accent)
                                }
                            }
                            .padding(.vertical, 4)
                        }
                        .listRowBackground(c.bgCard)
                    }
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
                .background(c.bg)
                .searchable(text: $searchText, prompt: "Buscar divisa")
            }
            .navigationTitle("Divisa")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                        .foregroundStyle(c.text3)
                }
            }
        }
    }
}
