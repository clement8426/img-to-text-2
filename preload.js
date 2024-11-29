const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    startSelection: () => ipcRenderer.send('start-selection'),
    onCaptureDone: (callback) => {
        ipcRenderer.removeAllListeners('capture-done');
        if (callback) {
            ipcRenderer.on('capture-done', callback);
        }
    },
    extractTextFromImage: (imagePath) => ipcRenderer.invoke('extract-text-from-image', imagePath),
    loadHistory: () => ipcRenderer.invoke('load-history'),
    saveHistory: (newHistory) => ipcRenderer.invoke('save-history', newHistory),
    uploadImage: (fileName, imageBuffer) => ipcRenderer.invoke('upload-image', fileName, imageBuffer), // Vérifiez cette ligne
});
