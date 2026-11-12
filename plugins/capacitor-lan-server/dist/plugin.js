/**
 * capacitor-lan-server — registro JS del plugin.
 * Se carga solo cuando existe window.Capacitor (en la app instalada).
 * En el navegador no hace nada: el juego detecta que no hay plugin
 * y usa el camino manual (QR / texto).
 */
(function () {
  if (typeof window === 'undefined' || !window.Capacitor) return;
  var stub = {
    connect: function () { return Promise.reject(new Error('LanServer solo funciona en la aplicación instalada.')); },
    disconnect: function () { return Promise.resolve(); },
    getLanIp: function () { return Promise.reject(new Error('LanServer solo funciona en la aplicación instalada.')); },
    sendResponse: function () { return Promise.resolve(); },
    addListener: function () { return Promise.resolve({ remove: function () {} }); },
    removeAllListeners: function () { return Promise.resolve(); }
  };
  window.Capacitor.registerPlugin('LanServer', {
    web: function () { return Promise.resolve().then(function () { return stub; }); }
  });
})();
