package com.cat.attendance.widget;

import android.content.Context;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class WidgetCloudSync {
    private static final String RECORDS_STORAGE_KEY = "cat-attendance-records-v1";
    private static final String WEEK_START_STORAGE_KEY = "cat-attendance-week-start-v1";
    private static final ExecutorService EXECUTOR = Executors.newSingleThreadExecutor();

    private WidgetCloudSync() {}

    public static void pushCurrentStateAsync(Context context) {
        if (context == null) {
            return;
        }

        Context appContext = context.getApplicationContext();
        EXECUTOR.execute(() -> pushCurrentState(appContext));
    }

    private static void pushCurrentState(Context context) {
        WidgetDataStore.CloudBridgeCredentials credentials =
                WidgetDataStore.getCloudBridgeCredentials(context);

        if (credentials == null) {
            return;
        }

        try {
            TokenResult tokenResult = refreshIdToken(credentials);
            if (tokenResult == null || tokenResult.idToken.isEmpty()) {
                return;
            }

            if (!tokenResult.refreshToken.isEmpty() &&
                    !tokenResult.refreshToken.equals(credentials.refreshToken)) {
                WidgetDataStore.updateCloudRefreshToken(context, tokenResult.refreshToken);
            }

            String documentUrl = buildDocumentUrl(credentials.projectId, credentials.uid);
            JSONObject remoteDocument = requestJson("GET", documentUrl, tokenResult.idToken, null, null);
            if (remoteDocument == null) {
                return;
            }

            JSONObject remoteFields = remoteDocument.optJSONObject("fields");
            JSONObject remoteStorageValue = remoteFields == null
                    ? null
                    : remoteFields.optJSONObject("storage");
            JSONObject remoteMapValue = remoteStorageValue == null
                    ? null
                    : remoteStorageValue.optJSONObject("mapValue");
            JSONObject remoteStorageFields = remoteMapValue == null
                    ? null
                    : remoteMapValue.optJSONObject("fields");

            JSONObject nextStorageFields = remoteStorageFields == null
                    ? new JSONObject()
                    : new JSONObject(remoteStorageFields.toString());

            nextStorageFields.put(
                    RECORDS_STORAGE_KEY,
                    new JSONObject().put(
                            "stringValue",
                            WidgetDataStore.getRecordsSnapshot(context).toString()
                    )
            );
            nextStorageFields.put(
                    WEEK_START_STORAGE_KEY,
                    new JSONObject().put(
                            "stringValue",
                            WidgetDataStore.getWeekStartValue(context)
                    )
            );

            JSONObject patchFields = new JSONObject();
            patchFields.put(
                    "storage",
                    new JSONObject().put(
                            "mapValue",
                            new JSONObject().put("fields", nextStorageFields)
                    )
            );
            patchFields.put(
                    "sourceDeviceId",
                    new JSONObject().put(
                            "stringValue",
                            "android-widget:" + context.getPackageName()
                    )
            );
            patchFields.put(
                    "updatedAt",
                    new JSONObject().put(
                            "timestampValue",
                            getUtcTimestamp()
                    )
            );

            String documentName = buildDocumentName(
                    credentials.projectId,
                    credentials.uid
            );
            JSONObject updateWrite = new JSONObject()
                    .put(
                            "update",
                            new JSONObject()
                                    .put("name", documentName)
                                    .put("fields", patchFields)
                    )
                    .put(
                            "updateMask",
                            new JSONObject().put(
                                    "fieldPaths",
                                    new org.json.JSONArray()
                                            .put("storage")
                                            .put("sourceDeviceId")
                                            .put("updatedAt")
                            )
                    );

            JSONObject requestBody = new JSONObject()
                    .put("writes", new org.json.JSONArray().put(updateWrite));

            JSONObject committed = requestJson(
                    "POST",
                    buildCommitUrl(credentials.projectId),
                    tokenResult.idToken,
                    "application/json; charset=UTF-8",
                    requestBody.toString()
            );

            if (committed != null) {
                WidgetDataStore.clearPendingAfterCloudSync(context);
            }
        } catch (Exception ignored) {
            // 위젯 화면/앱 실행 상태에는 영향을 주지 않고 다음 변경 때 재시도합니다.
        }
    }

    private static TokenResult refreshIdToken(
            WidgetDataStore.CloudBridgeCredentials credentials
    ) throws Exception {
        String endpoint = "https://securetoken.googleapis.com/v1/token?key="
                + URLEncoder.encode(credentials.apiKey, "UTF-8");
        String body = "grant_type=refresh_token&refresh_token="
                + URLEncoder.encode(credentials.refreshToken, "UTF-8");

        JSONObject response = requestJson(
                "POST",
                endpoint,
                null,
                "application/x-www-form-urlencoded; charset=UTF-8",
                body
        );

        if (response == null) {
            return null;
        }

        String idToken = response.optString("id_token", "");
        String refreshToken = response.optString("refresh_token", credentials.refreshToken);
        return new TokenResult(idToken, refreshToken);
    }

    private static String buildDocumentName(String projectId, String uid) {
        return "projects/"
                + projectId
                + "/databases/(default)/documents/users/"
                + uid
                + "/appData/main";
    }

    private static String buildDocumentUrl(String projectId, String uid) throws Exception {
        String safeProjectId = URLEncoder.encode(projectId, "UTF-8").replace("+", "%20");
        String safeUid = URLEncoder.encode(uid, "UTF-8").replace("+", "%20");
        return "https://firestore.googleapis.com/v1/projects/"
                + safeProjectId
                + "/databases/(default)/documents/users/"
                + safeUid
                + "/appData/main";
    }

    private static String buildCommitUrl(String projectId) throws Exception {
        String safeProjectId = URLEncoder.encode(projectId, "UTF-8").replace("+", "%20");
        return "https://firestore.googleapis.com/v1/projects/"
                + safeProjectId
                + "/databases/(default)/documents:commit";
    }

    private static String getUtcTimestamp() {
        SimpleDateFormat format = new SimpleDateFormat(
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                Locale.US
        );
        format.setTimeZone(TimeZone.getTimeZone("UTC"));
        return format.format(new Date());
    }

    private static JSONObject requestJson(
            String method,
            String endpoint,
            String bearerToken,
            String contentType,
            String requestBody
    ) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(endpoint).openConnection();
        connection.setRequestMethod(method);
        connection.setConnectTimeout(7000);
        connection.setReadTimeout(7000);
        connection.setUseCaches(false);
        connection.setRequestProperty("Accept", "application/json");

        if (bearerToken != null && !bearerToken.isEmpty()) {
            connection.setRequestProperty("Authorization", "Bearer " + bearerToken);
        }

        if (requestBody != null) {
            connection.setDoOutput(true);
            connection.setRequestProperty(
                    "Content-Type",
                    contentType == null ? "application/json; charset=UTF-8" : contentType
            );
            byte[] bytes = requestBody.getBytes(StandardCharsets.UTF_8);
            connection.setFixedLengthStreamingMode(bytes.length);
            try (OutputStream output = connection.getOutputStream()) {
                output.write(bytes);
            }
        }

        int status = connection.getResponseCode();
        InputStream stream = status >= 200 && status < 300
                ? connection.getInputStream()
                : connection.getErrorStream();
        String responseText = readAll(stream);
        connection.disconnect();

        if (status < 200 || status >= 300 || responseText.isEmpty()) {
            return null;
        }

        return new JSONObject(responseText);
    }

    private static String readAll(InputStream stream) throws Exception {
        if (stream == null) {
            return "";
        }

        StringBuilder result = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(stream, StandardCharsets.UTF_8)
        )) {
            String line;
            while ((line = reader.readLine()) != null) {
                result.append(line);
            }
        }
        return result.toString();
    }

    private static final class TokenResult {
        final String idToken;
        final String refreshToken;

        TokenResult(String idToken, String refreshToken) {
            this.idToken = idToken == null ? "" : idToken;
            this.refreshToken = refreshToken == null ? "" : refreshToken;
        }
    }
}
