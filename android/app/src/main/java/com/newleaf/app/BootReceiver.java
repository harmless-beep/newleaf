package com.newleaf.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (ReminderScheduler.enabled(context)) {
            int hour = ReminderScheduler.prefs(context).getInt(ReminderScheduler.KEY_HOUR, 20);
            int minute = ReminderScheduler.prefs(context).getInt(ReminderScheduler.KEY_MINUTE, 0);
            ReminderScheduler.schedule(context, hour, minute);
        }
    }
}
