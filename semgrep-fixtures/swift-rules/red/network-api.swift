import Foundation

func fetchIcon() {
  URLSession.shared.dataTask(with: URL(string: "https://example.com")!) { _, _, _ in }
}
