package com.cat.attendance.widget;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.NumberPicker;
import android.widget.ScrollView;
import android.widget.TextView;

import java.time.YearMonth;
import java.util.Locale;

public class MonthPickerActivity extends Activity {
    public static final String EXTRA_YEAR = "visible_year";
    public static final String EXTRA_MONTH = "visible_month";

    private static final int MIN_YEAR = 1;
    private static final int MAX_YEAR = 9999;

    private int widgetId;
    private int selectedYear;
    private int selectedMonth;

    private TextView currentYearView;
    private NumberPicker yearPicker;
    private final TextView[] monthViews = new TextView[12];

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        widgetId = getIntent().getIntExtra(
                AppWidgetManager.EXTRA_APPWIDGET_ID,
                AppWidgetManager.INVALID_APPWIDGET_ID
        );

        if (widgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish();
            return;
        }

        YearMonth now = YearMonth.now();
        selectedYear = clampYear(
                getIntent().getIntExtra(EXTRA_YEAR, now.getYear())
        );
        selectedMonth = getIntent().getIntExtra(
                EXTRA_MONTH,
                now.getMonthValue()
        );

        if (selectedMonth < 1 || selectedMonth > 12) {
            selectedMonth = now.getMonthValue();
        }

        Window window = getWindow();
        if (window != null) {
            window.setDimAmount(0.50f);
            window.addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);
            window.setGravity(Gravity.BOTTOM);
        }

        setContentView(buildScrollableContent());

        if (window != null) {
            int maxHeight = Math.round(
                    getResources().getDisplayMetrics().heightPixels * 0.88f
            );
            window.setLayout(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    maxHeight
            );
        }
    }

    private View buildScrollableContent() {
        ScrollView scrollView = new ScrollView(this);
        scrollView.setFillViewport(false);
        scrollView.setClipToPadding(false);
        scrollView.setOverScrollMode(
                View.OVER_SCROLL_IF_CONTENT_SCROLLS
        );

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(18), dp(2), dp(18), dp(16));
        root.setBackground(roundRect(
                Color.WHITE,
                28,
                0,
                Color.TRANSPARENT
        ));

        scrollView.addView(
                root,
                new ScrollView.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                )
        );

        LinearLayout yearHeader = new LinearLayout(this);
        yearHeader.setOrientation(LinearLayout.HORIZONTAL);
        yearHeader.setGravity(Gravity.CENTER_VERTICAL);

        TextView yearLabel = text(
                "연도",
                13,
                0xFF64748B,
                true
        );

        yearLabel.setTranslationY(dp(3));

        TextView closeButton = text("×", 30, 0xFF64748B, false);
        closeButton.setGravity(Gravity.CENTER);
        closeButton.setTranslationY(-dp(3));
        closeButton.setClickable(true);
        closeButton.setFocusable(true);
        closeButton.setBackground(roundRect(
                0xFFF1F5F9,
                14,
                0,
                Color.TRANSPARENT
        ));
        closeButton.setOnClickListener(v -> {
            // 선택 중인 연도/월을 저장하지 않고 즉시 닫습니다.
            finish();
        });

        yearHeader.addView(
                yearLabel,
                new LinearLayout.LayoutParams(
                        0,
                        dp(40),
                        1f
                )
        );
        yearHeader.addView(
                closeButton,
                new LinearLayout.LayoutParams(dp(40), dp(40))
        );
        root.addView(yearHeader);

        LinearLayout yearControl = new LinearLayout(this);
        yearControl.setOrientation(LinearLayout.HORIZONTAL);
        yearControl.setGravity(Gravity.CENTER_VERTICAL);

        TextView previousButton = text("<", 26, 0xFF334155, true);
        previousButton.setGravity(Gravity.CENTER);
        previousButton.setBackground(roundRect(
                0xFFF8FAFC,
                14,
                1,
                0xFFE2E8F0
        ));
        previousButton.setOnClickListener(v -> changeYear(-1));

        currentYearView = text(
                String.valueOf(selectedYear),
                20,
                0xFFFFFFFF,
                true
        );
        currentYearView.setGravity(Gravity.CENTER);
        currentYearView.setClickable(true);
        currentYearView.setFocusable(true);
        currentYearView.setBackground(roundRect(
                0xFF2563EB,
                14,
                1,
                0xFF2563EB
        ));
        currentYearView.setOnClickListener(v -> toggleYearPicker());

        TextView nextButton = text(">", 26, 0xFF334155, true);
        nextButton.setGravity(Gravity.CENTER);
        nextButton.setBackground(roundRect(
                0xFFF8FAFC,
                14,
                1,
                0xFFE2E8F0
        ));
        nextButton.setOnClickListener(v -> changeYear(1));

        LinearLayout.LayoutParams arrowParams =
                new LinearLayout.LayoutParams(dp(58), dp(56));

        LinearLayout.LayoutParams yearParams =
                new LinearLayout.LayoutParams(
                        0,
                        dp(60),
                        1f
                );
        yearParams.leftMargin = dp(8);
        yearParams.rightMargin = dp(8);

        yearControl.addView(previousButton, arrowParams);
        yearControl.addView(currentYearView, yearParams);
        yearControl.addView(
                nextButton,
                new LinearLayout.LayoutParams(dp(58), dp(56))
        );

        LinearLayout.LayoutParams yearControlParams =
                new LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                );
        yearControlParams.topMargin = dp(3);
        root.addView(yearControl, yearControlParams);

        yearPicker = new NumberPicker(this);
        yearPicker.setMinValue(MIN_YEAR);
        yearPicker.setMaxValue(MAX_YEAR);
        yearPicker.setValue(selectedYear);
        yearPicker.setWrapSelectorWheel(false);
        yearPicker.setDescendantFocusability(
                NumberPicker.FOCUS_BLOCK_DESCENDANTS
        );
        yearPicker.setVisibility(View.GONE);
        yearPicker.setOnValueChangedListener(
                (picker, oldValue, newValue) -> {
                    selectedYear = newValue;
                    currentYearView.setText(
                            String.valueOf(selectedYear)
                    );
                    updateMonthStyles();
                }
        );

        LinearLayout.LayoutParams pickerParams =
                new LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        dp(150)
                );
        pickerParams.topMargin = dp(8);
        root.addView(yearPicker, pickerParams);

        TextView monthLabel = text(
                "월",
                13,
                0xFF64748B,
                true
        );
        LinearLayout.LayoutParams monthLabelParams =
                new LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.WRAP_CONTENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                );
        monthLabelParams.topMargin = dp(8);
        root.addView(monthLabel, monthLabelParams);

        LinearLayout monthGrid = new LinearLayout(this);
        monthGrid.setOrientation(LinearLayout.VERTICAL);

        LinearLayout.LayoutParams gridParams =
                new LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                );
        gridParams.topMargin = dp(7);
        root.addView(monthGrid, gridParams);

        for (int rowIndex = 0; rowIndex < 3; rowIndex++) {
            LinearLayout row = new LinearLayout(this);
            row.setOrientation(LinearLayout.HORIZONTAL);
            row.setWeightSum(4f);

            LinearLayout.LayoutParams rowParams =
                    new LinearLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            dp(47)
                    );
            if (rowIndex > 0) {
                rowParams.topMargin = dp(7);
            }
            monthGrid.addView(row, rowParams);

            for (int column = 0; column < 4; column++) {
                int month = rowIndex * 4 + column + 1;
                final int targetMonth = month;

                TextView button = text(
                        String.format(Locale.KOREA, "%d월", month),
                        14,
                        0xFF334155,
                        true
                );
                button.setGravity(Gravity.CENTER);
                button.setOnClickListener(v -> {
                    selectedMonth = targetMonth;

                    // 월을 눌렀을 때만 실제 위젯 달력에 반영합니다.
                    WidgetDataStore.setVisibleMonth(
                            this,
                            widgetId,
                            selectedYear,
                            selectedMonth
                    );
                    CatCalendarWidgetProvider.refreshAll(this);
                    finish();
                });

                LinearLayout.LayoutParams params =
                        new LinearLayout.LayoutParams(
                                0,
                                ViewGroup.LayoutParams.MATCH_PARENT,
                                1f
                        );
                int gap = dp(3);
                params.leftMargin = column == 0 ? 0 : gap;
                params.rightMargin = column == 3 ? 0 : gap;
                row.addView(button, params);
                monthViews[month - 1] = button;
            }
        }

        updateMonthStyles();
        return scrollView;
    }

    private void toggleYearPicker() {
        boolean willShow =
                yearPicker.getVisibility() != View.VISIBLE;

        if (willShow) {
            yearPicker.setValue(selectedYear);
            yearPicker.setVisibility(View.VISIBLE);
        } else {
            yearPicker.setVisibility(View.GONE);
        }
    }

    private void changeYear(int direction) {
        int next = clampYear(selectedYear + direction);

        if (next == selectedYear) {
            return;
        }

        selectedYear = next;
        currentYearView.setText(String.valueOf(selectedYear));

        if (yearPicker.getVisibility() == View.VISIBLE) {
            yearPicker.setValue(selectedYear);
        }

        updateMonthStyles();
    }

    private int clampYear(int year) {
        return Math.max(MIN_YEAR, Math.min(MAX_YEAR, year));
    }

    private void updateMonthStyles() {
        for (int index = 0; index < monthViews.length; index++) {
            TextView view = monthViews[index];
            if (view == null) {
                continue;
            }

            int month = index + 1;
            boolean selected = month == selectedMonth;

            view.setTextColor(
                    selected ? 0xFF1D4ED8 : 0xFF334155
            );
            view.setBackground(roundRect(
                    selected ? 0xFFEFF6FF : 0xFFF8FAFC,
                    12,
                    selected ? 2 : 1,
                    selected ? 0xFF60A5FA : 0xFFE2E8F0
            ));
        }
    }

    private TextView text(
            String value,
            int sizeSp,
            int color,
            boolean bold
    ) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(sizeSp);
        view.setTextColor(color);

        if (bold) {
            view.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        }
        return view;
    }

    private GradientDrawable roundRect(
            int fillColor,
            int radiusDp,
            int strokeDp,
            int strokeColor
    ) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(fillColor);
        drawable.setCornerRadius(dp(radiusDp));

        if (strokeDp > 0) {
            drawable.setStroke(dp(strokeDp), strokeColor);
        }
        return drawable;
    }

    private int dp(int value) {
        return Math.round(
                value * getResources().getDisplayMetrics().density
        );
    }
}
