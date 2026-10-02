import Foundation
import Testing

@Suite
struct ProjectFileTests {
  @Test("plist throws when the root is not a dictionary")
  func nonDictionaryRootThrows() throws {
    let directory = FileManager.default.temporaryDirectory
    let fileName = "\(UUID().uuidString).plist"
    let fileURL = directory.appendingPathComponent(fileName)
    let data = try PropertyListSerialization.data(
      fromPropertyList: ["one", "two"],
      format: .xml,
      options: 0
    )
    try data.write(to: fileURL)
    defer { try? FileManager.default.removeItem(at: fileURL) }

    let fakeSourceFile = directory.appendingPathComponent("fake").appendingPathComponent(
      "probe.swift")
    #expect(throws: PlistDecodingError.self) {
      try ProjectFile.plist(fileName, testFile: fakeSourceFile.path)
    }
  }
}
