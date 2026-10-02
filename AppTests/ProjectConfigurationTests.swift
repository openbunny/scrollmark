import Foundation
import Testing

enum ProjectYAML {
  static func scalar(forKey key: String) throws -> String {
    let text = try String(contentsOf: ProjectFile.url("project.yml"), encoding: .utf8)
    let pattern = "^\\s*\(NSRegularExpression.escapedPattern(for: key)):\\s*\"?([^\"\\n]+?)\"?\\s*$"
    let regex = try NSRegularExpression(pattern: pattern, options: [.anchorsMatchLines])
    let range = NSRange(text.startIndex..., in: text)
    guard let match = regex.firstMatch(in: text, range: range),
      let valueRange = Range(match.range(at: 1), in: text)
    else {
      throw ScalarLookupError.keyNotFound(key)
    }
    return String(text[valueRange])
  }
}

enum ScalarLookupError: Error {
  case keyNotFound(String)
}

@Suite
struct ProjectConfigurationTests {
  @Test("project.yml pins the macOS deployment target used everywhere else")
  func deploymentTarget() throws {
    #expect(try ProjectYAML.scalar(forKey: "macOS") == "15.0")
    #expect(try ProjectYAML.scalar(forKey: "MACOSX_DEPLOYMENT_TARGET") == "15.0")
  }

  @Test("project.yml compiles under the Swift 6 language mode")
  func swiftVersion() throws {
    #expect(try ProjectYAML.scalar(forKey: "SWIFT_VERSION") == "6")
  }

  @Test("project.yml sets complete strict concurrency checking")
  func strictConcurrency() throws {
    #expect(try ProjectYAML.scalar(forKey: "SWIFT_STRICT_CONCURRENCY") == "complete")
  }

  @Test("project.yml sets strict memory-safety diagnostics")
  func strictMemorySafety() throws {
    #expect(try ProjectYAML.scalar(forKey: "OTHER_SWIFT_FLAGS") == "-strict-memory-safety")
  }

  @Test(
    "project.yml treats warnings as errors for every compiler",
    arguments: ["SWIFT_TREAT_WARNINGS_AS_ERRORS", "GCC_TREAT_WARNINGS_AS_ERRORS"]
  )
  func warningsAsErrors(key: String) throws {
    #expect(try ProjectYAML.scalar(forKey: key) == "YES")
  }

  @Test("signing is an xcconfig rather than an ad-hoc fallback")
  func sandboxedExtensionRequiresTeamIdentityFromXcconfig() throws {
    let project = try String(contentsOf: ProjectFile.url("project.yml"), encoding: .utf8)
    #expect(!project.contains("DEVELOPMENT_TEAM"))
    #expect(!project.contains("PROVISIONING_PROFILE"))
    #expect(!project.contains("CODE_SIGN_IDENTITY"))
    #expect(project.contains("Debug: Signing.xcconfig"))
    #expect(project.contains("Release: Signing.xcconfig"))

    let debug = try String(contentsOf: ProjectFile.url("Signing.xcconfig"), encoding: .utf8)
    #expect(debug.contains("CODE_SIGN_IDENTITY = Apple Development"))
    #expect(debug.contains("CODE_SIGN_STYLE = Automatic"))
    #expect(debug.contains("CODE_SIGNING_REQUIRED = YES"))
    #expect(debug.contains("#include? \"DeveloperTeam.xcconfig\""))
    #expect(!debug.contains("DEVELOPMENT_TEAM"))

    let gitignore = try String(
      contentsOf: ProjectFile.url(".gitignore"), encoding: .utf8)
    #expect(gitignore.contains("/DeveloperTeam.xcconfig"))
  }

  @Test("the signing hand-off example names a placeholder, never a team")
  func developerTeamExample() throws {
    let example = try String(
      contentsOf: ProjectFile.url("DeveloperTeam.xcconfig.example"), encoding: .utf8)
    #expect(example.contains("DEVELOPMENT_TEAM = <your 10-character team ID>"))
  }

  @Test("SwiftLint included directories exist")
  func swiftLintIncludedDirectoriesExist() throws {
    let yaml = try String(contentsOf: ProjectFile.url(".swiftlint.yml"), encoding: .utf8)
    var names: [String] = []
    var inIncluded = false
    for line in yaml.split(separator: "\n") {
      if line == "included:" {
        inIncluded = true
        continue
      }
      if inIncluded {
        if line.hasPrefix("  - ") {
          names.append(String(line.dropFirst(4)))
        } else {
          break
        }
      }
    }
    #expect(!names.isEmpty)
    for name in names {
      let values = try ProjectFile.url(name).resourceValues(forKeys: [.isDirectoryKey])
      #expect(values.isDirectory == true, "\(name) is not a directory")
    }
  }
}
