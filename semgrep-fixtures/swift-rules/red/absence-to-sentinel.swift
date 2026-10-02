import Foundation

func parseAmount(_ raw: String) -> Decimal {
  Decimal(string: raw) ?? 0
}
