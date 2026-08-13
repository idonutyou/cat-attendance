package com.cat.attendance.widget;

import android.app.Activity;

public final class WidgetAppBridge {
    private WidgetAppBridge() {}
    public static boolean deliverPendingToRunningAppSilently(Activity activity) { return false; }
    public static boolean openOrResumeCat(Activity activity) { return false; }
}
