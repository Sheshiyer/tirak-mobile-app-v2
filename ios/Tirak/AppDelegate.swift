import Expo
import React
import ReactAppDependencyProvider

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?
  private var initialLaunchOptions: [UIApplication.LaunchOptionsKey: Any]?
  private var hasStartedReactNative = false

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
  /// URL in Expo's initial-link registry immediately and retain a separate
  /// bridge-backed copy until JavaScript acknowledges the exact queue item.
  func preserveColdStartURL(
    _ url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any]
  ) {
    _ = super.application(UIApplication.shared, open: url, options: options)
    TirakSceneLinkRegistry.preserve(url, kind: "custom-scheme")
    debugLogSceneLink("preserved cold custom-scheme")
  }

  /// Universal-link equivalent of `preserveColdStartURL`.
  func preserveColdStartUserActivity(_ userActivity: NSUserActivity) {
    _ = super.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in })
    if let url = userActivity.webpageURL {
      TirakSceneLinkRegistry.preserve(url, kind: "universal-link")
    }
    debugLogSceneLink("preserved cold universal-link")
  }

  private func debugLogSceneLink(_ message: String) {
    NSLog("[TirakSceneLink] \(message)")
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
    if let embeddedBundle = Bundle.main.url(forResource: "main", withExtension: "jsbundle") {
      return embeddedBundle
    }
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
