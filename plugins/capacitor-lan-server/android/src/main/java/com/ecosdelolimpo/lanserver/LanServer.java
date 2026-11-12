package com.ecosdelolimpo.lanserver;

import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import fi.iki.elonen.NanoHTTPD;

/**
 * Servidor HTTP local (NanoHTTPD) para la señalización wifi local de
 * Ecos del Olimpo.
 *
 * Diferencias clave con un servidor HTTP genérico:
 *  - Escucha en 0.0.0.0 (todas las interfaces), no en la IP de la
 *    conexión wifi. Así funciona también cuando el teléfono es el
 *    punto de acceso (hotspot): WifiManager.getConnectionInfo() ahí
 *    devuelve 0 y un servidor atado a esa IP no sería alcanzable.
 *  - La IP que se anuncia se elige enumerando las interfaces de red:
 *    primero la del punto de acceso (192.168.43.x), luego cualquier
 *    IPv4 de la red local.
 *  - Puerto fijo 8080 si está libre (el invitado solo escribe la IP);
 *    si está ocupado, 8081…8089.
 *
 * Las peticiones se entregan a JavaScript con el evento 'onRequest' y
 * la respuesta vuelve con completeResponse(requestId, body). El
 * servidor espera hasta 10 segundos la respuesta de JS.
 */
public class LanServer {

    private static final String TAG = "LanServer";
    // Puerto fijo de la sala: el invitado solo escribe la IP. Si el 7777
    // está ocupado en el teléfono, se prueban 7778…7786 y el juego muestra
    // el puerto real junto a la IP.
    public static final int DEFAULT_PORT = 7777;
    private static final int MAX_PORT_TRIES = 10;
    private static final int TIMEOUT_SECONDS = 10;

    private final Plugin plugin;
    private LocalNanoServer server;
    private int boundPort = -1;

    private static final ConcurrentHashMap<String, CompletableFuture<String>> pendingResponses =
            new ConcurrentHashMap<>();

    public LanServer(@NonNull Plugin plugin) {
        this.plugin = plugin;
    }

    public static class Started {
        public final String ip;
        public final int port;
        Started(String ip, int port) { this.ip = ip; this.port = port; }
    }

    public boolean isRunning() {
        return server != null && server.isAlive();
    }

    public int getBoundPort() {
        return boundPort;
    }

    /** Arranca el servidor y devuelve la IP LAN y el puerto real. */
    @NonNull
    public Started start() throws IOException {
        if (isRunning()) {
            return new Started(detectLanIp(), boundPort);
        }
        IOException lastError = null;
        for (int i = 0; i < MAX_PORT_TRIES; i++) {
            int port = DEFAULT_PORT + i;
            try {
                server = new LocalNanoServer("0.0.0.0", port, plugin, TIMEOUT_SECONDS);
                server.start();
                boundPort = port;
                String ip = detectLanIp();
                Log.i(TAG, "Servidor local en 0.0.0.0:" + port + " (IP LAN: " + ip + ")");
                return new Started(ip, port);
            } catch (IOException e) {
                lastError = e;
                server = null;
                Log.w(TAG, "Puerto " + port + " ocupado o no disponible, probando el siguiente");
            }
        }
        throw lastError != null ? lastError : new IOException("No se pudo abrir ningún puerto local");
    }

    public void stop() {
        if (server != null) {
            server.stop();
            server = null;
            boundPort = -1;
            pendingResponses.clear();
            Log.i(TAG, "Servidor local parado");
        }
    }

    /** Respuesta de JavaScript para una petición pendiente. */
    public static void completeResponse(@NonNull String requestId, @NonNull String body) {
        CompletableFuture<String> future = pendingResponses.remove(requestId);
        if (future != null && !future.isDone()) {
            future.complete(body);
        } else {
            Log.w(TAG, "Sin petición pendiente para: " + requestId);
        }
    }

    /**
     * Mejor IPv4 local del teléfono.
     * Prioridad: punto de acceso Android (192.168.43.x) > red local
     * 192.168.x.x > 10.x.x.x > 172.16-31.x.x > otra IPv4 no loopback.
     * Devuelve null si no hay ninguna.
     */
    @Nullable
    public static String detectLanIp() {
        try {
            String best = null;
            int bestScore = -1;
            Enumeration<NetworkInterface> ifaces = NetworkInterface.getNetworkInterfaces();
            while (ifaces.hasMoreElements()) {
                NetworkInterface iface = ifaces.nextElement();
                if (!iface.isUp() || iface.isLoopback() || iface.isVirtual()) continue;
                Enumeration<InetAddress> addrs = iface.getInetAddresses();
                while (addrs.hasMoreElements()) {
                    InetAddress addr = addrs.nextElement();
                    if (!(addr instanceof Inet4Address) || addr.isLoopbackAddress()) continue;
                    String ip = addr.getHostAddress();
                    if (ip == null) continue;
                    int score = scoreIp(ip);
                    if (score > bestScore) {
                        bestScore = score;
                        best = ip;
                    }
                }
            }
            return best;
        } catch (Exception e) {
            Log.e(TAG, "Error enumerando interfaces", e);
            return null;
        }
    }

    private static int scoreIp(@NonNull String ip) {
        if (ip.startsWith("192.168.43.")) return 100; // punto de acceso Android
        if (ip.startsWith("192.168.")) return 80;
        if (ip.startsWith("10.")) return 70;
        if (ip.startsWith("172.")) {
            try {
                int second = Integer.parseInt(ip.split("\\.")[1]);
                if (second >= 16 && second <= 31) return 60;
            } catch (Exception ignored) { }
        }
        return 10;
    }

    // MARK: - Servidor NanoHTTPD

    private static class LocalNanoServer extends NanoHTTPD {

        private final Plugin plugin;
        private final int timeoutSeconds;

        LocalNanoServer(@NonNull String hostname, int port, @NonNull Plugin plugin, int timeoutSeconds) {
            super(hostname, port);
            this.plugin = plugin;
            this.timeoutSeconds = timeoutSeconds;
        }

        @Override
        public Response serve(@NonNull IHTTPSession session) {
            if (Method.OPTIONS.equals(session.getMethod())) {
                return createCorsResponse();
            }
            try {
                String body = extractBody(session);
                String responseBody = processRequest(
                        session.getMethod().name(), session.getUri(), body,
                        session.getHeaders(), session.getParms());
                return createJsonResponse(responseBody, Response.Status.OK);
            } catch (Exception e) {
                Log.e(TAG, "Error procesando petición", e);
                return createErrorResponse("Internal server error: " + e.getMessage(),
                        Response.Status.INTERNAL_ERROR);
            }
        }

        /** Cuerpo de peticiones POST/PUT/PATCH (o null si no hay). */
        @Nullable
        private String extractBody(@NonNull IHTTPSession session) {
            Method method = session.getMethod();
            if (method != Method.POST && method != Method.PUT && method != Method.PATCH) {
                return null;
            }
            try {
                HashMap<String, String> files = new HashMap<>();
                session.parseBody(files);
                String body = files.get("postData");
                if (body == null || body.isEmpty()) {
                    body = session.getQueryParameterString();
                }
                return body;
            } catch (IOException | ResponseException e) {
                Log.e(TAG, "Error leyendo el cuerpo", e);
                return null;
            }
        }

        /** Entrega la petición a JS y espera su respuesta (máx. 10 s). */
        @NonNull
        private String processRequest(@NonNull String method, @NonNull String path,
                                      @Nullable String body,
                                      @NonNull Map<String, String> headers,
                                      @NonNull Map<String, String> params) {
            String requestId = UUID.randomUUID().toString();
            JSObject requestData = new JSObject();
            requestData.put("requestId", requestId);
            requestData.put("method", method);
            requestData.put("path", path);
            if (body != null && !body.isEmpty()) requestData.put("body", body);
            if (!headers.isEmpty()) requestData.put("headers", mapToJson(headers));
            if (!params.isEmpty()) requestData.put("query", mapToJson(params));

            CompletableFuture<String> future = new CompletableFuture<>();
            pendingResponses.put(requestId, future);
            if (plugin instanceof LanServerPlugin) {
                ((LanServerPlugin) plugin).fireOnRequest(requestData);
            } else {
                Log.e(TAG, "El plugin no es LanServerPlugin");
            }
            try {
                return future.get(timeoutSeconds, TimeUnit.SECONDS);
            } catch (TimeoutException e) {
                Log.w(TAG, "Timeout esperando respuesta JS: " + requestId);
                return timeoutError(requestId);
            } catch (Exception e) {
                Log.e(TAG, "Error esperando respuesta JS", e);
                return "{\"error\":\"Error esperando respuesta\"}";
            } finally {
                pendingResponses.remove(requestId);
            }
        }

        @NonNull
        private JSObject mapToJson(@NonNull Map<String, String> map) {
            JSObject out = new JSObject();
            for (Map.Entry<String, String> e : map.entrySet()) out.put(e.getKey(), e.getValue());
            return out;
        }

        @NonNull
        private Response createJsonResponse(@NonNull String body, @NonNull Response.Status status) {
            Response response = newFixedLengthResponse(status, "application/json", body);
            addCorsHeaders(response);
            return response;
        }

        @NonNull
        private Response createCorsResponse() {
            Response response = newFixedLengthResponse(Response.Status.NO_CONTENT, "text/plain", "");
            addCorsHeaders(response);
            return response;
        }

        @NonNull
        private Response createErrorResponse(@NonNull String message, @NonNull Response.Status status) {
            try {
                JSONObject error = new JSONObject();
                error.put("error", message);
                return createJsonResponse(error.toString(), status);
            } catch (JSONException e) {
                return newFixedLengthResponse(status, "text/plain", message);
            }
        }

        @NonNull
        private String timeoutError(@NonNull String requestId) {
            try {
                JSONObject error = new JSONObject();
                error.put("error", "Request timeout");
                error.put("requestId", requestId);
                return error.toString();
            } catch (JSONException e) {
                return "{\"error\":\"Request timeout\"}";
            }
        }

        private void addCorsHeaders(@NonNull Response response) {
            response.addHeader("Access-Control-Allow-Origin", "*");
            response.addHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
            response.addHeader("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization");
            response.addHeader("Access-Control-Allow-Credentials", "true");
            response.addHeader("Access-Control-Max-Age", "3600");
        }
    }
}
