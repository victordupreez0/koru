const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';

// In production the built frontend is served over localhost instead of file://
// so the backend CORS policy and Google Sign-In (which requires an http origin) both work.
const PROD_PORT = 5201;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
};

function startStaticServer() {
  const distDir = path.join(__dirname, '../dist');

  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      let filePath = path.normalize(path.join(distDir, urlPath));

      // Stay inside dist; serve index.html for the root and any unknown path (HashRouter handles routing)
      if (!filePath.startsWith(distDir) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distDir, 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });

    server.on('error', (err) => {
      // Port already in use (e.g. a second app instance) — assume it's serving and load it
      if (err.code === 'EADDRINUSE') resolve();
    });

    server.listen(PROD_PORT, '127.0.0.1', () => resolve());
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  if (isDev) {
    // In dev mode load the Vite dev server
    win.loadURL('http://localhost:5200');
  } else {
    // In production load the built frontend from the local static server.
    // 127.0.0.1 (not localhost) avoids IPv6/IPv4 resolution ambiguity on Windows.
    win.loadURL(`http://127.0.0.1:${PROD_PORT}`);
  }

  win.once('ready-to-show', () => win.show());

  // Open external links in the default system browser instead of a new Electron window
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(async () => {
  if (!isDev) await startStaticServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
