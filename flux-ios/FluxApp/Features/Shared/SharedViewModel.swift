import Foundation
import Supabase

@MainActor
final class SharedViewModel: ObservableObject {
    @Published var people: [FluxPerson] = []
    @Published var balances: [String: Double] = [:]   // personId → balance
    @Published var isLoading = false

    func load(userId: UUID) async {
        isLoading = true
        do {
            let persons: [FluxPerson] = try await supabase
                .from("people")
                .select()
                .eq("user_id", value: userId)
                .eq("is_me", value: false)
                .order("name", ascending: true)
                .execute()
                .value
            people = persons
            await loadBalances(userId: userId, people: persons)
        } catch {}
        isLoading = false
    }

    private func loadBalances(userId: UUID, people: [FluxPerson]) async {
        guard !people.isEmpty else { return }

        // Load all transactions with split_data and parse client-side
        guard let txs = try? await supabase
            .from("transactions")
            .select("id, split_data")
            .eq("user_id", value: userId)
            .execute()
            .value as [SharedTxRow]
        else { return }

        var computed: [String: Double] = [:]
        let personIds = Set(people.map { $0.id })

        for tx in txs {
            guard let dataStr = tx.splitData,
                  let jsonData = dataStr.data(using: .utf8),
                  let json = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any],
                  let items = json["data"] as? [[String: Any]],
                  let splitMode = json["splitMode"] as? String else { continue }

            for item in items {
                guard let personId = item["id"] as? String,
                      personIds.contains(personId) else { continue }
                let value = (item["value"] as? Double) ?? 0
                let paidAmount = (item["paidAmount"] as? Double) ?? 0
                let paidStatus = (item["paidStatus"] as? Bool) ?? false
                if paidStatus { continue }
                let remaining = value - paidAmount

                switch splitMode {
                case "THEY":  computed[personId, default: 0] += remaining
                case "IOWE":  computed[personId, default: 0] -= remaining
                case "DIV":   computed[personId, default: 0] += remaining
                default: break
                }
            }
        }
        balances = computed
    }
}

private struct SharedTxRow: Decodable {
    let id: UUID
    let splitData: String?
}
