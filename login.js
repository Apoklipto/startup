const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const carpetaSesion = path.join(__dirname, 'sesion_facebook');

  console.log('🟢 Abriendo navegador con sesión persistente...');

  const browser = await chromium.launchPersistentContext(carpetaSesion, {
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--start-maximized'
    ],
    viewport: null
  });

  const page = await browser.newPage();

  await page.goto('https://www.facebook.com', { waitUntil: 'networkidle' });

  console.log('🔐 INICIA SESIÓN MANUALMENTE AHORA...');
  console.log('⏳ Tienes 2 minutos para iniciar sesión.');

  await page.waitForTimeout(120000);

  console.log('✅ Sesión guardada en la carpeta "sesion_facebook".');
  console.log('🔒 Cerrando navegador...');

  await browser.close();
  console.log('👍 Listo. Ya puedes usar el robot sin volver a iniciar sesión.');
})();