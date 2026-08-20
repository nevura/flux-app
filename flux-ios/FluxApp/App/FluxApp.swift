import SwiftUI
import AppIntents

@main
struct FluxApp: App {
    @StateObject private var appState = AppState()

    init() {
        FluxAppShortcuts.updateAppShortcutParameters()
    }

    var body: some Scene {
        WindowGroup {
            Group {
                if appState.isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color(.systemBackground))
                } else if appState.session != nil {
                    MainTabView()
                        .environmentObject(appState)
                } else {
                    AuthView()
                        .environmentObject(appState)
                }
            }
            .animation(.easeInOut(duration: 0.3), value: appState.session?.user.id)
        }
    }
}
