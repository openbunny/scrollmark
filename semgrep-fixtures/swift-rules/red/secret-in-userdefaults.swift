import Foundation

func saveToken(_ token: String) {
  UserDefaults.standard.set(token, forKey: "authToken")
}
