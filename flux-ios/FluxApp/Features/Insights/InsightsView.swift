import SwiftUI
import Charts

struct InsightsView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var vm = InsightsViewModel()
    @Environment(\.colorScheme) private var colorScheme
    private var c: FluxColors { FluxColors(colorScheme) }

    var body: some View {
        ZStack {
            c.bg.ignoresSafeArea()

            VStack(spacing: 0) {
                monthHeader

                if vm.isLoading && vm.transactions.isEmpty {
                    Spacer()
                    ProgressView().tint(FluxTheme.accent)
                    Spacer()
                } else {
                    ScrollView {
                        VStack(spacing: 16) {
                            kpiStrip
                            if !vm.categoryBreakdown.isEmpty {
                                categoryDonutCard
                                categoryRankingCard
                            } else {
                                emptyState
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.top, 16)
                        .padding(.bottom, 120)
                    }
                }
            }
        }
        .task {
            if let uid = appState.userId { await vm.load(userId: uid) }
        }
        .onChange(of: vm.currentMonth) { _, _ in
            if let uid = appState.userId { Task { await vm.load(userId: uid) } }
        }
        .onChange(of: vm.currentYear) { _, _ in
            if let uid = appState.userId { Task { await vm.load(userId: uid) } }
        }
    }

    // MARK: - Month Header

    private var monthHeader: some View {
        HStack(spacing: 16) {
            Button { withAnimation { vm.prevMonth() } } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(c.text3)
                    .frame(width: 36, height: 36)
                    .background(c.bgInput)
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)

            Text(vm.monthTitle)
                .font(.system(size: 16, weight: .black))
                .foregroundStyle(c.text)
                .frame(maxWidth: .infinity)

            Button { withAnimation { vm.nextMonth() } } label: {
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(vm.isCurrentMonth ? c.text4 : c.text3)
                    .frame(width: 36, height: 36)
                    .background(c.bgInput)
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)
            .disabled(vm.isCurrentMonth)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            ZStack {
                c.bg.opacity(0.95)
                Rectangle().fill(.ultraThinMaterial)
            }
        )
        .overlay(alignment: .bottom) { c.line.frame(height: 1) }
    }

    // MARK: - KPI Strip

    private var kpiStrip: some View {
        HStack(spacing: 8) {
            kpiChip(label: "Ingresos", amount: vm.incomeTotal, color: FluxTheme.income, prefix: "+")
            kpiChip(label: "Gastos",   amount: vm.expenseTotal, color: FluxTheme.expense, prefix: "-")
            kpiChip(label: "Balance",  amount: abs(vm.netBalance),
                    color: vm.netBalance >= 0 ? FluxTheme.accent : FluxTheme.expense,
                    prefix: vm.netBalance >= 0 ? "+" : "-")
        }
    }

    private func kpiChip(label: String, amount: Double, color: Color, prefix: String) -> some View {
        VStack(spacing: 2) {
            Text(label.uppercased())
                .font(.system(size: 9, weight: .black))
                .tracking(1.5)
                .foregroundStyle(color.opacity(0.75))
            Text(prefix + formatCurrency(amount))
                .font(.system(size: 13, weight: .black))
                .monospacedDigit()
                .foregroundStyle(color)
                .minimumScaleFactor(0.6)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(color.opacity(0.10))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(color.opacity(0.20), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Category Donut

    private var categoryDonutCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("GASTO POR CATEGORÍA")
                .font(.system(size: 11, weight: .black))
                .tracking(2)
                .foregroundStyle(c.text3)

            Chart(vm.categoryBreakdown.prefix(8), id: \.id) { item in
                SectorMark(
                    angle: .value("Monto", item.amount),
                    innerRadius: .ratio(0.60),
                    angularInset: 2
                )
                .foregroundStyle(Color(hex: item.colorHex))
                .cornerRadius(4)
            }
            .frame(height: 200)
            .chartBackground { _ in
                VStack(spacing: 2) {
                    Text(formatCurrency(vm.expenseTotal))
                        .font(.system(size: 18, weight: .black, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(c.text)
                    Text("total gastos")
                        .font(.system(size: 11))
                        .foregroundStyle(c.text3)
                }
            }
        }
        .padding(16)
        .background(c.bgCard)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(c.line, lineWidth: 1))
    }

    // MARK: - Category Ranking

    private var categoryRankingCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("DETALLE")
                .font(.system(size: 11, weight: .black))
                .tracking(2)
                .foregroundStyle(c.text3)
                .padding(.bottom, 12)

            ForEach(Array(vm.categoryBreakdown.enumerated()), id: \.element.id) { idx, item in
                categoryRankRow(item: item)
                if idx < vm.categoryBreakdown.count - 1 {
                    c.line.frame(height: 1).padding(.vertical, 6)
                }
            }
        }
        .padding(16)
        .background(c.bgCard)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(c.line, lineWidth: 1))
    }

    private func categoryRankRow(item: (id: String, name: String, colorHex: String, amount: Double, percent: Double)) -> some View {
        let barColor = Color(hex: item.colorHex)
        return VStack(spacing: 6) {
            HStack {
                Circle()
                    .fill(barColor)
                    .frame(width: 8, height: 8)
                Text(item.name)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(c.text)
                    .lineLimit(1)
                Spacer()
                Text(formatCurrency(item.amount))
                    .font(.system(size: 13, weight: .black))
                    .monospacedDigit()
                    .foregroundStyle(c.text)
                Text(String(format: "%.0f%%", item.percent * 100))
                    .font(.system(size: 11))
                    .foregroundStyle(c.text3)
                    .frame(width: 34, alignment: .trailing)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(c.bgInput).frame(height: 5)
                    Capsule().fill(barColor).frame(width: geo.size.width * item.percent, height: 5)
                }
            }
            .frame(height: 5)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "chart.pie")
                .font(.system(size: 44))
                .foregroundStyle(c.text4)
            Text("Sin gastos registrados")
                .font(.system(size: 17, weight: .bold))
                .foregroundStyle(c.text3)
            Text("Registra movimientos para ver tus estadísticas")
                .font(.system(size: 14))
                .foregroundStyle(c.text4)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 60)
    }
}
