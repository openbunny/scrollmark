import Foundation
import Testing

@Suite
struct SigningTests {
  private struct ScriptResult {
    let status: Int32
    let output: String
  }

  private func run(environment: [String: String]) throws -> ScriptResult {
    let process = Process()
    process.executableURL = URL(fileURLWithPath: "/bin/sh")
    process.arguments = [ProjectFile.url("Scripts/require-signing-team.sh").path]
    process.environment = environment
    let pipe = Pipe()
    process.standardError = pipe
    try process.run()
    let data = pipe.fileHandleForReading.readDataToEndOfFile()
    process.waitUntilExit()
    return ScriptResult(
      status: process.terminationStatus, output: String(bytes: data, encoding: .utf8) ?? "")
  }

  @Test("a signed build without DEVELOPMENT_TEAM fails and names the setting")
  func missingTeamFails() throws {
    for configuration in ["Debug", "Release"] {
      let result = try run(environment: ["CONFIGURATION": configuration])
      #expect(result.status != 0)
      #expect(result.output.contains("error: DEVELOPMENT_TEAM is unset for the \(configuration)"))
      #expect(result.output.contains("DeveloperTeam.xcconfig.example"))
    }
  }

  @Test("an empty DEVELOPMENT_TEAM fails like an unset one")
  func emptyTeamFails() throws {
    let result = try run(environment: ["CONFIGURATION": "Release", "DEVELOPMENT_TEAM": ""])
    #expect(result.status != 0)
  }

  @Test("a signed build with DEVELOPMENT_TEAM passes")
  func teamSetPasses() throws {
    let result = try run(environment: [
      "CONFIGURATION": "Release", "DEVELOPMENT_TEAM": "ABCDE12345",
    ])
    #expect(result.status == 0)
  }

  @Test("an unsigned build passes without DEVELOPMENT_TEAM")
  func unsignedPasses() throws {
    let result = try run(environment: ["CONFIGURATION": "Release", "CODE_SIGNING_ALLOWED": "NO"])
    #expect(result.status == 0)
  }

  @Test("the scheme runs the team check before any target builds")
  func schemeRunsTeamCheck() throws {
    let project = try String(contentsOf: ProjectFile.url("project.yml"), encoding: .utf8)
    #expect(project.contains("preActions:"))
    #expect(project.contains("require-signing-team.sh"))
  }
}
