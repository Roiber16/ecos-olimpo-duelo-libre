# Ecos del Olimpo - Duelo Libre: cómo conseguir la APK

> **Lee esto primero:** en esta carpeta NO hay todavía un archivo `.apk`.
> Aquí está el proyecto completo para que GitHub lo compile y te dé la APK
> para descargar. Si sigues los pasos de abajo, la APK aparece sola.
> Es una **APK debug** (de pruebas, sin firmar para la tienda): sirve para
> instalarla en tu teléfono y jugar, no es una versión de Play Store.

**El juego:** Duelo Libre con las 100 cartas, constructor de mazos, duelo
contra la IA, tutorial de Eudora y duelo por wifi local con código o QR.
Todo en horizontal, sin internet. El modo historia viene después.

---

## 1. Qué necesitas

- Una cuenta de **GitHub** (gratis). Si no tienes, se crea en 5 minutos.
- Tu teléfono (Xiaomi Redmi 10 con Android 12 vale) y wifi o datos para
  descargar la APK una vez.
- El archivo ZIP con este proyecto, que te paso por el chat.
  No subas las carpetas `node_modules` ni `android/app/build` (no vienen
  en el ZIP, no te preocupes por ellas).
- Unos 15 minutos la primera vez. La compilación en GitHub tarda unos 5 minutos.

---

## 2. Crea tu cuenta de GitHub (si no tienes)

1. Abre Chrome en el teléfono y entra a **github.com**.
2. Pulsa **Sign up**.
3. Escribe un correo, una contraseña y un nombre de usuario.
   Apunta el nombre de usuario: lo vas a necesitar. Ejemplo: `roiber2002`.
4. Sigue los pasos, verifica el correo y entra en tu cuenta.
5. Listo. No necesitas pagar nada: el plan gratis vale para esto.

## 3. Crea el repositorio (la carpeta del proyecto en GitHub)

1. Dentro de GitHub, arriba a la derecha, pulsa el **+** y luego
   **New repository**.
2. En **Repository name** escribe: `ecos-olimpo-duelo-libre`
3. En **Description** puedes poner: `APK Duelo Libre de Ecos del Olimpo`.
4. Déjalo en **Public** (así la compilación es gratis sin límite).
   Si lo pones en **Private** también funciona, pero el plan gratis
   limita los minutos de compilación al mes.
5. Marca **Add a README file** (así no queda vacío).
6. Pulsa **Create repository**. Ya tienes tu repositorio vacío.

## 4. Sube el proyecto al repositorio (elige UNA ruta)

### Ruta A — Con la app MGit (la más fácil, sin escribir comandos)

1. Instala **MGit** desde Play Store (gratis).
2. En GitHub, en el ordenador o en Chrome, crea un **token** para que MGit
   pueda subir:
   - Arriba a la derecha, pulsa tu foto > **Settings** >
     **Developer settings** > **Personal access tokens** >
     **Tokens (classic)** > **Generate new token (classic)**.
   - En **Note** escribe `MGit`.
   - En **Expiration** elige `90 days`.
   - Marca la casilla **`repo`**.
   - Pulsa **Generate token** y **copia el código** que te sale.
     Solo se ve una vez. Guárdalo en una nota.
3. En MGit, pulsa **+** > **Clone**, y escribe la dirección de tu repo:
   `https://github.com/TU_USUARIO/ecos-olimpo-duelo-libre.git`
   (cambia `TU_USUARIO` por tu nombre de usuario de GitHub).
   Cuando pida usuario y contraseña, pon tu usuario de GitHub y como
   contraseña pega el **token** del paso 2, no tu contraseña de GitHub.
4. Descarga el ZIP del proyecto en el teléfono y descomprímelo con la
   app **Archivos** (mantén pulsado el ZIP > **Extraer**).
5. Con Archivos, copia todo lo que hay dentro de la carpeta
   `ecos-apk` (las carpetas `www`, `scripts`, `assets`, `.github` y los
   archivos `package.json`, `capacitor.config.json`, `LEEME_APK.md`, etc.)
   dentro de la carpeta del repositorio que creó MGit.
   **Si subiste también la carpeta `android`, también vale.**
   Si no la subiste, no pasa nada: GitHub la crea sola al compilar.
6. Vuelve a MGit, entra en el repositorio, pulsa **Commit**,
   escribe `Primera versión Duelo Libre`, marca todo y pulsa **Commit**
   y luego **Push**.
7. Ve al paso 5.

### Ruta B — Con Termux (si te gustan los comandos)

1. Instala **Termux** desde F-Droid o Play Store.
2. Abre Termux y escribe, una línea cada vez (pulsa Enter después de cada una):
   ```
   pkg install git gh -y
   gh auth login
   ```
   En `gh auth login` elige: GitHub.com > HTTPS > Yes > Login with a web
   browser. Te dará un código; ábrelo en Chrome y escríbelo para autorizar.
3. Clona tu repositorio:
   ```
   git clone https://github.com/TU_USUARIO/ecos-olimpo-duelo-libre.git
   ```
4. Descarga el ZIP del proyecto, descomprímelo con Archivos y copia
   su contenido dentro de la carpeta `ecos-olimpo-duelo-libre` que se creó.
5. En Termux:
   ```
   cd ecos-olimpo-duelo-libre
   git add -A
   git commit -m "Primera versión Duelo Libre"
   git push
   ```
6. Ve al paso 5.

### Ruta C — Solo por la web de GitHub, sin instalar nada (más lenta)

Si no quieres instalar apps, sube solo lo necesario (sin la carpeta
`android`, que GitHub crea sola al compilar):

1. En tu repositorio, pulsa **Add file** > **Create new file**.
2. En el nombre escribe `www/.gitkeep` y pulsa **Commit new file**.
   Esto crea la carpeta `www`.
3. Entra en la carpeta `www`, pulsa **Add file** > **Upload files** y
   sube el archivo `index.html` de la carpeta `www` del proyecto.
4. Repite lo mismo para cada carpeta: crea la carpeta con un archivo
   `.gitkeep` y luego sube sus archivos dentro:
   - `package.json` y `package-lock.json` (en la raíz del repo)
   - `capacitor.config.json` (raíz)
   - `scripts/fix-manifest.js` y `scripts/setup-android.js`
   - `assets/icon-1024.png` y `assets/splash-land-1920x1280.png`,
     y todo lo de `assets/res/` (icono y splash por tamaños)
   - `.github/workflows/build-apk.yml`
   - `LEEME_APK.md` (este archivo)
5. Ve al paso 5.

> **Si te equivocas en algo, no pasa nada:** puedes borrar el repositorio
> y empezar de nuevo (Settings del repo > abajo del todo > Delete repository).

---

## 5. Dónde aparece la APK (la compilación)

1. Sube el proyecto (paso 4). Al subirlo, GitHub **empieza a compilar solo**.
   También puedes forzarlo: pestaña **Actions** > **Compilar APK Duelo Libre**
   > **Run workflow** > **Run workflow**.
2. Espera unos 5 minutos. En la pestaña **Actions** verás la ejecución:
   - Círculo amarillo: está compilando, espera.
   - **Check verde**: salió bien, la APK está lista.
   - **X roja**: falló. Pulsa la ejecución, busca el paso en rojo y
     haz captura para enseñármela.
3. Cuando esté en verde, pulsa la ejecución y baja hasta **Artifacts**.
4. Pulsa **ecos-del-olimpo-duelo-libre-debug**. Se descarga un ZIP.
5. Descomprime el ZIP en el teléfono: dentro está el archivo
   **`app-debug.apk`**.

> Ojo: el artefacto se borra de GitHub a los **30 días**. Si pasa ese tiempo,
> vuelve a compilar desde Actions > Run workflow, o guarda la APK en el teléfono.

---

## 6. Cómo instalar la APK en Android 12 (Redmi 10)

1. Abre el archivo `app-debug.apk` desde Archivos o desde Chrome > Descargas.
2. Android dirá que es una app de origen desconocido: pulsa **Ajustes** y
   activa **Permitir desde esta fuente** (solo para Chrome o Archivos,
   la app que estés usando).
3. Vuelve atrás y pulsa **Instalar**.
4. Si sale **"App no verificada"** o **"Desarrollador desconocido"**,
   es normal: es una APK de pruebas sin firmar para la tienda.
   Pulsa **Instalar de todos modos**.
5. Abre la app. Se llama **Ecos del Olimpo - Duelo Libre**.
6. **Gira el teléfono a horizontal.** El juego es solo horizontal:
   en vertical solo sale una pantalla que pide girarlo.
7. Si te pide permiso de cámara, es solo para escanear el QR del wifi.
   Puedes decir que no: el código de 4 letras funciona sin cámara.

> Para actualizar a una versión nueva: descarga la APK nueva y vuelve a
> instalarla encima, sin desinstalar la vieja. Tu mazo y tus ajustes se
> conservan si no desinstalas.

---

## 7. Cómo probar el wifi local con un amigo (hotspot)

**Lo que hace falta:** 2 teléfonos con la app instalada y sin internet.

**Teléfono 1 (el anfitrión):**

1. Ve a **Ajustes > Conexiones > Punto de acceso móvil** (o
   **Zona wifi**) y actívalo. Apunta el nombre de la red y la contraseña.
   Si ya tiene wifi, puede usar la wifi de la casa en vez del punto
   de acceso, pero el punto de acceso es lo más seguro sin internet.
2. Abre la app, pulsa **Duelo por wifi local** > **Crear sala**.
3. Te salen un **código de 4 letras** y un **QR**. Enséñaselos a tu amigo.

**Teléfono 2 (el invitado):**

1. Ve a **Ajustes > Wifi**, busca el nombre del punto de acceso del
   teléfono 1 y conéctate con su contraseña. No hace falta internet,
   solo estar en la misma wifi.
2. Abre la app, pulsa **Duelo por wifi local** > **Unirse**.
3. Escribe el código de 4 letras y pulsa **Unirse** (o escanea el QR
   con la cámara, si le diste permiso).
4. Cuando conecte, el anfitrión pulsa **Iniciar duelo** y juegan con
   las mismas reglas: Destino 20, energía 1 a 6, 3 carriles.

**Si no conecta:**

- Comprueba que los dos están en la **misma** wifi (el punto de acceso
  del teléfono 1) y que el punto de acceso sigue encendido.
- Prueba con el **código a mano** en vez del QR: el QR necesita internet
  la primera vez (la librería se descarga de internet); el código
  funciona siempre sin internet.
- Si se corta a mitad de partida, el juego ofrece seguir en
  **modo pasar el teléfono** con el mismo mazo.
- Si sigue sin conectar, haz captura del error y del código que sale
  y enséñamela.

---

## 8. Qué probar primero (para ayudar a mejorar el juego)

1. **Tutorial de Eudora** (desde el menú): los 6 pasos y luego el duelo
   de práctica contra la IA.
2. Un duelo contra la IA con el mazo de Ares.
3. Ármate un mazo propio en el constructor (24 cartas) y juega contra la IA.
4. Un duelo por wifi local con un amigo.
5. Apunta y dime: qué carta se sintió muy fuerte o muy débil, si algún
   duelo duró más de 15 minutos, y si algo se vio cortado o pequeño
   en horizontal.

---

## 9. Preguntas frecuentes

**¿La APK es gratis?** Sí. Todo lo de aquí es gratis: GitHub, Capacitor,
la compilación y la app.

**¿Necesito internet para jugar?** No. Solo para descargar la APK la
primera vez y para el QR la primera vez. El juego, el constructor,
la IA y el wifi local funcionan sin internet.

**¿Por qué la APK se llama app-debug.apk?** Porque es de pruebas.
Cuando el juego esté listo para publicar, se hará una versión
firmada (release) con otro nombre.

**¿Puedo compartir la APK con mis amigos?** Sí, pásales el archivo
`app-debug.apk` por Telegram o Bluetooth. Ellos la instalan igual
que tú (paso 6).

**¿Y si quiero cambiar una carta o una regla?** Dímelo a mí (Lu).
Yo actualizo el proyecto, tú vuelves a subir los archivos que
cambiaron a GitHub y la APK nueva se compila sola.
