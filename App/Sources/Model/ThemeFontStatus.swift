import OpenBunnyTheme

enum ThemeFontStatus: Equatable, Sendable {
  case registered
  case failed(String)

  static func register(
    using register: () throws(FontError) -> Void = Fonts.register
  ) -> Self {
    do {
      try register()
      return .registered
    } catch {
      return .failed(error.localizedDescription)
    }
  }
}
