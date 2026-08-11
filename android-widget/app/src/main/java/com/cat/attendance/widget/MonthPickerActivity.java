package com.cat.attendance.widget;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.widget.AbsListView;
import android.widget.BaseAdapter;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.TextView;

import java.time.YearMonth;
import java.util.Locale;

public class MonthPickerActivity extends Activity {
    public static final String EXTRA_YEAR = "visible_year";
    public static final String EXTRA_MONTH = "visible_month";

    private static final int MIN_YEAR = 1;
    private static final int MAX_YEAR = 9999;

    private int widgetId;
    private int sourceYear;
    private int sourceMonth;
    private int selectedYear;

    private TextView currentYearView;
    private ListView yearList;
    private YearAdapter yearAdapter;
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
        sourceYear = clampYear(
                getIntent().getIntExtra(EXTRA_YEAR, now.getYear())
        );
        sourceMonth = getIntent().getIntExtra(
                EXTRA_MONTH,
                now.getMonthValue()
        );

        if (sourceMonth < 1 || sourceMonth > 12) {
            sourceMonth = now.getMonthValue();
        }

        selectedYear = sourceYear;

        Window window = getWindow();
        if (window != null) {
            window.setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
            window.setDimAmount(0.50f);
            window.addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);
            window.setGravity(Gravity.FILL);
        }

        setFinishOnTouchOutside(false);
        setContentView(buildOverlay());

        if (window != null) {
            window.setLayout(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
            );
        }
    }

    private View buildOverlay() {
        FrameLayout overlay = new FrameLayout(this);
        overlay.setBackgroundColor(Color.TRANSPARENT);
        overlay.setClickable(true);
        overlay.setOnClickListener(v -> finish());

        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(dp(16), dp(10), dp(16), dp(18));
        card.setBackground(roundRect(
                Color.WHITE,
                28,
                0,
                Color.TRANSPARENT
        ));
        card.setClickable(true);
        card.setOnClickListener(v -> {
            // 카드 내부 빈 공간은 닫기 처리하지 않습니다.
        });

        FrameLayout.LayoutParams cardParams =
                new FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                );
        cardParams.leftMargin = dp(14);
        cardParams.rightMargin = dp(14);
        cardParams.gravity = Gravity.CENTER;
        overlay.addView(card, cardParams);

        LinearLayout closeRow = new LinearLayout(this);
        closeRow.setOrientation(LinearLayout.HORIZONTAL);
        closeRow.setGravity(Gravity.CENTER_VERTICAL);

        View spacer = new View(this);
        closeRow.addView(
                spacer,
                new LinearLayout.LayoutParams(
                        0,
                        dp(44),
                        1f
                )
        );

        TextView closeButton = text("×", 31, 0xFF64748B, false);
        closeButton.setGravity(Gravity.CENTER);
        closeButton.setBackground(roundRect(
                0xFFF1F5F9,
                14,
                0,
                Color.TRANSPARENT
        ));
        closeButton.setOnClickListener(v -> finish());
        closeRow.addView(
                closeButton,
                new LinearLayout.LayoutParams(dp(44), dp(44))
        );
        card.addView(closeRow);

        LinearLayout yearControl = new LinearLayout(this);
        yearControl.setOrientation(LinearLayout.HORIZONTAL);
        yearControl.setGravity(Gravity.CENTER_VERTICAL);

        TextView previousButton = text("‹", 30, 0xFF475569, true);
        previousButton.setGravity(Gravity.CENTER);
        previousButton.setBackground(roundRect(
                0xFFF8FAFC,
                14,
                1,
                0xFFE2E8F0
        ));
        previousButton.setOnClickListener(v -> changeYear(-1));

        currentYearView = text(
                String.format(Locale.KOREA, "%d년", selectedYear),
                21,
                0xFF2563EB,
                true
        );
        currentYearView.setGravity(Gravity.CENTER);
        currentYearView.setClickable(true);
        currentYearView.setFocusable(true);
        currentYearView.setBackground(roundRect(
                0xFFF8FAFC,
                14,
                2,
                0xFF60A5FA
        ));
        currentYearView.setOnClickListener(v -> toggleYearList());

        TextView nextButton = text("›", 30, 0xFF475569, true);
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
        yearControlParams.topMargin = dp(6);
        card.addView(yearControl, yearControlParams);

        yearList = new ListView(this);
        yearList.setVisibility(View.GONE);
        yearList.setDivider(new ColorDrawable(0xFFE2E8F0));
        yearList.setDividerHeight(dp(1));
        yearList.setOverScrollMode(View.OVER_SCROLL_IF_CONTENT_SCROLLS);
        yearList.setVerticalScrollBarEnabled(true);
        yearList.setBackground(roundRect(
                Color.WHITE,
                14,
                1,
                0xFFE2E8F0
        ));

        yearAdapter = new YearAdapter();
        yearList.setAdapter(yearAdapter);
        yearList.setOnItemClickListener((parent, view, position, id) -> {
            selectedYear = position + MIN_YEAR;
            currentYearView.setText(
                    String.format(Locale.KOREA, "%d년", selectedYear)
            );
            yearAdapter.notifyDataSetChanged();
            yearList.setVisibility(View.GONE);
            updateMonthStyles();
        });

        LinearLayout.LayoutParams listParams =
                new LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        dp(276)
                );
        listParams.topMargin = dp(10);
        card.addView(yearList, listParams);

        LinearLayout monthGrid = new LinearLayout(this);
        monthGrid.setOrientation(LinearLayout.VERTICAL);

        LinearLayout.LayoutParams gridParams =
                new LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                );
        gridParams.topMargin = dp(14);
        card.addView(monthGrid, gridParams);

        for (int rowIndex = 0; rowIndex < 4; rowIndex++) {
            LinearLayout row = new LinearLayout(this);
            row.setOrientation(LinearLayout.HORIZONTAL);
            row.setWeightSum(3f);

            LinearLayout.LayoutParams rowParams =
                    new LinearLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            dp(58)
                    );
            if (rowIndex > 0) {
                rowParams.topMargin = dp(8);
            }
            monthGrid.addView(row, rowParams);

            for (int column = 0; column < 3; column++) {
                int month = rowIndex * 3 + column + 1;
                final int targetMonth = month;

                TextView button = text(
                        String.format(Locale.KOREA, "%d월", month),
                        15,
                        0xFF334155,
                        true
                );
                button.setGravity(Gravity.CENTER);
                button.setOnClickListener(v -> {
                    WidgetDataStore.setVisibleMonth(
                            this,
                            widgetId,
                            selectedYear,
                            targetMonth
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
                int gap = dp(4);
                params.leftMargin = column == 0 ? 0 : gap;
                params.rightMargin = column == 2 ? 0 : gap;
                row.addView(button, params);
                monthViews[month - 1] = button;
            }
        }

        updateMonthStyles();
        return overlay;
    }

    private void toggleYearList() {
        boolean willShow = yearList.getVisibility() != View.VISIBLE;

        if (!willShow) {
            yearList.setVisibility(View.GONE);
            return;
        }

        yearAdapter.notifyDataSetChanged();
        yearList.setVisibility(View.VISIBLE);

        yearList.post(() -> {
            int selectedPosition = selectedYear - MIN_YEAR;
            int firstPosition = Math.max(0, selectedPosition - 2);
            yearList.setSelection(firstPosition);
        });
    }

    private void changeYear(int direction) {
        int next = clampYear(selectedYear + direction);

        if (next == selectedYear) {
            return;
        }

        selectedYear = next;
        currentYearView.setText(
                String.format(Locale.KOREA, "%d년", selectedYear)
        );
        yearAdapter.notifyDataSetChanged();

        if (yearList.getVisibility() == View.VISIBLE) {
            int selectedPosition = selectedYear - MIN_YEAR;
            yearList.setSelection(
                    Math.max(0, selectedPosition - 2)
            );
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
            boolean active =
                    selectedYear == sourceYear &&
                    month == sourceMonth;

            view.setTextColor(
                    active ? Color.WHITE : 0xFF334155
            );
            view.setBackground(roundRect(
                    active ? 0xFF2563EB : 0xFFF8FAFC,
                    12,
                    1,
                    active ? 0xFF2563EB : 0xFFE2E8F0
            ));
        }
    }

    private class YearAdapter extends BaseAdapter {
        @Override
        public int getCount() {
            return MAX_YEAR - MIN_YEAR + 1;
        }

        @Override
        public Object getItem(int position) {
            return position + MIN_YEAR;
        }

        @Override
        public long getItemId(int position) {
            return position + MIN_YEAR;
        }

        @Override
        public View getView(
                int position,
                View convertView,
                ViewGroup parent
        ) {
            TextView row;

            if (convertView instanceof TextView) {
                row = (TextView) convertView;
            } else {
                row = text("", 18, 0xFF475569, true);
                row.setGravity(Gravity.CENTER);
                row.setLayoutParams(
                        new AbsListView.LayoutParams(
                                ViewGroup.LayoutParams.MATCH_PARENT,
                                dp(55)
                        )
                );
            }

            int year = position + MIN_YEAR;
            boolean selected = year == selectedYear;

            row.setText(
                    String.format(Locale.KOREA, "%d년", year)
            );
            row.setTextColor(
                    selected ? Color.WHITE : 0xFF475569
            );
            row.setBackgroundColor(
                    selected ? 0xFF2563EB : Color.WHITE
            );

            return row;
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
