import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var appState: AppState
    @State private var activeTab = 0
    @State private var showAddTransaction = false
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        ZStack(alignment: .bottom) {
            // Full-screen background
            FluxColors(colorScheme).bg.ignoresSafeArea()

            // All tabs mounted simultaneously — only visibility changes
            DashboardView()
                .opacity(activeTab == 0 ? 1 : 0)
                .allowsHitTesting(activeTab == 0)

            TransactionsView()
                .opacity(activeTab == 1 ? 1 : 0)
                .allowsHitTesting(activeTab == 1)

            InsightsView()
                .environmentObject(appState)
                .opacity(activeTab == 2 ? 1 : 0)
                .allowsHitTesting(activeTab == 2)

            SharedView()
                .environmentObject(appState)
                .opacity(activeTab == 3 ? 1 : 0)
                .allowsHitTesting(activeTab == 3)

            // Floating pill nav bar
            FluxNavBar(activeTab: $activeTab, onAddTap: { showAddTransaction = true })
        }
        .sheet(isPresented: $showAddTransaction) {
            AddTransactionView().environmentObject(appState)
        }
    }
}

// MARK: - Floating pill nav bar

struct FluxNavBar: View {
    @Binding var activeTab: Int
    let onAddTap: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    private struct TabDef { let icon: String; let tag: Int }
    private let tabs: [TabDef] = [
        TabDef(icon: "wallet.pass", tag: 0),
        TabDef(icon: "list.bullet", tag: 1),
        TabDef(icon: "chart.pie",   tag: 2),
        TabDef(icon: "person.2",    tag: 3),
    ]

    var body: some View {
        HStack(spacing: 0) {
            tabItem(tabs[0])
            tabItem(tabs[1])
            fabButton
            tabItem(tabs[2])
            tabItem(tabs[3])
        }
        .padding(6)
        .background(pillBackground)
        .padding(.horizontal, 12)
        .padding(.bottom, 12)
    }

    // MARK: Pill background

    private var pillBackground: some View {
        let isDark = colorScheme == .dark
        return RoundedRectangle(cornerRadius: 26)
            .fill(.regularMaterial)
            .overlay(
                RoundedRectangle(cornerRadius: 26)
                    .fill(isDark ? Color(hex: "#1C1C1E").opacity(0.65) : Color.white.opacity(0.90))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 26)
                    .stroke(isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.08), lineWidth: 1)
            )
            .shadow(color: Color.black.opacity(isDark ? 0.50 : 0.15), radius: 16, x: 0, y: 8)
    }

    // MARK: FAB

    private var fabButton: some View {
        Button(action: onAddTap) {
            ZStack {
                Circle()
                    .fill(FluxTheme.accent)
                    .frame(width: 44, height: 44)
                    .shadow(color: FluxTheme.accent.opacity(0.35), radius: 10, x: 0, y: 4)
                Image(systemName: "plus")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(.white)
            }
        }
        .buttonStyle(ScaleButtonStyle())
        .padding(.horizontal, 8)
    }

    // MARK: Tab item

    private func tabItem(_ def: TabDef) -> some View {
        let isActive = activeTab == def.tag
        return Button {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.65)) {
                activeTab = def.tag
            }
        } label: {
            VStack(spacing: 4) {
                // Spring indicator pill above icon
                Capsule()
                    .fill(FluxTheme.accent)
                    .frame(width: 20, height: 3)
                    .opacity(isActive ? 1 : 0)
                    .scaleEffect(x: isActive ? 1 : 0.3, y: 1)
                    .animation(.spring(response: 0.3, dampingFraction: 0.55), value: isActive)

                Image(systemName: def.icon)
                    .font(.system(size: 20))
                    .foregroundStyle(isActive ? FluxTheme.accent : Color(.tertiaryLabel))
                    .scaleEffect(isActive ? 1.1 : 1.0)
                    .animation(.spring(response: 0.3, dampingFraction: 0.65), value: isActive)
            }
            .padding(.vertical, 12)
            .padding(.horizontal, 12)
            .background(
                RoundedRectangle(cornerRadius: 18)
                    .fill(isActive ? FluxTheme.accent.opacity(0.10) : .clear)
                    .animation(.easeInOut(duration: 0.15), value: isActive)
            )
        }
        .buttonStyle(.plain)
        .frame(maxWidth: .infinity)
    }
}

