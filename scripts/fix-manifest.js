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
