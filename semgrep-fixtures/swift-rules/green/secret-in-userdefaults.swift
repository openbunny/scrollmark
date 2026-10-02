import Foundation

func saveUsername(_ username: String) {
  UserDefaults.standard.set(username, forKey: "username")
}
