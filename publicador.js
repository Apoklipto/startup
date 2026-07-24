const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// ======================
// FUNCIÓN PARA LEER TODOS LOS PRODUCTOS DEL CSV
// ======================
function leerTodosLosProductos() {
  const csvPath = path.join(__dirname, 'productos.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error('❌ No se encuentra el archivo productos.csv');
    return [];
  }
  
  const contenido = fs.readFileSync(csvPath, 'utf-8');
  const lineas = contenido.split('\n').filter(linea => linea.trim());
  
  const productos = [];
  
  for (const linea of lineas) {
    const matches = linea.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    
    if (matches && matches.length >= 3) {
      const nombre = matches[0].replace(/"/g, '').trim();
      const descripcion = matches[1].replace(/"/g, '').trim();
      const imagen = matches[2].replace(/"/g, '').trim();
      
      if (descripcion && descripcion.length > 0) {
        const rutaImagen = path.join(__dirname, 'image', imagen);
        if (fs.existsSync(rutaImagen)) {
          productos.push({ nombre, descripcion, imagen });
          console.log(`✅ Producto cargado: ${nombre}`);
        } else {
          console.log(`⚠️ Imagen no encontrada: ${imagen}`);
        }
      } else {
        console.log(`⚠️ Sin descripción: ${nombre}`);
      }
    }
  }
  
  return productos;
}

// ======================
// PROGRAMA PRINCIPAL
// ======================
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
    console.log('⏳ Esperando 5 segundos...');
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
  } catch (error) {
    console.error('❌ No se pudo cargar el grupo:', error.message);
    await browser.close();
    return;
  }

  // ======================
  // 3. CARGAR PRODUCTOS DEL CSV
  // ======================
  console.log('📋 Cargando productos del CSV...');
  const productos = leerTodosLosProductos();
  
  if (productos.length === 0) {
    console.error('❌ No hay productos para publicar');
    await browser.close();
    return;
  }
  
  console.log(`📊 Total: ${productos.length} productos`);

  // ======================
  // 4. BUCLE DE PUBLICACIONES
  // ======================
  for (let index = 0; index < productos.length; index++) {
    console.log(`\n📦 [${index + 1}/${productos.length}] Iniciando publicación...`);
    
    try {
      // Hacer clic en "Escribe algo..."
      console.log('🔍 Buscando "Escribe algo..."...');
      try {
        const cajaTexto = page.locator('span:has-text("Escribe algo...")');
        await cajaTexto.first().waitFor({ state: 'visible', timeout: 30000 });
        await cajaTexto.first().click();
        console.log('🖱️ Clic en "Escribe algo..." exitoso.');
      } catch (error) {
        const botonEscribe = page.locator('div[role="button"]:has(span:text("Escribe algo..."))');
        await botonEscribe.first().waitFor({ state: 'visible', timeout: 30000 });
        await botonEscribe.first().click();
        console.log('🖱️ Clic en botón alternativo exitoso.');
      }

      // Esperar al modal
      console.log('⏳ Esperando modal...');
      const modalPublicacion = page.locator('[role="dialog"]:has-text("Crear publicación")').first();
      await modalPublicacion.waitFor({ state: 'visible', timeout: 15000 });
      await page.waitForTimeout(3000);

      // Buscar editor
      console.log('🔍 Buscando editor...');
      let editor;
      try {
        editor = modalPublicacion.locator('[contenteditable="true"]').first();
        await editor.waitFor({ state: 'visible', timeout: 5000 });
      } catch {
        editor = page.locator('[contenteditable="true"]').first();
        await editor.waitFor({ state: 'visible', timeout: 5000 });
      }
      console.log('✅ Editor encontrado');

      // Inyectar texto
      const producto = productos[index];
      console.log(`⌨️ Publicando: ${producto.nombre}`);
      const texto = `${producto.nombre}\n\n${producto.descripcion}`;
      
      await editor.click();
      await page.waitForTimeout(1500);
      await editor.fill('');
      await page.waitForTimeout(500);
      await editor.fill(texto);
      await page.waitForTimeout(1000);
      console.log('✅ Texto inyectado');

      // Subir imagen
      const rutaImagen = path.join(__dirname, 'image', producto.imagen);
      console.log('📎 Subiendo imagen...');
      
      const fileChooserPromise = page.waitForEvent('filechooser');
      const botonFoto = page.locator('div[aria-label="Foto/video"]').first();
      await botonFoto.waitFor({ state: 'visible', timeout: 10000 });
      await botonFoto.click();
      
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(rutaImagen);
      await page.waitForTimeout(5000);
      console.log('✅ Imagen subida');

      // PUBLICAR
      console.log('🚀 Publicando...');
      const botonPublicar = page.locator('[role="dialog"] div[role="button"]:has-text("Publicar")').first();
      await botonPublicar.waitFor({ state: 'visible', timeout: 10000 });
      console.log('🖱️ [PRUEBA] Clic en Publicar SIMULADO');
      //await botonPublicar.click();
      console.log(`✅ [${index + 1}/${productos.length}] PUBLICADO`);

      // Esperar entre publicaciones
      if (index < productos.length - 1) {
        console.log('⏳ Esperando 15 segundos...');
        await page.waitForTimeout(15000);
      }

    } catch (error) {
      console.error(`❌ Error en producto ${index + 1}:`, error.message);
      await page.screenshot({ path: `error_${Date.now()}.png`, fullPage: true });
    }
  }

  console.log('\n📊 FINALIZADO');
  console.log('⏳ Cerrando en 5 segundos...');
  await page.waitForTimeout(5000);
  await browser.close();
  console.log('🔒 Navegador cerrado.');

})();