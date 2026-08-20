import AppIntents
import Foundation

// MARK: - Transaction type enum

enum FluxTransactionTypeEnum: String, AppEnum {
    case expense  = "Gasto"
    case income   = "Ingreso"
    case transfer = "Transferencia"

    static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Tipo de movimiento")
    static var caseDisplayRepresentations: [Self: DisplayRepresentation] = [
        .expense:  DisplayRepresentation(title: "Gasto"),
        .income:   DisplayRepresentation(title: "Ingreso"),
        .transfer: DisplayRepresentation(title: "Transferencia"),
    ]
}

// MARK: - Registro rápido

struct RegisterTransactionIntent: AppIntent {
    static var title: LocalizedStringResource = "Registrar movimiento"
    static var description = IntentDescription(
        "Agrega un gasto, ingreso o transferencia a Flux sin abrir la app.",
        categoryName: "Flux"
    )
    static var openAppWhenRun: Bool = false

    // Always asked before perform() — required, non-optional
    @Parameter(title: "Monto", requestValueDialog: IntentDialog("¿Cuánto fue?"))
    var amount: Double

    @Parameter(title: "Tipo", requestValueDialog: IntentDialog("¿Qué tipo de movimiento?"))
    var transactionType: FluxTransactionTypeEnum

    // Asked conditionally inside perform() — optional so the system doesn't pre-ask them
    @Parameter(title: "Concepto")
    var concept: String?

    @Parameter(title: "Categoría")
    var category: FluxCategoryEntity?

    @Parameter(title: "Cuenta")
    var account: FluxAccountEntity?

    @Parameter(title: "Cuenta origen")
    var fromAccount: FluxAccountEntity?

    @Parameter(title: "Cuenta destino")
    var toAccount: FluxAccountEntity?

    func perform() async throws -> some IntentResult & ProvidesDialog {
        if transactionType == .transfer {
            let from  = try await $fromAccount.requestValue("¿Cuenta de origen?")
            let to    = try await $toAccount.requestValue("¿Cuenta destino?")
            let saved = try await FluxIntentService.saveTransfer(amount: amount, from: from, to: to)
            if saved {
                return .result(dialog: "Transferencia de \(fmt(amount)) de \(from.name) a \(to.name) registrada en Flux.")
            } else {
                return .result(dialog: "Transferencia de \(fmt(amount)) guardada sin conexión — se sincronizará al abrir Flux.")
            }
        } else {
            let desc  = try await $concept.requestValue("¿En qué fue?")
            let cat   = try await $category.requestValue("¿En qué categoría?")
            let acc   = try await $account.requestValue("¿En qué cuenta?")
            let type  = transactionType == .income ? "TR-INGRESO" : "TR-GASTO"
            let saved = try await FluxIntentService.saveTransaction(
                amount: amount, concept: desc, type: type,
                categoryId: cat.id, accountId: acc.id
            )
            let verb = transactionType == .income ? "Ingreso" : "Gasto"
            if saved {
                return .result(dialog: "\(verb) de \(fmt(amount)) por «\(desc)» registrado en Flux.")
            } else {
                return .result(dialog: "\(verb) de \(fmt(amount)) guardado sin conexión — se sincronizará al abrir Flux.")
            }
        }
    }

    private func fmt(_ v: Double) -> String { String(format: "$%.2f", v) }
}

// MARK: - Registro Apple Pay

struct RegisterApplePayIntent: AppIntent {
    static var title: LocalizedStringResource = "Registrar pago Apple Pay"
    static var description = IntentDescription(
        "Registra automáticamente un pago desde Apple Pay / Wallet.",
        categoryName: "Flux"
    )
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Monto")
    var amount: Double

    @Parameter(title: "Nombre del comercio")
    var merchantName: String

    @Parameter(title: "Tarjeta o Pase")
    var cardName: String

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let saved = try await FluxIntentService.saveTransaction(
            amount: amount, concept: merchantName, type: "TR-GASTO",
            categoryId: "CAT-APPLE", accountId: nil
        )
        let formatted = String(format: "$%.2f", amount)
        if saved {
            return .result(dialog: "Pagaste \(formatted) en \(merchantName) con \(cardName)")
        } else {
            return .result(dialog: "Pago de \(formatted) en \(merchantName) guardado sin conexión.")
        }
    }
}
