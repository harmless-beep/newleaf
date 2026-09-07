package com.newleaf.app;

import android.animation.AnimatorSet;
import android.animation.ObjectAnimator;
import android.app.Activity;
import android.graphics.Color;
import android.graphics.Path;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.view.HapticFeedbackConstants;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.DecelerateInterpolator;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

public class MainActivity extends Activity {

    // The splash dissolves the moment the page reports its first painted
    // frame (AndroidNative.pageReady). This is the safety net for the rare
    // case the page never reports ready — never trap the visitor on the logo.
    private static final long MAX_SPLASH_MS = 4000L;

    private WebView webView;
    private View splashRoot;
    private View splashLeaf;
    private boolean splashRevealed = false;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable revealRunnable = this::revealSplash;

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
        // The app owns its palette. Never let the system's force-dark pass
        // recolour the cream design when the phone is in dark mode — that
        // pass is also an extra render step on every frame on some OEMs.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            settings.setForceDark(WebSettings.FORCE_DARK_OFF);
        }

        // Let debuggable builds be inspectable via chrome://inspect (release stays closed).
        if ((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            android.webkit.WebView.setWebContentsDebuggingEnabled(true);
        }

        // Native-feel scrolling: no glow, no bounce, no visible scrollbars.
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);
        webView.setBackgroundColor(Color.parseColor("#fffdf8"));

        // Keep the renderer at foreground priority so compositor frames never
        // throttle mid-animation — some OEM power handlers downgrade a
        // WebView renderer the moment anything else takes focus (like the
        // recent-apps snapshot), and the next frame budget then stutters.
        webView.setRendererPriorityPolicy(
            WebView.RENDERER_PRIORITY_IMPORTANT, /* sacrificedWhenVisible */ false);

        // ---- Haptics: the page calls AndroidNative.tick() on check-in taps.
        webView.addJavascriptInterface(new NativeBridge(), "AndroidNative");

        // The page paints beneath an opaque cream splash; when it is ready the
        // leaf mark swells softly and the splash dissolves to reveal the app.
        FrameLayout root = new FrameLayout(this);
        LayoutInflater inflater = LayoutInflater.from(this);
        splashRoot = inflater.inflate(R.layout.splash_overlay, root, false);
        splashLeaf = splashRoot.findViewById(R.id.splash_leaf);
        // A tap anywhere on the splash skips the wait and opens the app now.
        splashRoot.setClickable(true);
        splashRoot.setContentDescription(getString(R.string.splash_tap_hint));
        splashRoot.setOnClickListener(v -> skipSplash());

        FrameLayout.LayoutParams full = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
        root.addView(webView, full);
        root.addView(splashRoot, full);
        setContentView(root);

        webView.setWebViewClient(
            new WebViewClient() {
                @Override
                public void onPageFinished(WebView view, String url) {
                    // Safe-area insets are needed as soon as the page is up.
                    pushInsets();
                    // The reveal itself waits for the page's first painted
                    // frame (see NativeBridge.pageReady) so the splash never
                    // lifts onto a blank or half-painted screen.
                }

                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    // The app is a single local page; nothing external is ever loaded.
                    return !url.startsWith("file://");
                }
            });

        // Re-report safe-area insets whenever the window insets change.
        webView.setOnApplyWindowInsetsListener(
            (v, insets) -> {
                pushInsets();
                return insets;
            });

        // Safety net: if the page never reports finished, reveal anyway.
        handler.postDelayed(
            () -> {
                if (!splashRevealed) revealSplash();
            },
            MAX_SPLASH_MS);

        webView.loadUrl("file:///android_asset/www/index.html");
    }

    /**
     * A tap on the splash skips the remaining wait: any in-flight animation
     * is cancelled and the splash disappears this instant, page or no page.
     */
    private void skipSplash() {
        if (splashRoot == null || splashRoot.getVisibility() == View.GONE) return;
        splashLeaf.animate().cancel();
        splashRoot.animate().cancel();
        splashRoot.setAlpha(1f);
        splashRoot.setVisibility(View.GONE);
        releasePageMotion();
    }

    /**
     * The page holds its entrance animations (html.nl-splash-hold) until the
     * splash reveal finishes, so they play as the app becomes visible instead
     * of finishing invisibly under the cream. Called the moment the cream
     * starts clearing on every reveal path.
     *
     * The release is confirmed: the page answers "nl-hold=1|0", and if it is
     * still holding (this call raced the page load — early tap-to-skip, slow
     * first paint, safety net) we retry shortly so the hold can never get
     * stranded with every animation suppressed.
     */
    private void releasePageMotion() {
        releasePageMotion(0);
    }

    private void releasePageMotion(final int attempt) {
        if (webView == null) return;
        webView.evaluateJavascript(
            "try{window.__nlReleaseMotion&&window.__nlReleaseMotion()}catch(e){};"
                + "document.documentElement.classList.contains('nl-splash-hold')",
            value -> {
                boolean stillHeld = value != null && value.contains("true");
                if (stillHeld && attempt < 3) {
                    webView.postDelayed(() -> releasePageMotion(attempt + 1), 400);
                }
            });
    }

    /** Convenience: reveal without a header target (centre swell + dissolve). */
    private void revealSplash() {
        revealSplash(null);
    }

    /**
     * Ends the splash. When {@code logoRect} — CSS px left, top, width, height
     * of the in-page header logo — is known, the leaf flies from the centre of
     * the screen up into that exact spot, like it settles into the app bar,
     * while the cream dissolves around it. Without a target it swells in place
     * and fades. Runs once; normally triggered by the page's first paint
     * (NativeBridge.pageReady / pageReadyAt), MAX_SPLASH_MS as a fallback.
     */
    private void revealSplash(final float[] logoRect) {
        if (splashRevealed || splashRoot == null) return;
        splashRevealed = true;

        // Honour "remove animations": reveal instantly for reduced-motion users.
        float animatorScale =
            Settings.Global.getFloat(getContentResolver(), Settings.Global.ANIMATOR_DURATION_SCALE, 1f);
        if (animatorScale == 0f) {
            splashRoot.setVisibility(View.GONE);
            releasePageMotion();
            return;
        }

        float cx = splashLeaf.getWidth() / 2f;
        float cy = splashLeaf.getHeight() / 2f;
        if (cx > 0f) {
            splashLeaf.setPivotX(cx);
            splashLeaf.setPivotY(cy);
        }

        boolean fly =
            logoRect != null
                && logoRect.length == 4
                && logoRect[2] > 0f
                && logoRect[3] > 0f
                && splashLeaf.getWidth() > 0f;

        if (fly) {
            float density = getResources().getDisplayMetrics().density;
            // Centre of the in-page header logo, in physical px.
            float endCssX = logoRect[0] + logoRect[2] / 2f;
            float endCssY = logoRect[1] + logoRect[3] / 2f;
            float dx =
                endCssX * density - (splashLeaf.getLeft() + splashLeaf.getWidth() / 2f);
            float dy =
                endCssY * density - (splashLeaf.getTop() + splashLeaf.getHeight() / 2f);
            // Both logos draw the same leaf spanning roughly half their box;
            // scale so the splash leaf arrives at the header logo's leaf size.
            float leafScale =
                (logoRect[2] * density * 0.52f) / (splashLeaf.getWidth() * 0.555f);
            leafScale = Math.max(0.15f, Math.min(0.6f, leafScale));

            // The leaf arcs up into the app bar and settles on the logo: the
            // path bows slightly above the straight line, so the motion reads
            // as a tiny upward swoop rather than a flat glide.
            float arcLift = 22f * density; // px of upward bow (arc height)
            Path arc = new Path();
            arc.moveTo(0f, 0f);
            arc.quadTo(dx / 2f, dy / 2f - arcLift, dx, dy);
            AnimatorSet flight = new AnimatorSet();
            flight.playTogether(
                ObjectAnimator.ofFloat(splashLeaf, "translationX", "translationY", arc),
                ObjectAnimator.ofFloat(splashLeaf, View.SCALE_X, leafScale),
                ObjectAnimator.ofFloat(splashLeaf, View.SCALE_Y, leafScale));
            flight.setDuration(430);
            flight.setInterpolator(new DecelerateInterpolator(1.6f));
            flight.start();
        } else if (cx > 0f) {
            // No header target (safety net, or the page has no header yet):
            // swell gently in place instead.
            splashLeaf
                .animate()
                .scaleX(1.16f)
                .scaleY(1.16f)
                .setDuration(240)
                .setInterpolator(new DecelerateInterpolator(1.4f))
                .start();
        }

        // …and the cream dissolves around it. The dissolve starts about 60%
        // of the way through the flight, so the page begins to emerge beneath
        // the leaf as it arrives instead of staying hidden until it lands; by
        // touchdown roughly a third of the cream is already clear, and the
        // last of it lifts as the leaf settles into the header logo.
        long dissolveDelay = fly ? 260 : (cx > 0f ? 200 : 0);
        splashRoot
            .animate()
            .alpha(0f)
            .setStartDelay(dissolveDelay)
            .setDuration(460)
            .setInterpolator(new DecelerateInterpolator(1.2f))
            // As the cream begins to clear, release the page's held entrance
            // animations so the app arrives already moving beneath it.
            .withStartAction(() -> releasePageMotion())
            .withEndAction(
                () -> {
                    splashRoot.setVisibility(View.GONE);
                    splashLeaf.animate().cancel();
                    splashLeaf.setTranslationX(0f);
                    splashLeaf.setTranslationY(0f);
                    splashLeaf.setScaleX(1f);
                    splashLeaf.setScaleY(1f);
                    splashLeaf.setAlpha(1f);
                })
            .start();
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

        /** Called by the page once its very first frame has been painted. */
        @JavascriptInterface
        public void pageReady() {
            webView.post(() -> revealSplash());
        }

        /**
         * Like {@link #pageReady()}, but with the header logo's CSS-px
         * bounding box (left, top, width, height) so the splash leaf can fly
         * up into the app bar instead of merely dissolving.
         */
        @JavascriptInterface
        public void pageReadyAt(
            final float left, final float top, final float width, final float height) {
            webView.post(
                () -> revealSplash(new float[] {left, top, width, height}));
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
        // The page gets first claim on back: full-screen overlays (habit
        // detail, keepsake, celebration card) close like native screens.
        // evaluateJavascript is async, so the no-overlay fallback is scheduled
        // with a short grace period and cancelled if the page consumes it.
        if (webView == null) {
            moveTaskToBack(true);
            return;
        }
        final Runnable fallback = () -> {
            if (webView != null && webView.canGoBack()) {
                webView.goBack();
            } else {
                // Back quietly leaves the app; state is preserved for next time.
                moveTaskToBack(true);
            }
        };
        webView.postDelayed(fallback, 220);
        webView.evaluateJavascript(
            "(function(){ try { return !!(window.__nlAndroidBack && window.__nlAndroidBack()); } catch (e) { return false; } })()",
            value -> {
                if (value != null && value.trim().equals("true")) {
                    webView.removeCallbacks(fallback);
                }
            });
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
