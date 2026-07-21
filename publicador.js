const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const carpetaSesion = path.join(__dirname, 'sesion_facebook');

  console.log('🟢 Abriendo navegador...');
  const browser = await chromium.launchPersistentContext(carpetaSesion, {
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--start-maximized'
    ],
    viewport: null,
    slowMo: 300
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(120000);

  // ======================
  // 1. IR A FACEBOOK
  // ======================
  console.log('🌐 Navegando a Facebook...');
  try {
    await page.goto('https://www.facebook.com', {
      waitUntil: 'domcontentloaded',
      timeout: 120000
    });
    console.log('⏳ Esperando 50 segundos...');
    await page.waitForTimeout(5000);
    console.log('✅ Facebook cargado.');
  } catch (error) {
    console.error('❌ No se pudo cargar Facebook:', error.message);
    await browser.close();
    return;
  }

  // ======================
  // 2. IR AL GRUPO
  // ======================
  const grupoID = '2280670018999339';
  const urlGrupo = `https://www.facebook.com/groups/${grupoID}`;

  console.log(`➡️ Navegando al grupo ${grupoID}...`);
  try {
    await page.goto(urlGrupo, {
      waitUntil: 'domcontentloaded',
      timeout: 120000
    });
    console.log('✅ URL del grupo cargada.');

    await page.screenshot({ path: 'grupo_cargado.png', fullPage: true });
    console.log('📸 Captura guardada en grupo_cargado.png');
  } catch (error) {
    console.error('❌ No se pudo cargar el grupo:', error.message);
    await browser.close();
    return;
  }

  // ======================
  // 3. HACER CLIC EN "Escribe algo..."
  // ======================
  console.log('🔍 Buscando "Escribe algo..."...');
  try {
    const cajaTexto = page.locator('span:has-text("Escribe algo...")');
    await cajaTexto.first().waitFor({ state: 'visible', timeout: 30000 });
    await cajaTexto.first().click();
    console.log('🖱️ Clic en "Escribe algo..." exitoso.');
  } catch (error) {
    console.error('⚠️ Selector span falló. Probando div[role="button"]...');
    try {
      const botonEscribe = page.locator('div[role="button"]:has(span:text("Escribe algo..."))');
      await botonEscribe.first().waitFor({ state: 'visible', timeout: 30000 });
      await botonEscribe.first().click();
      console.log('🖱️ Clic en botón alternativo exitoso.');
    } catch (error2) {
      console.error('❌ Ningún selector funcionó.');
      await page.screenshot({ path: 'error_final.png', fullPage: true });
      console.log('📸 Captura guardada en error_final.png');
      console.log('⏳ Manteniendo navegador abierto 30 segundos...');
      await page.waitForTimeout(30000);
      await browser.close();
      return;
    }
  }

  // ======================
  // 4. ESCRIBIR TEXTO
  // ======================
  console.log('⌨️ Escribiendo texto...');
  await page.keyboard.type('Hola, esto es una prueba automatizada.', { delay: 50 });
  console.log('✅ Texto escrito.');

// ======================
// 5. SUBIR IMAGEN (Solución con filechooser)
// ======================
const rutaImagen = path.join('C:', 'Users', 'ASUS', 'Desktop', 'startup', 'image', 'F6.jpeg');
console.log('📁 Ruta construida:', rutaImagen);

if (!fs.existsSync(rutaImagen)) {
    console.error('❌ El archivo NO existe en:', rutaImagen);
    await browser.close();
    return;
}
console.log('✅ Archivo encontrado.');

console.log('📎 Preparando subida de imagen...');

try {
    // 1. Crear una promesa que espera el diálogo de archivos
    const fileChooserPromise = page.waitForEvent('filechooser');
    
    // 2. Hacer clic en "Foto/video" (esto abrirá el diálogo nativo)
    await page.getByLabel('Foto/video').click();
    console.log('🖱️ Clic en Foto/video, esperando diálogo...');
    
    // 3. Esperar a que Playwright capture el diálogo
    const fileChooser = await fileChooserPromise;
    console.log('✅ Diálogo de archivos capturado.');
    
    // 4. Inyectar el archivo directamente (sin tocar la ventana del sistema)
    await fileChooser.setFiles(rutaImagen);
    console.log('🖼️ Imagen inyectada correctamente.');
    
    // 5. Esperar a que aparezca la vista previa
    await page.waitForTimeout(5000);
    console.log('✅ Imagen visible en el compositor.');
    
} catch (error) {
    console.error('❌ Error al subir imagen:', error.message);
    await page.screenshot({ path: 'error_subida.png', fullPage: true });
    console.log('📸 Captura guardada en error_subida.png');
}

  console.log('✅ Publicación lista (NO publicada).');
  console.log('⏳ Cerrando en 10 segundos...');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('🔒 Navegador cerrado.');
})();