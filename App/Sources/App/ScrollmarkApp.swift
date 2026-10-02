import Foundation
import OpenBunnyUI
import SwiftUI

@main
struct ScrollmarkApp: App {
  @State private var model = ExtensionStatusModel(
    identifier: BundleIdentifiers.extensionID(infoDictionary: Bundle.main.infoDictionary ?? [:]),
    querying: LiveSafariExtensionQuerying()
  )
  private let fontStatus = ThemeFontStatus.register()

  var body: some Scene {
    WindowGroup {
      ContentView(model: model, fontStatus: fontStatus)
        .openbunnyTheme()
    }
    .windowResizability(.contentSize)
  }
}
