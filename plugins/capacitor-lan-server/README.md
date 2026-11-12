# capacitor-lan-server

Pequeño plugin Capacitor propio para **Ecos del Olimpo** (solo Android).

El anfitrión de una partida por wifi local lleva un pequeño servidor HTTP
dentro de la app (NanoHTTPD). El invitado se conecta a ese servidor para
intercambiar la señalización WebRTC (oferta/respuesta) sin internet, sin
servidor externo y sin QR.

Por qué un plugin propio y no `@cappitolian/http-local-server`: ese paquete
publicado obtiene la IP con `WifiManager.getConnectionInfo()`, que devuelve
0 cuando el teléfono es el punto de acceso (hotspot). Este plugin, en
cambio, enumera las interfaces de red y escucha en `0.0.0.0`, así que
funciona también cuando el anfitrión crea el punto de acceso.

## API (JS)

```js
const LanServer = Capacitor.registerPlugin('LanServer');

// Arranca el servidor. Devuelve la IP LAN y el puerto real.
const { ip, port } = await LanServer.connect(); // puerto fijo 7777 si está libre

// IP LAN del teléfono (fiable, por APIs de Android)
const { ip } = await LanServer.getLanIp();

// Peticiones entrantes: { requestId, method, path, body, headers, query }
await LanServer.addListener('onRequest', async (data) => {
  await LanServer.sendResponse({ requestId: data.requestId, body: JSON.stringify({...}) });
});

await LanServer.disconnect();
```

Puerto: se intenta el **7777** primero (fijo, para que el invitado solo
tenga que escribir la IP) y, si está ocupado, 7778…7786. La IP que
devuelve `connect()` es la mejor IPv4 local: primero la del punto de
acceso (`192.168.43.x`) y luego cualquier IPv4 de la red local.

## Permisos

El manifiesto del plugin declara `INTERNET`, `ACCESS_NETWORK_STATE` y
`ACCESS_WIFI_STATE` (se fusionan solos en el manifiesto de la app).

La app además necesita `android:usesCleartextTraffic="true"` (lo pone
`scripts/fix-manifest.js` en CI), porque el invitado llama por HTTP
claro (`http://192.168.x.x:8080`) a la red local.
