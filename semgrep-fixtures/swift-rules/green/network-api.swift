import Foundation

func loadIcon() -> Data? {
  try? Data(contentsOf: Bundle.main.url(forResource: "icon", withExtension: "svg")!)
}
