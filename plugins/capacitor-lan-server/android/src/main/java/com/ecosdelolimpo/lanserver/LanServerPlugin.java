package com.ecosdelolimpo.lanserver;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Puente Capacitor del servidor HTTP local (LanServer).
 *
 * Métodos JS:
 *  - connect() -> { ip, port }       Arranca el servidor local.
 *  - disconnect() -> void            Para el servidor.
 *  - getLanIp() -> { ip }            Mejor IPv4 local (punto de acceso primero).
 *  - sendResponse({requestId, body}) Responde a una petición 'onRequest'.
 *
 * Eventos JS:
 *  - 'onRequest' { requestId, method, path, body?, headers?, query? }
 */
@CapacitorPlugin(name = "LanServer")
public class LanServerPlugin extends Plugin {

    private LanServer server;

    @PluginMethod
    public void connect(PluginCall call) {
        if (server != null && server.isRunning()) {
            JSObject ret = new JSObject();
            ret.put("ip", LanServer.detectLanIp());
            ret.put("port", server.getBoundPort());
            call.resolve(ret);
            return;
        }
        try {
            server = new LanServer(this);
            LanServer.Started started = server.start();
            JSObject ret = new JSObject();
            ret.put("ip", started.ip);
            ret.put("port", started.port);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("No se pudo arrancar el servidor local: " + e.getMessage());
        }
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        if (server != null) {
            server.stop();
            server = null;
        }
        call.resolve();
    }

    @PluginMethod
    public void getLanIp(PluginCall call) {
        String ip = LanServer.detectLanIp();
        if (ip == null) {
            call.reject("No se encontró una IP de red local");
            return;
        }
        JSObject ret = new JSObject();
        ret.put("ip", ip);
        call.resolve(ret);
    }

    @PluginMethod
    public void sendResponse(PluginCall call) {
        String requestId = call.getString("requestId");
        String body = call.getString("body", "");
        if (requestId == null) {
            call.reject("Falta requestId");
            return;
        }
        LanServer.completeResponse(requestId, body);
        call.resolve();
    }

    /** Entrega una petición HTTP entrante a JavaScript. */
    void fireOnRequest(JSObject data) {
        notifyListeners("onRequest", data);
    }
}
