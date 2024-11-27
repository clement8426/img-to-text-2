import React, { useState } from 'react';
import { Box, Button, Typography, Card, CardContent, Alert, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const ScreenshotPage = () => {
    const [texts, setTexts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleCaptureAndExtract = () => {
        setLoading(true);
        setError(null);

        window.electronAPI.onCaptureDone(async (event, { success, path, error }) => {
            if (success) {
                try {
                    const result = await window.electronAPI.extractTextFromImage(path);

                    const newText = {
                        date: new Date().toLocaleString(),
                        text: result.text.trim(),
                    };

                    setTexts((prevTexts) => [newText, ...prevTexts]);

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
        const updatedTexts = texts.filter((_, index) => index !== indexToRemove);
        setTexts(updatedTexts);

        // Sauvegarder uniquement les éléments restants
        await window.electronAPI.saveHistory(updatedTexts);
    };

    const clearHistory = async () => {
        setTexts([]);
        await window.electronAPI.saveHistory([]);
    };

    return (
        <Box sx={{ padding: '1rem' }}>
            <Typography variant="h4" gutterBottom>
                Capture d'Écran
            </Typography>
            <Box sx={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleCaptureAndExtract}
                    disabled={loading}
                >
                    {loading ? 'Traitement...' : 'Capturer et Extraire'}
                </Button>
                <Button
                    variant="outlined"
                    color="error"
                    onClick={clearHistory}
                    disabled={texts.length === 0}
                >
                    Supprimer l'Historique
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ marginBottom: '1rem' }}>
                    {error}
                </Alert>
            )}

            <Box
                sx={{
                    maxHeight: '500px',
                    overflowY: 'auto',
                    border: '1px solid #e0e0e0',
                    borderRadius: '5px',
                    padding: '1rem',
                    backgroundColor: '#fff',
                }}
            >
                {texts.length > 0 ? (
                    texts.map((item, index) => (
                        <Card
                            key={index}
                            sx={{
                                marginBottom: '1rem',
                                backgroundColor: '#f9f9f9',
                                border: '1px solid #ddd',
                                borderRadius: '5px',
                                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                            }}
                        >
                            <CardContent>
                                <Typography
                                    variant="subtitle2"
                                    color="textSecondary"
                                    gutterBottom
                                >
                                    {item.date}
                                </Typography>
                                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {item.text}
                                </Typography>
                            </CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', padding: '0.5rem' }}>
                                <IconButton
                                    color="primary"
                                    onClick={() => copyToClipboard(item.text)}
                                >
                                    <ContentCopyIcon />
                                </IconButton>
                                <IconButton
                                    color="error"
                                    onClick={() => deleteSingleText(index)}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Box>
                        </Card>
                    ))
                ) : (
                    <Typography textAlign="center" color="textSecondary">
                        Aucune capture effectuée pour le moment.
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default ScreenshotPage;
