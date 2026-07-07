package com.earmo.exercises;

import android.app.Activity;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Locale;

@SuppressWarnings("deprecation")
public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().setStatusBarColor(Color.rgb(14, 17, 19));
        getWindow().setNavigationBarColor(Color.rgb(14, 17, 19));

        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(false);
        settings.setDatabaseEnabled(false);
        settings.setDomStorageEnabled(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return interceptExerciseGif(request.getUrl());
            }
        });
        setContentView(webView);
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView == null) {
            super.onBackPressed();
            return;
        }

        webView.evaluateJavascript(
                "window.handleAndroidBack ? window.handleAndroidBack() : false",
                handled -> {
                    if ("true".equals(handled)) {
                        return;
                    }
                    if (webView.canGoBack()) {
                        webView.goBack();
                        return;
                    }
                    MainActivity.super.onBackPressed();
                });
    }

    private WebResourceResponse interceptExerciseGif(Uri uri) {
        String path = uri == null ? null : uri.getPath();
        if (uri == null
                || !"https".equals(uri.getScheme())
                || !"static.exercisedb.dev".equals(uri.getHost())
                || path == null
                || !path.startsWith("/media/")
                || !path.toLowerCase(Locale.US).endsWith(".gif")) {
            return null;
        }

        try {
            File cachedFile = getCachedGifFile(uri);
            if (cachedFile.exists() && cachedFile.length() > 0) {
                return gifResponse(cachedFile);
            }

            downloadToCache(uri.toString(), cachedFile);
            if (cachedFile.exists() && cachedFile.length() > 0) {
                return gifResponse(cachedFile);
            }
        } catch (Exception ignored) {
            return null;
        }
        return null;
    }

    private File getCachedGifFile(Uri uri) {
        File cacheDir = new File(getCacheDir(), "exercise-gifs");
        if (!cacheDir.exists()) {
            cacheDir.mkdirs();
        }
        String fileName = new File(uri.getPath()).getName();
        return new File(cacheDir, fileName);
    }

    private WebResourceResponse gifResponse(File file) throws Exception {
        return new WebResourceResponse("image/gif", null, new FileInputStream(file));
    }

    private void downloadToCache(String url, File outputFile) throws Exception {
        File tempFile = new File(outputFile.getParentFile(), outputFile.getName() + ".tmp");
        HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
        connection.setConnectTimeout(12000);
        connection.setReadTimeout(30000);
        connection.setUseCaches(true);

        try {
            if (connection.getResponseCode() < 200 || connection.getResponseCode() >= 300) {
                return;
            }
            try (InputStream input = connection.getInputStream();
                    FileOutputStream output = new FileOutputStream(tempFile)) {
                byte[] buffer = new byte[8192];
                int read;
                while ((read = input.read(buffer)) != -1) {
                    output.write(buffer, 0, read);
                }
            }
            if (!tempFile.renameTo(outputFile)) {
                tempFile.delete();
            }
        } finally {
            connection.disconnect();
        }
    }
}
