package com.cat.attendance.widget;

import java.util.HashMap;
import java.util.Map;

public final class WorkTypes {
    public static final String CUSTOM_ID = "custom";
    public static final String HALF_ANNUAL_LEAVE_ID = "halfAnnualLeave";
    public static final String EARLY_LEAVE_ID = "earlyLeave";

    public static final String[] IDS = {
            "day", "dayOvertime", "dayHoliday", "dayHolidayOvertime", HALF_ANNUAL_LEAVE_ID, "annualLeave", EARLY_LEAVE_ID,
            "night", "nightOvertime", "nightHoliday", "nightHolidayOvertime"
    };
    public static final String[] LABELS = {
            "주간", "주간잔업", "주간특근", "주간특근잔업", "반차", "연차", "조퇴",
            "야간", "야간잔업", "야간특근", "야간특근잔업"
    };

    private static final Map<String, String> SHORT_LABELS = new HashMap<>();
    private static final Map<String, Integer> BADGES = new HashMap<>();
    private static final Map<String, Integer> DOT_COLORS = new HashMap<>();
    static {
        SHORT_LABELS.put("day", "주간");
        SHORT_LABELS.put("night", "야간");
        SHORT_LABELS.put("dayOvertime", "주잔");
        SHORT_LABELS.put("nightOvertime", "야잔");
        SHORT_LABELS.put("dayHoliday", "주특");
        SHORT_LABELS.put("nightHoliday", "야특");
        SHORT_LABELS.put("dayHolidayOvertime", "주특잔");
        SHORT_LABELS.put("nightHolidayOvertime", "야특잔");
        SHORT_LABELS.put(HALF_ANNUAL_LEAVE_ID, "반차");
        SHORT_LABELS.put("annualLeave", "연차");
        SHORT_LABELS.put(EARLY_LEAVE_ID, "조퇴");
        BADGES.put("day", R.drawable.badge_day);
        BADGES.put("night", R.drawable.badge_night);
        BADGES.put("dayOvertime", R.drawable.badge_day_overtime);
        BADGES.put("nightOvertime", R.drawable.badge_night_overtime);
        BADGES.put("dayHoliday", R.drawable.badge_day_holiday);
        BADGES.put("nightHoliday", R.drawable.badge_night_holiday);
        BADGES.put("dayHolidayOvertime", R.drawable.badge_day_holiday_overtime);
        BADGES.put("nightHolidayOvertime", R.drawable.badge_night_holiday_overtime);
        BADGES.put(HALF_ANNUAL_LEAVE_ID, R.drawable.badge_annual_leave);
        BADGES.put("annualLeave", R.drawable.badge_annual_leave);
        BADGES.put(EARLY_LEAVE_ID, R.drawable.badge_annual_leave);
        BADGES.put(CUSTOM_ID, R.drawable.badge_custom);
        DOT_COLORS.put("day", 0xFF3B82F6);
        DOT_COLORS.put("dayOvertime", 0xFF06B6D4);
        DOT_COLORS.put("dayHoliday", 0xFFF59E0B);
        DOT_COLORS.put("dayHolidayOvertime", 0xFFF97316);
        DOT_COLORS.put(HALF_ANNUAL_LEAVE_ID, 0xFF10B981);
        DOT_COLORS.put("annualLeave", 0xFF10B981);
        DOT_COLORS.put(EARLY_LEAVE_ID, 0xFFF59E0B);
        DOT_COLORS.put("night", 0xFF6366F1);
        DOT_COLORS.put("nightOvertime", 0xFF8B5CF6);
        DOT_COLORS.put("nightHoliday", 0xFFEC4899);
        DOT_COLORS.put("nightHolidayOvertime", 0xFFDB2777);
        DOT_COLORS.put(CUSTOM_ID, 0xFF64748B);
    }
    private WorkTypes() {}

    public static String shortLabel(String id) {
        return shortLabel(id, "");
    }

    public static String shortLabel(String id, String customLabel) {
        if (CUSTOM_ID.equals(id)) {
            String label = customLabel == null ? "" : customLabel.trim();
            if (label.length() > 5) {
                return label.substring(0, 5);
            }
            return label;
        }
        return SHORT_LABELS.getOrDefault(id, "");
    }
    public static int badgeDrawable(String id) {
        return BADGES.getOrDefault(id, R.drawable.badge_day);
    }

    public static int dotColor(String id) {
        return DOT_COLORS.getOrDefault(id, 0xFF64748B);
    }
}
