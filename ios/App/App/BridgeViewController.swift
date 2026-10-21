import UIKit
import WebKit
import Capacitor

class BridgeViewController: CAPBridgeViewController {
    private static let webCacheResetKey = "yatang.webCacheReset.v2"

    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        clearStaleWebCacheIfNeeded()
        disableWebViewZoom()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        disableWebViewZoom()
    }

    /// 예전 HTML/JS가 WKWebView 디스크 캐시에 남아 완전 종료 후 옛 UI로 돌아가는 경우 방지.
    /// 버전 키가 바뀔 때만 한 번 비우고, 이후에는 nginx no-cache HTML에 맡긴다.
    private func clearStaleWebCacheIfNeeded() {
        let defaults = UserDefaults.standard
        if defaults.bool(forKey: Self.webCacheResetKey) { return }
        defaults.set(true, forKey: Self.webCacheResetKey)

        URLCache.shared.removeAllCachedResponses()

        let store = WKWebsiteDataStore.default()
        let types: Set<String> = [
            WKWebsiteDataTypeDiskCache,
            WKWebsiteDataTypeMemoryCache,
        ]
        store.removeData(ofTypes: types, modifiedSince: Date.distantPast) { }
    }

    private func disableWebViewZoom() {
        guard let webView = self.webView else { return }
        let scrollView = webView.scrollView
        scrollView.minimumZoomScale = 1.0
        scrollView.maximumZoomScale = 1.0
        scrollView.zoomScale = 1.0
        scrollView.bouncesZoom = false
        scrollView.pinchGestureRecognizer?.isEnabled = false
    }
}
