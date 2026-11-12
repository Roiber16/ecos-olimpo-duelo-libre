/**
 * setup-android.js — Prepara la plataforma Android antes de compilar.
 *
 * Dos casos:
 * A) La carpeta android/ ya está en el repo (subida completa):
 *    solo copia el icono y el splash desde assets/res/ y fija el manifiesto.
 * B) La carpeta android/ NO está en el repo (subida ligera solo por la web):
 *    ejecuta `npx cap add android`, copia icono y splash, y fija el manifiesto.
 *
 * Después de este script, el workflow ejecuta `npx cap sync android`
 * (copia www/ a los assets de la app) y luego compila con Gradle.
 *
 * Uso: node scripts/setup-android.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const androidDir = path.join(root, 'android');
const resSrc = path.join(root, 'assets', 'res');
const resDst = path.join(androidDir, 'app', 'src', 'main', 'res');

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

if (!fs.existsSync(androidDir)) {
  console.log('No existe android/. Creando la plataforma con Capacitor...');
  execSync('npx cap add android', { cwd: root, stdio: 'inherit' });
} else {
  console.log('La carpeta android/ ya existe. No se regenera.');
}

console.log('Copiando icono y splash desde assets/res/ ...');
copyDir(resSrc, resDst);
console.log('Icono y splash copiados.');

// Reutiliza fix-manifest.js (fija landscape + permiso de cámara).
require('./fix-manifest.js');
console.log('setup-android.js terminado.');
