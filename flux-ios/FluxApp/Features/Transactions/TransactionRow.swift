import SwiftUI

struct TransactionRow: View {
    let transaction: FluxTransaction
    var categoryName: String?
    var accountName: String?

    @Environment(\.colorScheme) private var colorScheme
    private var c: FluxColors { FluxColors(colorScheme) }
    private var meta: CategoryMeta? { categoryMeta(for: transaction.categoryId) }

    var body: some View {
        HStack(spacing: 12) {
            // Square category icon (matches Dashboard style)
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color(hex: meta?.colorHex ?? "#94a3b8").opacity(0.15))
                    .frame(width: 40, height: 40)
                Image(systemName: meta?.sfSymbol ?? "questionmark.circle")
                    .font(.system(size: 16))
                    .foregroundStyle(Color(hex: meta?.colorHex ?? "#94a3b8"))
            }

            // Concept + category/account
            VStack(alignment: .leading, spacing: 2) {
                Text(transaction.concept)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(c.text)
                    .lineLimit(1)

                HStack(spacing: 4) {
                    Text(categoryName ?? meta?.name ?? "Sin categoría")
                        .font(.system(size: 13))
                        .foregroundStyle(c.text3)
                    if let acc = accountName {
                        Text("·")
                            .font(.system(size: 13))
                            .foregroundStyle(c.text4)
                        Text(acc)
                            .font(.system(size: 13))
                            .foregroundStyle(c.text3)
                    }
                }
            }

            Spacer()

            // Amount + date
            VStack(alignment: .trailing, spacing: 2) {
                Text(formattedAmount)
                    .font(.system(size: 15, weight: .black))
                    .monospacedDigit()
                    .foregroundStyle(FluxTheme.amountColor(type: transaction.type, colorScheme: colorScheme))

                Text(displayDate)
                    .font(.system(size: 11))
                    .foregroundStyle(c.text3)
            }
        }
        .padding(12)
    }

    private var formattedAmount: String {
        let prefix = transaction.type == "TR-INGRESO" ? "+" : transaction.type == "TR-GASTO" ? "-" : ""
        return prefix + formatCurrency(abs(transaction.amount), currency: transaction.currency)
    }

    private var displayDate: String {
        let f = DateFormatter()
        f.dateFormat = "d MMM"
        f.locale = Locale(identifier: "es_MX")
        return f.string(from: transaction.transactionDate)
    }
}
