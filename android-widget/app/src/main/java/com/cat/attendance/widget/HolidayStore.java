package com.cat.attendance.widget;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public final class HolidayStore {
    private static final String PREFS = "cat_widget_holidays_v1";
    private static final String KEY_SYNCED_HOLIDAYS = "synced_holidays";

    private static JSONObject bundledHolidays;
    private static JSONObject syncedHolidays;

    private HolidayStore() {}

    public static synchronized String get(Context context, String dateKey) {
        JSONObject synced = getSynced(context);
        String syncedName = synced.optString(dateKey, "");
        if (!syncedName.isEmpty()) {
            return syncedName;
        }

        if (bundledHolidays == null) {
            bundledHolidays = loadBundled(context);
        }
        return bundledHolidays.optString(dateKey, "");
    }

    public static synchronized void replaceFromWeb(
            Context context,
            JSONObject holidays
    ) {
        if (holidays == null || holidays.length() == 0) {
            return;
        }

        syncedHolidays = holidays;
        preferences(context)
                .edit()
                .putString(KEY_SYNCED_HOLIDAYS, holidays.toString())
                .apply();
    }

    private static JSONObject getSynced(Context context) {
        if (syncedHolidays != null) {
            return syncedHolidays;
        }

        String raw = preferences(context).getString(
                KEY_SYNCED_HOLIDAYS,
                "{}"
        );

        try {
            syncedHolidays = new JSONObject(
                    raw == null || raw.isEmpty() ? "{}" : raw
            );
        } catch (JSONException error) {
            syncedHolidays = new JSONObject();
        }
        return syncedHolidays;
    }

    private static SharedPreferences preferences(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private static JSONObject loadBundled(Context context) {
        try (InputStream input = context.getResources().openRawResource(R.raw.holidays);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096];
            int count;
            while ((count = input.read(buffer)) >= 0) {
                output.write(buffer, 0, count);
            }
            return new JSONObject(
                    output.toString(StandardCharsets.UTF_8.name())
            );
        } catch (IOException | JSONException error) {
            return new JSONObject();
        }
    }
}
