import Foundation

// swiftlint:disable:next unused_declaration - loaded by name from Info.plist NSExtensionPrincipalClass
final class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
  func beginRequest(with context: NSExtensionContext) {
    context.completeRequest(returningItems: nil)
  }
}
