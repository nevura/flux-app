import SwiftUI
import Supabase

struct SettingsView: View {
    @EnvironmentObject var appState: AppState
    @State private var profile: FluxProfile?
    @State private var showCurrencyPicker = false
    @State private var profileCurrency = "MXN"
    @State private var showSignOutConfirm = false
    @State private var isSigningOut = false
    @Environment(\.colorScheme) private var colorScheme
    private var c: FluxColors { FluxColors(colorScheme) }

    var body: some View {
        NavigationStack {
            ZStack {
                c.bg.ignoresSafeArea()

                List {
                    profileSection
                    managementSection
                    if let status = profile?.subscriptionStatus {
                        subscriptionSection(status)
                    }
                    appInfoSection
                    signOutSection
                }
                .scrollContentBackground(.hidden)
                .background(c.bg)
            }
            .navigationTitle("Ajustes")
        }
        .confirmationDialog("¿Cerrar sesión?", isPresented: $showSignOutConfirm, titleVisibility: .visible) {
            Button("Cerrar sesión", role: .destructive) {
                Task { await signOut() }
            }
            Button("Cancelar", role: .cancel) {}
        }
        .task { await loadProfile() }
        .sheet(isPresented: $showCurrencyPicker) {
            CurrencyPickerView(selectedCode: $profileCurrency)
                .onDisappear { Task { await saveCurrency() } }
        }
    }

    // MARK: - Profile

    private var profileSection: some View {
        Section {
            HStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(FluxTheme.accent.opacity(0.15))
                        .frame(width: 52, height: 52)
                    Text(String((appState.fullName ?? "U").prefix(1)).uppercased())
                        .font(.system(size: 22, weight: .black))
                        .foregroundStyle(FluxTheme.accent)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(appState.fullName ?? "Usuario")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(c.text)
                    Text(appState.userEmail ?? "")
                        .font(.caption)
                        .foregroundStyle(c.text3)
                }
            }
            .padding(.vertical, 4)
            .listRowBackground(c.bgCard)

            currencyRow
        } header: {
            Text("Perfil").foregroundStyle(c.text3)
        }
    }

    // MARK: - Currency Row

    private var currencyRow: some View {
        Button { showCurrencyPicker = true } label: {
            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(Color(hex: "#3b82f6").opacity(0.15))
                        .frame(width: 40, height: 40)
                    Image(systemName: "dollarsign.circle.fill")
                        .font(.system(size: 17))
                        .foregroundStyle(Color(hex: "#3b82f6"))
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text("Divisa")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(c.text)
                    Text("Moneda por defecto")
                        .font(.system(size: 13))
                        .foregroundStyle(c.text3)
                }
                Spacer()
                let flag = SUPPORTED_CURRENCIES.first(where: { $0.code == profileCurrency })?.flag ?? "💱"
                Text("\(flag) \(profileCurrency)")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(c.text3)
                Image(systemName: "chevron.right")
                    .font(.system(size: 12))
                    .foregroundStyle(c.text4)
            }
            .padding(.vertical, 4)
        }
        .buttonStyle(.plain)
        .listRowBackground(c.bgCard)
    }

    // MARK: - Management Sections

    private var managementSection: some View {
        Section {
            settingsRow(
                icon: "wallet.pass.fill",
                color: FluxTheme.accent,
                label: "Cuentas",
                desc: "Gestiona tus cuentas"
            ) {
                AccountsSettingsView()
            }
            settingsRow(
                icon: "calendar.badge.clock",
                color: FluxTheme.expense,
                label: "Recurrentes",
                desc: "Suscripciones y pagos fijos"
            ) {
                RecurringSettingsView()
            }
            settingsRow(
                icon: "chart.bar.fill",
                color: FluxTheme.income,
                label: "Presupuesto",
                desc: "Meta de gasto mensual"
            ) {
                BudgetSettingsView()
            }
        } header: {
            Text("Gestión").foregroundStyle(c.text3)
        }
    }

    private func settingsRow<Dest: View>(
        icon: String,
        color: Color,
        label: String,
        desc: String,
        @ViewBuilder destination: () -> Dest
    ) -> some View {
        NavigationLink(destination: destination().environmentObject(appState)) {
            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(color.opacity(0.15))
                        .frame(width: 40, height: 40)
                    Image(systemName: icon)
                        .font(.system(size: 17))
                        .foregroundStyle(color)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(label)
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(c.text)
                    Text(desc)
                        .font(.system(size: 13))
                        .foregroundStyle(c.text3)
                }
            }
            .padding(.vertical, 4)
        }
        .listRowBackground(c.bgCard)
    }

    // MARK: - Subscription

    private func subscriptionSection(_ status: String) -> some View {
        Section {
            HStack {
                Label("Plan", systemImage: "star.circle")
                    .foregroundStyle(c.text)
                Spacer()
                Text(subscriptionLabel(status))
                    .foregroundStyle(c.text3)
                    .font(.subheadline)
            }
            .listRowBackground(c.bgCard)
        } header: {
            Text("Suscripción").foregroundStyle(c.text3)
        }
    }

    // MARK: - App Info

    private var appInfoSection: some View {
        Section {
            HStack {
                Label("Versión", systemImage: "info.circle")
                    .foregroundStyle(c.text)
                Spacer()
                Text("1.0.0")
                    .foregroundStyle(c.text3)
                    .font(.subheadline)
            }
            .listRowBackground(c.bgCard)
        } header: {
            Text("Información").foregroundStyle(c.text3)
        }
    }

    // MARK: - Sign Out

    private var signOutSection: some View {
        Section {
            Button(role: .destructive) {
                showSignOutConfirm = true
            } label: {
                HStack {
                    if isSigningOut {
                        ProgressView().scaleEffect(0.8)
                    } else {
                        Label("Cerrar sesión", systemImage: "rectangle.portrait.and.arrow.right")
                            .foregroundStyle(FluxTheme.expense)
                    }
                }
            }
            .listRowBackground(c.bgCard)
        }
    }

    // MARK: - Actions

    private func loadProfile() async {
        guard let uid = appState.userId else { return }
        do {
            let p: FluxProfile = try await supabase
                .from("profiles")
                .select()
                .eq("id", value: uid)
                .single()
                .execute()
                .value
            profile = p
            profileCurrency = p.currency ?? "MXN"
        } catch {}
    }

    private func saveCurrency() async {
        guard let uid = appState.userId else { return }
        struct Patch: Encodable { let currency: String }
        try? await supabase.from("profiles")
            .update(Patch(currency: profileCurrency))
            .eq("id", value: uid)
            .execute()
    }

    private func signOut() async {
        isSigningOut = true
        try? await supabase.auth.signOut()
        isSigningOut = false
    }

    private func subscriptionLabel(_ status: String) -> String {
        switch status {
        case "trialing":  return "Prueba gratuita"
        case "active":    return "Activo"
        case "grace":     return "Periodo de gracia"
        case "expired":   return "Expirado"
        case "canceled":  return "Cancelado"
        default:          return status
        }
    }
}
