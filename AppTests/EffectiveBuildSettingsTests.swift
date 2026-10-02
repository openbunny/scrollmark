import Foundation
import Testing

enum EffectiveSettingsError: Error {
  case projectNotGenerated
  case xcodebuildFailed(Int32, String)
}

enum XcodeBuildSettings {
  static func effective(target: String, configuration: String) throws -> [String: String] {
    let projectURL = ProjectFile.url("Scrollmark.xcodeproj")
    guard FileManager.default.fileExists(atPath: projectURL.path) else {
      throw EffectiveSettingsError.projectNotGenerated
    }
    let process = Process()
    process.executableURL = URL(fileURLWithPath: "/usr/bin/xcodebuild")
    process.arguments = [
      "-showBuildSettings",
      "-project", projectURL.path,
      "-target", target,
      "-configuration", configuration,
      "CODE_SIGNING_ALLOWED=NO",
    ]
    let pipe = Pipe()
    process.standardOutput = pipe
    process.standardError = pipe
    try process.run()
    let data = pipe.fileHandleForReading.readDataToEndOfFile()
    process.waitUntilExit()
    let output = String(bytes: data, encoding: .utf8) ?? ""
    guard process.terminationStatus == 0 else {
      throw EffectiveSettingsError.xcodebuildFailed(process.terminationStatus, output)
    }
    var settings: [String: String] = [:]
    for line in output.split(separator: "\n") {
      let parts = line.split(separator: "=", maxSplits: 1).map { component in
        component.trimmingCharacters(in: .whitespaces)
      }
      guard parts.count == 2 else { continue }
      settings[parts[0]] = parts[1]
    }
    return settings
  }
}

@Suite
struct EffectiveBuildSettingsTests {
  @Test(
    "the app target's effective settings apply Swift 6, strict checks and warnings as errors",
    arguments: ["Debug", "Release"]
  )
  func appTargetEffectiveSettings(configuration: String) throws {
    let settings = try XcodeBuildSettings.effective(
      target: "Scrollmark", configuration: configuration)
    #expect(settings["SWIFT_VERSION"] == "6")
    #expect(settings["SWIFT_STRICT_CONCURRENCY"] == "complete")
    #expect(settings["OTHER_SWIFT_FLAGS"]?.contains("-strict-memory-safety") == true)
    #expect(settings["SWIFT_TREAT_WARNINGS_AS_ERRORS"] == "YES")
    #expect(settings["GCC_TREAT_WARNINGS_AS_ERRORS"] == "YES")
    #expect(settings["MACOSX_DEPLOYMENT_TARGET"] == "15.0")
    #expect(
      settings["PRODUCT_BUNDLE_IDENTIFIER"]
        == (try ProjectYAML.scalar(forKey: "APP_BUNDLE_IDENTIFIER")))
    #expect(settings["CODE_SIGN_IDENTITY"] == "Apple Development")
    #expect(settings["CODE_SIGN_STYLE"] == "Automatic")
    #expect(settings["CODE_SIGNING_REQUIRED"] == "YES")
  }

  @Test(
    "the extension target's effective settings apply Swift 6, strict concurrency and strict memory safety",
    arguments: ["Debug", "Release"]
  )
  func extensionTargetEffectiveSettings(configuration: String) throws {
    let settings = try XcodeBuildSettings.effective(
      target: "ScrollmarkExtension",
      configuration: configuration
    )
    #expect(settings["SWIFT_VERSION"] == "6")
    #expect(settings["SWIFT_STRICT_CONCURRENCY"] == "complete")
    #expect(settings["OTHER_SWIFT_FLAGS"]?.contains("-strict-memory-safety") == true)
    #expect(
      settings["PRODUCT_BUNDLE_IDENTIFIER"]
        == (try ProjectYAML.scalar(forKey: "APP_BUNDLE_IDENTIFIER")) + ".extension")
    #expect(settings["CODE_SIGN_IDENTITY"] == "Apple Development")
    #expect(settings["CODE_SIGN_STYLE"] == "Automatic")
    #expect(settings["CODE_SIGNING_REQUIRED"] == "YES")
  }

  @Test(
    "both targets carry the version from project.yml",
    arguments: ["Scrollmark", "ScrollmarkExtension"]
  )
  func targetVersion(target: String) throws {
    let settings = try XcodeBuildSettings.effective(target: target, configuration: "Release")
    #expect(settings["MARKETING_VERSION"] == (try ProjectYAML.scalar(forKey: "MARKETING_VERSION")))
    #expect(
      settings["CURRENT_PROJECT_VERSION"]
        == (try ProjectYAML.scalar(forKey: "CURRENT_PROJECT_VERSION")))
  }
}
