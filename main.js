const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const screenshot = require('screenshot-desktop');
const sharp = require('sharp');
const fs = require('fs');
const Tesseract = require('tesseract.js');

const historyFilePath = path.join(__dirname, 'text-history.json');
const imgFolderPath = path.join(__dirname, 'img');
let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            webviewTag: true,
        },
    });

    mainWindow.loadURL('http://localhost:8080');

    ipcMain.on('start-selection', () => {
        const { width, height } = screen.getPrimaryDisplay().workAreaSize;

        const selectionWindow = new BrowserWindow({
            x: 0,
            y: 0,
            width,
            height,
            transparent: true,
            frame: false,
            alwaysOnTop: true,
            webPreferences: { nodeIntegration: true, contextIsolation: false },
        });

        selectionWindow.loadFile('selection.html');
        selectionWindow.on('closed', () => {
            mainWindow.show();
        });
    });

    ipcMain.on('capture-selection', async (event, { x, y, width, height }) => {
        const originalBounds = mainWindow.getBounds();
        const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

        try {
            console.log(`Coordonnées reçues : x=${x}, y=${y}, width=${width}, height=${height}`);

            mainWindow.setBounds({
                x: screenWidth - 1,
                y: screenHeight - 1,
                width: 0,
                height: 0,
            });

            await new Promise(resolve => setTimeout(resolve, 100));

            if (!fs.existsSync(imgFolderPath)) {
                fs.mkdirSync(imgFolderPath, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `capture-${timestamp}.png`;
            const outputPath = path.join(imgFolderPath, fileName);

            const imgBuffer = await screenshot({ format: 'png' });
            await sharp(imgBuffer)
                .extract({ left: Math.floor(x), top: Math.floor(y), width: Math.floor(width), height: Math.floor(height) })
                .toFile(outputPath);

            console.log(`Image capturée et enregistrée : ${outputPath}`);

            mainWindow.setBounds(originalBounds);
            mainWindow.show();

            mainWindow.webContents.send('capture-done', { success: true, path: outputPath });
        } catch (err) {
            console.error('Erreur lors de la capture :', err);

            mainWindow.setBounds(originalBounds);
            mainWindow.show();

            mainWindow.webContents.send('capture-done', { success: false, error: err.message });
        }
    });

    ipcMain.handle('extract-text-from-image', async (event, imagePath) => {
        try {
            const { data: { text } } = await Tesseract.recognize(imagePath, 'eng');
            return { text };
        } catch (err) {
            console.error('Erreur lors de l\'analyse avec Tesseract :', err);
            throw err;
        }
    });

    ipcMain.handle('upload-image', async (event, fileName, imageBuffer) => {
      try {
          if (!fs.existsSync(imgFolderPath)) {
              fs.mkdirSync(imgFolderPath, { recursive: true });
          }

          const outputPath = path.join(imgFolderPath, fileName);
          fs.writeFileSync(outputPath, Buffer.from(imageBuffer));

          console.log(`Image sauvegardée avec succès : ${outputPath}`);
          return { success: true, filePath: outputPath };
      } catch (err) {
          console.error("Erreur lors de l'upload de l'image :", err);
          return { success: false, error: err.message };
      }
    });

    ipcMain.handle('load-history', async () => {
        try {
            if (fs.existsSync(historyFilePath)) {
                const history = JSON.parse(fs.readFileSync(historyFilePath, 'utf8'));
                return Array.isArray(history) ? history : [];
            }
            return [];
        } catch (err) {
            console.error('Erreur lors du chargement de l\'historique :', err);
            return [];
        }
    });

    ipcMain.handle('save-history', async (event, newHistory) => {
        try {
            let history = [];
            if (fs.existsSync(historyFilePath)) {
                history = JSON.parse(fs.readFileSync(historyFilePath, 'utf8'));
                history = Array.isArray(history) ? history : [];
            }

            if (Array.isArray(newHistory)) {
                history = newHistory;
            } else if (typeof newHistory === 'object' && newHistory !== null) {
                history.unshift(newHistory);
            }

            history = history.filter(item => item && typeof item === 'object' && item.text);

            fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2), 'utf8');
            return true;
        } catch (err) {
            console.error('Erreur lors de la sauvegarde de l\'historique :', err);
            return false;
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) app.emit('ready');
});
