package com.newleaf.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

/**
 * Owns the opt-in evening-check-in reminder. Everything lives on-device in
 * SharedPreferences: the user's choice (on/off + time) and a small mirror of
 * what the app knows about today (morning mood, whether the evening check-in
 * was answered) so the nudge only fires when it is truthful.
 *
 * Data flow: the web page tells this class about check-ins through the
 * AndroidNative bridge; the alarm wakes {@link ReminderReceiver}; this class
 * decides whether a notification is still honest to show.
 */
final class ReminderScheduler {

    static final String PREFS = "nl_reminder";
    static final String KEY_ON = "on";
    static final String KEY_HOUR = "hour";
    static final String KEY_MINUTE = "minute";
    static final String KEY_MORNING_DATE = "morning_date";
    static final String KEY_MORNING_MOOD = "morning_mood";
    static final String KEY_EVENING_DATE = "evening_date";
    static final String CHANNEL_ID = "evening_checkin";

    private static final SimpleDateFormat DAY = new SimpleDateFormat("yyyy-MM-dd", Locale.US);

    private ReminderScheduler() {}

    // ---- preferences ----------------------------------------------------

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static boolean enabled(Context c) {
        return prefs(c).getBoolean(KEY_ON, false);
    }

    static void setEnabled(Context c, boolean on) {
        prefs(c).edit().putBoolean(KEY_ON, on).apply();
        if (!on) cancel(c);
    }

    /** Remembers a check-in so future notifications can be honest about it. */
    static void noteCheckin(Context c, String slot, String moodLabel) {
        String today = DAY.format(new Date());
        SharedPreferences.Editor e = prefs(c).edit();
        if ("morning".equals(slot)) {
            e.putString(KEY_MORNING_DATE, today);
            if (moodLabel != null && !moodLabel.isEmpty()) {
                e.putString(KEY_MORNING_MOOD, moodLabel.toLowerCase(Locale.US));
            }
        } else if ("evening".equals(slot)) {
            e.putString(KEY_EVENING_DATE, today);
        }
        e.apply();
        // Note: the repeating alarm is intentionally left armed — the receiver
        // itself checks eveningStillOpen() each day, so answered days are simply
        // skipped and future days keep their gentle nudge.
    }

    /** True when the evening check-in is still unwritten today. */
    static boolean eveningStillOpen(Context c) {
        String today = DAY.format(new Date());
        String done = prefs(c).getString(KEY_EVENING_DATE, "");
        return !today.equals(done);
    }

    private static String morningMoodToday(Context c) {
        String today = DAY.format(new Date());
        String date = prefs(c).getString(KEY_MORNING_DATE, "");
        if (!today.equals(date)) return null;
        String mood = prefs(c).getString(KEY_MORNING_MOOD, "");
        return mood.isEmpty() ? null : mood;
    }

    // ---- notification channel -------------------------------------------

    static void ensureChannel(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null || nm.getNotificationChannel(CHANNEL_ID) != null) return;
        NotificationChannel ch = new NotificationChannel(
            CHANNEL_ID,
            "Evening check-in",
            NotificationManager.IMPORTANCE_DEFAULT);
        ch.setDescription("A gentle, opt-in reminder to check in with how your day went. It only appears if the evening check-in is still open.");
        ch.enableVibration(false);
        ch.setSound(null, null);
        nm.createNotificationChannel(ch);
    }

    // ---- alarm ----------------------------------------------------------

    /** (Re)arms the daily one-shot alarm for the stored time. */
    static void schedule(Context c) {
        ensureChannel(c);
        int hour = prefs(c).getInt(KEY_HOUR, 20);
        int minute = prefs(c).getInt(KEY_MINUTE, 0);
        scheduleAt(c, hour, minute);
    }

    static void schedule(Context c, int hour, int minute) {
        ensureChannel(c);
        prefs(c).edit().putInt(KEY_HOUR, hour).putInt(KEY_MINUTE, minute).apply();
        scheduleAt(c, hour, minute);
    }

    private static void scheduleAt(Context c, int hour, int minute) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, hour);
        cal.set(Calendar.MINUTE, minute);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        if (!cal.getTime().after(new Date())) cal.add(Calendar.DAY_OF_YEAR, 1);
        long when = cal.getTimeInMillis();
        PendingIntent pi = pendingIntent(c);
        // One-shot alarm, re-armed by the receiver each day. When the system
        // grants exact-alarm access the nudge lands on time; otherwise a tight
        // window keeps it close to the set hour while still being battery-kind.
        // (setInexactRepeating is deliberately avoided: it hands the system an
        // 18-hour window, so an "evening" nudge can arrive the next morning.)
        if (am.canScheduleExactAlarms()) {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when, pi);
        } else {
            am.setWindow(AlarmManager.RTC_WAKEUP, when, 10 * 60_000L, pi);
        }
    }

    static void cancel(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        am.cancel(pendingIntent(c));
    }

    private static PendingIntent pendingIntent(Context c) {
        Intent i = new Intent(c, ReminderReceiver.class);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(c, 0, i, flags);
    }

    // ---- notification ---------------------------------------------------

    /** Called when the alarm fires: nudge if honest, then arm tomorrow's alarm. */
    static void onAlarmFired(Context c) {
        maybeShow(c);
        if (enabled(c)) schedule(c); // chain to tomorrow (today's fire already passed)
    }

    static void maybeShow(Context c) {
        if (!enabled(c)) return;
        if (!eveningStillOpen(c)) return; // already answered — never nag

        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        ensureChannel(c);

        Intent open = new Intent(c, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent content =
            PendingIntent.getActivity(
                c, 1, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        String morning = morningMoodToday(c);
        String title;
        String text;
        if (morning != null) {
            title = "How did the rest of today go?";
            text =
                "This morning you felt "
                    + morning
                    + ". If you'd like, a gentle evening check-in before the day closes. No pressure either way.";
        } else {
            title = "A gentle evening check-in";
            text =
                "How did today actually go? One tap if you'd like to notice it — and if not, tomorrow starts fresh either way.";
        }

        Notification.Builder b =
            new Notification.Builder(c, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setContentIntent(content)
                .setAutoCancel(true)
                .setCategory(Notification.CATEGORY_REMINDER);

        nm.notify(1001, b.build());
    }
}
