import OpenBunnyTheme
import OpenBunnyUI
import SwiftUI

struct ContentView: View {
  @Environment(\.colorSchemeContrast)
  private var contrast

  let model: ExtensionStatusModel
  let fontStatus: ThemeFontStatus

  var body: some View {
    VStack(spacing: Spacing.loose) {
      statusText
      Button("Safari settings") {
        Task { await model.openSettings() }
      }
      .buttonStyle(.flat)
      if model.lastSettingsOutcome == .failed {
        note("could not open Safari settings")
      }
      if case .failed(let reason) = fontStatus {
        note("theme fonts failed to load; system fonts are shown")
          .help(reason)
      }
    }
    .multilineTextAlignment(.center)
    .padding(Spacing.page)
    .task { await model.refresh() }
  }

  private var statusText: some View {
    let (text, status) = statusContent
    return Text(text)
      .foregroundStyle(contrast == .increased ? Color.foreground : status.color)
  }

  private var statusContent: (LocalizedStringKey, Status) {
    switch model.availability {
    case .enabled:
      ("extension enabled", .enabled)

    case .disabled:
      ("extension disabled", .disabled)

    case .unavailable:
      ("safari did not return extension status", .unavailable)
    }
  }

  private func note(_ text: LocalizedStringKey) -> some View {
    Text(text)
      .font(.themeCaption)
      .foregroundStyle(contrast == .increased ? Color.foreground : Color.muted)
  }
}
