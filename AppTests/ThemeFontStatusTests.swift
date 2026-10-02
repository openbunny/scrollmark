import AppKit
import OpenBunnyTheme
import Testing

@Suite
struct ThemeFontStatusTests {
  @Test
  func registersTheThemeFamilies() {
    #expect(ThemeFontStatus.register() == .registered)
    let available = Set(NSFontManager.shared.availableFontFamilies)
    #expect(available.isSuperset(of: Fonts.families))
  }

  @Test(arguments: [
    FontError.resourceMissing("CourierPrime-Regular"),
    FontError.registrationFailed(file: "CourierPrime-Bold", reason: "denied"),
    FontError.familyUnavailable("Courier Prime"),
  ])
  func reportsEveryRegistrationFailure(error: FontError) {
    let status = ThemeFontStatus.register { () throws(FontError) in throw error }
    #expect(status == .failed(error.localizedDescription))
  }
}
