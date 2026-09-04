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

    /** Reads back whether the Android 13+ notification permission is granted. */
    private boolean canNotify() {
        return Build.VERSION.SDK_INT < 33
            || checkSelfPermission("android.permission.POST_NOTIFICATIONS")
                == android.content.pm.PackageManager.PERMISSION_GRANTED;
    }

    private void answerJs(String payload) {
        if (webView == null) return;
        webView.post(
            () ->
                webView.evaluateJavascript(
                    "window.__reminderAnswer && window.__reminderAnswer(" + payload + ");", null));
    }

    private final class NativeBridge {
        @JavascriptInterface
        public void tick() {
            webView.post(
                () -> webView.performHapticFeedback(HapticFeedbackConstants.CONTEXT_CLICK));
        }

        /** Opt in/out of the evening-check-in reminder. Runs on a bridge thread. */
        @JavascriptInterface
        public void setReminder(final boolean enabled, final int hour, final int minute) {
            webView.post(
                () -> {
                    if (!enabled) {
                        ReminderScheduler.setEnabled(MainActivity.this, false);
                        answerJs("'off'");
                        return;
                    }
                    // Remember the choice even before the permission prompt, so a
                    // reboot or later resume can re-arm it.
                    ReminderScheduler.prefs(MainActivity.this)
                        .edit()
                        .putBoolean(ReminderScheduler.KEY_ON, true)
                        .putInt(ReminderScheduler.KEY_HOUR, hour)
                        .putInt(ReminderScheduler.KEY_MINUTE, minute)
                        .apply();
                    if (canNotify()) {
                        ReminderScheduler.schedule(MainActivity.this, hour, minute);
                        answerJs("'granted'");
                        return;
                    }
                    if (Build.VERSION.SDK_INT >= 33) {
                        requestPermissions(new String[] {"android.permission.POST_NOTIFICATIONS"}, 41);
                    } else {
                        answerJs("'granted'");
                    }
                });
        }

        /** Mirrors a check-in into native storage so reminders stay truthful. */
        @JavascriptInterface
        public void noteCheckin(final String slot, final String moodLabel) {
            ReminderScheduler.noteCheckin(MainActivity.this, slot, moodLabel);
        }
    }

    @Override
    public void onRequestPermissionsResult(
        int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != 41) return;
        boolean granted =
            grantResults.length > 0
                && grantResults[0] == android.content.pm.PackageManager.PERMISSION_GRANTED;
        if (granted) {
            int h = ReminderScheduler.prefs(this).getInt(ReminderScheduler.KEY_HOUR, 20);
            int m = ReminderScheduler.prefs(this).getInt(ReminderScheduler.KEY_MINUTE, 0);
            ReminderScheduler.schedule(this, h, m);
            answerJs("'granted'");
        } else {
            // Be honest: keep the reminder off rather than pretend it works.
            ReminderScheduler.setEnabled(this, false);
            answerJs("'denied'");
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
        // Re-arm the reminder whenever the app opens (survives reboots and
        // force-stops once the user returns), and only when it is still allowed.
        ReminderScheduler.ensureChannel(this);
        if (ReminderScheduler.enabled(this) && canNotify()) {
            int h = ReminderScheduler.prefs(this).getInt(ReminderScheduler.KEY_HOUR, 20);
            int m = ReminderScheduler.prefs(this).getInt(ReminderScheduler.KEY_MINUTE, 0);
            ReminderScheduler.schedule(this, h, m);
        }
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