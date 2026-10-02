import Testing

@Suite
struct InfoPlistTests {
  @Test("app Info.plist takes its bundle identifier from the build setting")
  func appBundleIdentifier() throws {
    let plist = try ProjectFile.plist("App/Info.plist")
    #expect(plist["CFBundleIdentifier"] as? String == "$(PRODUCT_BUNDLE_IDENTIFIER)")
  }

  @Test("app Info.plist pins the deployment target used everywhere else")
  func appDeploymentTarget() throws {
    let plist = try ProjectFile.plist("App/Info.plist")
    #expect(plist["LSMinimumSystemVersion"] as? String == "15.0")
  }

  @Test("app Info.plist names NSApplication as its principal class")
  func appPrincipalClass() throws {
    let plist = try ProjectFile.plist("App/Info.plist")
    #expect(plist["NSPrincipalClass"] as? String == "NSApplication")
  }

  @Test("extension Info.plist takes its bundle identifier from the build setting")
  func extensionBundleIdentifier() throws {
    let plist = try ProjectFile.plist("Extension/Info.plist")
    #expect(plist["CFBundleIdentifier"] as? String == "$(PRODUCT_BUNDLE_IDENTIFIER)")
  }

  @Test("extension Info.plist registers as a Safari web extension")
  func extensionPointIdentifier() throws {
    let plist = try ProjectFile.plist("Extension/Info.plist")
    let nsExtension = try #require(plist["NSExtension"] as? [String: Any])
    #expect(
      nsExtension["NSExtensionPointIdentifier"] as? String == "com.apple.Safari.web-extension")
  }

  @Test("extension Info.plist names the handler as its principal class")
  func extensionPrincipalClass() throws {
    let plist = try ProjectFile.plist("Extension/Info.plist")
    let nsExtension = try #require(plist["NSExtension"] as? [String: Any])
    #expect(
      nsExtension["NSExtensionPrincipalClass"] as? String
        == "$(PRODUCT_MODULE_NAME).SafariWebExtensionHandler"
    )
  }

  @Test("app Info.plist hands the app the extension identifier derived from its own")
  func appNamesExtensionIdentifier() throws {
    let plist = try ProjectFile.plist("App/Info.plist")
    #expect(
      plist[BundleIdentifiers.extensionKey] as? String == "$(PRODUCT_BUNDLE_IDENTIFIER).extension")
  }

  @Test(
    "every Info.plist takes version and copyright from the single source",
    arguments: ["App/Info.plist", "Extension/Info.plist"]
  )
  func versionAndCopyright(path: String) throws {
    let plist = try ProjectFile.plist(path)
    #expect(plist["CFBundleShortVersionString"] as? String == "$(MARKETING_VERSION)")
    #expect(plist["CFBundleVersion"] as? String == "$(CURRENT_PROJECT_VERSION)")
    #expect(plist["NSHumanReadableCopyright"] as? String == "Copyright (c) 2026 OpenBunny")
  }
}
