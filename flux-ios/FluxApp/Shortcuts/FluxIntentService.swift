import Foundation

enum FluxIntentService {
    private static let appGroup    = "group.com.nevura.flux"
    private static let supabaseURL = "https://ykxnqwuuiivtyjdhlbeb.supabase.co"
    private static let anonKey     = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreG5xd3V1aWl2dHlqZGhsYmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1ODE1MjEsImV4cCI6MjA5NTE1NzUyMX0.W5ebmwAjAD0JDKQmz6QumAE_GAgkeAn058XW-nAzRPA"

    private static var ud: UserDefaults? { UserDefaults(suiteName: appGroup) }

    // MARK: - Session management

    static func persistSession(userId: String, accessToken: String, refreshToken: String, expiresAt: TimeInterval) {
        ud?.set(userId,       forKey: "flux_user_id")
        ud?.set(accessToken,  forKey: "flux_access_token")
        ud?.set(refreshToken, forKey: "flux_refresh_token")
        ud?.set(expiresAt,    forKey: "flux_expires_at")
    }

    static func clearSession() {
        ["flux_user_id", "flux_access_token", "flux_refresh_token", "flux_expires_at"]
            .forEach { ud?.removeObject(forKey: $0) }
    }

    static func validCredentials() async throws -> (userId: String, token: String) {
        guard let userId = ud?.string(forKey: "flux_user_id"),
              let token  = ud?.string(forKey: "flux_access_token") else {
            throw IntentError.notAuthenticated
        }
        let expiresAt = ud?.double(forKey: "flux_expires_at") ?? 0
        if Date().timeIntervalSince1970 > (expiresAt - 300),
           let refreshToken = ud?.string(forKey: "flux_refresh_token") {
            let newToken = try await refreshAccessToken(refreshToken)
            return (userId, newToken)
        }
        return (userId, token)
    }

    private static func refreshAccessToken(_ refreshToken: String) async throws -> String {
        var req = URLRequest(url: URL(string: "\(supabaseURL)/auth/v1/token?grant_type=refresh_token")!)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(anonKey,            forHTTPHeaderField: "apikey")
        req.httpBody = try JSONSerialization.data(withJSONObject: ["refresh_token": refreshToken])
        let (data, _) = try await URLSession.shared.data(for: req)
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let newToken = json["access_token"] as? String else {
            throw IntentError.notAuthenticated
        }
        ud?.set(newToken,                           forKey: "flux_access_token")
        ud?.set(json["refresh_token"] as? String,   forKey: "flux_refresh_token")
        ud?.set(json["expires_at"] as? Double ?? 0, forKey: "flux_expires_at")
        return newToken
    }

    // MARK: - Cache

    static func cacheAccounts(_ list: [FluxAccountEntity]) {
        guard let data = try? JSONEncoder().encode(list) else { return }
        ud?.set(data, forKey: "flux_cached_accounts")
    }

    static func cachedAccounts() -> [FluxAccountEntity] {
        guard let data = ud?.data(forKey: "flux_cached_accounts"),
              let list = try? JSONDecoder().decode([FluxAccountEntity].self, from: data) else { return [] }
        return list
    }

    static func cacheCategories(_ list: [FluxCategoryEntity]) {
        guard let data = try? JSONEncoder().encode(list) else { return }
        ud?.set(data, forKey: "flux_cached_categories")
    }

    static func cachedCategories() -> [FluxCategoryEntity] {
        guard let data = ud?.data(forKey: "flux_cached_categories"),
              let list = try? JSONDecoder().decode([FluxCategoryEntity].self, from: data) else { return [] }
        return list
    }

    // MARK: - Offline queue

    private static func enqueueTransaction(_ body: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: body) else { return }
        var queue = (ud?.array(forKey: "flux_pending_queue") as? [Data]) ?? []
        queue.append(data)
        ud?.set(queue, forKey: "flux_pending_queue")
    }

    static func syncPendingQueue() async {
        let items = (ud?.array(forKey: "flux_pending_queue") as? [Data]) ?? []
        guard !items.isEmpty else { return }
        guard let (_, token) = try? await validCredentials() else { return }
        var remaining: [Data] = []
        for data in items {
            var request = URLRequest(url: URL(string: "\(supabaseURL)/rest/v1/transactions")!)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.setValue("return=minimal",   forHTTPHeaderField: "Prefer")
            request.setValue(anonKey,            forHTTPHeaderField: "apikey")
            request.setValue("Bearer \(token)",  forHTTPHeaderField: "Authorization")
            request.httpBody = data
            if let (_, response) = try? await URLSession.shared.data(for: request),
               let http = response as? HTTPURLResponse,
               (200..<300).contains(http.statusCode) {
                continue
            }
            remaining.append(data)
        }
        if remaining.isEmpty {
            ud?.removeObject(forKey: "flux_pending_queue")
        } else {
            ud?.set(remaining, forKey: "flux_pending_queue")
        }
    }

    // MARK: - Data fetching

    static func fetchAccounts() async throws -> [FluxAccountEntity] {
        do {
            let (userId, token) = try await validCredentials()
            var comps = URLComponents(string: "\(supabaseURL)/rest/v1/accounts")!
            comps.queryItems = [
                URLQueryItem(name: "user_id",   value: "eq.\(userId)"),
                URLQueryItem(name: "is_active", value: "eq.true"),
                URLQueryItem(name: "select",    value: "id,name,currency"),
                URLQueryItem(name: "order",     value: "sort_order.asc"),
            ]
            var req = URLRequest(url: comps.url!)
            req.setValue(anonKey,           forHTTPHeaderField: "apikey")
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            let (data, _) = try await URLSession.shared.data(for: req)
            let rows = try JSONSerialization.jsonObject(with: data) as? [[String: Any]] ?? []
            let list = rows.compactMap { row -> FluxAccountEntity? in
                guard let id       = row["id"]       as? String,
                      let name     = row["name"]     as? String,
                      let currency = row["currency"] as? String else { return nil }
                return FluxAccountEntity(id: id, name: name, currency: currency)
            }
            cacheAccounts(list)
            return list
        } catch {
            let cached = cachedAccounts()
            if !cached.isEmpty { return cached }
            throw error
        }
    }

    static func fetchCategories() async throws -> [FluxCategoryEntity] {
        do {
            let (userId, token) = try await validCredentials()
            var comps = URLComponents(string: "\(supabaseURL)/rest/v1/categories")!
            comps.queryItems = [
                URLQueryItem(name: "or",     value: "(user_id.eq.\(userId),user_id.is.null)"),
                URLQueryItem(name: "select", value: "id,name,icon_id"),
                URLQueryItem(name: "order",  value: "sort_order.asc.nullslast"),
            ]
            var req = URLRequest(url: comps.url!)
            req.setValue(anonKey,           forHTTPHeaderField: "apikey")
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            let (data, _) = try await URLSession.shared.data(for: req)
            let rows = try JSONSerialization.jsonObject(with: data) as? [[String: Any]] ?? []
            let list = rows.compactMap { row -> FluxCategoryEntity? in
                guard let id   = row["id"]   as? String,
                      let name = row["name"] as? String else { return nil }
                let iconId = row["icon_id"] as? String ?? ""
                return FluxCategoryEntity(id: id, name: name, iconId: iconId)
            }
            cacheCategories(list)
            return list
        } catch {
            let cached = cachedCategories()
            if !cached.isEmpty { return cached }
            throw error
        }
    }

    // MARK: - Mutations

    // Returns true if saved online, false if queued offline
    static func saveTransaction(
        amount: Double,
        concept: String,
        type: String,
        categoryId: String?,
        accountId: String?
    ) async throws -> Bool {
        let (userId, token) = try await validCredentials()
        let adjustment = type == "TR-INGRESO" ? abs(amount) : -abs(amount)
        var body: [String: Any] = [
            "user_id":          userId,
            "concept":          concept,
            "type":             type,
            "amount":           amount,
            "adjustment":       adjustment,
            "transaction_date": isoDateString(),
            "is_validated":     true,
            "currency":         "MXN",
            "exchange_rate":    1.0,
        ]
        if let cat = categoryId { body["category_id"] = cat }
        if let acc = accountId  { body["account_id"]  = acc }
        do {
            try await postJSON(body: body, token: token)
            return true
        } catch {
            enqueueTransaction(body)
            return false
        }
    }

    // Returns true if saved online, false if queued offline
    static func saveTransfer(
        amount: Double,
        from: FluxAccountEntity,
        to: FluxAccountEntity
    ) async throws -> Bool {
        let (userId, token) = try await validCredentials()
        let body: [String: Any] = [
            "user_id":                userId,
            "concept":                "Transferencia de \(from.name) a \(to.name)",
            "type":                   "TR-TRANSFER",
            "amount":                 amount,
            "adjustment":             -amount,
            "account_id":             from.id,
            "destination_account_id": to.id,
            "transaction_date":       isoDateString(),
            "is_validated":           true,
            "currency":               from.currency,
            "exchange_rate":          1.0,
        ]
        do {
            try await postJSON(body: body, token: token)
            return true
        } catch {
            enqueueTransaction(body)
            return false
        }
    }

    // MARK: - Helpers

    private static func isoDateString() -> String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withFullDate, .withDashSeparatorInDate]
        return f.string(from: Date())
    }

    private static func postJSON(body: [String: Any], token: String) async throws {
        var request = URLRequest(url: URL(string: "\(supabaseURL)/rest/v1/transactions")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("return=minimal",   forHTTPHeaderField: "Prefer")
        request.setValue(anonKey,            forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)",  forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (_, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse,
              (200..<300).contains(http.statusCode) else {
            throw IntentError.saveFailed
        }
    }

    // MARK: - Errors

    enum IntentError: LocalizedError {
        case notAuthenticated
        case saveFailed
        var errorDescription: String? {
            switch self {
            case .notAuthenticated: return "Inicia sesión en Flux primero"
            case .saveFailed:       return "No se pudo guardar el movimiento"
            }
        }
    }
}
