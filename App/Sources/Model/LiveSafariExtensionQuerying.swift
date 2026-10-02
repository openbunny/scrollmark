import SafariServices

struct LiveSafariExtensionQuerying: SafariExtensionQuerying {
  func availability(forExtensionWithIdentifier identifier: String) async -> ExtensionAvailability {
    await withCheckedContinuation { continuation in
      SFSafariExtensionManager.scrollmarkGetStateOfSafariExtension(identifier: identifier) {
        state, error in
        guard let state, error == nil else {
          continuation.resume(returning: .unavailable)
          return
        }
        continuation.resume(returning: state.isEnabled ? .enabled : .disabled)
      }
    }
  }

  func openPreferences(forExtensionWithIdentifier identifier: String) async -> SettingsOpenOutcome {
    await withCheckedContinuation { continuation in
      SFSafariApplication.showPreferencesForExtension(withIdentifier: identifier) { error in
        continuation.resume(returning: error == nil ? .opened : .failed)
      }
    }
  }
}
