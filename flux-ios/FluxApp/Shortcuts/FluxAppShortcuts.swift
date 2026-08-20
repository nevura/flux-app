import AppIntents

struct FluxAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: RegisterTransactionIntent(),
            phrases: [
                "Registrar gasto en \(.applicationName)",
                "Nuevo movimiento en \(.applicationName)",
                "Agregar gasto a \(.applicationName)",
                "Registrar ingreso en \(.applicationName)",
            ],
            shortTitle: "Registro rápido",
            systemImageName: "plus.circle.fill"
        )
        AppShortcut(
            intent: RegisterApplePayIntent(),
            phrases: [
                "Registrar Apple Pay en \(.applicationName)",
                "Guardar pago Apple Pay en \(.applicationName)",
            ],
            shortTitle: "Registro Apple Pay",
            systemImageName: "creditcard.fill"
        )
    }
}
