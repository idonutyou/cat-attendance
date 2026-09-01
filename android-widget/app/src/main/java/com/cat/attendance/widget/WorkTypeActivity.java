package com.cat.attendance.widget;

import android.app.Activity;
import android.app.Dialog;
import android.appwidget.AppWidgetManager;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.text.InputFilter;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.view.inputmethod.EditorInfo;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public class WorkTypeActivity extends Activity {
    public static final String EXTRA_DATE_KEY = "date_key";

    private String dateKey;
    private int widgetId;
    private LinearLayout customEditor;
    private EditText customInput;
    private ScrollView contentScrollView;
    private LinearLayout rootContent;
    private Window activityWindow;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        dateKey = getIntent().getStringExtra(EXTRA_DATE_KEY);
        widgetId = getIntent().getIntExtra(
                AppWidgetManager.EXTRA_APPWIDGET_ID,
                AppWidgetManager.INVALID_APPWIDGET_ID
        );

        if (dateKey == null || widgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish();
            return;
        }

        activityWindow = getWindow();
        if (activityWindow != null) {
            activityWindow.setDimAmount(0.50f);
            activityWindow.addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);
            activityWindow.setGravity(Gravity.BOTTOM);
            activityWindow.setSoftInputMode(
                    WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
            );
        }

        setContentView(buildContent());

        if (activityWindow != null) {
            activityWindow.setLayout(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
            );

            View decorView = activityWindow.getDecorView();
            decorView.setOnApplyWindowInsetsListener((view, insets) -> {
                updateWindowBounds();
                return insets;
            });
            decorView.post(this::updateWindowBounds);
            decorView.requestApplyInsets();
        }
    }

    private View buildContent() {
        contentScrollView = new ScrollView(this);
        contentScrollView.setFillViewport(false);
        contentScrollView.setClipToPadding(false);
        contentScrollView.setOverScrollMode(View.OVER_SCROLL_IF_CONTENT_SCROLLS);

        rootContent = new LinearLayout(this);
        rootContent.setOrientation(LinearLayout.VERTICAL);
        rootContent.setPadding(dp(16), dp(12), dp(16), dp(14));
        rootContent.setBackground(roundRect(Color.WHITE, 30, 0, Color.TRANSPARENT));
        contentScrollView.addView(
                rootContent,
                new ScrollView.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                )
        );

        LinearLayout root = rootContent;

        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setGravity(Gravity.CENTER_VERTICAL);

        LinearLayout titleBox = new LinearLayout(this);
        titleBox.setOrientation(LinearLayout.VERTICAL);
        titleBox.setLayoutParams(new LinearLayout.LayoutParams(
                0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f
        ));

        TextView title = text(formatDateTitle(), 25, 0xFF172033, true);
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        titleParams.topMargin = 0;
        titleBox.addView(title, titleParams);

        TextView close = text("×", 34, 0xFF64748B, false);
        close.setGravity(Gravity.CENTER);
        close.setBackground(roundRect(0xFFF1F5F9, 16, 0, Color.TRANSPARENT));
        close.setOnClickListener(v -> finish());
        header.addView(titleBox);
        header.addView(close, new LinearLayout.LayoutParams(dp(46), dp(46)));
        root.addView(header);

        LinearLayout grid = new LinearLayout(this);
        grid.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams gridParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        gridParams.topMargin = dp(14);
        root.addView(grid, gridParams);

        String currentType = WidgetDataStore.getWorkType(this, dateKey);
        String currentCustom = WidgetDataStore.getCustomLabel(this, dateKey);

        String[] ids = {
                "day", "dayOvertime", "dayHoliday", "dayHolidayOvertime", "annualLeave",
                "night", "nightOvertime", "nightHoliday", "nightHolidayOvertime", WorkTypes.CUSTOM_ID
        };
        String[] labels = {
                "주간", "주간잔업", "주간특근", "주간특근잔업", "연차 / 조퇴",
                "야간", "야간잔업", "야간특근", "야간특근잔업", "직접 입력"
        };

        for (int rowIndex = 0; rowIndex < 2; rowIndex++) {
            LinearLayout row = new LinearLayout(this);
            row.setOrientation(LinearLayout.HORIZONTAL);
            row.setWeightSum(5f);

            if (rowIndex == 1) {
                LinearLayout.LayoutParams rowParams = new LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                );
                rowParams.topMargin = dp(8);
                grid.addView(row, rowParams);
            } else {
                grid.addView(row);
            }

            for (int column = 0; column < 5; column++) {
                int index = rowIndex * 5 + column;
                String id = ids[index];
                String label = labels[index];
                boolean selected =
                        id.equals(currentType) ||
                        ("annualLeave".equals(id) &&
                                (WorkTypes.HALF_ANNUAL_LEAVE_ID.equals(currentType) ||
                                 WorkTypes.EARLY_LEAVE_ID.equals(currentType)));
                View tile = createWorkTypeTile(id, label, selected);
                LinearLayout.LayoutParams tileParams = new LinearLayout.LayoutParams(
                        0, dp(88), 1f
                );
                int gap = dp(4);
                tileParams.leftMargin = column == 0 ? 0 : gap;
                tileParams.rightMargin = column == 4 ? 0 : gap;
                row.addView(tile, tileParams);
            }
        }

        customEditor = buildCustomEditor(currentCustom);
        LinearLayout.LayoutParams editorParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        editorParams.topMargin = dp(10);
        root.addView(customEditor, editorParams);
        customEditor.setVisibility(WorkTypes.CUSTOM_ID.equals(currentType) ? View.VISIBLE : View.GONE);

        if (!currentType.isEmpty()) {
            TextView delete = text("이 날짜의 기록 삭제", 14, 0xFFDC2626, true);
            delete.setGravity(Gravity.CENTER);
            delete.setBackground(roundRect(0xFFFFF7F7, 14, 1, 0xFFFECACA));
            delete.setOnClickListener(v -> {
                WidgetDataStore.setWorkType(this, dateKey, "");
                CatCalendarWidgetProvider.refreshAll(this);
                WidgetCloudSync.pushCurrentStateAsync(this);
                finish();
                overridePendingTransition(0, 0);
            });
            LinearLayout.LayoutParams deleteParams = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, dp(44)
            );
            deleteParams.topMargin = dp(10);
            root.addView(delete, deleteParams);
        }

        return contentScrollView;
    }

    private View createWorkTypeTile(String id, String label, boolean selected) {
        LinearLayout tile = new LinearLayout(this);
        tile.setOrientation(LinearLayout.VERTICAL);
        tile.setGravity(Gravity.CENTER);
        tile.setPadding(dp(3), dp(7), dp(3), dp(6));
        tile.setBackground(roundRect(
                Color.WHITE,
                18,
                selected ? 2 : 1,
                selected ? 0xFF2563EB : 0xFFE2E8F0
        ));

        TextView dot = text("●", 19, WorkTypes.dotColor(id), true);
        dot.setGravity(Gravity.CENTER);
        tile.addView(dot);

        TextView name = text(label, 11, 0xFF334155, true);
        name.setGravity(Gravity.CENTER);
        name.setMaxLines(2);
        LinearLayout.LayoutParams nameParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        nameParams.topMargin = dp(2);
        tile.addView(name, nameParams);

        tile.setOnClickListener(v -> {
            if (WorkTypes.CUSTOM_ID.equals(id)) {
                customEditor.setVisibility(View.VISIBLE);
                customInput.requestFocus();
                customInput.setSelection(customInput.getText().length());
                rootContent.post(this::updateWindowBounds);
                return;
            }

            if ("annualLeave".equals(id)) {
                showAnnualLeaveChoiceDialog();
                return;
            }

            saveWorkTypeAndFinish(id);
        });

        return tile;
    }

    private void showAnnualLeaveChoiceDialog() {
        Dialog dialog = new Dialog(this);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setCanceledOnTouchOutside(true);
        dialog.setCancelable(true);

        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.HORIZONTAL);
        panel.setGravity(Gravity.CENTER);
        panel.setPadding(dp(12), dp(12), dp(12), dp(12));
        panel.setBackground(roundRect(Color.WHITE, 22, 0, Color.TRANSPARENT));

        String currentType = WidgetDataStore.getWorkType(this, dateKey);

        TextView halfDay = createLeaveChoiceButton(
                "반차",
                WorkTypes.HALF_ANNUAL_LEAVE_ID.equals(currentType)
        );
        TextView fullDay = createLeaveChoiceButton(
                "연차",
                "annualLeave".equals(currentType)
        );
        TextView earlyLeave = createLeaveChoiceButton(
                "조퇴",
                WorkTypes.EARLY_LEAVE_ID.equals(currentType)
        );

        LinearLayout.LayoutParams halfParams =
                new LinearLayout.LayoutParams(0, dp(62), 1f);
        halfParams.rightMargin = dp(4);
        panel.addView(halfDay, halfParams);

        LinearLayout.LayoutParams fullParams =
                new LinearLayout.LayoutParams(0, dp(62), 1f);
        fullParams.leftMargin = dp(4);
        fullParams.rightMargin = dp(4);
        panel.addView(fullDay, fullParams);

        LinearLayout.LayoutParams earlyParams =
                new LinearLayout.LayoutParams(0, dp(62), 1f);
        earlyParams.leftMargin = dp(4);
        panel.addView(earlyLeave, earlyParams);

        halfDay.setOnClickListener(v -> {
            dialog.dismiss();
            saveWorkTypeAndFinish(WorkTypes.HALF_ANNUAL_LEAVE_ID);
        });

        fullDay.setOnClickListener(v -> {
            dialog.dismiss();
            saveWorkTypeAndFinish("annualLeave");
        });

        earlyLeave.setOnClickListener(v -> {
            dialog.dismiss();
            saveWorkTypeAndFinish(WorkTypes.EARLY_LEAVE_ID);
        });

        dialog.setContentView(panel);
        dialog.show();

        Window dialogWindow = dialog.getWindow();
        if (dialogWindow != null) {
            dialogWindow.setBackgroundDrawable(
                    new ColorDrawable(Color.TRANSPARENT)
            );
            dialogWindow.setDimAmount(0.18f);
            dialogWindow.addFlags(
                    WindowManager.LayoutParams.FLAG_DIM_BEHIND
            );
            dialogWindow.setGravity(Gravity.CENTER);

            int displayWidth =
                    getResources().getDisplayMetrics().widthPixels;
            int width = Math.min(displayWidth - dp(40), dp(340));

            dialogWindow.setLayout(
                    Math.max(dp(280), width),
                    ViewGroup.LayoutParams.WRAP_CONTENT
            );
        }
    }

    private TextView createLeaveChoiceButton(String label, boolean selected) {
        TextView button = text(
                label,
                16,
                selected ? Color.WHITE : 0xFF334155,
                true
        );
        button.setGravity(Gravity.CENTER);
        button.setBackground(roundRect(
                selected ? 0xFF10B981 : 0xFFF8FAFC,
                16,
                1,
                selected ? 0xFF10B981 : 0xFFD8E0EA
        ));
        return button;
    }

    private void saveWorkTypeAndFinish(String id) {
        WidgetDataStore.setWorkType(this, dateKey, id);
        CatCalendarWidgetProvider.refreshAll(this);
        WidgetCloudSync.pushCurrentStateAsync(this);
        finish();
        overridePendingTransition(0, 0);
    }

    private LinearLayout buildCustomEditor(String initialValue) {
        LinearLayout editor = new LinearLayout(this);
        editor.setOrientation(LinearLayout.VERTICAL);
        editor.setPadding(dp(14), dp(12), dp(14), dp(12));
        editor.setBackground(roundRect(0xFFF8FAFC, 16, 1, 0xFFE2E8F0));

        TextView label = text("근무 내용 직접 입력", 13, 0xFF334155, true);
        editor.addView(label);

        LinearLayout control = new LinearLayout(this);
        control.setOrientation(LinearLayout.HORIZONTAL);
        control.setGravity(Gravity.CENTER_VERTICAL);

        customInput = new EditText(this);
        customInput.setSingleLine(true);
        customInput.setText(initialValue == null ? "" : initialValue);
        customInput.setHint("예: 교육, 출장, 휴무");
        customInput.setTextSize(14);
        customInput.setTextColor(0xFF172033);
        customInput.setHintTextColor(0xFF94A3B8);
        customInput.setFilters(new InputFilter[]{new InputFilter.LengthFilter(20)});
        customInput.setImeOptions(EditorInfo.IME_ACTION_DONE);
        customInput.setPadding(dp(12), 0, dp(12), 0);
        customInput.setBackground(roundRect(Color.WHITE, 12, 1, 0xFFD8E0EA));

        LinearLayout.LayoutParams inputParams = new LinearLayout.LayoutParams(
                0, dp(46), 1f
        );
        control.addView(customInput, inputParams);

        TextView save = text("저장", 14, Color.WHITE, true);
        save.setGravity(Gravity.CENTER);
        save.setBackground(roundRect(0xFF2563EB, 12, 0, Color.TRANSPARENT));
        LinearLayout.LayoutParams saveParams = new LinearLayout.LayoutParams(dp(68), dp(46));
        saveParams.leftMargin = dp(8);
        control.addView(save, saveParams);

        LinearLayout.LayoutParams controlParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        controlParams.topMargin = dp(8);
        editor.addView(control, controlParams);

        TextView message = text(
                "직접 입력한 기록은 근무시간 0시간으로 계산됩니다.",
                11,
                0xFF64748B,
                false
        );
        LinearLayout.LayoutParams messageParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        messageParams.topMargin = dp(7);
        editor.addView(message, messageParams);

        View.OnClickListener saveAction = v -> saveCustomWorkType();
        save.setOnClickListener(saveAction);
        customInput.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_DONE) {
                saveCustomWorkType();
                return true;
            }
            return false;
        });

        return editor;
    }

    private void saveCustomWorkType() {
        String label = customInput.getText() == null
                ? ""
                : customInput.getText().toString().trim().replaceAll("\\s+", " ");

        if (label.isEmpty()) {
            Toast.makeText(this, "내용을 입력해 주세요.", Toast.LENGTH_SHORT).show();
            customInput.requestFocus();
            return;
        }

        if (label.length() > 20) {
            label = label.substring(0, 20);
        }

        WidgetDataStore.setCustomWorkType(this, dateKey, label);
        CatCalendarWidgetProvider.refreshAll(this);
        WidgetCloudSync.pushCurrentStateAsync(this);
        finish();
        overridePendingTransition(0, 0);
    }

    private void updateWindowBounds() {
        if (activityWindow == null || rootContent == null) {
            return;
        }

        View decorView = activityWindow.getDecorView();
        int navigationBottom = getNavigationBarInset(decorView);
        int statusTop = getStatusBarInset(decorView);

        int displayHeight = getResources().getDisplayMetrics().heightPixels;
        int safeTopGap = dp(10);
        int maxHeight = Math.max(
                dp(260),
                displayHeight - statusTop - navigationBottom - safeTopGap
        );

        int contentHeight = rootContent.getMeasuredHeight();
        int targetHeight = contentHeight > 0
                ? Math.min(contentHeight, maxHeight)
                : ViewGroup.LayoutParams.WRAP_CONTENT;

        activityWindow.setLayout(
                ViewGroup.LayoutParams.MATCH_PARENT,
                targetHeight
        );

        WindowManager.LayoutParams params = activityWindow.getAttributes();
        params.gravity = Gravity.BOTTOM;
        // Move the actual bottom-sheet window above the Android navigation bar.
        // This keeps the final button/field physically above the three system buttons.
        params.y = Math.max(0, navigationBottom);
        activityWindow.setAttributes(params);
    }

    private int getNavigationBarInset(View decorView) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            WindowInsets insets = decorView.getRootWindowInsets();
            if (insets != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    int bottom = insets.getInsets(WindowInsets.Type.navigationBars()).bottom;
                    if (bottom > 0) {
                        return bottom;
                    }
                } else {
                    int bottom = insets.getStableInsetBottom();
                    if (bottom > 0) {
                        return bottom;
                    }
                }
            }
        }

        int resourceId = getResources().getIdentifier(
                "navigation_bar_height",
                "dimen",
                "android"
        );
        return resourceId > 0
                ? getResources().getDimensionPixelSize(resourceId)
                : dp(48);
    }

    private int getStatusBarInset(View decorView) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            WindowInsets insets = decorView.getRootWindowInsets();
            if (insets != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    return insets.getInsets(WindowInsets.Type.statusBars()).top;
                }
                return insets.getStableInsetTop();
            }
        }
        return 0;
    }

    private String formatDateTitle() {
        try {
            LocalDate date = LocalDate.parse(dateKey, DateTimeFormatter.ISO_LOCAL_DATE);
            return String.format(
                    Locale.KOREA,
                    "%d년 %d월 %d일",
                    date.getYear(),
                    date.getMonthValue(),
                    date.getDayOfMonth()
            );
        } catch (Exception error) {
            return dateKey;
        }
    }

    private TextView text(String value, int sizeSp, int color, boolean bold) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(sizeSp);
        view.setTextColor(color);
        if (bold) {
            view.setTypeface(view.getTypeface(), android.graphics.Typeface.BOLD);
        }
        return view;
    }

    private GradientDrawable roundRect(int fillColor, int radiusDp, int strokeDp, int strokeColor) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(fillColor);
        drawable.setCornerRadius(dp(radiusDp));
        if (strokeDp > 0) {
            drawable.setStroke(dp(strokeDp), strokeColor);
        }
        return drawable;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
