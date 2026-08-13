package com.cat.attendance.widget;

import android.app.Activity;
import android.os.Bundle;
import android.widget.Toast;


public class OpenCatActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        openCat();
        finish();
    }

    private void openCat() {
        if (WidgetAppBridge.openOrResumeCat(this)) {
            return;
        }

        Toast.makeText(
                this,
                "CAT 앱을 열 수 없습니다.",
                Toast.LENGTH_LONG
        ).show();
    }
}
