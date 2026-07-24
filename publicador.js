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
// 4. ESPERAR A QUE EL MODAL DE PUBLICACIÓN CARGUE
// ======================
console.log('⏳ Esperando a que el modal de publicación cargue...');

// Esperar a que aparezca el modal CORRECTO (el de crear publicación)
// Opción 1: Buscar el modal que contiene "Crear publicación"
const modalPublicacion = page.locator('[role="dialog"]:has-text("Crear publicación")').first();
await modalPublicacion.waitFor({ state: 'visible', timeout: 15000 });
console.log('✅ Modal de publicación detectado.');

// Esperar a que las animaciones terminen
await page.waitForTimeout(3000);

// ======================
// 4.1 BUSCAR EL EDITOR DENTRO DEL MODAL CORRECTO
// ======================
console.log('🔍 Buscando editor de texto...');

let editor = null;

// Intento 1: Buscar contenteditable dentro del modal de publicación
try {
  editor = modalPublicacion.locator('[contenteditable="true"]').first();
  await editor.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✅ Editor encontrado en modal de publicación');
} catch (e1) {
  console.log('❌ Intento 1 falló, buscando en toda la página...');
  
  // Intento 2: Buscar en toda la página
  try {
    editor = page.locator('[contenteditable="true"]').first();
    await editor.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✅ Editor encontrado en página');
  } catch (e2) {
    console.log('❌ Intento 2 falló, esperando más tiempo...');
    
    // Intento 3: Esperar más y reintentar
    await page.waitForTimeout(5000);
    
    try {
      editor = page.locator('[contenteditable="true"]').first();
      await editor.waitFor({ state: 'visible', timeout: 5000 });
      console.log('✅ Editor encontrado después de espera');
    } catch (e3) {
      console.log('❌ Intento 3 falló, buscando alternativas...');
      
      // Intento 4: Buscar cualquier campo de texto
      try {
        editor = page.locator('div[role="textbox"]').first();
        await editor.waitFor({ state: 'visible', timeout: 5000 });
        console.log('✅ Campo de texto alternativo encontrado');
      } catch (e4) {
        console.error('❌ No se encontró ningún editor');
        await page.screenshot({ path: 'error_editor.png', fullPage: true });
        console.log('📸 Screenshot guardado como error_editor.png');
        await browser.close();
        return;
      }
    }
  }
}

// ======================
// 5. INYECTAR TEXTO
// ======================
console.log('⌨️ Preparando para inyectar texto...');

// Hacer clic en el editor para asegurar foco
await editor.click();
await page.waitForTimeout(1500);

// Limpiar texto existente
await editor.fill('');
await page.waitForTimeout(500);

// Inyectar texto
const texto = 'Hola, esto es una prueba automatizada.';
console.log('📝 Inyectando texto:', texto);
await editor.fill(texto);
await page.waitForTimeout(1000);

// Verificar
try {
  const textoActual = await editor.textContent();
  console.log('📋 Texto actual:', textoActual);
  
  if (textoActual && textoActual.includes('prueba automatizada')) {
    console.log('✅ Texto inyectado correctamente');
  } else {
    console.log('⚠️ Reintentando inyección...');
    await editor.fill('');
    await page.waitForTimeout(500);
    await editor.fill(texto);
    await page.waitForTimeout(1000);
    console.log('✅ Texto inyectado (segundo intento)');
  }
} catch (error) {
  console.log('⚠️ No se pudo verificar, continuando...');
}

// ======================
// 6. SUBIR IMAGEN
// ======================
const rutaImagen = path.join('C:', 'Users', 'ASUS', 'Desktop', 'startup', 'image', 'F6.jpeg');
console.log('📁 Ruta:', rutaImagen);

if (!fs.existsSync(rutaImagen)) {
    console.error('❌ Archivo no existe:', rutaImagen);
    await browser.close();
    return;
}
console.log('✅ Archivo encontrado');

console.log('📎 Subiendo imagen...');

try {
    const fileChooserPromise = page.waitForEvent('filechooser');
    
    // Buscar botón Foto/video
    const botonFoto = page.locator('div[aria-label="Foto/video"]').first();
    await botonFoto.waitFor({ state: 'visible', timeout: 10000 });
    await botonFoto.click();
    console.log('🖱️ Clic en Foto/video');
    
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(rutaImagen);
    console.log('🖼️ Imagen subida');
    
    await page.waitForTimeout(5000);
    console.log('✅ Imagen cargada en el compositor');
    
} catch (error) {
    console.error('❌ Error al subir imagen:', error.message);
    await page.screenshot({ path: 'error_subida.png', fullPage: true });
}

console.log('✅ Publicación lista (NO publicada)');
console.log('⏳ Cerrando en 10 segundos...');
await page.waitForTimeout(10000);

await browser.close();
console.log('🔒 Navegador cerrado.');
})();