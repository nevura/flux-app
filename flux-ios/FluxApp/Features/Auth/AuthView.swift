import SwiftUI

struct AuthView: View {
    @StateObject private var vm = AuthViewModel()
    @Environment(\.colorScheme) private var colorScheme
    @State private var isLogin = true
    private var c: FluxColors { FluxColors(colorScheme) }

    var body: some View {
        ZStack {
            Color(hex: "#020617").ignoresSafeArea()

            ScrollView {
                VStack(spacing: 0) {
                    // Logo area
                    VStack(spacing: 12) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 22)
                                .fill(FluxTheme.accent.opacity(0.15))
                                .frame(width: 72, height: 72)
                            Image(systemName: "bolt.fill")
                                .font(.system(size: 32, weight: .black))
                                .foregroundStyle(FluxTheme.accent)
                        }
                        Text("FluxApp")
                            .font(.system(size: 34, weight: .black))
                            .foregroundStyle(.white)
                        Text("Tus finanzas personales")
                            .font(.system(size: 15))
                            .foregroundStyle(.white.opacity(0.40))
                    }
                    .padding(.top, 60)
                    .padding(.bottom, 36)

                    // Mode toggle
                    HStack(spacing: 8) {
                        ForEach([("Iniciar sesión", true), ("Registrarse", false)], id: \.0) { label, login in
                            let active = isLogin == login
                            Button { withAnimation(.spring(response: 0.25)) { isLogin = login; vm.errorMessage = nil } } label: {
                                Text(label)
                                    .font(.system(size: 14, weight: .black))
                                    .foregroundStyle(active ? .white : .white.opacity(0.40))
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 12)
                                    .background(active ? FluxTheme.accent : Color.white.opacity(0.07))
                                    .clipShape(RoundedRectangle(cornerRadius: 14))
                                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(active ? FluxTheme.accent : Color.white.opacity(0.08), lineWidth: 1))
                            }
                            .buttonStyle(ScaleButtonStyle(scale: 0.97))
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.bottom, 24)

                    // Form
                    VStack(spacing: 14) {
                        if !isLogin {
                            authField(placeholder: "Nombre completo", text: $vm.fullName)
                                .textContentType(.name)
                        }

                        authField(placeholder: "Correo electrónico", text: $vm.email)
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)

                        authField(placeholder: "Contraseña", text: $vm.password, isSecure: true)
                            .textContentType(isLogin ? .password : .newPassword)

                        if let error = vm.errorMessage {
                            Text(error)
                                .font(.caption)
                                .foregroundStyle(FluxTheme.expense)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(.horizontal, 4)
                        }

                        Button {
                            Task {
                                if isLogin { await vm.signIn() }
                                else { await vm.signUp() }
                            }
                        } label: {
                            Group {
                                if vm.isLoading {
                                    ProgressView().tint(.white)
                                } else {
                                    Text(isLogin ? "Entrar" : "Crear cuenta")
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
                        .disabled(vm.isLoading)
                    }
                    .padding(.horizontal, 24)

                    Spacer(minLength: 40)

                    Text("Flux · Powered by Nevura")
                        .font(.system(size: 12))
                        .foregroundStyle(.white.opacity(0.20))
                        .padding(.bottom, 32)
                }
            }
        }
    }

    @ViewBuilder
    private func authField(placeholder: String, text: Binding<String>, isSecure: Bool = false) -> some View {
        Group {
            if isSecure {
                SecureField(placeholder, text: text)
            } else {
                TextField(placeholder, text: text)
            }
        }
        .font(.system(size: 16, weight: .medium))
        .foregroundStyle(.white)
        .tint(FluxTheme.accent)
        .padding(.horizontal, 16)
        .padding(.vertical, 16)
        .background(Color.white.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.white.opacity(0.08), lineWidth: 1))
    }
}
