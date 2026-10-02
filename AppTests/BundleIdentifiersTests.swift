import Testing

@Suite
struct BundleIdentifiersTests {
  @Test("the extension identifier is read from the Info.plist key")
  func readsKey() {
    let info: [String: Any] = [BundleIdentifiers.extensionKey: "test.invalid.extension"]
    #expect(BundleIdentifiers.extensionID(infoDictionary: info) == "test.invalid.extension")
  }

  @Test("an absent key yields no identifier")
  func absentKey() {
    #expect(BundleIdentifiers.extensionID(infoDictionary: [:]) == nil)
  }

  @Test("an empty value yields no identifier")
  func emptyValue() {
    let info: [String: Any] = [BundleIdentifiers.extensionKey: ""]
    #expect(BundleIdentifiers.extensionID(infoDictionary: info) == nil)
  }

  @Test("a value that is not a string yields no identifier")
  func mistypedValue() {
    let info: [String: Any] = [BundleIdentifiers.extensionKey: 7]
    #expect(BundleIdentifiers.extensionID(infoDictionary: info) == nil)
  }
}
