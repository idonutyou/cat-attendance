package com.cat.attendance.widget;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;

import java.nio.charset.StandardCharsets;
import java.util.List;

public final class WidgetAppBridge {
    private static final long SILENT_HOME_DELAY_MS = 90L;

    private WidgetAppBridge() {}

    public static boolean deliverPendingToRunningAppSilently(Activity activity) {
        if (activity == null) {
            return false;
        }

        Intent catIntent = buildCatIntent(activity);

        if (catIntent == null) {
            return false;
        }

        if (!startCatIntentWithFallback(activity, catIntent)) {
            return false;
        }

        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            try {
                Intent homeIntent = new Intent(Intent.ACTION_MAIN)
                        .addCategory(Intent.CATEGORY_HOME)
                        .addFlags(
                                Intent.FLAG_ACTIVITY_NEW_TASK |
                                Intent.FLAG_ACTIVITY_NO_ANIMATION
                        );

                activity.getApplicationContext().startActivity(homeIntent);
            } catch (Exception ignored) {
            }
        }, SILENT_HOME_DELAY_MS);

        return true;
    }

    public static boolean openOrResumeCat(Activity activity) {
        if (activity == null) {
            return false;
        }

        Intent catIntent = buildCatIntent(activity);

        if (catIntent == null) {
            return false;
        }

        String installedWebAppPackage = catIntent.getPackage();

        if (
                installedWebAppPackage != null &&
                installedWebAppPackage.startsWith(
                        "org.chromium.webapk."
                ) &&
                launchInstalledWebAppLikeLauncher(
                        activity,
                        installedWebAppPackage
                )
        ) {
            return true;
        }

        return startCatIntentWithFallback(activity, catIntent);
    }

    private static boolean launchInstalledWebAppLikeLauncher(
            Activity activity,
            String packageName
    ) {
        try {
            Intent launchIntent =
                    activity.getPackageManager()
                            .getLaunchIntentForPackage(packageName);

            if (launchIntent == null) {
                return false;
            }

            launchIntent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK |
                    Intent.FLAG_ACTIVITY_REORDER_TO_FRONT |
                    Intent.FLAG_ACTIVITY_SINGLE_TOP |
                    Intent.FLAG_ACTIVITY_NO_ANIMATION
            );

            activity.startActivity(launchIntent);
            activity.overridePendingTransition(0, 0);
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    private static Intent buildCatIntent(Activity activity) {
        String baseUrl = BuildConfig.CAT_APP_URL;

        if (
                baseUrl == null ||
                baseUrl.isEmpty() ||
                baseUrl.contains("YOUR_GITHUB_USERNAME")
        ) {
            return null;
        }

        try {
            String payload =
                    WidgetDataStore.buildPendingPayload(activity, 80);
            String encoded = Base64.encodeToString(
                    payload.getBytes(StandardCharsets.UTF_8),
                    Base64.URL_SAFE |
                            Base64.NO_WRAP |
                            Base64.NO_PADDING
            );

            Uri uri = Uri.parse(baseUrl).buildUpon()
                    .fragment("catWidgetPayload=" + encoded)
                    .build();

            Intent intent = new Intent(Intent.ACTION_VIEW, uri)
                    .addCategory(Intent.CATEGORY_BROWSABLE)
                    .addFlags(
                            Intent.FLAG_ACTIVITY_NEW_TASK |
                            Intent.FLAG_ACTIVITY_SINGLE_TOP |
                            Intent.FLAG_ACTIVITY_NO_ANIMATION
                    );

            String preferredPackage =
                    findPreferredInstalledWebAppPackage(
                            activity,
                            intent
                    );

            if (preferredPackage != null) {
                intent.setPackage(preferredPackage);
            }

            return intent;
        } catch (Exception ignored) {
            return null;
        }
    }

    private static boolean startCatIntentWithFallback(
            Activity activity,
            Intent originalIntent
    ) {
        try {
            activity.startActivity(originalIntent);
            activity.overridePendingTransition(0, 0);
            return true;
        } catch (ActivityNotFoundException firstError) {
            if (originalIntent.getPackage() == null) {
                return false;
            }

            try {
                Intent fallbackIntent =
                        new Intent(originalIntent);
                fallbackIntent.setPackage(null);

                activity.startActivity(fallbackIntent);
                activity.overridePendingTransition(0, 0);
                return true;
            } catch (Exception ignored) {
                return false;
            }
        } catch (Exception ignored) {
            return false;
        }
    }

    private static String findPreferredInstalledWebAppPackage(
            Activity activity,
            Intent viewIntent
    ) {
        try {
            List<ResolveInfo> handlers =
                    activity.getPackageManager()
                            .queryIntentActivities(
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
                        packageName.startsWith(
                                "org.chromium.webapk."
                        )
                ) {
                    return packageName;
                }
            }
        } catch (Exception ignored) {
        }

        return null;
    }
}
