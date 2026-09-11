import Expo
import React
import ReactAppDependencyProvider

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  private enum PendingSceneLink {
    case url(URL, [UIApplication.OpenURLOptionsKey: Any])
    case userActivity(NSUserActivity)
  }

  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?
  private var initialLaunchOptions: [UIApplication.LaunchOptionsKey: Any]?
  private var hasStartedReactNative = false
  private var hasReactContentAppeared = false
  private var pendingSceneLink: PendingSceneLink?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)
    initialLaunchOptions = launchOptions

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(reactContentDidAppear(_:)),
      name: Notification.Name("RCTContentDidAppearNotification"),
      object: nil)

    // Expo Dev Launcher observes didFinishLaunching before UIKit connects the
    // first scene and requires the app delegate to already own its window.
    // SceneDelegate attaches this same window to the UIWindowScene before use.
    let bootstrapWindow = UIWindow(frame: UIScreen.main.bounds)
    window = bootstrapWindow
    startReactNative(in: bootstrapWindow)

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func startReactNative(in window: UIWindow) {
    guard !hasStartedReactNative, let factory = reactNativeFactory else {
      return
    }

    hasStartedReactNative = true
    self.window = window

    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: initialLaunchOptions)
  }

  /// UIScene receives cold-start links after `didFinishLaunching`, once the
  /// React Native factory has already captured its launch options. Preserve the
  /// URL in Expo's initial-link registry immediately, then defer the RN event
  /// until the first React content has mounted and its linking listener exists.
  func preserveColdStartURL(
    _ url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any]
  ) {
    _ = super.application(UIApplication.shared, open: url, options: options)
    debugLogSceneLink("preserved cold custom-scheme")
    enqueuePendingSceneLink(.url(url, options))
  }

  /// Universal-link equivalent of `preserveColdStartURL`.
  func preserveColdStartUserActivity(_ userActivity: NSUserActivity) {
    _ = super.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in })
    debugLogSceneLink("preserved cold universal-link")
    enqueuePendingSceneLink(.userActivity(userActivity))
  }

  private func enqueuePendingSceneLink(_ link: PendingSceneLink) {
    guard pendingSceneLink == nil else {
      return
    }

    pendingSceneLink = link
    deliverPendingSceneLink()
  }

  @objc private func reactContentDidAppear(_ notification: Notification) {
    hasReactContentAppeared = true
    deliverPendingSceneLink()
  }

  private func deliverPendingSceneLink() {
    guard hasReactContentAppeared, let link = pendingSceneLink else {
      return
    }

    pendingSceneLink = nil

    // React's content notification is posted during native mounting. Deliver
    // on the following main-loop turn so passive effects can attach Linking's
    // URL observer before RCTLinkingManager posts its notification.
    DispatchQueue.main.async {
      switch link {
      case let .url(url, options):
        _ = RCTLinkingManager.application(
          UIApplication.shared,
          open: url,
          options: options)
        self.debugLogSceneLink("delivered deferred custom-scheme")
      case let .userActivity(userActivity):
        _ = RCTLinkingManager.application(
          UIApplication.shared,
          continue: userActivity,
          restorationHandler: { _ in })
        self.debugLogSceneLink("delivered deferred universal-link")
      }
    }
  }

  private func debugLogSceneLink(_ message: String) {
#if DEBUG
    NSLog("[TirakSceneLink] \(message)")
#endif
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    let expoHandled = super.application(app, open: url, options: options)
    let reactNativeHandled = RCTLinkingManager.application(
      app,
      open: url,
      options: options)
    debugLogSceneLink("delivered warm custom-scheme")
    return expoHandled || reactNativeHandled
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let expoHandled = super.application(
      application,
      continue: userActivity,
      restorationHandler: restorationHandler)
    let reactNativeHandled = RCTLinkingManager.application(
      application,
      continue: userActivity,
      restorationHandler: restorationHandler)
    debugLogSceneLink("delivered warm universal-link")
    return expoHandled || reactNativeHandled
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
