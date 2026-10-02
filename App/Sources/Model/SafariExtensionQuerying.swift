protocol SafariExtensionQuerying: Sendable {
  func availability(forExtensionWithIdentifier identifier: String) async -> ExtensionAvailability
  func openPreferences(forExtensionWithIdentifier identifier: String) async -> SettingsOpenOutcome
}
