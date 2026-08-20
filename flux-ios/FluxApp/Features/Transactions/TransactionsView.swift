import SwiftUI

struct TransactionsView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var vm = TransactionsViewModel()
    @Environment(\.colorScheme) private var colorScheme
    @State private var showAdd = false
    @State private var selectedTransaction: FluxTransaction?
    @State private var showEdit = false
    private var c: FluxColors { FluxColors(colorScheme) }

    var body: some View {
        ZStack {
            c.bg.ignoresSafeArea()

            VStack(spacing: 0) {
                stickyHeader
                searchBar
                summaryPills
                typeChips

                if vm.isLoading && vm.transactions.isEmpty {
                    Spacer()
                    ProgressView().tint(FluxTheme.accent)
                    Spacer()
                } else if vm.transactionsByDay.isEmpty {
                    emptyState
                } else {
                    transactionList
                }
            }
        }
        .task {
            if let uid = appState.userId, vm.transactions.isEmpty {
                await vm.load(userId: uid)
            }
        }
        .onChange(of: vm.currentMonth) { _, _ in
            if let uid = appState.userId { Task { await vm.load(userId: uid) } }
        }
        .onChange(of: vm.currentYear) { _, _ in
            if let uid = appState.userId { Task { await vm.load(userId: uid) } }
        }
        .sheet(isPresented: $showEdit) {
            if let tx = selectedTransaction {
                AddTransactionView(existingTransaction: tx).environmentObject(appState)
            }
        }
    }

    // MARK: - Sticky Header

    private var stickyHeader: some View {
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

            Button {
                withAnimation { vm.nextMonth() }
            } label: {
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

    // MARK: - Search Bar

    private var searchBar: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 15))
                .foregroundStyle(c.text3)
            TextField("Buscar movimiento...", text: $vm.searchQuery)
                .font(.system(size: 15))
                .foregroundStyle(c.text)
            if !vm.searchQuery.isEmpty {
                Button { vm.searchQuery = "" } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(c.text4)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(c.bgInput)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(c.line, lineWidth: 1))
        .padding(.horizontal, 16)
        .padding(.top, 10)
        .padding(.bottom, 6)
    }

    // MARK: - Summary Cards

    private var summaryPills: some View {
        HStack(spacing: 8) {
            summaryCard(label: "Ingresos", prefix: "+", amount: vm.incomeTotal, color: FluxTheme.income)
            summaryCard(label: "Gastos",   prefix: "-", amount: vm.expenseTotal, color: FluxTheme.expense)
        }
        .padding(.horizontal, 16)
        .padding(.top, 2)
        .padding(.bottom, 6)
    }

    private func summaryCard(label: String, prefix: String, amount: Double, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(label.uppercased())
                .font(.system(size: 11, weight: .black))
                .tracking(2)
                .foregroundStyle(color.opacity(0.70))
            Text(prefix + formatCurrency(amount))
                .font(.system(size: 16, weight: .black))
                .monospacedDigit()
                .foregroundStyle(color)
                .minimumScaleFactor(0.65)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(color.opacity(0.10))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(color.opacity(0.20), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Type Filter Chips

    private var typeChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                typeChip(label: "Gastos",        type: "TR-GASTO",    color: FluxTheme.expense)
                typeChip(label: "Ingresos",      type: "TR-INGRESO",  color: FluxTheme.income)
                typeChip(label: "Transferencias",type: "TR-TRANSFER", color: FluxTheme.transfer)
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 10)
        }
    }

    private func typeChip(label: String, type: String, color: Color) -> some View {
        let active = vm.selectedTypes.contains(type)
        return Button { withAnimation(.spring(response: 0.25)) { vm.toggleType(type) } } label: {
            Text(label)
                .font(.system(size: 13, weight: .black))
                .foregroundStyle(active ? .white : c.text3)
                .padding(.horizontal, 14)
                .padding(.vertical, 7)
                .background(active ? color : c.bgInput)
                .clipShape(Capsule())
                .overlay(Capsule().stroke(active ? color : c.line, lineWidth: 1))
        }
        .buttonStyle(ScaleButtonStyle(scale: 0.95))
    }

    // MARK: - Transaction List

    private var transactionList: some View {
        List {
            ForEach(vm.transactionsByDay, id: \.date) { group in
                Section {
                    ForEach(group.items) { tx in
                        TransactionRow(
                            transaction: tx,
                            categoryName: vm.categoryName(for: tx.categoryId),
                            accountName:  vm.accountName(for: tx.accountId)
                        )
                        .listRowBackground(
                            RoundedRectangle(cornerRadius: 14)
                                .fill(tx.isValidated ? c.bgCard : FluxTheme.pending.opacity(0.08))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 14)
                                        .stroke(tx.isValidated ? c.line : FluxTheme.pending.opacity(0.30), lineWidth: 1)
                                )
                                .padding(EdgeInsets(top: 2, leading: 0, bottom: 2, trailing: 0))
                        )
                        .listRowInsets(EdgeInsets(top: 2, leading: 16, bottom: 2, trailing: 16))
                        .listRowSeparator(.hidden)
                        .onTapGesture {
                            selectedTransaction = tx
                            showEdit = true
                        }
                        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                            Button(role: .destructive) {
                                Task { await vm.delete(tx) }
                            } label: {
                                Label("Borrar", systemImage: "trash")
                            }
                        }
                        .swipeActions(edge: .leading, allowsFullSwipe: true) {
                            if !tx.isValidated {
                                Button {
                                    Task { await vm.confirm(tx) }
                                } label: {
                                    Label("Confirmar", systemImage: "checkmark")
                                }
                                .tint(FluxTheme.income)
                            }
                        }
                    }
                } header: {
                    Text(dayHeader(group.date))
                        .font(.system(size: 11, weight: .black))
                        .tracking(2)
                        .foregroundStyle(c.text3)
                        .textCase(.none)
                        .padding(.top, 8)
                }
            }

            Color.clear.frame(height: 80).listRowBackground(Color.clear).listRowSeparator(.hidden)
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
        .background(c.bg)
        .refreshable {
            if let uid = appState.userId { await vm.load(userId: uid) }
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "tray")
                .font(.system(size: 40))
                .foregroundStyle(c.text4)
            Text(vm.searchQuery.isEmpty ? "Sin movimientos este mes" : "Sin resultados")
                .font(.system(size: 17, weight: .bold))
                .foregroundStyle(c.text3)
            Spacer()
        }
    }

    // MARK: - Helpers

    private func dayHeader(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "EEEE d MMM yyyy"
        f.locale = Locale(identifier: "es_MX")
        return f.string(from: date).uppercased()
    }
}
