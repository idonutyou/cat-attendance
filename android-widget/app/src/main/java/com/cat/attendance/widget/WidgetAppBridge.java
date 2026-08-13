package com.cat.attendance.widget;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.util.Base64;

import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * 위젯에서 변경한 pending 데이터를 설치된 CAT WebAPK에 넘기되,
 * 사용자의 화면은 CAT 앱으로 전환하지 않고 즉시 홈으로 되돌립니다.
 *
 * CAT 앱이 이미 메모리에 살아 있으면 새 VIEW intent의 URL만 전달되고,
 * 사용자가 나중에 CAT 앱으로 돌아올 때 웹 쪽 focus/pageshow 로직이
 * catWidgetPayload를 읽어 근태 기록을 즉시 갱신합니다.
 */
public final class WidgetAppBridge {
    private WidgetAppBridge() {}

    public static boolean deliverPendingToRunningAppSilently(Activity activity) {
        if (activity == null) {
            return false;
        }

        String baseUrl = BuildConfig.CAT_APP_URL;
        if (
                baseUrl == null ||
                baseUrl.isEmpty() ||
                baseUrl.contains("YOUR_GITHUB_USERNAME")
        ) {
            return false;
        }

        try {
            String payload = WidgetDataStore.buildPendingPayload(activity, 80);
            String encoded = Base64.encodeToString(
                    payload.getBytes(StandardCharsets.UTF_8),
                    Base64.URL_SAFE | Base64.NO_WRAP | Base64.NO_PADDING
            );

            Uri uri = Uri.parse(baseUrl).buildUpon()
                    .appendQueryParameter("catWidgetPayload", encoded)
                    .build();

            Intent appIntent = new Intent(Intent.ACTION_VIEW, uri)
                    .addCategory(Intent.CATEGORY_BROWSABLE)
                    .addFlags(
                            Intent.FLAG_ACTIVITY_NEW_TASK |
                            Intent.FLAG_ACTIVITY_REORDER_TO_FRONT |
                            Intent.FLAG_ACTIVITY_SINGLE_TOP |
                            Intent.FLAG_ACTIVITY_NO_ANIMATION
                    );

            String webApkPackage = findInstalledWebApk(activity, appIntent);

            /*
             * WebAPK가 없으면 일반 브라우저를 띄우지 않습니다.
             * pending은 WidgetDataStore에 그대로 남으므로 CAT 버튼으로
             * 나중에 앱을 열 때 기존 경로로 정상 반영됩니다.
             */
            if (webApkPackage == null) {
                return false;
            }

            appIntent.setPackage(webApkPackage);
            activity.startActivity(appIntent);
            activity.overridePendingTransition(0, 0);

            /*
             * VIEW intent를 WebAPK에 전달한 직후 launcher를 다시 전면으로
             * 올려, 위젯 선택 때문에 CAT 앱 화면이 남지 않게 합니다.
             * 위젯 클릭에서 시작된 사용자 동작 안에서만 실행됩니다.
             */
            Intent homeIntent = new Intent(Intent.ACTION_MAIN)
                    .addCategory(Intent.CATEGORY_HOME)
                    .addFlags(
                            Intent.FLAG_ACTIVITY_NEW_TASK |
                            Intent.FLAG_ACTIVITY_NO_ANIMATION
                    );

            activity.startActivity(homeIntent);
            activity.overridePendingTransition(0, 0);
            return true;
        } catch (ActivityNotFoundException ignored) {
            return false;
        } catch (Exception ignored) {
            return false;
        }
    }

    public static boolean openOrResumeCat(Activity activity) {
        if (activity == null) {
            return false;
        }

        String baseUrl = BuildConfig.CAT_APP_URL;
        if (
                baseUrl == null ||
                baseUrl.isEmpty() ||
                baseUrl.contains("YOUR_GITHUB_USERNAME")
        ) {
            return false;
        }

        try {
            String payload = WidgetDataStore.buildPendingPayload(activity, 80);
            String encoded = Base64.encodeToString(
                    payload.getBytes(StandardCharsets.UTF_8),
                    Base64.URL_SAFE | Base64.NO_WRAP | Base64.NO_PADDING
            );

            Uri uri = Uri.parse(baseUrl).buildUpon()
                    .appendQueryParameter("catWidgetPayload", encoded)
                    .build();

            Intent appIntent = new Intent(Intent.ACTION_VIEW, uri)
                    .addCategory(Intent.CATEGORY_BROWSABLE)
                    .addFlags(
                            Intent.FLAG_ACTIVITY_NEW_TASK |
                            Intent.FLAG_ACTIVITY_REORDER_TO_FRONT |
                            Intent.FLAG_ACTIVITY_SINGLE_TOP |
                            Intent.FLAG_ACTIVITY_NO_ANIMATION
                    );

            String webApkPackage =
                    findInstalledWebApk(activity, appIntent);

            if (webApkPackage == null) {
                return false;
            }

            appIntent.setPackage(webApkPackage);
            activity.startActivity(appIntent);
            activity.overridePendingTransition(0, 0);
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    private static String findInstalledWebApk(
            Activity activity,
            Intent viewIntent
    ) {
        List<ResolveInfo> handlers =
                activity.getPackageManager().queryIntentActivities(
                        viewIntent,
                        0
                );

        for (ResolveInfo handler : handlers) {
            if (
                    handler == null ||
                    handler.activityInfo == null
            ) {
                continue;
            }

            String packageName =
                    handler.activityInfo.packageName;

            if (
                    packageName != null &&
                    packageName.startsWith("org.chromium.webapk.")
            ) {
                return packageName;
            }
        }

        return null;
    }
}
