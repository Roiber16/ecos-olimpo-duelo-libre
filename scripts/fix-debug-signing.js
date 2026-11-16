/**
 * fix-debug-signing.js — Firma debug explícita en build.gradle.
 *
 * Por qué existe: copiar el keystore fijo a ~/.android/debug.keystore
 * (fix-signing.js) no bastó — la build #107 salió firmada con otra
 * clave (SHA-256 49:30:A9:78… en vez de D4:05:2F:AF… del keystore fijo).
 * Gradle resolvió su propio debug.keystore por otro camino (p. ej.
 * ANDROID_SDK_HOME distinto del HOME del usuario).
 *
 * Solución robusta: configurar la firma debug EXPLÍCITAMENTE en
 * android/app/build.gradle, apuntando al keystore del repo
 * (keystore/ecos-debug.keystore). Así Gradle no tiene que adivinar
 * dónde está la clave: usa siempre la misma, y Roi podrá actualizar
 * sin desinstalar a partir de la build que incluya este cambio.
 *
 * Se ejecuta en GitHub Actions después de que `npx cap add android`
 * genera la plataforma. Es idempotente.
 *
 * Uso: node scripts/fix-debug-signing.js
 */
const fs = require('fs');
const path = require('path');

const gradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');

if (!fs.existsSync(gradlePath)) {
  console.error('No existe build.gradle en ' + gradlePath);
  process.exit(1);
}

let gradle = fs.readFileSync(gradlePath, 'utf8');

if (gradle.includes('ecos-debug.keystore')) {
  console.log('build.gradle ya usa el keystore fijo. Sin cambios.');
  process.exit(0);
}

const anchor = '    buildTypes {';
if (!gradle.includes(anchor)) {
  console.error('AVISO: no se encontró "buildTypes {" en build.gradle. Revisa a mano.');
  process.exit(1);
}

const patch =
  '    signingConfigs {\n' +
  '        debug {\n' +
  '            storeFile file("../../keystore/ecos-debug.keystore")\n' +
  '            storePassword "android"\n' +
  '            keyAlias "androiddebugkey"\n' +
  '            keyPassword "android"\n' +
  '        }\n' +
  '    }\n' +
  '    buildTypes {\n' +
  '        debug {\n' +
  '            signingConfig signingConfigs.debug\n' +
  '        }';

gradle = gradle.replace(anchor, patch);
fs.writeFileSync(gradlePath, gradle, 'utf8');
console.log('build.gradle actualizado: firma debug explícita con keystore/ecos-debug.keystore.');
console.log('fix-debug-signing.js terminado.');
