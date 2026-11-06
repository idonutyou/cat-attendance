package com.cat.attendance.widget;

import android.app.Activity;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;

import org.json.JSONObject;

import java.nio.charset.StandardCharsets;

public class WidgetSyncActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Uri data = getIntent().getData();
        if (data != null) {
            String encoded = data.getQueryParameter("payload");
            if (encoded != null && !encoded.isEmpty()) {
                try {
                    byte[] bytes = Base64.decode(
                            encoded,
                            Base64.URL_SAFE | Base64.NO_WRAP | Base64.NO_PADDING
                    );
                    JSONObject payload = new JSONObject(
                            new String(bytes, StandardCharsets.UTF_8)
                    );
                    JSONObject records = payload.optJSONObject("records");
                    JSONObject holidays = payload.optJSONObject("holidays");
                    JSONObject firebaseBridge = payload.optJSONObject("firebaseBridge");
                    String weekStart = payload.optString("weekStart", "sunday");
                    WidgetDataStore.replaceFromWeb(this, records, weekStart);
                    WidgetDataStore.saveCloudBridgeCredentials(this, firebaseBridge);
                    HolidayStore.replaceFromWeb(this, holidays);
                    CatCalendarWidgetProvider.refreshAll(this);
                    // Pairing can arrive after edits were made while offline.
                    // Upload queued widget changes without opening the CAT PWA.
                    WidgetCloudSync.pushCurrentStateAsync(this);
                    String pairingDeviceId = payload.optString("pairingDeviceId", "");
                    String pairingNonce = payload.optString("pairingNonce", "");
                    if (!pairingDeviceId.isEmpty() && !pairingNonce.isEmpty()) {
                        WidgetCloudSync.confirmPairingAsync(
                                this, pairingDeviceId, pairingNonce);
                    }
                } catch (Exception ignored) {
                    // 잘못된 콜백은 무시하고 앱으로 즉시 돌아갑니다.
                }
            }
        }

        finish();
    }
}
