import Foundation
import Supabase

@MainActor
final class AppState: ObservableObject {
    @Published var session: Session?
    @Published var isLoading = true

    init() {
        Task { await startListening() }
    }

    private func startListening() async {
        for await (event, session) in supabase.auth.authStateChanges {
            switch event {
            case .initialSession:
                self.session = session
                self.isLoading = false
                persistIntentSession(session)
                if session != nil {
                    Task.detached { await FluxIntentService.syncPendingQueue() }
                }
            case .signedIn:
                self.session = session
                persistIntentSession(session)
            case .signedOut:
                self.session = nil
                FluxIntentService.clearSession()
            default:
                self.session = session
            }
        }
    }

    private func persistIntentSession(_ session: Session?) {
        if let session {
            FluxIntentService.persistSession(
                userId: session.user.id.uuidString,
                accessToken: session.accessToken,
                refreshToken: session.refreshToken,
                expiresAt: session.expiresAt
            )
        } else {
            FluxIntentService.clearSession()
        }
    }

    var userId: UUID? { session?.user.id }
    var userEmail: String? { session?.user.email }

    var firstName: String? {
        guard let meta = session?.user.userMetadata,
              let val = meta["full_name"] else { return nil }
        let raw = String(describing: val)
            .trimmingCharacters(in: CharacterSet(charactersIn: "\""))
        guard !raw.isEmpty, raw != "null" else { return nil }
        return raw.components(separatedBy: " ").first
    }

    var fullName: String? {
        guard let meta = session?.user.userMetadata,
              let val = meta["full_name"] else { return nil }
        let raw = String(describing: val)
            .trimmingCharacters(in: CharacterSet(charactersIn: "\""))
        return raw.isEmpty || raw == "null" ? nil : raw
    }
}
