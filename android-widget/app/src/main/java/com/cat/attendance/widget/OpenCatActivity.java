package com.cat.attendance.widget;

import android.app.Activity;
import android.os.Bundle;
import android.widget.Toast;

public class OpenCatActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (!WidgetAppBridge.openOrResumeCat(this)) {
            Toast.makeText(
                    this,
                    "CAT 앱을 열 수 없습니다.",
                    Toast.LENGTH_LONG
            ).show();
        }

        finish();
        overridePendingTransition(0, 0);
    }
}
