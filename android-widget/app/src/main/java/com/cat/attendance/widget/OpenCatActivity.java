package com.cat.attendance.widget;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.widget.Toast;

import java.nio.charset.StandardCharsets;
import java.util.List;

public class OpenCatActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        openCat();
        finish();
    }

    private void openCat() {
        String baseUrl = BuildConfig.CAT_APP_URL;
        if (baseUrl == null || baseUrl.contains("YOUR_GITHUB_USERNAME")) {
            Toast.makeText(
                    this,
                    "CAT 앱 주소가 아직 설정되지 않았습니다.",
                    Toast.LENGTH_LONG
            ).show();
            return;
        }

        String payload = WidgetDataStore.buildPendingPayload(this, 80);
        String encoded = Base64.encodeToString(
                payload.getBytes(StandardCharsets.UTF_8),
                Base64.URL_SAFE | Base64.NO_WRAP | Base64.NO_PADDING
        );

        Uri uri = Uri.parse(baseUrl).buildUpon()
                .appendQueryParameter("catWidgetPayload", encoded)
                .build();
        Intent viewIntent = new Intent(Intent.ACTION_VIEW, uri)
                .addCategory(Intent.CATEGORY_BROWSABLE);

        // 설치된 Chrome WebAPK(PWA)가 있으면 브라우저 탭보다 그 앱을 우선합니다.
        List<ResolveInfo> handlers = getPackageManager().queryIntentActivities(viewIntent, 0);
        for (ResolveInfo handler : handlers) {
            String packageName = handler.activityInfo.packageName;
            if (packageName != null && packageName.startsWith("org.chromium.webapk.")) {
                viewIntent.setPackage(packageName);
                break;
            }
        }

        try {
            startActivity(viewIntent);
        } catch (ActivityNotFoundException error) {
            Toast.makeText(this, "CAT 앱을 열 수 없습니다.", Toast.LENGTH_LONG).show();
        }
    }
}
