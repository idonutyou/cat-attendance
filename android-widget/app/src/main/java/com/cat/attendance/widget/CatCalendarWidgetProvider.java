package com.cat.attendance.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.json.JSONObject;

public class CatCalendarWidgetProvider extends AppWidgetProvider {
    public static final String ACTION_PREVIOUS_MONTH = "com.cat.attendance.widget.PREVIOUS_MONTH";
    public static final String ACTION_NEXT_MONTH = "com.cat.attendance.widget.NEXT_MONTH";
    public static final String ACTION_CURRENT_MONTH = "com.cat.attendance.widget.CURRENT_MONTH";
    public static final String ACTION_TOGGLE_WEEK_START = "com.cat.attendance.widget.TOGGLE_WEEK_START";

    private static final int[] ROW_IDS = {
            R.id.calendar_row_0, R.id.calendar_row_1, R.id.calendar_row_2,
            R.id.calendar_row_3, R.id.calendar_row_4, R.id.calendar_row_5
    };
    private static final int[] WEEKDAY_IDS = {
            R.id.weekday0, R.id.weekday1, R.id.weekday2, R.id.weekday3,
            R.id.weekday4, R.id.weekday5, R.id.weekday6
    };
    private static final DateTimeFormatter DATE_KEY = DateTimeFormatter.ISO_LOCAL_DATE;

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, manager, appWidgetId);
        }
    }

    @Override
    public void onDeleted(Context context, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            WidgetDataStore.deleteWidgetState(context, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        int appWidgetId = intent.getIntExtra(
                AppWidgetManager.EXTRA_APPWIDGET_ID,
                AppWidgetManager.INVALID_APPWIDGET_ID
        );

        if (ACTION_TOGGLE_WEEK_START.equals(action)) {
            WidgetDataStore.toggleWeekStart(context);
            refreshAll(context);
            return;
        }

        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            return;
        }

        if (ACTION_CURRENT_MONTH.equals(action)) {
            YearMonth now = YearMonth.now();
            WidgetDataStore.setVisibleMonth(
                    context,
                    appWidgetId,
                    now.getYear(),
                    now.getMonthValue()
            );
            updateWidget(
                    context,
                    AppWidgetManager.getInstance(context),
                    appWidgetId
            );
            return;
        }

        if (ACTION_PREVIOUS_MONTH.equals(action) || ACTION_NEXT_MONTH.equals(action)) {
            YearMonth visible = getVisibleMonth(context, appWidgetId);
            visible = ACTION_PREVIOUS_MONTH.equals(action)
                    ? visible.minusMonths(1)
                    : visible.plusMonths(1);
            WidgetDataStore.setVisibleMonth(
                    context,
                    appWidgetId,
                    visible.getYear(),
                    visible.getMonthValue()
            );
            updateWidget(
                    context,
                    AppWidgetManager.getInstance(context),
                    appWidgetId
            );
        }
    }

    public static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName provider = new ComponentName(context, CatCalendarWidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(provider);
        for (int id : ids) {
            updateWidget(context, manager, id);
        }
    }

    private static YearMonth getVisibleMonth(Context context, int widgetId) {
        int year = WidgetDataStore.getYear(context, widgetId);
        int month = WidgetDataStore.getMonth(context, widgetId);
        if (year <= 0 || month < 1 || month > 12) {
            YearMonth now = YearMonth.now();
            WidgetDataStore.setVisibleMonth(context, widgetId, now.getYear(), now.getMonthValue());
            return now;
        }
        return YearMonth.of(year, month);
    }

    private static void updateWidget(Context context, AppWidgetManager manager, int widgetId) {
        WidgetAppBridge.prepareCatLauncher(context);
        YearMonth visibleMonth = getVisibleMonth(context, widgetId);
        boolean startsMonday = WidgetDataStore.startsOnMonday(context);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_calendar);

        views.setTextViewText(
                R.id.month_title,
                String.format(Locale.KOREA, "%d년 %d월", visibleMonth.getYear(), visibleMonth.getMonthValue())
        );
        views.setTextViewText(R.id.week_start_button, startsMonday ? "월 >" : "일 >");

        String[] weekdays = startsMonday
                ? new String[]{"월", "화", "수", "목", "금", "토", "일"}
                : new String[]{"일", "월", "화", "수", "목", "금", "토"};

        for (int index = 0; index < WEEKDAY_IDS.length; index++) {
            views.setTextViewText(WEEKDAY_IDS[index], weekdays[index]);
            int color = "토".equals(weekdays[index])
                    ? Color.rgb(37, 131, 197)
                    : "일".equals(weekdays[index])
                    ? Color.rgb(227, 72, 80)
                    : Color.rgb(82, 82, 91);
            views.setTextColor(WEEKDAY_IDS[index], color);
        }

        views.setOnClickPendingIntent(
                R.id.week_start_button,
                broadcastIntent(context, ACTION_TOGGLE_WEEK_START, widgetId, 10)
        );
        views.setOnClickPendingIntent(
                R.id.current_month_button,
                broadcastIntent(context, ACTION_CURRENT_MONTH, widgetId, 15)
        );
        views.setOnClickPendingIntent(
                R.id.prev_month_button,
                broadcastIntent(context, ACTION_PREVIOUS_MONTH, widgetId, 20)
        );
        views.setOnClickPendingIntent(
                R.id.next_month_button,
                broadcastIntent(context, ACTION_NEXT_MONTH, widgetId, 30)
        );
        views.setOnClickPendingIntent(
                R.id.month_title,
                openMonthPickerIntent(context, widgetId, visibleMonth)
        );
        views.setOnClickPendingIntent(
                R.id.open_cat_button,
                openCatIntent(context, widgetId)
        );

        LocalDate first = visibleMonth.atDay(1);
        int offset = startsMonday
                ? first.getDayOfWeek().getValue() - 1
                : first.getDayOfWeek().getValue() % 7;
        LocalDate start = first.minusDays(offset);
        LocalDate today = LocalDate.now();
        Set<LocalDate> nightWeekStarts = buildNightWeekStarts(
                context,
                start,
                start.plusDays(41),
                startsMonday
        );

        for (int row = 0; row < ROW_IDS.length; row++) {
            views.removeAllViews(ROW_IDS[row]);
            for (int column = 0; column < 7; column++) {
                LocalDate date = start.plusDays(row * 7L + column);
                RemoteViews cell = buildDayCell(
                        context,
                        widgetId,
                        visibleMonth,
                        date,
                        today,
                        nightWeekStarts.contains(getWeekStart(date, startsMonday))
                );
                views.addView(ROW_IDS[row], cell);
            }
        }

        manager.updateAppWidget(widgetId, views);
    }

    private static RemoteViews buildDayCell(
            Context context,
            int widgetId,
            YearMonth visibleMonth,
            LocalDate date,
            LocalDate today,
            boolean isNightWeek
    ) {
        RemoteViews cell = new RemoteViews(context.getPackageName(), R.layout.widget_day_cell);
        boolean inMonth = YearMonth.from(date).equals(visibleMonth);
        boolean isToday = date.equals(today);
        String dateKey = DATE_KEY.format(date);
        String workType = WidgetDataStore.getWorkType(context, dateKey);
        String customLabel = WidgetDataStore.getCustomLabel(context, dateKey);
        String holiday = HolidayStore.get(context, dateKey);

        cell.setTextViewText(R.id.day_number, Integer.toString(date.getDayOfMonth()));
        int backgroundResource;
        if (isToday) {
            backgroundResource = isNightWeek
                    ? R.drawable.widget_day_today_night_week_bg
                    : R.drawable.widget_day_today_bg;
        } else {
            backgroundResource = isNightWeek
                    ? R.drawable.widget_day_night_week_bg
                    : R.drawable.widget_day_bg;
        }
        cell.setInt(
                R.id.day_root,
                "setBackgroundResource",
                backgroundResource
        );

        int dayColor;
        if (!inMonth) {
            dayColor = Color.rgb(203, 208, 214);
        } else if (!holiday.isEmpty() || date.getDayOfWeek() == DayOfWeek.SUNDAY) {
            dayColor = Color.rgb(227, 72, 80);
        } else if (date.getDayOfWeek() == DayOfWeek.SATURDAY) {
            dayColor = Color.rgb(37, 131, 197);
        } else {
            dayColor = Color.rgb(23, 23, 23);
        }
        cell.setTextColor(R.id.day_number, dayColor);

        if (inMonth && workType != null && !workType.isEmpty()) {
            cell.setViewVisibility(R.id.work_badge, View.VISIBLE);
            cell.setTextViewText(
                    R.id.work_badge,
                    WorkTypes.shortLabel(workType, customLabel)
            );
            cell.setInt(
                    R.id.work_badge,
                    "setBackgroundResource",
                    WorkTypes.badgeDrawable(workType)
            );
        } else {
            cell.setViewVisibility(R.id.work_badge, View.GONE);
        }

        if (inMonth && !holiday.isEmpty()) {
            cell.setViewVisibility(R.id.holiday_badge, View.VISIBLE);
            cell.setTextViewText(R.id.holiday_badge, holiday);
            cell.setInt(
                    R.id.holiday_badge,
                    "setBackgroundResource",
                    R.drawable.badge_holiday
            );
        } else {
            cell.setViewVisibility(R.id.holiday_badge, View.GONE);
        }

        if (inMonth) {
            Intent intent = new Intent(context, WorkTypeActivity.class)
                    .putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId)
                    .putExtra(WorkTypeActivity.EXTRA_DATE_KEY, dateKey)
                    .setData(Uri.parse("catwidget://date/" + widgetId + "/" + dateKey));
            PendingIntent pending = PendingIntent.getActivity(
                    context,
                    Math.abs((widgetId + ":" + dateKey).hashCode()),
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            cell.setOnClickPendingIntent(R.id.day_root, pending);
        }

        return cell;
    }

    private static Set<LocalDate> buildNightWeekStarts(
            Context context,
            LocalDate rangeStart,
            LocalDate rangeEnd,
            boolean startsMonday
    ) {
        JSONObject records = WidgetDataStore.getRecordsSnapshot(context);
        Map<LocalDate, ShiftObservation> explicitWeeks = new HashMap<>();
        LocalDate firstExplicitWeek = null;
        Iterator<String> keys = records.keys();

        while (keys.hasNext()) {
            String dateKey = keys.next();
            Object rawRecord = records.opt(dateKey);
            String workType = "";

            if (rawRecord instanceof String) {
                workType = (String) rawRecord;
            } else if (rawRecord instanceof JSONObject) {
                workType = ((JSONObject) rawRecord).optString("type", "");
            }

            String shiftKind = getShiftKind(workType);
            if (shiftKind.isEmpty()) {
                continue;
            }

            LocalDate recordDate;
            try {
                recordDate = LocalDate.parse(dateKey, DATE_KEY);
            } catch (Exception ignored) {
                continue;
            }

            LocalDate weekStart = getWeekStart(recordDate, startsMonday);
            ShiftObservation previous = explicitWeeks.get(weekStart);

            // 같은 주 안에서 주간/야간 기록이 섞이면 뒤 날짜의 설정을
            // 사용자의 최신 주간 전환 의도로 봅니다.
            if (previous == null || recordDate.isAfter(previous.recordDate)) {
                explicitWeeks.put(
                        weekStart,
                        new ShiftObservation(recordDate, shiftKind)
                );
            }

            if (firstExplicitWeek == null || weekStart.isBefore(firstExplicitWeek)) {
                firstExplicitWeek = weekStart;
            }
        }

        Set<LocalDate> nightWeeks = new HashSet<>();
        if (firstExplicitWeek == null) {
            return nightWeeks;
        }

        LocalDate firstVisibleWeek = getWeekStart(rangeStart, startsMonday);
        LocalDate lastVisibleWeek = getWeekStart(rangeEnd, startsMonday);
        boolean cycleActive = false;
        LocalDate nightAnchor = null;

        for (
                LocalDate week = firstExplicitWeek;
                !week.isAfter(lastVisibleWeek);
                week = week.plusWeeks(1)
        ) {
            boolean predictedNight = isPredictedNightWeek(
                    cycleActive,
                    nightAnchor,
                    week
            );
            ShiftObservation explicit = explicitWeeks.get(week);

            if (explicit != null && "night".equals(explicit.shiftKind)) {
                if (!cycleActive || !predictedNight) {
                    cycleActive = true;
                    nightAnchor = week;
                }
            } else if (
                    explicit != null &&
                    "day".equals(explicit.shiftKind) &&
                    predictedNight
            ) {
                // 예상 야간주 중간에 실제 주간 기록이 나오면 자동 2주 교대
                // 예측을 멈추고 다음 실제 야간 기록 전까지 주간으로 둡니다.
                cycleActive = false;
                nightAnchor = null;
            }

            predictedNight = isPredictedNightWeek(
                    cycleActive,
                    nightAnchor,
                    week
            );

            if (predictedNight && !week.isBefore(firstVisibleWeek)) {
                nightWeeks.add(week);
            }
        }

        return nightWeeks;
    }

    private static boolean isPredictedNightWeek(
            boolean cycleActive,
            LocalDate nightAnchor,
            LocalDate week
    ) {
        if (!cycleActive || nightAnchor == null) {
            return false;
        }

        long elapsedWeeks = ChronoUnit.WEEKS.between(nightAnchor, week);
        return elapsedWeeks >= 0 && elapsedWeeks % 4 < 2;
    }

    private static LocalDate getWeekStart(
            LocalDate date,
            boolean startsMonday
    ) {
        int offset = startsMonday
                ? date.getDayOfWeek().getValue() - 1
                : date.getDayOfWeek().getValue() % 7;
        return date.minusDays(offset);
    }

    private static String getShiftKind(String workType) {
        switch (workType) {
            case "night":
            case "nightOvertime":
            case "nightHoliday":
            case "nightHolidayOvertime":
                return "night";
            case "day":
            case "dayOvertime":
            case "dayHoliday":
            case "dayHolidayOvertime":
                return "day";
            default:
                return "";
        }
    }

    private static final class ShiftObservation {
        final LocalDate recordDate;
        final String shiftKind;

        ShiftObservation(LocalDate recordDate, String shiftKind) {
            this.recordDate = recordDate;
            this.shiftKind = shiftKind;
        }
    }

    private static PendingIntent broadcastIntent(
            Context context,
            String action,
            int widgetId,
            int requestBase
    ) {
        Intent intent = new Intent(context, CatCalendarWidgetProvider.class)
                .setAction(action)
                .putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId)
                .setData(Uri.parse("catwidget://action/" + action + "/" + widgetId));
        return PendingIntent.getBroadcast(
                context,
                requestBase + widgetId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private static PendingIntent openMonthPickerIntent(
            Context context,
            int widgetId,
            YearMonth visibleMonth
    ) {
        Intent intent = new Intent(context, MonthPickerActivity.class)
                .putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId)
                .putExtra(
                        MonthPickerActivity.EXTRA_YEAR,
                        visibleMonth.getYear()
                )
                .putExtra(
                        MonthPickerActivity.EXTRA_MONTH,
                        visibleMonth.getMonthValue()
                )
                .setData(
                        Uri.parse(
                                "catwidget://month-picker/" +
                                widgetId + "/" +
                                visibleMonth.getYear() + "/" +
                                visibleMonth.getMonthValue()
                        )
                );

        return PendingIntent.getActivity(
                context,
                35000 + widgetId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT |
                        PendingIntent.FLAG_IMMUTABLE
        );
    }

    private static PendingIntent openCatIntent(Context context, int widgetId) {
        Intent intent = new Intent(context, OpenCatActivity.class)
                .putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId)
                .setData(Uri.parse("catwidget://open/" + widgetId));
        return PendingIntent.getActivity(
                context,
                40000 + widgetId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }
}
