import Foundation
import Supabase

@MainActor
final class AuthViewModel: ObservableObject {
    @Published var email = ""
    @Published var password = ""
    @Published var fullName = ""
    @Published var isLoading = false
    @Published var errorMessage: String?

    func signIn() async {
        guard validate() else { return }
        isLoading = true
        errorMessage = nil
        do {
            try await supabase.auth.signIn(email: email, password: password)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func signUp() async {
        guard validate() else { return }
        isLoading = true
        errorMessage = nil
        do {
            try await supabase.auth.signUp(
                email: email,
                password: password,
                data: ["full_name": .string(fullName)]
            )
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    private func validate() -> Bool {
        guard !email.isEmpty, !password.isEmpty else {
            errorMessage = "Completa todos los campos"
            return false
        }
        guard password.count >= 6 else {
            errorMessage = "La contraseña debe tener al menos 6 caracteres"
            return false
        }
        return true
    }
}
