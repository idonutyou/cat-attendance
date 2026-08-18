package com.cat.attendance.widget;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.LauncherActivityInfo;
import android.content.pm.LauncherApps;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.os.Process;
import android.os.UserHandle;
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

        // Do not discover CAT through its https URL here.  An installed PWA
        // can have a perfectly valid launcher entry without being selected as
        // the handler for an external ACTION_VIEW URL.  Find the same
        // ACTION_MAIN + CATEGORY_LAUNCHER component that the home screen uses
        // and launch that exact component first.
        ComponentName catLauncher = findCatLauncherComponent(activity);
        if (
                catLauncher != null &&
                launchExactLauncherComponent(activity, catLauncher)
        ) {
            return true;
        }

        // Only fall back to the URL path when CAT is not installed as a
        // launcher app/PWA on this device.
        Intent catIntent = buildCatIntent(activity);
        if (catIntent == null) {
            return false;
        }

        return startCatIntentWithFallback(activity, catIntent);
    }

    private static ComponentName findCatLauncherComponent(Activity activity) {
        try {
            Intent launcherQuery = new Intent(Intent.ACTION_MAIN)
                    .addCategory(Intent.CATEGORY_LAUNCHER);

            List<ResolveInfo> launchers =
                    activity.getPackageManager()
                            .queryIntentActivities(launcherQuery, 0);

            for (ResolveInfo launcher : launchers) {
                if (
                        launcher == null ||
                        launcher.activityInfo == null
                ) {
                    continue;
                }

                String packageName = launcher.activityInfo.packageName;
                String className = launcher.activityInfo.name;

                if (
                        packageName == null ||
                        className == null ||
                        packageName.equals(activity.getPackageName())
                ) {
                    continue;
                }

                CharSequence rawLabel =
                        launcher.loadLabel(activity.getPackageManager());
                String label = rawLabel == null
                        ? ""
                        : rawLabel.toString().trim();

                // The installed CAT PWA currently publishes short_name
                // "CAT 근태" and name "CAT 근태관리".  Match the launcher
                // label rather than a browser-specific WebAPK package name so
                // this also works when a different Chromium-based installer is
                // used on another Android phone.
                boolean isCatLauncher =
                        "CAT 근태".equals(label) ||
                        "CAT 근태관리".equals(label) ||
                        (label.startsWith("CAT") && label.contains("근태"));

                if (isCatLauncher) {
                    return new ComponentName(packageName, className);
                }
            }
        } catch (Exception ignored) {
        }

        return null;
    }

    private static boolean launchExactLauncherComponent(
            Activity activity,
            ComponentName component
    ) {
        try {
            // Intent.makeMainActivity() is the framework API specifically for
            // launching an application's front door the same way as Home.
            Intent launchIntent = Intent.makeMainActivity(component)
                    .addFlags(
                            Intent.FLAG_ACTIVITY_NEW_TASK |
                            Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED |
                            Intent.FLAG_ACTIVITY_NO_ANIMATION
                    );

            activity.startActivity(launchIntent);
            activity.overridePendingTransition(0, 0);
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    private static boolean launchInstalledWebAppLikeLauncher(
            Activity activity,
            String packageName
    ) {
        // Match the real home-screen launcher path first.  WebAPK/PWA tasks
        // are resumed correctly by LauncherApps.startMainActivity(), whereas
        // re-opening their URL can create/reload a fresh PWA launch.
        try {
            LauncherApps launcherApps =
                    (LauncherApps) activity.getSystemService(
                            Context.LAUNCHER_APPS_SERVICE
                    );
            UserHandle user = Process.myUserHandle();

            if (launcherApps != null) {
                List<LauncherActivityInfo> activities =
                        launcherApps.getActivityList(packageName, user);

                if (activities != null && !activities.isEmpty()) {
                    launcherApps.startMainActivity(
                            activities.get(0).getComponentName(),
                            user,
                            null,
                            null
                    );
                    return true;
                }
            }
        } catch (Exception ignored) {
        }

        // Fallback: reproduce a normal launcher tap as closely as possible.
        // Do not use REORDER_TO_FRONT/SINGLE_TOP here; the launcher-style
        // NEW_TASK + RESET_TASK_IF_NEEDED flags let Android reuse the app's
        // existing task when one is already running.
        try {
            Intent launchIntent =
                    activity.getPackageManager()
                            .getLaunchIntentForPackage(packageName);

            if (launchIntent == null) {
                return false;
            }

            launchIntent.setFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK |
                    Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED |
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
