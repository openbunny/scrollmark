enum BundleIdentifiers {
  static let extensionKey = "ExtensionBundleIdentifier"

  static func extensionID(infoDictionary: [String: Any]) -> String? {
    guard let value = infoDictionary[extensionKey] as? String, !value.isEmpty else {
      return nil
    }
    return value
  }
}
