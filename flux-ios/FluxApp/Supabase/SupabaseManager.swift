import Foundation
import Supabase

let supabase: SupabaseClient = {
    let decoder = JSONDecoder()
    decoder.keyDecodingStrategy = .convertFromSnakeCase
    decoder.dateDecodingStrategy = .custom { dec in
        let container = try dec.singleValueContainer()
        let str = try container.decode(String.self)
        let frac = ISO8601DateFormatter()
        frac.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = frac.date(from: str) { return d }
        let plain = ISO8601DateFormatter()
        plain.formatOptions = [.withInternetDateTime]
        if let d = plain.date(from: str) { return d }
        throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot parse date: \(str)")
    }

    let encoder = JSONEncoder()
    encoder.keyEncodingStrategy = .convertToSnakeCase
    encoder.dateEncodingStrategy = .iso8601

    return SupabaseClient(
        supabaseURL: URL(string: "https://ykxnqwuuiivtyjdhlbeb.supabase.co")!,
        supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreG5xd3V1aWl2dHlqZGhsYmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1ODE1MjEsImV4cCI6MjA5NTE1NzUyMX0.W5ebmwAjAD0JDKQmz6QumAE_GAgkeAn058XW-nAzRPA",
        options: SupabaseClientOptions(
            db: .init(encoder: encoder, decoder: decoder)
        )
    )
}()
