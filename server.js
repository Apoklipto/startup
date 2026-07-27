const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('dashboard'));

// Servir productos.json
app.get('/api/productos', (req, res) => {
    const datos = JSON.parse(fs.readFileSync('productos.json', 'utf-8'));
    res.json(datos);
});

// Guardar productos.json
app.post('/api/productos', (req, res) => {
    fs.writeFileSync('productos.json', JSON.stringify(req.body, null, 2));
    res.json({ success: true, mensaje: '✅ Productos guardados' });
});

// 🚀 EJECUTAR PUBLICADOR
app.post('/api/publicar', (req, res) => {
    console.log('🚀 Iniciando publicador...');
    
    const proceso = exec('node publicador.js', { cwd: __dirname });
    
    let output = '';
    proceso.stdout.on('data', (data) => output += data);
    proceso.stderr.on('data', (data) => output += data);
    
    proceso.on('close', (code) => {
        res.json({ 
            success: code === 0,
            mensaje: code === 0 ? '✅ Publicación completada' : '❌ Error',
            log: output 
        });
    });
});

// Estado del publicador
app.get('/api/estado', (req, res) => {
    res.json({ 
        ejecutandose: global.publicadorActivo || false,
        ultimaEjecucion: global.ultimaEjecucion || null
    });
});

app.listen(PORT, () => {
    console.log(`✅ Dashboard en: http://localhost:${PORT}`);
    console.log(`📦 API en: http://localhost:${PORT}/api/productos`);
});