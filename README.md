# AdamoServices: prueba técnica

Esta es mi solución a la prueba: un login que funciona con contraseña temporal enviada por correo, el cambio obligatorio de esa contraseña y un dashboard de clientes. Está hecho con React (Vite) en el front, Node con Express en el back, MongoDB y JWT.

Lo dejé armado para que se pueda probar sin instalar nada más que Docker. Si sigues los pasos de abajo en orden, no deberías necesitar escribirme. Si algo no funciona, mira la sección "Si algo falla" casi al final, porque probablemente ya lo tengo anotado ahí.

## Qué necesitas instalar

Solo una cosa: Docker Desktop.

- Descárgalo en https://www.docker.com/products/docker-desktop e instálalo (Mac, Windows o Linux).
- Ábrelo y espera a que diga que está corriendo (el ícono de la ballena queda quieto, sin animación).
- Necesitas tener libres los puertos 8080 y 8025 de tu máquina. Si alguno está ocupado, más abajo explico cómo cambiarlo.
- Espacio en disco: unos 2 GB entre imágenes y contenedores.

No necesitas instalar Node, ni MongoDB, ni un servidor de correo. Todo eso corre dentro de los contenedores. Tampoco necesitas una cuenta de correo real: los correos que manda la aplicación no salen a internet, llegan a una bandeja de pruebas que también levanta Docker.

Lo desarrollé y probé en un Mac con Apple Silicon. En Windows y Linux debería funcionar igual porque todo corre en contenedores, pero ahí no lo he probado yo.

## Cómo descargarlo y levantarlo

1. Descarga el proyecto. Tienes dos opciones:
   - Con git: `git clone https://github.com/luisbenitez96/adamo-prueba.git`
   - Sin git: en la página del repositorio en GitHub, botón verde "Code", luego "Download ZIP", y descomprime el archivo.

2. Abre una terminal dentro de la carpeta del proyecto (la que tiene el archivo `docker-compose.yml`). En Windows puede ser PowerShell. Si no sabes cómo, en Mac y Windows basta con abrir la carpeta, hacer clic derecho y elegir abrir terminal ahí.

3. Con Docker Desktop ya corriendo, ejecuta:

   ```
   docker compose up --build
   ```

4. Espera. La primera vez Docker descarga las imágenes (MongoDB, Mailpit, Node y nginx, unos 1,5 GB en total) y construye la aplicación, así que dependiendo de tu internet puede tardar unos minutos. En mi máquina, con las imágenes ya descargadas, todo queda listo en unos 20 segundos.

5. Sabes que terminó cuando en la terminal aparecen estas dos líneas del servicio `api`:

   ```
   Conectado a MongoDB
   API escuchando en el puerto 3000 (production)
   ```

   Si prefieres que la terminal quede libre, usa `docker compose up --build -d` y comprueba el estado con `docker compose ps`: los cuatro servicios (mongo, mailpit, api y web) deben aparecer como `healthy`.

6. Abre http://localhost:8080 en el navegador.

Para parar todo, `Ctrl + C` en esa terminal (o `docker compose down` si lo levantaste con `-d`). Los datos se guardan en un volumen de Docker, así que al volver a levantar siguen ahí. Si quieres empezar totalmente de cero, incluyendo la base de datos, usa `docker compose down -v`.

### Si el puerto 8080 u 8025 está ocupado

Docker te va a decir algo como "port is already allocated". Crea un archivo llamado `.env` (con ese nombre exacto, sin nada más) al lado del `docker-compose.yml` con estas líneas, cambiando los números por puertos libres:

```
WEB_PORT=8081
MAILPIT_PORT=8026
```

Vuelve a ejecutar `docker compose up --build`. A partir de ahí la aplicación queda en http://localhost:8081 y la bandeja de correos en http://localhost:8026. Los enlaces dentro de los correos también se ajustan solos.

## Cómo probar el flujo completo

Lo que hice fue exactamente lo que pide la prueba: el usuario pone su correo, recibe una contraseña aleatoria, entra con ella, la aplicación le obliga a cambiarla y solo después ve el dashboard. Estos son los pasos para recorrerlo:

1. En http://localhost:8080 aparece el login. Como es la primera vez y todavía no existe ningún usuario, haz clic en "Crear cuenta" (abajo del botón "Iniciar sesión").

2. Escribe cualquier correo. No tiene que existir de verdad. Por ejemplo `prueba@example.com`. Pulsa "Crear cuenta". Aparece la pantalla "Revisa tu correo", que dice que te enviamos una contraseña temporal, con un botón "Ir a iniciar sesión".

3. Abre la bandeja de correos en http://localhost:8025. Es Mailpit, un servidor de correo de pruebas. Ahí va a estar un mensaje con el asunto "Tu contraseña temporal de AdamoServices". Ábrelo y copia la contraseña (12 caracteres, mezcla de mayúsculas, minúsculas y números). Vence a los 15 minutos.

4. Vuelve a la aplicación (el botón "Ir a iniciar sesión" te lleva) y entra con tu correo y esa contraseña temporal.

5. La aplicación te lleva sola a "Actualiza tu contraseña". Escribe una nueva dos veces. Tiene que tener al menos 8 caracteres, una mayúscula y un número. No puedes usar la temporal ni ninguna de tus últimas contraseñas.

6. Al terminar entras a la pantalla de Inicio. Desde ahí puedes recorrer todo:
   - Inicio: un resumen con el total de clientes, cuántos están activos, pendientes e inactivos, y la lista de servicios.
   - Clientes (menú lateral, o la barra de abajo en el celular): las cuatro tarjetas del diseño, con Adamo Pay, Adamo ID, Adamo Risk y Adamo Sign.
   - "Gestionar clientes" en cualquier tarjeta: la lista de clientes de ese servicio, con buscador y paginación.
   - La campanita arriba a la derecha: tus notificaciones de seguridad.
   - "Cerrar sesión" en el menú lateral (en el celular está en "Más").

Otros caminos que vale la pena probar:

- Si olvidas la contraseña, en el login está el texto "¿Olvidaste tu contraseña? Haz click aquí". Pide una temporal nueva a tu correo y llega a la misma bandeja.
- Si intentas crear una cuenta con un correo que ya existe, el error sale justo debajo del campo ("Este correo ya está registrado") y no se manda ningún correo.
- Si escribes mal la contraseña, sale un error genérico que no dice si el fallo fue el correo o la contraseña.
- Puedes redimensionar la ventana o abrirlo en el celular: es responsive. En pantallas chicas el menú lateral se convierte en una barra de navegación abajo, con Inicio, Clientes y Más.

## Qué hace cada pantalla

El diseño que me dieron tenía tres pantallas: el login, el cambio de contraseña y el dashboard de Clientes. Las construí tal cual las vi en los archivos de la carpeta `design/`. Lo demás lo agregué yo porque el flujo lo necesitaba o porque me sobró tiempo para dejar la aplicación más completa:

- Crear cuenta y Recuperar contraseña. Sin la primera no habría forma de que existiera el primer usuario, y la segunda es el "Haz click aquí" que ya traía el diseño del login.
- Inicio, con el resumen de clientes y los servicios.
- La lista de clientes de cada servicio.
- La campanita de notificaciones.

Hay dos controles que están como en el diseño pero a propósito no hacen nada: "Mi perfil" y "Ver todos los servicios". No los quise inventar.

## La base de datos

Uso MongoDB 7 corriendo en su propio contenedor, con Mongoose en el backend.

- La API se conecta a `mongodb://mongo:27017/adamo`. Ahí `mongo` es el nombre del servicio en `docker-compose.yml` (Docker resuelve ese nombre dentro de su red interna) y `adamo` es el nombre de la base.
- Esa cadena se pasa a la API con la variable de entorno `MONGO_URI`, que ya viene puesta en el `docker-compose.yml`. No tienes que configurar nada.
- MongoDB no está expuesto a tu máquina (no abre el puerto 27017 hacia afuera) para no chocar con un Mongo que ya tengas instalado. Si quieres mirar los datos, la forma más fácil es entrar al contenedor:

  ```
  docker compose exec mongo mongosh adamo
  ```

  Y ya dentro, por ejemplo:

  ```
  show collections
  db.users.find().pretty()
  db.clients.countDocuments()
  db.notifications.find().pretty()
  ```

- Si prefieres conectar una herramienta como MongoDB Compass desde tu máquina, agrega esto al servicio `mongo` en `docker-compose.yml`, vuelve a levantar y conéctate a `mongodb://localhost:27017/adamo`:

  ```
  ports:
    - '27017:27017'
  ```

Las colecciones son cuatro:

- `users`: el correo, el hash de la contraseña (con bcrypt, nunca la contraseña en texto plano), el hash de la contraseña temporal con su vencimiento y el historial de las últimas contraseñas.
- `services`: los cuatro servicios del dashboard.
- `clients`: los clientes de cada servicio.
- `notifications`: las alertas de seguridad de cada usuario.

### Los datos de los clientes

Los números del diseño (3.827, 9.411, 793 y 2.738 clientes) no están escritos a mano en la pantalla. Quería que fueran reales, así que la API, al arrancar por primera vez, genera esos 16.769 clientes y los guarda en MongoDB. Los contadores de las tarjetas y del resumen de Inicio se calculan contando lo que hay en la base.

Son datos inventados, no hay nadie real ahí. Los nombres y las ciudades son de Colombia y los correos terminan en `example.com`, `example.org` o `example.net`, que son dominios reservados para ejemplos. El generador es determinista, o sea que siempre produce los mismos clientes, y el proceso se puede repetir sin duplicar nada: si reinicias la API no se vuelven a crear. Si se borra alguno, lo repone.

## El correo

La aplicación envía los correos por SMTP con Nodemailer. En el `docker-compose.yml` el servidor SMTP es Mailpit, que atrapa todo lo que se envía y lo muestra en una bandeja web (http://localhost:8025). Elegí eso para que quien pruebe no tenga que configurar una cuenta de Gmail ni nada parecido.

Si algún día se quiere usar un SMTP real, solo hay que cambiar las variables `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` y `MAIL_FROM`. El código no cambia, porque el envío está detrás de una interfaz.

## Variables de entorno

Con Docker no tienes que configurar ninguna: el `docker-compose.yml` ya trae lo necesario. Esta tabla es por si quieres cambiar algo o correr la API a mano. Las que tienen valor por defecto no hace falta definirlas.

| Variable                    | Por defecto                                   | Para qué sirve                                                            |
| --------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| `PORT`                      | 3000                                          | Puerto de la API                                                          |
| `NODE_ENV`                  | development                                   | `production` dentro de Docker                                             |
| `MONGO_URI`                 | mongodb://localhost:27017/adamo               | Conexión a MongoDB                                                        |
| `APP_URL`                   | http://localhost:8080                         | URL pública del front, la usan los enlaces de los correos                 |
| `TRUST_PROXY`               | false                                         | `true` dentro de Docker porque la API está detrás de nginx                |
| `JWT_SECRET`                | sin valor (obligatoria, mínimo 32 caracteres) | Clave con la que se firman los tokens. En Docker trae una de demostración |
| `JWT_EXPIRES_IN_MINUTES`    | 60                                            | Duración de la sesión                                                     |
| `COOKIE_SECURE`             | false                                         | Debe ser `true` si se sirve por HTTPS                                     |
| `TEMP_PASSWORD_TTL_MINUTES` | 15                                            | Vida de la contraseña temporal                                            |
| `SMTP_HOST` / `SMTP_PORT`   | localhost / 1025                              | Servidor de correo                                                        |
| `SMTP_USER` / `SMTP_PASS`   | vacías                                        | Credenciales SMTP, si el servidor las pide                                |
| `MAIL_FROM`                 | `AdamoServices <no-reply@adamo.local>`        | Remitente de los correos                                                  |
| `WEB_PORT`                  | 8080                                          | Solo Docker: puerto donde se abre la web                                  |
| `MAILPIT_PORT`              | 8025                                          | Solo Docker: puerto de la bandeja de correos                              |

Ojo con `JWT_SECRET`: la que viene en el `docker-compose.yml` es de demostración. En un entorno real habría que reemplazarla por una propia, larga y secreta (por ejemplo definiéndola en el `.env`).

## Cómo correrlo sin Docker (para desarrollar)

No hace falta para evaluar la prueba, pero lo dejo por si quieren verlo corriendo en modo desarrollo. Necesitas Node 20 o superior.

1. En la carpeta del proyecto: `npm install`
2. Copia `.env.example` como `.env` (en Mac o Linux: `cp .env.example .env`; en PowerShell: `Copy-Item .env.example .env`). Ya viene con valores para desarrollo local.
3. Necesitas un MongoDB y un servidor de correo de pruebas escuchando en tu máquina. La forma más simple es con Docker:

   ```
   docker run -d --name adamo-mongo -p 27017:27017 mongo:7
   docker run -d --name adamo-mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit
   ```

4. En una terminal, la API: `npm run dev -w @adamo/api` (queda en el puerto 3000).
5. En otra terminal, el front: `npm run dev -w @adamo/web` (queda en http://localhost:5173 y reenvía las llamadas `/api` a la API).
6. La bandeja de correos queda en http://localhost:8025.

## Pruebas

Escribí las pruebas junto con cada cambio, no al final. Son unas 950 entre la API y el front. Los comandos, desde la carpeta del proyecto y después de `npm install`:

```
npm test              # todas las pruebas (API y front)
npm run lint          # revisión de código
npm run typecheck     # revisión de tipos de TypeScript
npm run format:check  # formato
```

Las de la API usan una base MongoDB real en memoria (`mongodb-memory-server`), así que no necesitas tener Mongo instalado para correrlas, y se prueba el flujo completo por HTTP. Las del front usan Testing Library y MSW para simular la API. Además de escribirlas, comprobé que de verdad fallan: fui rompiendo el código a propósito (cambiando una condición, quitando una validación, etc.) y verifiqué que alguna prueba se pusiera en rojo cada vez.

También hay una prueba de humo que recorre el sistema ya levantado con Docker, igual que lo haría una persona: crea una cuenta, lee la contraseña temporal de Mailpit, entra, la cambia, revisa el dashboard y las notificaciones, y cierra sesión. Son 37 comprobaciones. Con el sistema corriendo:

```
npm run smoke
```

Si cambiaste los puertos, díselo con variables: `WEB_URL=http://localhost:8081 MAILPIT_URL=http://localhost:8026 npm run smoke` (en PowerShell: `$env:WEB_URL="http://localhost:8081"; $env:MAILPIT_URL="http://localhost:8026"; npm run smoke`). Necesita Node 20 o superior.

## Decisiones que tomé y por qué

Estas son las cosas que no vienen en el enunciado y que quiero que sepan que las pensé:

- El token JWT va en una cookie `httpOnly` con `SameSite=Lax`, no en `localStorage`. Así ningún JavaScript de la página puede leerlo, ni siquiera si hubiera una falla de XSS. Para que el navegador y la API compartan origen (y no haya líos de CORS ni de cookies), el front lo sirve nginx y este reenvía todo lo que empieza con `/api` hacia la API.
- El token trae un alcance: `password-change` cuando entraste con la temporal y `full` cuando ya definiste tu contraseña. La API rechaza cualquier ruta del dashboard si el alcance no es `full` (responde 403). No es solo el front el que te bloquea: aunque alguien se saltara la pantalla, el backend no le entrega datos.
- Pedir una contraseña temporal no borra tu contraseña actual. La temporal se guarda aparte, vence a los 15 minutos y se gasta al usarla. Lo hice así porque "olvidé mi contraseña" solo pide el correo; si invalidara la contraseña actual, cualquiera podría dejar fuera a otra persona con solo escribir su correo. Cuando entras con la temporal y la cambias, ahí sí la anterior deja de servir.
- No se pueden reutilizar contraseñas: la nueva no puede ser la temporal, la actual ni ninguna de las 5 anteriores. Se guardan solo los hashes.
- Para no revelar qué correos existen, "Recuperar contraseña" responde siempre lo mismo, exista o no el correo. La excepción es "Crear cuenta": ahí sí avisa que el correo ya está registrado, porque así lo pidió el flujo (el mensaje sale debajo del campo, sin enviar correo). Es una decisión de usabilidad que tiene su costo, y prefiero decirlo.
- Límites contra abuso: máximo 20 solicitudes de crear cuenta o recuperar por IP cada 15 minutos, máximo 10 intentos fallidos de login por IP cada 15 minutos, y una sola temporal por correo por minuto.
- Las contraseñas se guardan con bcrypt, las temporales se generan con `crypto.randomInt` (no con `Math.random`) y la API usa `helmet`. nginx agrega cabeceras de seguridad (CSP, `X-Frame-Options`, `nosniff`).
- Todas las cargas muestran un spinner que dura al menos un tiempo mínimo (500 ms en datos, 300 ms al cambiar de pantalla). Así se percibe que algo está pasando y no hay parpadeos cuando el servidor responde demasiado rápido.

## Cómo está organizado el código

El proyecto es un monorepo con npm workspaces:

```
apps/api        Backend: Express 5 + TypeScript + Mongoose
apps/web        Frontend: React 19 + Vite + Tailwind + TypeScript
design/         Los archivos del diseño que me dieron
scripts/        La prueba de humo
docker-compose.yml
```

En el backend cada módulo (auth, users, services, clients, summary, notifications) tiene sus capas: rutas, controlador, servicio y repositorio. Los servicios dependen de interfaces (el repositorio de usuarios, el que envía correos, el que genera contraseñas, el que firma tokens, el que publica notificaciones) y no de Mongoose, Nodemailer o bcrypt directamente. Todo se conecta en un solo lugar, `apps/api/src/container.ts`. Eso es lo que me permitió probar cada pieza por separado y es mi forma de aplicar SOLID aquí. Los errores salen todos con la misma forma (`{ "error": { "code", "message" } }`) a través de un manejador central.

En el front, el código está por funcionalidad (`features/auth`, `features/dashboard`, `features/notifications`), con los componentes de interfaz reutilizables en `components/ui`. Cada componente tiene sus estilos en un archivo aparte (`algo.styles.ts`). Las pantallas protegidas se resuelven en el router con guardas: sin sesión te manda al login, con la contraseña temporal sin cambiar te manda a cambiarla.

### Los endpoints de la API

Todos responden JSON. Los de la última fila requieren sesión con alcance `full`.

| Método | Ruta                          | Qué hace                                                                 |
| ------ | ----------------------------- | ------------------------------------------------------------------------ |
| GET    | `/api/health`                 | Estado de la API                                                         |
| POST   | `/api/auth/register`          | Crea la cuenta y envía la contraseña temporal                            |
| POST   | `/api/auth/forgot-password`   | Envía una contraseña temporal nueva                                      |
| POST   | `/api/auth/login`             | Inicia sesión (cookie)                                                   |
| GET    | `/api/auth/me`                | Dice si hay sesión. Siempre responde 200                                 |
| POST   | `/api/auth/change-password`   | Cambia la contraseña (solo con sesión de contraseña temporal)            |
| POST   | `/api/auth/logout`            | Cierra sesión                                                            |
| GET    | `/api/services`               | Los servicios con su cantidad de clientes                                |
| GET    | `/api/services/:id/clients`   | Clientes de un servicio. Admite `page`, `pageSize` (máx. 100) y `search` |
| GET    | `/api/summary`                | Totales para la pantalla de Inicio                                       |
| GET    | `/api/notifications`          | Las últimas 20 notificaciones y cuántas están sin leer                   |
| POST   | `/api/notifications/read`     | Marca todas como leídas                                                  |
| POST   | `/api/notifications/:id/read` | Marca una como leída                                                     |

Sobre `/api/auth/me`: responde siempre 200, con `{ "session": null }` cuando no hay sesión. Lo hice así a propósito para que la consola del navegador no se llene de errores rojos 401 cada vez que alguien abre la página sin haber iniciado sesión.

## Si algo falla

- "Cannot connect to the Docker daemon" o algo parecido: Docker Desktop no está abierto. Ábrelo, espera a que arranque y repite el comando.
- "port is already allocated": un puerto está ocupado. Mira la parte de arriba sobre cómo cambiar `WEB_PORT` y `MAILPIT_PORT`.
- "docker: 'compose' is not a command": tienes una versión muy vieja de Docker. Con Docker Desktop actual viene incluido; si usas la versión antigua, el comando es `docker-compose` con guion, pero lo mejor es actualizar.
- La página abre pero dice "No pudimos cargar la aplicación": la API todavía está arrancando o falló. Espera unos segundos y pulsa "Reintentar". Si sigue igual, mira los registros con `docker compose logs api`.
- No llega el correo con la contraseña: no sale a ningún correo real. Búscalo en la bandeja de Mailpit, en http://localhost:8025 (o el puerto que hayas puesto en `MAILPIT_PORT`). Si pasó más de un minuto desde la última solicitud para ese correo y aun así no llega, vuelve a pedirla; solo se envía una por minuto.
- La contraseña temporal no funciona: vence a los 15 minutos y se gasta al usarla. Pide otra con "¿Olvidaste tu contraseña? Haz click aquí".
- Sale "Demasiados intentos, inténtalo más tarde": es el límite contra abuso (10 intentos fallidos de login en 15 minutos). Espera, o reinicia la API con `docker compose restart api`, que borra ese contador.
- Quiero empezar de cero: `docker compose down -v` borra los contenedores y la base de datos, y luego `docker compose up --build` los crea otra vez.
- Algo se quedó a medias después de tocar cosas: `docker compose down -v` y levantar de nuevo casi siempre lo arregla.

Cualquier otra cosa que no esté aquí, me escribes. Gracias por tomarte el tiempo de probarlo.
