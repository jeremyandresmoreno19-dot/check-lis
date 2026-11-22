# Instrucciones para el agente que controla el computador

**Tarea:** dejar publicada y funcionando la app **Check-Lis Taller** (Mantenimiento Industrial) con una cuenta de Google nueva del taller, usando solo el **plan gratuito de Firebase**.

Lee este documento completo antes de empezar. Trabaja por fases y en orden. Al final de cada fase, confirma el resultado que se indica antes de seguir.

---

## 0. Contexto

- La app ya está programada. Está en el archivo **`checklis-taller.zip`**, que la persona dejó en el computador, normalmente en *Descargas*.
- No hay que programar nada. Solo hay que:
  1. Crear una cuenta de Google para el taller.
  2. Crear un proyecto de Firebase con esa cuenta.
  3. Copiar la configuración del proyecto en un archivo de la app.
  4. Publicar la app con un comando.
- La app **no usa Supabase**. No crees nada en Supabase.
- Todo debe quedar a nombre de la **cuenta nueva del taller**, no de la persona.

## 1. Reglas obligatorias

**Nunca:**
- Ingreses datos de tarjeta, pago o facturación.
- Actives el plan **Blaze** ni "Upgrade". Si una pantalla pide pago para continuar, **detente y avisa a la persona**.
- Escribas contraseñas en notas, documentos, chats ni en el informe final. Las contraseñas las escribe **la persona**.
- Crees más de un proyecto de Firebase. Si algo falla, reintenta en el mismo proyecto.
- Modifiques archivos de la app, salvo **`public/firebase-config.js`** (fase 5).
- Actives Google Analytics, Gemini, Crashlytics, Storage, Functions ni otros productos. Solo se usan **Authentication, Firestore y Hosting**.
- Aceptes compartir datos de uso o telemetría cuando la terminal lo pregunte. Responde que no.

**Siempre:**
- Si aparece un CAPTCHA, verificación por teléfono, código SMS, verificación en dos pasos o una elección de contraseña, **detente y pídele a la persona que lo haga**. Continúa cuando te diga "listo".
- Si un botón o menú tiene otro nombre del que dice esta guía, busca el equivalente. La consola puede estar en español o en inglés; aquí van ambos nombres.
- Anota lo que se te pide anotar (correo, ID del proyecto, dirección web) para el informe final.

## 2. Fase 1: preparar la carpeta de la app

1. Busca `checklis-taller.zip` en *Descargas*. Si no está, pídeselo a la persona.
2. Descomprímelo en la carpeta *Documentos*. Debe quedar `Documentos/checklis-taller/`, que contiene `firebase.json`, `firestore.rules`, `GUIA.md` y la carpeta `public`.
3. Verifica que existan `Documentos/checklis-taller/firebase.json` y `Documentos/checklis-taller/public/firebase-config.js`.

**Resultado esperado:** la carpeta existe con esos archivos.

## 3. Fase 2: crear la cuenta de Google del taller

1. Abre el navegador (Chrome si existe) en **una ventana de incógnito** o en un perfil nuevo, para no mezclar con la cuenta personal de la persona.
2. Ve a <https://accounts.google.com/signup>. Si aparece el selector, elige **"Para mi uso personal"**.
3. Datos sugeridos:
   - **Nombre:** `Taller`
   - **Apellido:** `Mantenimiento Industrial`
   - **Fecha de nacimiento y género:** pídeselos a la persona (usa los de la persona responsable).
4. Elige **"Crear tu propia dirección de Gmail"** y prueba en este orden hasta que una esté disponible:
   1. `checklis.mantenimiento.industrial`
   2. `taller.mantenimiento.industrial`
   3. `checklis.taller.mi`
   4. `mi.checklis.taller`
   5. `checklis.taller.mi` seguido de un número de 2 dígitos, por ejemplo `checklis.taller.mi24`
5. **Contraseña: la escribe la persona.** Detente y dile: *"Escribe una contraseña segura y guárdala en un lugar seguro. Avísame cuando esté lista."*
6. **Teléfono, códigos y CAPTCHA:** los completa la persona.
7. **Correo de recuperación:** pídele a la persona su correo personal y escríbelo. Es importante para recuperar la cuenta.
8. Acepta los términos de Google. En "personalización" o "configuración rápida", elige la opción más básica (sin personalización extra).

**Resultado esperado:** quedó la sesión iniciada en la cuenta nueva. **Anota el correo** (no la contraseña).

## 4. Fase 3: crear el proyecto en Firebase

1. En la misma ventana, con la cuenta nueva, ve a <https://console.firebase.google.com>.
2. Acepta los términos si los pide. Si pregunta el país, elige **Chile**.
3. Toca **"Crear un proyecto"** (o "Comenzar con un proyecto de Firebase" / "Create a project").
4. Nombre del proyecto: **`checklis-taller`**.
   - Firebase propone un **ID del proyecto** debajo del nombre, a veces con letras extra.
   - Si te deja editarlo, prueba `checklis-taller-mi` y, si está ocupado, deja el que proponga.
   - **Anota el ID del proyecto exacto.**
5. Si ofrece **Gemini en Firebase / asistencia con IA**: **desactívalo o "Ahora no"**.
6. **Google Analytics: desactívalo.**
7. Toca **Crear proyecto** y espera a que termine. Luego **Continuar**.
8. Abajo a la izquierda debe decir **"Spark"** o "Plan sin costo". No lo cambies.

**Resultado esperado:** estás dentro de la consola del proyecto. Tienes anotado el ID del proyecto.

## 5. Fase 4: activar el inicio de sesión

1. Menú izquierdo: **Compilación → Authentication** (Build → Authentication). Toca **Comenzar** (Get started).
2. Pestaña **Método de acceso** (Sign-in method):
   - **Correo electrónico/contraseña** (Email/Password): actívalo (solo el primer interruptor) y **Guardar**.
   - **Agregar proveedor nuevo → Google**: actívalo. En "Correo de asistencia del proyecto" elige el correo del taller y **Guardar**.
3. Pestaña **Configuración → Dominios autorizados** (Settings → Authorized domains): solo verifica que estén `localhost`, `<ID>.firebaseapp.com` y `<ID>.web.app`. No cambies nada.

**Resultado esperado:** Google y Correo/contraseña aparecen como "Habilitado".

## 6. Fase 5: registrar la app web y copiar la configuración

1. Ve a **Configuración del proyecto** (engranaje junto a "Descripción general del proyecto").
2. En **Tus apps**, toca el ícono **`</>`** (Web).
3. Sobrenombre: `Check-Lis`. **No** marques "Configurar también Firebase Hosting". Toca **Registrar app**.
4. Aparece un bloque de código con `const firebaseConfig = { apiKey: ..., authDomain: ..., projectId: ..., storageBucket: ..., messagingSenderId: ..., appId: ... }`.
5. Abre con el editor de texto (Bloc de notas, TextEdit o VS Code) el archivo:
   `Documentos/checklis-taller/public/firebase-config.js`
6. Reemplaza **solo los valores vacíos** entre comillas por los de Firebase. Debe quedar así, con los valores reales:

```js
window.FIREBASE_CONFIG = {
  apiKey: "AIza....",
  authDomain: "ID.firebaseapp.com",
  projectId: "ID",
  storageBucket: "ID.firebasestorage.app",
  messagingSenderId: "123...",
  appId: "1:123...:web:abc..."
};
```

   - No borres la línea `window.FIREBASE_CONFIG = {` ni los comentarios.
   - Si Firebase muestra `measurementId`, no lo agregues.
   - En TextEdit (Mac), usa **Formato → Convertir a texto sin formato** antes de guardar.
7. Guarda el archivo y vuelve a la consola. Toca **Ir a la consola**.

Estos valores no son secretos (identifican el proyecto). Igual no los publiques en otros lugares.

**Resultado esperado:** `firebase-config.js` guardado con los 6 valores llenos.

## 7. Fase 6: crear la base de datos

1. Menú: **Compilación → Firestore Database** (Build → Firestore Database) → **Crear base de datos** (Create database).
2. Si pide edición, elige **Standard / Estándar**.
3. **ID de la base de datos:** deja `(default)`.
4. **Ubicación:** **`southamerica-west1` (Santiago)**. Si no aparece, `southamerica-east1` (São Paulo). No se puede cambiar después.
5. **Reglas:** elige **modo de producción** (production mode). Las reglas correctas se suben en la fase 8.
6. Toca **Crear** y espera.

**Resultado esperado:** se ve la base de datos vacía ("Iniciar colección").

## 8. Fase 7: instalar Node.js (si no está)

1. Abre una terminal:
   - **Windows:** menú Inicio → escribe `PowerShell` → abrir.
   - **Mac:** Spotlight → `Terminal`.
2. Escribe `node -v` y presiona Enter.
   - Si muestra una versión `v18` o mayor, pasa a la fase 8.
   - Si no está instalado: ve a <https://nodejs.org>, descarga la versión **LTS** y ejecuta el instalador con las opciones por defecto. Si el sistema pide contraseña de administrador o permiso, **pídeselo a la persona**.
3. Cierra la terminal, ábrela de nuevo y confirma con `node -v`.

## 9. Fase 8: publicar la app

1. En la terminal, entra a la carpeta de la app:
   - **Windows:** `cd "$HOME\Documents\checklis-taller"`
   - **Mac:** `cd ~/Documents/checklis-taller`

   Si la carpeta Documentos tiene otro nombre (por ejemplo `Documentos`) o está dentro de OneDrive, ajusta la ruta.
   Otra forma, en Windows: en el Explorador de archivos, clic derecho sobre la carpeta `checklis-taller` → **"Abrir en Terminal"**.
   Para confirmar que estás en la carpeta correcta, ejecuta `dir` (Windows) o `ls` (Mac): debe aparecer `firebase.json`.
2. Inicia sesión en Firebase:

   ```
   npx firebase-tools@15 login
   ```

   - Si pregunta si instala el paquete (`Ok to proceed?`), responde `y`.
   - Si pregunta por Gemini o por recopilar información de uso, responde **`n`**.
   - Se abre el navegador. Elige la **cuenta del taller** (no la personal) y toca **Permitir**. Si aparece "Google no verificó esta app", es la herramienta oficial de Firebase; continúa con *Permitir*.
   - En la terminal debe decir `Success! Logged in as <correo del taller>`.
   - Si Windows bloquea el script de PowerShell por política de ejecución, usa la app **Símbolo del sistema (cmd)** en vez de PowerShell y repite desde el paso 1, con `cd %USERPROFILE%\Documents\checklis-taller`.
3. Elige el proyecto:

   ```
   npx firebase-tools@15 use --add
   ```

   - Selecciona con las flechas el proyecto creado y presiona Enter.
   - Cuando pida un alias, escribe `default` y Enter.
4. Publica:

   ```
   npx firebase-tools@15 deploy
   ```

   - Debe terminar con **`Deploy complete!`** y mostrar `Hosting URL: https://<ID>.web.app`.
   - **Anota esa dirección.**
   - Si da un error sobre Firestore o reglas, revisa que la fase 6 se haya completado y repite el comando una vez.
   - Si el error pide habilitar una API o el plan Blaze, **detente y avisa a la persona** con el texto exacto del error.

## 10. Fase 9: comprobar que funciona

1. Abre la dirección `https://<ID>.web.app` en el navegador.
2. Debe aparecer el logo de Mantenimiento Industrial y el botón **"Entrar con Google"**.
3. Toca **Entrar con Google** y elige la **cuenta del taller**.
4. Debe aparecer **"Eres la primera persona en entrar"**. Toca **"Crear el taller y ser administrador"**.
5. En "Tus datos", escribe:
   - **Nombre:** `Administración Taller`
   - **Área:** `Mantención`
   - **Turno:** `A`
   - **RUT:** déjalo vacío.

   Toca **Guardar y entrar**.
6. Debe aparecer la pantalla **Taller** con las pestañas Inicio, Equipos, Escanear, Turno y Panel.
7. No cargues datos de ejemplo y no crees fichas. La persona hará la primera prueba.

## 11. Fase 10: que no dependa de una sola persona

1. Pídele a la persona **su correo personal de Gmail**.
2. En la consola de Firebase: **Configuración del proyecto → Usuarios y permisos** (Users and permissions) → **Agregar miembro** → su correo → rol **Propietario** (Owner) → Agregar.
3. Dile a la persona que acepte la invitación que le llegará al correo.

## 12. Informe final

Entrega a la persona este resumen, **sin contraseñas**:

- Correo de la cuenta del taller: `...@gmail.com`
- ID del proyecto Firebase: `...`
- Dirección de la app: `https://....web.app`
- Base de datos creada en: `southamerica-west1` (o la que se eligió)
- Métodos de acceso activos: Google y Correo/contraseña
- Propietario adicional invitado: `...`
- Lo que quedó pendiente o falló, con el texto exacto de cualquier error.

Y recuérdale:

1. Guardar la contraseña de la cuenta del taller en un lugar seguro.
2. Entrar a la app desde su celular con su propia cuenta de Google. Luego, desde la cuenta del taller, en **Ajustes → Personas y roles**, asignarse el rol **Administrador**.
3. Instalar la app en cada celular:
   - **Android:** menú ⋮ → Instalar aplicación.
   - **iPhone:** Compartir → Agregar a inicio.
4. Leer `GUIA.md` para el uso diario y la limpieza de datos antiguos cada 2 o 3 meses.

---

## Resumen: qué hace la IA y qué hace la persona

| Paso | Lo hace la IA | Lo hace la persona |
|---|---|---|
| Descomprimir la app | ✔ | Dejar el zip en Descargas |
| Crear cuenta Google | Llenar nombre, elegir correo | Contraseña, teléfono, SMS, CAPTCHA, fecha de nacimiento |
| Proyecto Firebase, acceso y base de datos | ✔ | — |
| Copiar configuración a `firebase-config.js` | ✔ | — |
| Instalar Node.js | Descargar e iniciar instalador | Permiso de administrador si lo pide |
| Publicar (`login`, `use`, `deploy`) | ✔ | Aprobar el inicio de sesión si el navegador lo pide |
| Primer ingreso como administrador | ✔ | — |
| Invitar segundo propietario | ✔ | Dar su correo y aceptar la invitación |
| Cualquier pantalla que pida pago | ✘ Detenerse | Decidir (no debería ser necesario) |
