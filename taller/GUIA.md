# Check-Lis Taller · Guía de puesta en marcha

App de ingreso y chequeo de equipos para el taller de **Mantenimiento Industrial**.
Funciona en celular y computador, se instala como app, trabaja sin internet y sincroniza sola al volver la señal.

Todo funciona con el **plan gratuito de Firebase (Spark)**. No pide tarjeta de crédito y no tiene fecha de término.

---

## 1. Antes de empezar: una cuenta de Google del taller

Crea (o usa) una cuenta de Google **de la empresa o del taller**, por ejemplo `taller.mantencion@gmail.com`.
Así la app no depende de la cuenta personal de nadie. Más adelante puedes agregar a otras personas como dueñas del proyecto (paso 8).

## 2. Crear el proyecto en Firebase (10 minutos)

1. Entra a <https://console.firebase.google.com> con la cuenta del taller.
2. **Crear un proyecto** → nombre: `checklis-taller` (o el que quieras).
3. Cuando pregunte por Google Analytics, **desactívalo**. No se necesita.
4. Al terminar, el proyecto queda en el plan **Spark (gratis)**. No actives el plan Blaze.

## 3. Registrar la app web y copiar la configuración

1. En la página del proyecto, toca el ícono **`</>`** (Web).
2. Nombre de la app: `Check-Lis`. **No** marques "Firebase Hosting" en esta pantalla, se configura después.
3. Firebase muestra un bloque `const firebaseConfig = { ... }`.
4. Copia esos valores en el archivo **`public/firebase-config.js`**, dentro de `window.FIREBASE_CONFIG`. Por ejemplo:

```js
window.FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "checklis-taller.firebaseapp.com",
  projectId: "checklis-taller",
  storageBucket: "checklis-taller.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};
```

Estos datos no son secretos: identifican el proyecto. La seguridad está en las reglas (`firestore.rules`), que solo dejan entrar a personas aprobadas.

## 4. Activar el inicio de sesión

1. Menú **Compilación → Authentication → Comenzar**.
2. En **Método de acceso**, activa:
   - **Google** (elige el correo de soporte y guarda).
   - **Correo electrónico/contraseña**.

## 5. Crear la base de datos

1. Menú **Compilación → Firestore Database → Crear base de datos**.
2. Ubicación: **`southamerica-west1` (Santiago)**. No se puede cambiar después.
3. Modo: **producción**. Las reglas correctas se suben en el paso 6.

## 6. Publicar la app (una sola vez, desde un computador)

Necesitas un computador con **Node.js** instalado (<https://nodejs.org>, versión LTS).

Abre una terminal en la carpeta `taller` (la que contiene `firebase.json`) y ejecuta, uno por uno:

```bash
npx firebase-tools login
```

```bash
npx firebase-tools use --add
```

(elige el proyecto `checklis-taller` y como alias escribe `default`)

```bash
npx firebase-tools deploy
```

Al terminar, la app queda publicada en:

**`https://checklis-taller.web.app`** (con el nombre de tu proyecto).

Este comando sube la app y también las reglas de seguridad de la base de datos.

## 7. Primer ingreso: el administrador

1. Abre la dirección de la app y entra con Google o con correo.
2. La **primera persona** que entra ve "Configurar el taller" y queda como **administrador**.
3. Completa tus datos (nombre, área, RUT, turno).
4. Cada trabajador entra con su cuenta, completa sus datos y queda **pendiente**.
5. Tú, como administrador, vas a **Ajustes (engranaje) → Personas y roles** y le asignas su rol:
   - **Mecánico**: llena fichas.
   - **Supervisor**: además entrega el turno y ve el panel y los reportes.
   - **Operador**: solo ve el estado de los equipos; firma en el celular del mecánico.
   - **Administrador**: además aprueba personas y cambia la configuración.
   - **Sin acceso**: para quitarle el acceso a alguien.

En **Ajustes** también defines el turno activo (A o B, turnos 7x7 de día), la hora de término de la jornada, el intervalo de mantención, los ítems de hidráulico y frenos, y las plantillas por tipo de equipo.

## 8. Que la app no dependa de una sola persona

En la consola de Firebase: **Configuración del proyecto (engranaje) → Usuarios y permisos → Agregar miembro**, con rol **Propietario**. Agrega al menos a una segunda persona de confianza.
En la app, asigna también un segundo **Administrador**.

## 9. Instalar en los celulares

- **Android (Chrome):** abre la dirección y toca **Instalar app** (o menú ⋮ → *Instalar aplicación*).
- **iPhone (Safari):** botón **Compartir → Agregar a inicio**.
- En la app, **Ajustes → Instalar en el celular** muestra el botón o las instrucciones.

Una vez instalada:

- Abre sin internet.
- Lo que se registra sin señal queda guardado en el celular y se sube solo al volver la conexión. La barra superior muestra "Sin señal, N por subir".
- Para entrar por primera vez en un celular sí se necesita internet. Después la sesión queda abierta.

## 10. Límites del plan gratuito y mantención

| Recurso | Límite gratis | Uso estimado del taller |
|---|---|---|
| Base de datos | 1 GB | Miles de fichas con fotos |
| Lecturas | 50.000 por día | Unas pocas miles |
| Escrituras | 20.000 por día | Unos cientos a pocos miles |
| Publicación (hosting) | 10 GB y 360 MB/día | La app pesa unos 3 MB y queda guardada en cada celular |

Cada **2 o 3 meses**, el administrador va a **Ajustes → Datos antiguos → Respaldar y borrar fichas antiguas**:

1. Se descarga un **Excel** con las fichas cerradas antiguas. Guárdalo en el computador o en Drive.
2. Luego se borran de la app, con sus fotos y firmas.

Si un día se llega a un límite diario, la app sigue funcionando en el celular y sincroniza al día siguiente. No se pierde nada.

## 11. Publicar una versión nueva

1. Haz los cambios en la carpeta `public`.
2. En `public/sw.js`, sube el número de `VERSION` (por ejemplo `checklis-v2`), para que los celulares descarguen la versión nueva.
3. Ejecuta:

```bash
npx firebase-tools deploy
```

## 12. Probar sin Firebase (modo demostración)

Si `public/firebase-config.js` está vacío, la app abre en **modo demostración**: se entra con nombre y rol, y los datos quedan solo en ese dispositivo. Sirve para mostrarla sin crear el proyecto.

---

### Archivos

| Archivo | Para qué sirve |
|---|---|
| `public/index.html`, `app.js`, `app.css` | La app |
| `public/firebase-config.js` | Datos del proyecto Firebase (paso 3) |
| `public/sw.js` | Guarda la app en el celular para usarla sin internet |
| `public/manifest.webmanifest`, `public/img/` | Ícono y datos para instalarla |
| `public/vendor/`, `public/fonts/` | Librerías y letras incluidas, sin depender de otros servicios |
| `firestore.rules` | Reglas de seguridad: quién puede leer y escribir |
| `firebase.json` | Configuración de publicación |
