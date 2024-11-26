import React, { useState, useEffect } from 'react';

const App = () => {
    const [texts, setTexts] = useState([]); // Stocke les textes extraits
    const [loading, setLoading] = useState(false); // Indique si une extraction est en cours
    const [error, setError] = useState(null); // Gère les erreurs

    // Charger l'historique depuis le backend au démarrage
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const history = await window.electronAPI.loadHistory(); // Récupère l'historique du backend
                setTexts(Array.isArray(history) ? history : []); // Met à jour l'état avec l'historique
            } catch (err) {
                console.error('Erreur lors du chargement de l\'historique :', err);
                setTexts([]); // En cas d'erreur, réinitialisez l'état
            }
        };

        loadHistory();
    }, []); // Chargé une seule fois au montage

    const handleCaptureAndExtract = () => {
        setLoading(true);
        setError(null);

        // Ajouter le gestionnaire pour traiter la capture
        window.electronAPI.onCaptureDone(async (event, { success, path, error }) => {
            if (success) {
                try {
                    const result = await window.electronAPI.extractTextFromImage(path);

                    const newText = {
                        date: new Date().toLocaleString(),
                        text: result.text.trim(),
                    };

                    // Ajouter à l'état local
                    setTexts((prevTexts) => [
                        newText,
                        ...(Array.isArray(prevTexts) ? prevTexts : []),
                    ]);

                    // Sauvegarder uniquement le nouveau texte
                    await window.electronAPI.saveHistory(newText);

                    // Copier automatiquement dans le presse-papiers
                    await navigator.clipboard.writeText(newText.text);
                } catch (err) {
                    console.error('Erreur lors de l\'extraction du texte :', err);
                    setError('Erreur lors de l\'analyse de l\'image.');
                } finally {
                    setLoading(false);
                }
            } else {
                console.error('Erreur lors de la capture :', error);
                setError('Impossible de capturer l\'écran.');
                setLoading(false);
            }
        });

        window.electronAPI.startSelection();
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).catch((err) => {
            console.error('Erreur lors de la copie :', err);
            alert('Impossible de copier le texte.');
        });
    };

    const deleteSingleText = async (indexToRemove) => {
      // Filtrer les éléments pour exclure celui à supprimer
      const updatedTexts = texts.filter((_, index) => index !== indexToRemove);
      setTexts(updatedTexts);

      // Sauvegarder uniquement les éléments restants
      await window.electronAPI.saveHistory(updatedTexts);
  };

  const clearHistory = async () => {
      // Réinitialiser l'état local
      setTexts([]);

      // Réinitialiser l'historique dans le fichier JSON
      await window.electronAPI.saveHistory([]);
  };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>Capture et Extraction de Texte</h1>
            <button
                onClick={handleCaptureAndExtract}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    border: '1px solid black',
                    borderRadius: '5px',
                    marginBottom: '20px',
                }}
            >
                Capturer et Extraire le Texte
            </button>
            <button
                onClick={clearHistory}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    border: '1px solid red',
                    borderRadius: '5px',
                    marginLeft: '10px',
                    color: 'white',
                    backgroundColor: 'red',
                }}
            >
                Supprimer l'Historique
            </button>
            {loading && <p>Traitement en cours...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div
                style={{
                    maxHeight: '400px',
                    overflowY: 'scroll',
                    border: '1px solid gray',
                    borderRadius: '5px',
                    padding: '10px',
                    marginTop: '20px',
                }}
            >
                {texts.length > 0 ? (
                    texts.map((item, index) => (
                        <div
                            key={index}
                            style={{
                                marginBottom: '20px',
                                padding: '10px',
                                background: '#f9f9f9',
                                borderRadius: '5px',
                                border: '1px solid #ddd',
                            }}
                        >
                            <p style={{ margin: 0, fontWeight: 'bold' }}>
                                {item.date}
                            </p>
                            <p style={{ whiteSpace: 'pre-wrap', margin: '10px 0' }}>
                                {item.text}
                            </p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => copyToClipboard(item.text)}
                                    style={{
                                        padding: '5px 10px',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        border: '1px solid black',
                                        borderRadius: '5px',
                                    }}
                                >
                                    Copier
                                </button>
                                <button
                                    onClick={() => deleteSingleText(index)}
                                    style={{
                                        padding: '5px 10px',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        border: '1px solid red',
                                        borderRadius: '5px',
                                        color: 'white',
                                        backgroundColor: 'red',
                                    }}
                                >
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>Aucune capture effectuée pour le moment.</p>
                )}
            </div>
        </div>
    );
};

export default App;
