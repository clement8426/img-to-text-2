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

    // Capture de la sélection avec déplacement en bas à droite
    ipcMain.on('capture-selection', async (event, { x, y, width, height }) => {
        const originalBounds = mainWindow.getBounds(); // Sauvegarder la position et taille actuelles
        const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize; // Taille de l'écran

        try {
            console.log(`Coordonnées reçues : x=${x}, y=${y}, width=${width}, height=${height}`);

            // Étape 1 : Déplacer en bas à droite et réduire à 0x0
            mainWindow.setBounds({
                x: screenWidth - 1, // Positionner à droite
                y: screenHeight - 1, // Positionner en bas
                width: 0,
                height: 0,
            });

            // Pause pour garantir le déplacement effectif avant la capture
            await new Promise(resolve => setTimeout(resolve, 100));

            // Créer le dossier `img` s'il n'existe pas
            if (!fs.existsSync(imgFolderPath)) {
                fs.mkdirSync(imgFolderPath, { recursive: true });
            }

            // Générer un nom de fichier unique
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `capture-${timestamp}.png`;
            const outputPath = path.join(imgFolderPath, fileName);

            // Capture et découpe
            const imgBuffer = await screenshot({ format: 'png' });
            await sharp(imgBuffer)
                .extract({ left: Math.floor(x), top: Math.floor(y), width: Math.floor(width), height: Math.floor(height) })
                .toFile(outputPath);

            console.log(`Image capturée et enregistrée : ${outputPath}`);

            // Étape 3 : Restaurer la fenêtre après la capture
            mainWindow.setBounds(originalBounds); // Restaurer les dimensions et position d'origine
            mainWindow.show(); // Réafficher la fenêtre

            mainWindow.webContents.send('capture-done', { success: true, path: outputPath });
        } catch (err) {
            console.error('Erreur lors de la capture :', err);

            // Toujours restaurer la fenêtre en cas d'erreur
            mainWindow.setBounds(originalBounds); // Restaurer les dimensions et position
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
            // Charger l'historique existant si nécessaire
            let history = [];
            if (fs.existsSync(historyFilePath)) {
                history = JSON.parse(fs.readFileSync(historyFilePath, 'utf8'));
                history = Array.isArray(history) ? history : [];
            }

            // Si `newHistory` est un tableau, remplacer entièrement l'historique
            if (Array.isArray(newHistory)) {
                history = newHistory;
            } else if (typeof newHistory === 'object' && newHistory !== null) {
                // Sinon, ajouter un nouvel élément
                history.unshift(newHistory);
            }

            // Filtrer les entrées vides ou invalides
            history = history.filter(item => item && typeof item === 'object' && item.text);

            // Sauvegarder le nouvel historique
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
