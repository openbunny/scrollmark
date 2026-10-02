import Foundation

func makeInstance(named name: String) -> AnyObject? {
  NSClassFromString(name)
}
