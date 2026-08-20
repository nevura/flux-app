import AppIntents

struct FluxAccountEntity: AppEntity, Codable {
    static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Cuenta")
    static var defaultQuery = FluxAccountQuery()

    var id: String
    var name: String
    var currency: String

    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(title: LocalizedStringResource(stringLiteral: name))
    }
}

struct FluxAccountQuery: EntityQuery {
    func entities(for identifiers: [String]) async throws -> [FluxAccountEntity] {
        let all = (try? await FluxIntentService.fetchAccounts()) ?? FluxIntentService.cachedAccounts()
        return all.filter { identifiers.contains($0.id) }
    }

    func suggestedEntities() async throws -> [FluxAccountEntity] {
        (try? await FluxIntentService.fetchAccounts()) ?? FluxIntentService.cachedAccounts()
    }
}
