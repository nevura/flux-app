import AppIntents

struct FluxCategoryEntity: AppEntity, Codable {
    static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Categoría")
    static var defaultQuery = FluxCategoryQuery()

    var id: String
    var name: String
    var iconId: String

    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(title: LocalizedStringResource(stringLiteral: name))
    }
}

struct FluxCategoryQuery: EntityQuery {
    func entities(for identifiers: [String]) async throws -> [FluxCategoryEntity] {
        let all = (try? await FluxIntentService.fetchCategories()) ?? FluxIntentService.cachedCategories()
        return all.filter { identifiers.contains($0.id) }
    }

    func suggestedEntities() async throws -> [FluxCategoryEntity] {
        (try? await FluxIntentService.fetchCategories()) ?? FluxIntentService.cachedCategories()
    }
}
