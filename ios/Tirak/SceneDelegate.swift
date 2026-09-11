import UIKit

final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard
      let windowScene = scene as? UIWindowScene,
      let appDelegate = UIApplication.shared.delegate as? AppDelegate
    else {
      return
    }

    let window = appDelegate.window ?? UIWindow(windowScene: windowScene)
    window.windowScene = windowScene
    self.window = window
    window.makeKeyAndVisible()
    appDelegate.startReactNative(in: window)

    if let context = connectionOptions.urlContexts.first {
      appDelegate.preserveColdStartURL(
        context.url,
        options: applicationOpenOptions(from: context))
    } else if let userActivity = connectionOptions.userActivities.first {
      appDelegate.preserveColdStartUserActivity(userActivity)
    }
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard
      let appDelegate = UIApplication.shared.delegate as? AppDelegate,
      let context = URLContexts.first
    else {
      return
    }

    _ = appDelegate.application(
      UIApplication.shared,
      open: context.url,
      options: applicationOpenOptions(from: context))
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else {
      return
    }

    _ = appDelegate.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in })
  }

  private func applicationOpenOptions(
    from context: UIOpenURLContext
  ) -> [UIApplication.OpenURLOptionsKey: Any] {
    var options: [UIApplication.OpenURLOptionsKey: Any] = [
      .openInPlace: context.options.openInPlace,
    ]
    options[.sourceApplication] = context.options.sourceApplication
    options[.annotation] = context.options.annotation
    return options
  }
}
