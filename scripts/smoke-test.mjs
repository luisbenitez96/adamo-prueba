const WEB_URL = process.env.WEB_URL ?? 'http://localhost:8080';
const MAILPIT_URL = process.env.MAILPIT_URL ?? 'http://localhost:8025';
const NEW_PASSWORD = 'ClaveNueva2026';

const results = [];

function record(name, passed, details = '') {
  results.push({ name, passed });
  console.log(`${passed ? '✔' : '✘'} ${name}${passed ? '' : `  -> ${details}`}`);
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

class Browser {
  cookies = new Map();

  async request(method, path, body) {
    const response = await fetch(`${WEB_URL}${path}`, {
      method,
      redirect: 'manual',
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(this.cookies.size ? { Cookie: this.cookieHeader() } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    this.storeCookies(response.headers.getSetCookie());

    const text = await response.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }

    return { status: response.status, headers: response.headers, text, json };
  }

  storeCookies(setCookieHeaders) {
    for (const header of setCookieHeaders) {
      const [pair] = header.split(';');
      const separator = pair.indexOf('=');
      const name = pair.slice(0, separator);
      const value = pair.slice(separator + 1);
      if (value === '') {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, value);
      }
    }
  }

  cookieHeader() {
    return [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; ');
  }
}

async function waitForTemporaryPassword(email) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const list = await (await fetch(`${MAILPIT_URL}/api/v1/messages`)).json();
    const message = list.messages?.find((item) => item.To?.some((to) => to.Address === email));

    if (message) {
      const detail = await (await fetch(`${MAILPIT_URL}/api/v1/message/${message.ID}`)).json();
      const match = /Contraseña temporal: (\S+)/.exec(detail.Text);
      if (match) {
        return match[1];
      }
    }

    await sleep(500);
  }

  return null;
}

async function main() {
  const email = `smoke-${Date.now()}@correo.com`;
  const browser = new Browser();

  const home = await browser.request('GET', '/');
  record(
    'la web responde con la aplicación',
    home.status === 200 && home.text.includes('<div id="root">'),
  );
  record(
    'la web envía cabeceras de seguridad',
    home.headers.get('content-security-policy')?.includes("default-src 'self'") &&
      home.headers.get('x-content-type-options') === 'nosniff',
  );

  const deepLink = await browser.request('GET', '/dashboard/clientes');
  record(
    'recargar una ruta interna devuelve la aplicación (no un 404)',
    deepLink.status === 200 && deepLink.text.includes('<div id="root">'),
  );

  const health = await browser.request('GET', '/api/health');
  record(
    'la API responde a través de la web',
    health.status === 200 && health.json?.status === 'ok',
  );

  const noSession = await browser.request('GET', '/api/auth/me');
  record(
    'sin sesión, /api/auth/me responde 200 con session null (la consola del navegador queda limpia)',
    noSession.status === 200 && noSession.json?.session === null,
  );

  const staleCookie = await fetch(`${WEB_URL}/api/auth/me`, {
    headers: { Cookie: 'session=basura' },
  });
  const staleCookieBody = await staleCookie.json();
  record(
    'con una cookie inválida, /api/auth/me responde 200 sin sesión y la borra',
    staleCookie.status === 200 &&
      staleCookieBody.session === null &&
      staleCookie.headers.getSetCookie().some((cookie) => cookie.startsWith('session=;')),
  );

  const unauthorizedServices = await browser.request('GET', '/api/services');
  record('sin sesión, /api/services responde 401', unauthorizedServices.status === 401);

  const unauthorizedClients = await browser.request(
    'GET',
    '/api/services/64b7f0c2a1b2c3d4e5f60718/clients',
  );
  record('sin sesión, el listado de clientes responde 401', unauthorizedClients.status === 401);

  const unauthorizedSummary = await browser.request('GET', '/api/summary');
  record('sin sesión, el resumen responde 401', unauthorizedSummary.status === 401);

  const register = await browser.request('POST', '/api/auth/register', { email });
  record('crear cuenta responde 202', register.status === 202);

  const duplicate = await browser.request('POST', '/api/auth/register', { email });
  record(
    'crear la misma cuenta otra vez responde 409',
    duplicate.status === 409 && duplicate.json?.error?.code === 'EMAIL_ALREADY_REGISTERED',
  );

  const temporaryPassword = await waitForTemporaryPassword(email);
  record(
    'la contraseña temporal llega a la bandeja de correo (Mailpit)',
    temporaryPassword !== null,
  );
  if (!temporaryPassword) {
    return;
  }

  const wrong = await browser.request('POST', '/api/auth/login', {
    email,
    password: 'ClaveIncorrecta1',
  });
  record('una contraseña incorrecta responde 401', wrong.status === 401);

  const login = await browser.request('POST', '/api/auth/login', {
    email,
    password: temporaryPassword,
  });
  record(
    'entrar con la temporal exige cambiar la contraseña',
    login.status === 200 && login.json?.requiresPasswordChange === true,
  );
  record('la sesión viaja en una cookie httpOnly', browser.cookies.has('session'));

  const temporarySession = await browser.request('GET', '/api/auth/me');
  record(
    'con la temporal, /api/auth/me indica que falta cambiar la contraseña',
    temporarySession.json?.session?.requiresPasswordChange === true,
  );

  const blocked = await browser.request('GET', '/api/services');
  record(
    'con la temporal, /api/services responde 403',
    blocked.status === 403 && blocked.json?.error?.code === 'PASSWORD_CHANGE_REQUIRED',
  );

  const weak = await browser.request('POST', '/api/auth/change-password', {
    newPassword: 'abc',
    confirmPassword: 'abc',
  });
  record('una contraseña débil se rechaza con 400', weak.status === 400);

  const change = await browser.request('POST', '/api/auth/change-password', {
    newPassword: NEW_PASSWORD,
    confirmPassword: NEW_PASSWORD,
  });
  record(
    'cambiar la contraseña da acceso completo',
    change.status === 200 && change.json?.requiresPasswordChange === false,
  );

  const fullSession = await browser.request('GET', '/api/auth/me');
  record(
    'tras cambiarla, /api/auth/me indica acceso completo',
    fullSession.json?.session?.requiresPasswordChange === false,
  );

  const EXPECTED_SERVICES = [
    ['Adamo Pay', 3827],
    ['Adamo ID', 9411],
    ['Adamo Risk', 793],
    ['Adamo Sign', 2738],
  ];
  const PAGE_SIZE = 20;

  const services = await browser.request('GET', '/api/services');
  const received = services.json?.services?.map((service) => [service.name, service.clientsCount]);
  record(
    'el dashboard recibe los 4 servicios en orden, con las cantidades del diseño (contadas de la base)',
    services.status === 200 && JSON.stringify(received) === JSON.stringify(EXPECTED_SERVICES),
    JSON.stringify(received),
  );

  const [pay, identity] = services.json.services;
  const firstPage = await browser.request('GET', `/api/services/${pay.id}/clients`);
  record(
    'el listado de clientes devuelve la primera página de 20 con el total del servicio',
    firstPage.status === 200 &&
      firstPage.json?.clients?.length === PAGE_SIZE &&
      firstPage.json?.pagination?.total === 3827 &&
      firstPage.json?.pagination?.totalPages === Math.ceil(3827 / PAGE_SIZE),
    JSON.stringify(firstPage.json?.pagination),
  );

  const lastPage = await browser.request('GET', `/api/services/${pay.id}/clients?page=192`);
  record(
    'la última página trae los 7 clientes que sobran',
    lastPage.json?.clients?.length === 3827 % PAGE_SIZE,
    String(lastPage.json?.clients?.length),
  );

  const bigService = await browser.request(
    'GET',
    `/api/services/${identity.id}/clients?pageSize=100`,
  );
  record(
    'un servicio grande (9.411 clientes) pagina de 100 en 100 sin problema',
    bigService.json?.clients?.length === 100 && bigService.json?.pagination?.total === 9411,
  );

  const searchTerm = firstPage.json.clients[0].name.split(' ')[0];
  const searched = await browser.request(
    'GET',
    `/api/services/${pay.id}/clients?search=${encodeURIComponent(searchTerm)}&pageSize=100`,
  );
  const foundTotal = searched.json?.pagination?.total ?? 0;
  record(
    'la búsqueda filtra por nombre: menos resultados que el total, y todos coinciden',
    foundTotal > 0 &&
      foundTotal < 3827 &&
      searched.json.clients.every((client) =>
        `${client.name} ${client.email}`.includes(searchTerm),
      ),
    `${searchTerm}: ${foundTotal}`,
  );

  const accentInsensitive = await browser.request(
    'GET',
    `/api/services/${pay.id}/clients?search=ANDRES&pageSize=100`,
  );
  record(
    'la búsqueda no distingue mayúsculas ni tildes ("ANDRES" encuentra "Andrés")',
    accentInsensitive.json?.clients?.some((client) => client.name.startsWith('Andrés')),
  );

  const tooBig = await browser.request('GET', `/api/services/${pay.id}/clients?pageSize=101`);
  record('un tamaño de página mayor a 100 se rechaza con 400', tooBig.status === 400);

  const summary = await browser.request('GET', '/api/summary');
  const { totalClients, totalServices, clientsByStatus } = summary.json?.summary ?? {};
  const statusTotal = clientsByStatus
    ? clientsByStatus.active + clientsByStatus.pending + clientsByStatus.inactive
    : -1;
  record(
    'el resumen de Inicio cuenta los 16.769 clientes y 4 servicios, y el desglose por estado suma el total',
    summary.status === 200 &&
      totalClients === 16769 &&
      totalServices === 4 &&
      statusTotal === 16769,
    JSON.stringify(summary.json?.summary),
  );

  const unknownService = await browser.request('GET', '/api/services/no-existe/clients');
  record('un servicio que no existe responde 404', unknownService.status === 404);

  const logout = await browser.request('POST', '/api/auth/logout');
  record('cerrar sesión responde 204', logout.status === 204);

  const afterLogout = await browser.request('GET', '/api/auth/me');
  record(
    'tras cerrar sesión, /api/auth/me responde 200 sin sesión',
    afterLogout.status === 200 && afterLogout.json?.session === null,
  );

  const relogin = await browser.request('POST', '/api/auth/login', {
    email,
    password: NEW_PASSWORD,
  });
  record(
    'se puede entrar con la contraseña nueva',
    relogin.status === 200 && relogin.json?.requiresPasswordChange === false,
  );

  const oldPassword = await new Browser().request('POST', '/api/auth/login', {
    email,
    password: temporaryPassword,
  });
  record('la contraseña temporal ya no sirve', oldPassword.status === 401);
}

try {
  await main();
} catch (error) {
  record('la prueba terminó sin errores inesperados', false, String(error));
}

const failed = results.filter((result) => !result.passed);
console.log(`\n${results.length - failed.length} de ${results.length} comprobaciones correctas`);
process.exit(failed.length === 0 ? 0 : 1);
