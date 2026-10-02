import SafariServices
import Testing

@Suite
struct LiveSafariExtensionQueryingTests {
  @Test(
    "availability resolves consistently when the SDK's completion handler fires off the main actor",
    .timeLimit(.minutes(1))
  )
  func availabilityCompletesRegardlessOfCallbackThread() async {
    let querying = LiveSafariExtensionQuerying()
    let id = "test.invalid.extension"
    async let first = querying.availability(forExtensionWithIdentifier: id)
    async let second = querying.availability(forExtensionWithIdentifier: id)
    let (firstResult, secondResult) = await (first, second)
    #expect(firstResult == secondResult)
  }
}
