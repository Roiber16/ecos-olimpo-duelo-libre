/**
 * fix-fullscreen.js — Pantalla completa inmersiva para Ecos del Olimpo.
 *
 * El juego es SOLO horizontal y a pantalla completa: sin barra de estado
 * del teléfono ni barra de navegación. Roi lo exigió (la v20 se veía con
 * la barra de arriba visible).
 *
 * Se ejecuta en GitHub Actions después de que `npx cap add android`
 * genera la plataforma. Es idempotente: si el cambio ya existe, no toca nada.
 *
 * 1. styles.xml: añade android:windowFullscreen=true al tema
 *    AppTheme.NoActionBar (el que usa MainActivity).
 * 2. MainActivity.java: oculta la barra de estado y la de navegación
 *    en modo inmersivo (API 30+ con WindowInsetsController; antes con
 *    SYSTEM_UI_FLAG_IMMERSIVE_STICKY). Se re-aplica al recuperar el foco,
 *    para que no reaparezca la barra tras un diálogo o al volver a la app.
 *
 * Uso: node scripts/fix-fullscreen.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const stylesPath = path.join(root, 'android', 'app', 'src', 'main', 'res', 'values', 'styles.xml');
const activityPath = path.join(root, 'android', 'app', 'src', 'main', 'java', 'com', 'ecosdelolimpo', 'duelolibre', 'MainActivity.java');

// 1. styles.xml — windowFullscreen en AppTheme.NoActionBar.
if (!fs.existsSync(stylesPath)) {
  console.error('No existe styles.xml en ' + stylesPath);
  process.exit(1);
}
let styles = fs.readFileSync(stylesPath, 'utf8');
if (!styles.includes('android:windowFullscreen')) {
  styles = styles.replace(
    /(<style name="AppTheme\.NoActionBar"[^>]*>)/,
    '$1\n        <item name="android:windowFullscreen">true</item>'
  );
  if (styles.includes('android:windowFullscreen')) {
    fs.writeFileSync(stylesPath, styles, 'utf8');
    console.log('Añadido android:windowFullscreen=true a AppTheme.NoActionBar.');
  } else {
    console.error('AVISO: no se pudo añadir windowFullscreen. Revisa styles.xml a mano.');
  }
} else {
  console.log('windowFullscreen ya estaba en styles.xml.');
}

// 2. MainActivity.java — modo inmersivo.
if (!fs.existsSync(activityPath)) {
  console.error('No existe MainActivity.java en ' + activityPath);
  process.exit(1);
}
let java = fs.readFileSync(activityPath, 'utf8');
if (!java.includes('hideSystemBars')) {
  const immersive = `package com.ecosdelolimpo.duelolibre;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        hideSystemBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemBars();
        }
    }

    private void hideSystemBars() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN);
        }
    }
}
`;
  fs.writeFileSync(activityPath, immersive, 'utf8');
  console.log('MainActivity.java actualizado con modo inmersivo.');
} else {
  console.log('MainActivity.java ya tenía el modo inmersivo.');
}

console.log('fix-fullscreen.js terminado.');
