import Testing

@Suite
struct EntitlementsTests {
  @Test(
    "each entitlements file grants sandboxing and nothing else",
    arguments: ["App/App.entitlements", "Extension/Extension.entitlements"]
  )
  func entitlementsAreMinimal(relativePath: String) throws {
    let entitlements = try ProjectFile.plist(relativePath)
    #expect(entitlements.count == 1)
    #expect(entitlements["com.apple.security.app-sandbox"] as? Bool == true)
  }
}
