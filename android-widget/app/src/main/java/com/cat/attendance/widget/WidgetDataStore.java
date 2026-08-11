package com.cat.attendance.widget;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.Iterator;
import java.util.List;

public final class WidgetDataStore {
    private static final String PREFS = "cat_widget_state_v1";
    private static final String KEY_RECORDS = "records";
    private static final String KEY_PENDING = "pending";
    private static final String KEY_WEEK_START_MONDAY = "week_start_monday";
    private static final String KEY_WEEK_START_PENDING = "week_start_pending";

    private WidgetDataStore() {}

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static boolean startsOnMonday(Context context) {
        return prefs(context).getBoolean(KEY_WEEK_START_MONDAY, false);
    }

    public static void toggleWeekStart(Context context) {
        boolean next = !startsOnMonday(context);
        long now = System.currentTimeMillis();
        JSONObject pending = new JSONObject();
        try {
            pending.put("value", next ? "monday" : "sunday");
            pending.put("updatedAt", now);
        } catch (JSONException ignored) {}

        prefs(context).edit()
                .putBoolean(KEY_WEEK_START_MONDAY, next)
                .putString(KEY_WEEK_START_PENDING, pending.toString())
                .apply();
    }

    public static int getYear(Context context, int widgetId) {
        return prefs(context).getInt("year_" + widgetId, 0);
    }

    public static int getMonth(Context context, int widgetId) {
        return prefs(context).getInt("month_" + widgetId, 0);
    }

    public static void setVisibleMonth(Context context, int widgetId, int year, int month) {
        prefs(context).edit()
                .putInt("year_" + widgetId, year)
                .putInt("month_" + widgetId, month)
                .apply();
    }

    public static void deleteWidgetState(Context context, int widgetId) {
        prefs(context).edit()
                .remove("year_" + widgetId)
                .remove("month_" + widgetId)
                .apply();
    }

    public static String getWorkType(Context context, String dateKey) {
        Object record = getWorkRecord(context, dateKey);
        if (record instanceof String) {
            return (String) record;
        }
        if (record instanceof JSONObject) {
            return ((JSONObject) record).optString("type", "");
        }
        return "";
    }

    public static String getCustomLabel(Context context, String dateKey) {
        Object record = getWorkRecord(context, dateKey);
        if (!(record instanceof JSONObject)) {
            return "";
        }
        JSONObject object = (JSONObject) record;
        if (!WorkTypes.CUSTOM_ID.equals(object.optString("type", ""))) {
            return "";
        }
        return normalizeCustomLabel(object.optString("label", ""));
    }

    private static Object getWorkRecord(Context context, String dateKey) {
        JSONObject records = readObject(prefs(context).getString(KEY_RECORDS, "{}"));
        return records.opt(dateKey);
    }

    public static void setWorkType(Context context, String dateKey, String type) {
        if (type == null || type.isEmpty()) {
            setWorkRecord(context, dateKey, null);
            return;
        }
        setWorkRecord(context, dateKey, type);
    }

    public static void setCustomWorkType(Context context, String dateKey, String label) {
        String normalized = normalizeCustomLabel(label);
        if (normalized.isEmpty()) {
            return;
        }

        JSONObject record = new JSONObject();
        try {
            record.put("type", WorkTypes.CUSTOM_ID);
            record.put("label", normalized);
        } catch (JSONException ignored) {
            return;
        }
        setWorkRecord(context, dateKey, record);
    }

    private static void setWorkRecord(Context context, String dateKey, Object record) {
        SharedPreferences preferences = prefs(context);
        JSONObject records = readObject(preferences.getString(KEY_RECORDS, "{}"));
        JSONObject pending = readObject(preferences.getString(KEY_PENDING, "{}"));
        long now = System.currentTimeMillis();

        try {
            JSONObject change = new JSONObject();
            if (record == null) {
                records.remove(dateKey);
                change.put("type", "");
            } else if (record instanceof JSONObject) {
                JSONObject object = (JSONObject) record;
                records.put(dateKey, object);
                change.put("type", WorkTypes.CUSTOM_ID);
                change.put("record", object);
            } else {
                String type = String.valueOf(record);
                records.put(dateKey, type);
                change.put("type", type);
            }

            change.put("updatedAt", now);
            pending.put(dateKey, change);
        } catch (JSONException ignored) {}

        preferences.edit()
                .putString(KEY_RECORDS, records.toString())
                .putString(KEY_PENDING, pending.toString())
                .apply();
    }

    public static void replaceFromWeb(Context context, JSONObject records, String weekStart) {
        SharedPreferences.Editor editor = prefs(context).edit()
                .putString(KEY_RECORDS, records == null ? "{}" : records.toString())
                .putBoolean(KEY_WEEK_START_MONDAY, "monday".equals(weekStart))
                .putString(KEY_PENDING, "{}")
                .remove(KEY_WEEK_START_PENDING);
        editor.apply();
    }

    public static String buildPendingPayload(Context context, int maxChanges) {
        SharedPreferences preferences = prefs(context);
        JSONObject pending = readObject(preferences.getString(KEY_PENDING, "{}"));
        JSONObject payload = new JSONObject();
        JSONObject limitedChanges = new JSONObject();

        List<PendingEntry> entries = new ArrayList<>();
        Iterator<String> keys = pending.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            JSONObject change = pending.optJSONObject(key);
            if (change != null) {
                entries.add(new PendingEntry(key, change, change.optLong("updatedAt", 0L)));
            }
        }
        entries.sort(Comparator.comparingLong((PendingEntry e) -> e.updatedAt).reversed());

        try {
            for (int index = 0; index < Math.min(maxChanges, entries.size()); index++) {
                PendingEntry entry = entries.get(index);
                limitedChanges.put(entry.dateKey, entry.change);
            }
            payload.put("changes", limitedChanges);

            String weekStartPending = preferences.getString(KEY_WEEK_START_PENDING, "");
            if (weekStartPending != null && !weekStartPending.isEmpty()) {
                payload.put("weekStart", readObject(weekStartPending));
            }
        } catch (JSONException ignored) {}

        return payload.toString();
    }

    private static String normalizeCustomLabel(String value) {
        if (value == null) {
            return "";
        }
        String normalized = value.trim().replaceAll("\\s+", " ");
        return normalized.length() > 20
                ? normalized.substring(0, 20)
                : normalized;
    }

    private static JSONObject readObject(String raw) {
        try {
            return new JSONObject(raw == null || raw.isEmpty() ? "{}" : raw);
        } catch (JSONException error) {
            return new JSONObject();
        }
    }

    private static final class PendingEntry {
        final String dateKey;
        final JSONObject change;
        final long updatedAt;

        PendingEntry(String dateKey, JSONObject change, long updatedAt) {
            this.dateKey = dateKey;
            this.change = change;
            this.updatedAt = updatedAt;
        }
    }
}
