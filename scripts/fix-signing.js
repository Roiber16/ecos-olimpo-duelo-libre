/**
 * fix-signing.js — Misma firma en todas las APK debug.
 *
 * Problema: cada ejecución de GitHub Actions genera un debug.keystore
 * nuevo (firma distinta), así que Android no deja actualizar la app:
 * obliga a desinstalar primero. Roi tuvo que desinstalar la v20 por eso.
 *
 * Solución: el repo lleva un keystore debug fijo
 * (keystore/ecos-debug.keystore, alias androiddebugkey, claves estándar
 * de debug). Este script lo copia a ~/.android/debug.keystore antes de
 * compilar, que es donde Gradle busca la clave de debug. Así todas las
 * builds firman igual y se puede actualizar sin desinstalar.
 *
 * NOTA: es una clave DEBUG, no de Play Store (las claves estándar de
 * debug son públicas por diseño). La primera APK con esta clave (v21)
 * seguirá pidiendo desinstalar la v20, porque la v20 se firmó con otra
 * clave efímera que ya no existe. A partir de la v21, las actualizaciones
 * serán directas.
 *
 * Uso: node scripts/fix-signing.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const src = path.join(__dirname, '..', 'keystore', 'ecos-debug.keystore');
const dstDir = path.join(os.homedir(), '.android');
const dst = path.join(dstDir, 'debug.keystore');

if (!fs.existsSync(src)) {
  console.error('No existe el keystore fijo en ' + src);
  process.exit(1);
}

fs.mkdirSync(dstDir, { recursive: true });
fs.copyFileSync(src, dst);
console.log('Keystore debug fijo copiado a ' + dst);
console.log('Todas las builds debug firmarán con la misma clave.');
console.log('fix-signing.js terminado.');
