package com.bgv.application.support;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.ServerSocket;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * Frees the HTTP port in local dev when a previous Spring Boot instance was left running.
 * Set BGV_SKIP_PORT_CLEANUP=true to disable (e.g. production).
 */
public final class DevPortCleaner {

    private static final int DEFAULT_PORT = 8080;

    private DevPortCleaner() {
    }

    public static void releasePortIfBusy(int port) {
        if ("true".equalsIgnoreCase(System.getenv("BGV_SKIP_PORT_CLEANUP"))) {
            return;
        }
        String profile = System.getenv("SPRING_PROFILES_ACTIVE");
        if (profile != null && profile.toLowerCase().contains("prod")) {
            return;
        }
        if (!isPortInUse(port)) {
            return;
        }

        System.out.println("[BGV] Port " + port + " is in use - stopping previous backend instance...");
        String os = System.getProperty("os.name", "").toLowerCase();
        if (os.contains("win")) {
            releaseOnWindows(port);
        } else if (os.contains("linux") || os.contains("mac")) {
            releaseOnUnix(port);
        }
        waitUntilFree(port, 8_000);
    }

    public static void releaseDefaultPortIfBusy() {
        String portProperty = System.getProperty("server.port", System.getenv("SERVER_PORT"));
        int port = DEFAULT_PORT;
        if (portProperty != null && !portProperty.isBlank()) {
            try {
                port = Integer.parseInt(portProperty.trim());
            } catch (NumberFormatException ignored) {
                port = DEFAULT_PORT;
            }
        }
        releasePortIfBusy(port);
    }

    private static boolean isPortInUse(int port) {
        try (ServerSocket socket = new ServerSocket(port)) {
            socket.setReuseAddress(true);
            return false;
        } catch (IOException e) {
            return true;
        }
    }

    private static void releaseOnWindows(int port) {
        long currentPid = ProcessHandle.current().pid();
        for (int pid : findListeningPidsWindows(port)) {
            if (pid == currentPid || !isJavaProcessWindows(pid)) {
                continue;
            }
            System.out.println("[BGV] Stopping java process PID " + pid);
            runQuietly(new ProcessBuilder("taskkill", "/F", "/PID", String.valueOf(pid)));
        }
    }

    private static Set<Integer> findListeningPidsWindows(int port) {
        Set<Integer> pids = new HashSet<>();
        String portSuffix = ":" + port;

        try {
            Process process = new ProcessBuilder("cmd.exe", "/c", "netstat -ano")
                .redirectErrorStream(true)
                .start();

            try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (!line.contains("LISTENING") || !line.contains(portSuffix)) {
                        continue;
                    }
                    String[] parts = line.trim().split("\\s+");
                    if (parts.length < 5) {
                        continue;
                    }
                    String localAddress = parts[1];
                    if (!localAddress.endsWith(portSuffix)) {
                        continue;
                    }
                    try {
                        pids.add(Integer.parseInt(parts[parts.length - 1]));
                    } catch (NumberFormatException ignored) {
                        // skip malformed netstat rows
                    }
                }
            }
            process.waitFor(10, TimeUnit.SECONDS);
        } catch (Exception e) {
            System.err.println("[BGV] Could not inspect port listeners: " + e.getMessage());
        }
        return pids;
    }

    private static boolean isJavaProcessWindows(int pid) {
        try {
            Process process = new ProcessBuilder(
                "tasklist", "/FI", "PID eq " + pid, "/FO", "CSV", "/NH"
            ).redirectErrorStream(true).start();

            String output;
            try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                output = reader.readLine();
            }
            process.waitFor(5, TimeUnit.SECONDS);

            if (output == null) {
                return false;
            }
            String lower = output.toLowerCase();
            return lower.contains("java.exe") || lower.contains("javaw.exe");
        } catch (Exception e) {
            return false;
        }
    }

    private static void releaseOnUnix(int port) {
        runQuietly(new ProcessBuilder(
            "sh", "-c",
            "lsof -ti tcp:" + port + " -sTCP:LISTEN 2>/dev/null | xargs -r kill -9 2>/dev/null || true"
        ));
    }

    private static void runQuietly(ProcessBuilder builder) {
        try {
            Process process = builder.redirectErrorStream(true).start();
            process.waitFor(10, TimeUnit.SECONDS);
        } catch (Exception e) {
            System.err.println("[BGV] Could not free port automatically: " + e.getMessage());
        }
    }

    private static void waitUntilFree(int port, long timeoutMs) {
        long deadline = System.currentTimeMillis() + timeoutMs;
        while (System.currentTimeMillis() < deadline) {
            if (!isPortInUse(port)) {
                System.out.println("[BGV] Port " + port + " is now available.");
                return;
            }
            try {
                Thread.sleep(500);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            }
        }
        System.err.println("[BGV] Port " + port + " is still in use after cleanup attempt.");
    }
}
