package com.newleaf.app;

import android.app.Activity;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.HapticFeedbackConstants;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {

    private WebView webView;
    private final Handler handler = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ---- Edge-to-edge: warm content draws behind transparent system bars.
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
        } else {
            getWindow()
                .getDecorView()
                .setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        }
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        // Dark icons + gesture pill over the cream page.
        int light = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        if (Build.VERSION.SDK_INT >= 26) light |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        getWindow().getDecorView().setSystemUiVisibility(light);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        // localStorage persistence — all check-ins, streaks, journal live here.
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        // The app is fully offline with no INTERNET permission and only its own
        // bundled files, so same-app file access is safe and lets the module
        // scripts and stylesheet load under file://.
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMediaPlaybackRequiresUserGesture(true);

        // Let debuggable builds be inspectable via chrome://inspect (release stays closed).
        if ((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            android.webkit.WebView.setWebContentsDebuggingEnabled(true);
        }

        // Native-feel scrolling: no glow, no bounce, no visible scrollbars.
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);
        webView.setBackgroundColor(Color.parseColor("#fffdf8"));

        // ---- Haptics: the page calls AndroidNative.tick() on check-in taps.
        webView.addJavascriptInterface(new NativeBridge(), "AndroidNative");

        webView.setWebViewClient(
            new WebViewClient() {
                @Override
                public void onPageFinished(WebView view, String url) {
                    pushInsets();
                    // Gently fade the content in over the warm splash.
                    view.animate().alpha(1f).setDuration(350).start();
                }

                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    // The app is a single local page; nothing external is ever loaded.
                    return !url.startsWith("file://");
                }
            });

        // Re-report safe-area insets whenever the window insets change, and fall
        // back to the splash if the page somehow never reports finished.
        webView.setOnApplyWindowInsetsListener(
            (v, insets) -> {
                pushInsets();
                return insets;
            });
        handler.postDelayed(
            () -> {
                if (webView.getAlpha() < 1f) webView.animate().alpha(1f).setDuration(300).start();
            },
            4000);

        // Start transparent so the cream splash shows through, then fade in.
        webView.setAlpha(0f);
        webView.loadUrl("file:///android_asset/www/index.html");
    }

    /** Reads the current system-bar insets and tells the page, in CSS px. */
    private void pushInsets() {
        if (webView == null || Build.VERSION.SDK_INT < 23) return;
        android.view.WindowInsets wi = webView.getRootWindowInsets();
        if (wi == null) return;
        int top = 0;
        int bottom = 0;
        if (Build.VERSION.SDK_INT >= 30) {
            android.graphics.Insets bars = wi.getInsets(android.view.WindowInsets.Type.systemBars());
            top = bars.top;
            bottom = bars.bottom;
        } else {
            top = wi.getSystemWindowInsetTop();
            bottom = wi.getSystemWindowInsetBottom();
        }
        float density = getResources().getDisplayMetrics().density;
        int cssTop = Math.round(top / density);
        int cssBottom = Math.round(bottom / density);
        webView.evaluateJavascript(
            "window.__setSafeInsets && window.__setSafeInsets(" + cssTop + "," + cssBottom + ");", null);
    }

    private final class NativeBridge {
        @JavascriptInterface
        public void tick() {
            webView.post(
                () -> webView.performHapticFeedback(HapticFeedbackConstants.CONTEXT_CLICK));
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            // Back quietly leaves the app; state is preserved for next time.
            moveTaskToBack(true);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        pushInsets();
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}