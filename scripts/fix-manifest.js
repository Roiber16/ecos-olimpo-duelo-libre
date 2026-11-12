/**
 * fix-manifest.js — Seguridad para Ecos del Olimpo - Duelo Libre.
 *
 * Se ejecuta en GitHub Actions antes de compilar, por si `npx cap sync`
 * o un `cap add android` nuevo regenera el AndroidManifest.xml.
 * Es idempotente: si el cambio ya existe, no toca nada.
 *
 * 1. Fija la orientación en horizontal (landscape) en MainActivity.
 *    El juego es SOLO horizontal, sin opción a vertical.
 * 2. Añade el permiso de cámara (solo para escanear el QR del wifi local;
 *    sin cámara se entra el código de 4 letras a mano).
 * 3. Permite tráfico sin cifrar (android:usesCleartextTraffic="true"):
 *    el invitado llama por HTTP claro al servidor local del anfitrión
 *    (http://192.168.x.x:7777). Sin esto, Android 9+ bloquea esas
 *    llamadas y «Unirse por IP» nunca conectaría.
 *    Solo afecta a la red local: el juego no usa internet.
 * 4. Declara el permiso de red local de Android 17
 *    (android.permission.ACCESS_LOCAL_NETWORK). El proyecto apunta a
 *    SDK 36 (Android 16): ahí el acceso a la red local sigue implícito
 *    por INTERNET y esta declaración es inerte (los permisos
 *    desconocidos se ignoran). Si el objetivo sube a SDK 37, esa
 *    declaración pasa a ser obligatoria Y además habrá que pedir el
 *    permiso en tiempo de ejecución antes de crear la sala o unirse
 *    (con una llamada nativa al plugin); sin concederlo, en Android 17
 *    las conexiones TCP locales agotan el tiempo y el mDNS falla.
 *    Esta declaración solo prepara el terreno; no cambia nada hoy.
 *
 * Uso: node scripts/fix-manifest.js
 */
const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

if (!fs.existsSync(manifestPath)) {
  console.error('No existe AndroidManifest.xml en ' + manifestPath);
  console.error('Ejecuta primero: npx cap add android');
  process.exit(1);
}

let xml = fs.readFileSync(manifestPath, 'utf8');
let changed = false;

// 1. Orientación horizontal en MainActivity.
if (!xml.includes('android:screenOrientation="landscape"')) {
  xml = xml.replace(
    /(<activity[^>]*android:name="\.MainActivity")/,
    '$1\n            android:screenOrientation="landscape"'
  );
  // Si el reemplazo no funcionó (formato distinto), avisar sin romper.
  if (!xml.includes('android:screenOrientation="landscape"')) {
    console.error('AVISO: no se pudo añadir screenOrientation="landscape". Revisa el manifiesto a mano.');
  } else {
    console.log('Añadido android:screenOrientation="landscape" a MainActivity.');
    changed = true;
  }
} else {
  console.log('La orientación landscape ya estaba fijada.');
}

// 2. Permiso de cámara para el escáner QR.
if (!xml.includes('android.permission.CAMERA')) {
  xml = xml.replace(
    /(<uses-permission android:name="android\.permission\.INTERNET" \/>)/,
    '$1\n    <uses-permission android:name="android.permission.CAMERA" />'
  );
  if (xml.includes('android.permission.CAMERA')) {
    console.log('Añadido permiso CAMERA.');
    changed = true;
  } else {
    console.error('AVISO: no se pudo añadir el permiso CAMERA. Revisa el manifiesto a mano.');
  }
} else {
  console.log('El permiso CAMERA ya estaba.');
}

if (changed) {
  fs.writeFileSync(manifestPath, xml, 'utf8');
  console.log('AndroidManifest.xml actualizado.');
} else {
  console.log('AndroidManifest.xml ya estaba correcto. Sin cambios.');
}

// 3. Tráfico sin cifrar para la red local (wifi v2: el invitado llama por
//    HTTP claro al servidor del anfitrión, http://192.168.x.x:8080).
if (!xml.includes('android:usesCleartextTraffic="true"')) {
  xml = xml.replace(
    /(<application[\s\S]*?)>/,
    function (m) {
      // Solo tocar la etiqueta <application ...> (la primera coincidencia
      // con «application» es la propia etiqueta; las demás no empiezan así).
      return m.includes('android:usesCleartextTraffic')
        ? m
        : m.replace(/>$/, '\n        android:usesCleartextTraffic="true">');
    }
  );
  if (xml.includes('android:usesCleartextTraffic="true"')) {
    console.log('Añadido android:usesCleartextTraffic="true" a <application>.');
    fs.writeFileSync(manifestPath, xml, 'utf8');
    console.log('AndroidManifest.xml actualizado.');
  } else {
    console.error('AVISO: no se pudo añadir usesCleartextTraffic. Revisa el manifiesto a mano.');
  }
} else {
  console.log('usesCleartextTraffic="true" ya estaba.');
}

// 4. Permiso de red local de Android 17 (ACCESS_LOCAL_NETWORK).
//    Inerte con targetSdk 36; obligatorio (declaración + petición en
//    tiempo de ejecución) si el objetivo sube a 37.
if (!xml.includes('android.permission.ACCESS_LOCAL_NETWORK')) {
  xml = xml.replace(
    /(<uses-permission android:name="android\.permission\.INTERNET" \/>)/,
    '$1\n    <uses-permission android:name="android.permission.ACCESS_LOCAL_NETWORK" />'
  );
  if (xml.includes('android.permission.ACCESS_LOCAL_NETWORK')) {
    console.log('Añadido permiso ACCESS_LOCAL_NETWORK (preparado para SDK 37).');
    fs.writeFileSync(manifestPath, xml, 'utf8');
    console.log('AndroidManifest.xml actualizado.');
  } else {
    console.error('AVISO: no se pudo añadir ACCESS_LOCAL_NETWORK. Revisa el manifiesto a mano.');
  }
} else {
  console.log('El permiso ACCESS_LOCAL_NETWORK ya estaba.');
}
