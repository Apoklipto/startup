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
  const grupoID = '1731721740715291';
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
// 5. SUBIR IMAGEN (sin abrir explorador)
// ======================
const rutaImagen = path.join('C:', 'Users', 'ASUS', 'Desktop', 'startup', 'image', 'F6.jpeg');
console.log('📁 Ruta construida:', rutaImagen);

// Verificar que el archivo existe
if (fs.existsSync(rutaImagen)) {
  console.log('✅ Archivo encontrado en disco.');
} else {
  console.error('❌ El archivo NO existe en:', rutaImagen);vb
}
console.log('📎 Buscando input de archivo oculto...');


// Estrategia: buscar el input[type="file"] que ya existe en el DOM (sin hacer clic en Foto/video)
// Facebook lo tiene oculto pero presente. Lo forzamos a estar disponible.
try {
  // Intentamos directamente con el input de archivo (sin abrir explorador)
  const inputFile = page.locator('input[type="file"][accept*="image"]').first();
  
  // Forzamos que sea visible para Playwright (aunque esté oculto visualmente)
  await inputFile.evaluate(el => {
    el.style.display = 'block';
    el.style.visibility = 'visible';
    el.style.opacity = '1';
    el.style.position = 'fixed';
    el.style.top = '0';
    el.style.left = '0';
    el.style.zIndex = '9999';
  });
  
  // Ahora le asignamos la imagen directamente
  await inputFile.setInputFiles(rutaImagen);
  console.log('🖼️ Imagen inyectada directamente en el input.');
  await page.waitForTimeout(5000);
} catch (error) {
  console.error('❌ No se pudo inyectar la imagen sin diálogo:', error.message);
  
  // Plan B: hacer clic en Foto/video y luego inyectar rápido
  console.log('🔄 Probando método alternativo...');
  try {
    await page.getByLabel('Foto/video').click();
    await page.waitForTimeout(1000);
    const inputFile2 = page.locator('input[type="file"]').first();
    await inputFile2.setInputFiles(rutaImagen);
    console.log('🖼️ Imagen subida con método alternativo.');
    await page.waitForTimeout(5000);
  } catch (error2) {
    console.error('❌ Error también en método alternativo:', error2.message);
    await page.screenshot({ path: 'error_subida.png', fullPage: true });
  }
}

  console.log('✅ Publicación lista (NO publicada).');
  console.log('⏳ Cerrando en 10 segundos...');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('🔒 Navegador cerrado.');
})();