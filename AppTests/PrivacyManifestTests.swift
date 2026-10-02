import Testing

@Suite
struct PrivacyManifestTests {
  @Test("privacy manifest declares no tracking")
  func noTracking() throws {
    let manifest = try ProjectFile.plist("App/PrivacyInfo.xcprivacy")
    #expect(manifest["NSPrivacyTracking"] as? Bool == false)
  }

  @Test(
    "privacy manifest declares empty collection and API arrays",
    arguments: [
      "NSPrivacyTrackingDomains", "NSPrivacyCollectedDataTypes", "NSPrivacyAccessedAPITypes",
    ]
  )
  func emptyArrays(key: String) throws {
    let manifest = try ProjectFile.plist("App/PrivacyInfo.xcprivacy")
    let array = try #require(manifest[key] as? [Any])
    #expect(array.isEmpty)
  }

  @Test("privacy manifest declares exactly the four known keys")
  func exactKeySet() throws {
    let manifest = try ProjectFile.plist("App/PrivacyInfo.xcprivacy")
    #expect(
      Set(manifest.keys) == [
        "NSPrivacyTracking",
        "NSPrivacyTrackingDomains",
        "NSPrivacyCollectedDataTypes",
        "NSPrivacyAccessedAPITypes",
      ]
    )
  }
}

private final class TestBundleAnchor {}

enum BuiltProductsError: Error {
  case missing(String)
}

enum BuiltProducts {
  static func appURL() throws -> URL {
    let products = Bundle(for: TestBundleAnchor.self).bundleURL.deletingLastPathComponent()
    let app = products.appendingPathComponent("Scrollmark.app")
    guard FileManager.default.fileExists(atPath: app.path) else {
      throw BuiltProductsError.missing(app.path)
    }
    return app
  }

  static func extensionURL() throws -> URL {
    let appex = try appURL().appendingPathComponent(
      "Contents/PlugIns/Scrollmark Extension.appex")
    guard FileManager.default.fileExists(atPath: appex.path) else {
      throw BuiltProductsError.missing(appex.path)
    }
    return appex
  }

  static func privacyManifest(in bundle: URL) throws -> [String: Any] {
    let url = bundle.appendingPathComponent("Contents/Resources/PrivacyInfo.xcprivacy")
    guard FileManager.default.fileExists(atPath: url.path) else {
      throw BuiltProductsError.missing(url.path)
    }
    let object = try unsafe PropertyListSerialization.propertyList(
      from: try Data(contentsOf: url), format: nil)
    guard let dict = object as? [String: Any] else {
      throw PlistDecodingError.notADictionary(url.path)
    }
    return dict
  }
}

@Suite
struct BuiltPrivacyManifestTests {
  private func canonical(_ plist: [String: Any]) throws -> Data {
    try PropertyListSerialization.data(fromPropertyList: plist, format: .xml, options: 0)
  }

  @Test("the built app bundles the privacy manifest")
  func appBundlesManifest() throws {
    let built = try BuiltProducts.privacyManifest(in: BuiltProducts.appURL())
    let source = try ProjectFile.plist("App/PrivacyInfo.xcprivacy")
    #expect(try canonical(built) == canonical(source))
  }

  @Test("the built extension bundles the privacy manifest")
  func extensionBundlesManifest() throws {
    let built = try BuiltProducts.privacyManifest(in: BuiltProducts.extensionURL())
    let source = try ProjectFile.plist("App/PrivacyInfo.xcprivacy")
    #expect(try canonical(built) == canonical(source))
  }
}
