import SwiftUI

struct SharedView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var vm = SharedViewModel()
    @Environment(\.colorScheme) private var colorScheme
    private var c: FluxColors { FluxColors(colorScheme) }

    var body: some View {
        ZStack {
            c.bg.ignoresSafeArea()

            VStack(spacing: 0) {
                sharedHeader

                if vm.isLoading && vm.people.isEmpty {
                    Spacer()
                    ProgressView().tint(FluxTheme.accent)
                    Spacer()
                } else if vm.people.isEmpty {
                    emptyState
                } else {
                    peopleList
                }
            }
        }
        .task {
            if let uid = appState.userId { await vm.load(userId: uid) }
        }
    }

    // MARK: - Header

    private var sharedHeader: some View {
        HStack {
            Text("Amigos")
                .font(.system(size: 20, weight: .black))
                .foregroundStyle(c.text)
            Spacer()
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
        .background(
            ZStack {
                c.bg.opacity(0.95)
                Rectangle().fill(.ultraThinMaterial)
            }
        )
        .overlay(alignment: .bottom) { c.line.frame(height: 1) }
    }

    // MARK: - People List

    private var peopleList: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Summary strip
                let totalOwed    = vm.balances.values.filter { $0 > 0 }.reduce(0, +)
                let totalIOwe    = vm.balances.values.filter { $0 < 0 }.reduce(0, +)

                if totalOwed != 0 || totalIOwe != 0 {
                    HStack(spacing: 8) {
                        if totalOwed > 0 {
                            balanceSummaryChip(label: "Te deben", amount: totalOwed, color: FluxTheme.income)
                        }
                        if totalIOwe < 0 {
                            balanceSummaryChip(label: "Debes", amount: abs(totalIOwe), color: FluxTheme.expense)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 16)
                    .padding(.bottom, 8)
                }

                LazyVStack(spacing: 10) {
                    ForEach(vm.people) { person in
                        personRow(person)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 120)
            }
        }
        .refreshable {
            if let uid = appState.userId { await vm.load(userId: uid) }
        }
    }

    private func balanceSummaryChip(label: String, amount: Double, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(label.uppercased())
                .font(.system(size: 9, weight: .black))
                .tracking(1.5)
                .foregroundStyle(color.opacity(0.75))
            Text(formatCurrency(amount))
                .font(.system(size: 14, weight: .black))
                .monospacedDigit()
                .foregroundStyle(color)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(color.opacity(0.10))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(color.opacity(0.20), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func personRow(_ person: FluxPerson) -> some View {
        let balance = vm.balances[person.id] ?? 0
        let isLinked = person.linkedUserId != nil

        return HStack(spacing: 14) {
            // Avatar
            ZStack {
                Circle()
                    .fill(FluxTheme.accent.opacity(0.15))
                    .frame(width: 46, height: 46)
                Text(String(person.name.prefix(1)).uppercased())
                    .font(.system(size: 18, weight: .black))
                    .foregroundStyle(FluxTheme.accent)
            }
            .overlay(alignment: .bottomTrailing) {
                if isLinked {
                    Circle()
                        .fill(FluxTheme.income)
                        .frame(width: 12, height: 12)
                        .overlay(
                            Image(systemName: "checkmark")
                                .font(.system(size: 7, weight: .black))
                                .foregroundStyle(.white)
                        )
                }
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(person.name)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(c.text)
                if let phone = person.phone, !phone.isEmpty {
                    Text(phone)
                        .font(.system(size: 13))
                        .foregroundStyle(c.text3)
                } else {
                    Text(isLinked ? "Usuario Flux" : "Sin teléfono")
                        .font(.system(size: 13))
                        .foregroundStyle(c.text4)
                }
            }

            Spacer()

            if balance != 0 {
                VStack(alignment: .trailing, spacing: 2) {
                    Text(balance > 0 ? "Te deben" : "Debes")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(balance > 0 ? FluxTheme.income : FluxTheme.expense)
                    Text(formatCurrency(abs(balance)))
                        .font(.system(size: 15, weight: .black))
                        .monospacedDigit()
                        .foregroundStyle(balance > 0 ? FluxTheme.income : FluxTheme.expense)
                }
            } else {
                Text("Al corriente")
                    .font(.system(size: 12))
                    .foregroundStyle(c.text4)
            }
        }
        .padding(14)
        .background(c.bgCard)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(c.line, lineWidth: 1))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "person.2")
                .font(.system(size: 44))
                .foregroundStyle(c.text4)
            Text("Sin amigos agregados")
                .font(.system(size: 17, weight: .bold))
                .foregroundStyle(c.text3)
            Text("Agrega contactos desde la web para dividir gastos")
                .font(.system(size: 14))
                .foregroundStyle(c.text4)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            Spacer()
        }
    }
}
