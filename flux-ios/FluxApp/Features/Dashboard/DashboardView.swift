import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var vm = DashboardViewModel()
    @Environment(\.colorScheme) private var colorScheme

    // Daily/Weekly Spend widget state
    @State private var spendMode: SpendMode = .day
    @State private var spendOffset: Int = 0
    @State private var showSettings = false

    private var c: FluxColors { FluxColors(colorScheme) }

    enum SpendMode { case day, week }

    var body: some View {
        ZStack {
            c.bg.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 16) {
                    balanceCard
                    budgetWidget
                    spendWidget
                    recurringWidget
                    if !vm.accounts.isEmpty { accountsSection }
                    if !tdcAccounts.isEmpty { tdcSection }
                }
                .padding(.horizontal, 16)
                .padding(.top, 16)
                .padding(.bottom, 120)
            }
            .safeAreaInset(edge: .top, spacing: 0) {
                dashboardHeader
            }
            .refreshable {
                if let uid = appState.userId { await vm.load(userId: uid) }
            }

            if vm.isLoading && vm.accounts.isEmpty {
                ProgressView().tint(FluxTheme.accent)
            }
        }
        .sheet(isPresented: $showSettings) {
            SettingsView().environmentObject(appState)
        }
        .task {
            if let uid = appState.userId, vm.accounts.isEmpty {
                await vm.load(userId: uid)
            }
        }
    }

    // MARK: - Sticky Header

    private var dashboardHeader: some View {
        HStack(spacing: 12) {
            Button { showSettings = true } label: {
                Image(systemName: "line.3.horizontal")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(c.text3)
                    .frame(width: 36, height: 36)
                    .background(c.bgInput)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .buttonStyle(.plain)

            Spacer()

            VStack(spacing: 2) {
                Text(currentMonthLabel)
                    .font(.system(size: 11, weight: .black))
                    .tracking(3)
                    .foregroundStyle(c.text3)
                Text(greetingText)
                    .font(.system(size: 20, weight: .black))
                    .foregroundStyle(c.text)
                    .lineLimit(1)
            }

            Spacer()

            Button {} label: {
                Image(systemName: "bell")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(c.text3)
                    .frame(width: 36, height: 36)
                    .background(c.bgInput)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .buttonStyle(.plain)
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

    // MARK: - Balance Card

    private var balanceCard: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("SALDO ACTUAL")
                .font(.system(size: 11, weight: .black))
                .tracking(3)
                .foregroundStyle(.white.opacity(0.60))

            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text(formatCurrency(vm.totalBalance))
                    .font(.system(size: 46, weight: .black, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(.white)
                    .minimumScaleFactor(0.5)
                    .lineLimit(1)

                Text("MXN")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(.white.opacity(0.40))
                    .offset(y: -6)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(24)
        .background(FluxTheme.accent)
        .clipShape(RoundedRectangle(cornerRadius: 28))
        .shadow(color: FluxTheme.accent.opacity(0.35), radius: 10, x: 0, y: 4)
    }

    // MARK: - Budget Widget

    private var budgetWidget: some View {
        let spend = vm.monthlySpend
        let limit = vm.budget?.amount ?? 0
        let pct   = limit > 0 ? min(spend / limit, 1.0) : 0
        let over  = limit > 0 && spend > limit
        let low   = limit > 0 && pct > 0.80 && !over

        let bgFill: Color = vm.budget == nil ? c.bgCard
            : over ? FluxTheme.expense.opacity(0.10)
            : FluxTheme.accent.opacity(0.08)
        let borderColor: Color = vm.budget == nil ? c.line
            : over ? FluxTheme.expense.opacity(0.30)
            : FluxTheme.accent.opacity(0.25)
        let barColor: Color = over ? FluxTheme.expense : low ? FluxTheme.warning : FluxTheme.income

        return VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("PRESUPUESTO DEL MES")
                    .font(.system(size: 11, weight: .black))
                    .tracking(2)
                    .foregroundStyle(c.text3)
                Spacer()
                Button {} label: {
                    Image(systemName: "pencil")
                        .font(.system(size: 12))
                        .foregroundStyle(c.text3)
                        .frame(width: 28, height: 28)
                        .background(c.bgInput)
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
            }

            if vm.budget == nil {
                Text("Sin presupuesto configurado")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(c.text4)
            } else {
                Text(formatCurrency(spend))
                    .font(.system(size: 28, weight: .black))
                    .foregroundStyle(c.text)
                    .monospacedDigit()

                let remaining = limit - spend
                HStack(spacing: 4) {
                    Text("de \(formatCurrency(limit))")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(c.text3)
                    Text("·")
                        .foregroundStyle(c.text4)
                    if over {
                        Text("excedido \(formatCurrency(abs(remaining)))")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(FluxTheme.expense)
                    } else {
                        Text("te quedan \(formatCurrency(remaining))")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(barColor)
                    }
                }

                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(c.bgInput).frame(height: 6)
                        Capsule().fill(barColor)
                            .frame(width: geo.size.width * pct, height: 6)
                    }
                }
                .frame(height: 6)
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(bgFill)
                .overlay(RoundedRectangle(cornerRadius: 20).stroke(borderColor, lineWidth: 1))
        )
    }

    // MARK: - Daily / Weekly Spend Widget

    private var spendWidget: some View {
        let label    = spendLabel
        let amount   = currentSpendAmount
        let canNext  = spendOffset < 0

        return VStack(spacing: 0) {
            // Segmented control
            HStack(spacing: 0) {
                ForEach([("HOY", SpendMode.day), ("SEMANA", SpendMode.week)], id: \.0) { title, mode in
                    let active = spendMode == mode
                    Button { withAnimation(.spring(response: 0.25)) { spendMode = mode; spendOffset = 0 } } label: {
                        Text(title)
                            .font(.system(size: 13, weight: .black))
                            .tracking(1)
                            .foregroundStyle(active ? .white : c.text3)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(active ? FluxTheme.accent : Color.clear)
                    }
                    .buttonStyle(.plain)
                }
            }
            .background(c.bgInput)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .padding([.horizontal, .top], 14)

            // Body
            VStack(spacing: 6) {
                Text(label)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(c.text3)

                HStack(spacing: 16) {
                    Button { withAnimation { spendOffset -= 1 } } label: {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(c.text3)
                            .frame(width: 36, height: 36)
                            .background(c.bgInput)
                            .clipShape(Circle())
                    }
                    .buttonStyle(.plain)

                    Text(formatCurrency(amount))
                        .font(.system(size: 38, weight: .black))
                        .monospacedDigit()
                        .foregroundStyle(c.text)
                        .minimumScaleFactor(0.6)
                        .lineLimit(1)
                        .frame(maxWidth: .infinity)

                    Button { withAnimation { spendOffset += 1 } } label: {
                        Image(systemName: "chevron.right")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(canNext ? c.text3 : c.text4)
                            .frame(width: 36, height: 36)
                            .background(c.bgInput)
                            .clipShape(Circle())
                    }
                    .buttonStyle(.plain)
                    .disabled(!canNext)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
        }
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(c.bgCard)
                .overlay(RoundedRectangle(cornerRadius: 20).stroke(c.line, lineWidth: 1))
        )
    }

    private var spendLabel: String {
        let cal = Calendar.current
        if spendMode == .day {
            guard let d = cal.date(byAdding: .day, value: spendOffset, to: Date()) else { return "" }
            if spendOffset == 0 { return "Hoy" }
            if spendOffset == -1 { return "Ayer" }
            let f = DateFormatter(); f.dateFormat = "EEEE d MMM"; f.locale = Locale(identifier: "es_MX")
            return f.string(from: d).capitalized
        } else {
            guard let start = weekStart(offset: spendOffset) else { return "" }
            if spendOffset == 0 { return "Esta semana" }
            guard let end = Calendar.current.date(byAdding: .day, value: 6, to: start) else { return "" }
            let f = DateFormatter(); f.dateFormat = "d MMM"; f.locale = Locale(identifier: "es_MX")
            return "\(f.string(from: start)) – \(f.string(from: end))"
        }
    }

    private var currentSpendAmount: Double {
        let cal = Calendar.current
        if spendMode == .day {
            guard let d = cal.date(byAdding: .day, value: spendOffset, to: Date()) else { return 0 }
            return vm.spendFor(date: d)
        } else {
            guard let start = weekStart(offset: spendOffset) else { return 0 }
            return vm.spendForWeek(startingFrom: start)
        }
    }

    private func weekStart(offset: Int) -> Date? {
        let cal = Calendar.current
        guard let thisWeek = cal.dateInterval(of: .weekOfYear, for: Date())?.start else { return nil }
        return cal.date(byAdding: .weekOfYear, value: offset, to: thisWeek)
    }

    // MARK: - Upcoming Recurring Widget

    private var recurringWidget: some View {
        Group {
            if vm.upcomingScheduled.isEmpty {
                recurringEmpty
            } else {
                recurringList
            }
        }
    }

    private var recurringEmpty: some View {
        VStack(spacing: 10) {
            ZStack {
                RoundedRectangle(cornerRadius: 14)
                    .fill(FluxTheme.accent.opacity(0.12))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(FluxTheme.accent.opacity(0.20), lineWidth: 1))
                    .frame(width: 48, height: 48)
                Image(systemName: "arrow.clockwise")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(FluxTheme.accent)
            }
            Text("Sin recurrentes registrados")
                .font(.system(size: 14, weight: .black))
                .foregroundStyle(c.text)
            Text("Registra tus suscripciones en Ajustes")
                .font(.system(size: 12))
                .foregroundStyle(c.text3)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(c.bgCard)
                .overlay(RoundedRectangle(cornerRadius: 20).stroke(c.line, lineWidth: 1))
        )
    }

    private var recurringList: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("PRÓXIMOS RECURRENTES")
                .font(.system(size: 11, weight: .black))
                .tracking(3)
                .foregroundStyle(c.text3)
                .padding(.horizontal, 14)
                .padding(.top, 14)
                .padding(.bottom, 10)

            if vm.upcomingIncomeTotal > 0 || vm.upcomingExpenseTotal > 0 {
                let maxVal = max(vm.upcomingIncomeTotal, vm.upcomingExpenseTotal)
                VStack(spacing: 8) {
                    if vm.upcomingIncomeTotal > 0 {
                        recurringBarRow(label: "INGRESOS", amount: vm.upcomingIncomeTotal,
                                        color: FluxTheme.income,
                                        pct: vm.upcomingIncomeTotal / maxVal)
                    }
                    if vm.upcomingExpenseTotal > 0 {
                        recurringBarRow(label: "GASTOS", amount: vm.upcomingExpenseTotal,
                                        color: FluxTheme.expense,
                                        pct: vm.upcomingExpenseTotal / maxVal)
                    }
                }
                .padding(.horizontal, 14)
                .padding(.bottom, 10)

                c.line.frame(height: 1)
            }

            ForEach(Array(vm.upcomingScheduled.enumerated()), id: \.element.id) { idx, sched in
                if idx > 0 {
                    c.line.frame(height: 1).padding(.leading, 62)
                }
                ScheduledRow(sched: sched)
            }
            .padding(.bottom, 4)
        }
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(c.bgCard)
                .overlay(RoundedRectangle(cornerRadius: 20).stroke(c.line, lineWidth: 1))
        )
    }

    private func recurringBarRow(label: String, amount: Double, color: Color, pct: Double) -> some View {
        VStack(spacing: 4) {
            HStack {
                Text(label)
                    .font(.system(size: 11, weight: .black))
                    .tracking(2)
                    .foregroundStyle(c.text3)
                Spacer()
                Text(formatCurrency(amount))
                    .font(.system(size: 11, weight: .bold))
                    .monospacedDigit()
                    .foregroundStyle(c.text3)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(c.bgInput).frame(height: 6)
                    Capsule().fill(color).frame(width: geo.size.width * pct, height: 6)
                }
            }
            .frame(height: 6)
        }
    }

    // MARK: - Accounts Grid

    private var accountsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("ESTADO DE CUENTAS")
                    .font(.system(size: 11, weight: .black))
                    .tracking(3)
                    .foregroundStyle(c.text3)
                Spacer()
                Button {} label: {
                    Text("Auditar")
                        .font(.system(size: 13, weight: .black))
                        .foregroundStyle(FluxTheme.accent)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(FluxTheme.accent.opacity(0.12))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }
                .buttonStyle(.plain)
            }

            LazyVGrid(
                columns: [.init(.flexible(), spacing: 12), .init(.flexible(), spacing: 12)],
                spacing: 12
            ) {
                ForEach(vm.accounts) { account in
                    AccountCardView(account: account)
                }
            }
        }
    }

    // MARK: - TDC Payments Section

    private var tdcAccounts: [AccountBalance] {
        vm.accounts.filter { $0.paymentMethodId == "MP-TDC" || (($0.creditLimit ?? 0) > 0) }
    }

    private var tdcSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("PAGOS TDC")
                .font(.system(size: 11, weight: .black))
                .tracking(3)
                .foregroundStyle(c.text3)

            VStack(spacing: 0) {
                ForEach(Array(tdcAccounts.enumerated()), id: \.element.id) { idx, account in
                    if idx > 0 { c.line.frame(height: 1) }
                    tdcRow(account: account)
                }
            }
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(c.bgCard)
                    .overlay(RoundedRectangle(cornerRadius: 20).stroke(c.line, lineWidth: 1))
            )
        }
    }

    private func tdcRow(account: AccountBalance) -> some View {
        let today = Calendar.current.component(.day, from: Date())
        let isPaid = account.balance >= 0
        let isOverdue = !isPaid && today > (account.paymentDay ?? 31)
        let iconName = isPaid ? "checkmark" : "creditcard"
        let iconColor: Color = isPaid ? FluxTheme.income : isOverdue ? FluxTheme.expense : Color(hex: "#FF8A80")

        return HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(iconColor.opacity(0.15))
                    .frame(width: 36, height: 36)
                Image(systemName: iconName)
                    .font(.system(size: 14))
                    .foregroundStyle(iconColor)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(account.name)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(c.text)
                    .lineLimit(1)
                if let day = account.paymentDay {
                    Text(isPaid ? "Al corriente" : isOverdue ? "Vencido — día \(day)" : "Pendiente — día \(day)")
                        .font(.system(size: 13))
                        .foregroundStyle(isOverdue ? FluxTheme.expense : c.text3)
                }
            }

            Spacer()

            if !isPaid {
                Text(formatCurrency(abs(account.balance), currency: account.currency))
                    .font(.system(size: 14, weight: .black))
                    .monospacedDigit()
                    .foregroundStyle(isOverdue ? FluxTheme.expense : c.text)
            }

            let badgeColor: Color = isPaid ? FluxTheme.income : isOverdue ? FluxTheme.expense : FluxTheme.accent
            Text(isPaid ? "Pagado" : isOverdue ? "Vencido" : "Pagar")
                .font(.system(size: 12, weight: .black))
                .foregroundStyle(badgeColor)
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(badgeColor.opacity(0.12))
                .clipShape(Capsule())
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
    }

    // MARK: - Helpers

    private var currentMonthLabel: String {
        let f = DateFormatter()
        f.dateFormat = "MMMM yyyy"
        f.locale = Locale(identifier: "es_MX")
        return f.string(from: Date()).uppercased()
    }

    private var greetingText: String {
        let hour = Calendar.current.component(.hour, from: Date())
        let prefix = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches"
        if let name = appState.firstName, !name.isEmpty { return "\(prefix), \(name)" }
        return prefix
    }
}

// MARK: - Scheduled Row

struct ScheduledRow: View {
    let sched: ScheduledTransaction
    @Environment(\.colorScheme) private var colorScheme
    private var c: FluxColors { FluxColors(colorScheme) }
    private var meta: CategoryMeta? { categoryMeta(for: sched.categoryId) }

    var body: some View {
        HStack(spacing: 12) {
            // Icon
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color(hex: meta?.colorHex ?? "#94a3b8").opacity(0.15))
                    .frame(width: 36, height: 36)
                Image(systemName: meta?.sfSymbol ?? "arrow.clockwise")
                    .font(.system(size: 14))
                    .foregroundStyle(Color(hex: meta?.colorHex ?? "#94a3b8"))
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(sched.name)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(c.text)
                    .lineLimit(1)
                if let dateStr = sched.nextChargeDate {
                    Text(formattedDate(dateStr))
                        .font(.system(size: 13))
                        .foregroundStyle(c.text3)
                }
            }

            Spacer()

            let prefix = sched.type == "TR-INGRESO" ? "+" : sched.type == "TR-GASTO" ? "−" : ""
            let color: Color = sched.type == "TR-INGRESO" ? FluxTheme.income
                : sched.type == "TR-TRANSFER" ? FluxTheme.transfer : FluxTheme.expense

            Text(prefix + formatCurrency(sched.amount, currency: sched.currency ?? "MXN"))
                .font(.system(size: 15, weight: .black))
                .monospacedDigit()
                .foregroundStyle(color)

            Image(systemName: "chevron.right")
                .font(.system(size: 11))
                .foregroundStyle(c.text4)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
    }

    private func formattedDate(_ s: String) -> String {
        let inp = DateFormatter(); inp.dateFormat = "yyyy-MM-dd"; inp.locale = Locale(identifier: "es_MX")
        guard let d = inp.date(from: s) else { return s }
        let out = DateFormatter(); out.dateFormat = "EEE, d"; out.locale = Locale(identifier: "es_MX")
        return out.string(from: d).capitalized
    }
}

// MARK: - Account Card

struct AccountCardView: View {
    let account: AccountBalance

    private var accentColor: Color { FluxTheme.accountColor(paymentMethodId: account.paymentMethodId) }
    private var shadowColor: Color  { FluxTheme.accountShadowColor(paymentMethodId: account.paymentMethodId) }
    private var pmIcon: String      { FluxTheme.paymentMethodIcon(paymentMethodId: account.paymentMethodId) }
    private var textColor: Color    { account.balance < 0 ? Color(hex: "#2b2b2b") : .white }

    var body: some View {
        ZStack(alignment: .topTrailing) {
            VStack(alignment: .leading, spacing: 6) {
                Spacer()
                Text(account.name.uppercased())
                    .font(.system(size: 9.5, weight: .black))
                    .tracking(1.5)
                    .foregroundStyle(textColor)
                    .lineLimit(2)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.trailing, 20)

                Text(formatCurrency(account.balance, currency: account.currency))
                    .font(.system(size: 22, weight: .black, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(textColor)
                    .minimumScaleFactor(0.5)
                    .lineLimit(1)

                if account.currency != "MXN" && account.displayExchangeRate > 0 {
                    Text("≈ \(formatCurrency(account.balance * account.displayExchangeRate))")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(textColor.opacity(0.55))
                }
            }
            .padding(16)

            Image(systemName: pmIcon)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(.white.opacity(0.70))
                .padding(16)
        }
        .frame(maxWidth: .infinity)
        .frame(minHeight: 100)
        .background(accentColor)
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .shadow(color: shadowColor, radius: 8, x: 0, y: 4)
    }
}
