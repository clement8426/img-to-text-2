const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    startSelection: () => ipcRenderer.send('start-selection'),
    onCaptureDone: (callback) => {
        ipcRenderer.removeAllListeners('capture-done'); // Supprimer tous les anciens gestionnaires
        if (callback) {
            ipcRenderer.on('capture-done', callback); // Ajouter le nouveau gestionnaire
        }
    },
    extractTextFromImage: (imagePath) => ipcRenderer.invoke('extract-text-from-image', imagePath),
    loadHistory: () => ipcRenderer.invoke('load-history'),
    saveHistory: (newHistory) => ipcRenderer.invoke('save-history', newHistory),
});
