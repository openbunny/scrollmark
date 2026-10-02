import Foundation

enum ProjectFile {
  static func url(_ relativePath: String, testFile: String = #filePath) -> URL {
    URL(fileURLWithPath: testFile)
      .deletingLastPathComponent()
      .deletingLastPathComponent()
      .appendingPathComponent(relativePath)
  }

  static func plist(_ relativePath: String, testFile: String = #filePath) throws -> [String: Any] {
    let data = try Data(contentsOf: url(relativePath, testFile: testFile))
    let object = try unsafe PropertyListSerialization.propertyList(from: data, format: nil)
    guard let dict = object as? [String: Any] else {
      throw PlistDecodingError.notADictionary(relativePath)
    }
    return dict
  }
}

enum PlistDecodingError: Error {
  case notADictionary(String)
}
