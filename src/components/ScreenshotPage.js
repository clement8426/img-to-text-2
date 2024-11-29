import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Card, CardContent, Alert, IconButton, TextField, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const ScreenshotPage = () => {
    const [texts, setTexts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    // Pour gérer l'état de l'alerte de suppression
    const [openDialog, setOpenDialog] = useState(false); // Etat pour ouvrir ou fermer le Dialog

    // Charger l'historique à partir de text-history.json
    useEffect(() => {
        const loadHistory = async () => {
            if (!window.electronAPI || !window.electronAPI.loadHistory) {
                setError("L'API de chargement de l'historique n'est pas disponible.");
                return;
            }

            try {
                const history = await window.electronAPI.loadHistory();
                setTexts(history);
            } catch (err) {
                console.error("Erreur lors du chargement de l'historique :", err);
                setError("Erreur lors du chargement de l'historique.");
            }
        };

        loadHistory();
    }, []);

    const handleCaptureAndExtract = () => {
        if (!window.electronAPI || !window.electronAPI.startSelection) {
            setError("L'API de capture n'est pas disponible.");
            return;
        }

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
                    console.error("Erreur lors de l'extraction du texte :", err);
                    setError("Erreur lors de l'analyse de l'image.");
                } finally {
                    setLoading(false);
                }
            } else {
                console.error("Erreur lors de la capture :", error);
                setError("Impossible de capturer l'écran.");
                setLoading(false);
            }
        });

        window.electronAPI.startSelection();
    };

    const handleFileUpload = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleUploadAndExtract = async () => {
        if (!window.electronAPI || !window.electronAPI.uploadImage) {
            setError("L'API de téléchargement d'images n'est pas disponible.");
            return;
        }

        if (!selectedFile) {
            setError("Veuillez sélectionner une image à uploader.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const imageBuffer = e.target.result;
                const response = await window.electronAPI.uploadImage(selectedFile.name, imageBuffer);

                if (response.success) {
                    try {
                        const result = await window.electronAPI.extractTextFromImage(response.filePath);

                        const newText = {
                            date: new Date().toLocaleString(),
                            text: result.text.trim(),
                        };

                        setTexts((prevTexts) => [newText, ...prevTexts]);

                        await window.electronAPI.saveHistory(newText);
                    } catch (err) {
                        console.error("Erreur lors de l'extraction du texte :", err);
                        setError("Erreur lors de l'extraction du texte de l'image uploadée.");
                    }
                } else {
                    setError("Erreur lors de la sauvegarde de l'image.");
                }
            };
            reader.readAsArrayBuffer(selectedFile);
        } catch (err) {
            console.error("Erreur lors de l'upload de l'image :", err);
            setError("Erreur lors de l'upload de l'image.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).catch((err) => {
            console.error("Erreur lors de la copie :", err);
            alert("Impossible de copier le texte.");
        });
    };

    const deleteSingleText = async (indexToRemove) => {
        if (!window.electronAPI || !window.electronAPI.saveHistory) {
            setError("L'API de sauvegarde de l'historique n'est pas disponible.");
            return;
        }

        const updatedTexts = texts.filter((_, index) => index !== indexToRemove);
        setTexts(updatedTexts);

        try {
            await window.electronAPI.saveHistory(updatedTexts);
        } catch (err) {
            console.error("Erreur lors de la sauvegarde de l'historique :", err);
        }
    };

    const clearHistory = async () => {
        if (!window.electronAPI || !window.electronAPI.saveHistory) {
            setError("L'API de sauvegarde de l'historique n'est pas disponible.");
            return;
        }

        setTexts([]);

        try {
            await window.electronAPI.saveHistory([]);
        } catch (err) {
            console.error("Erreur lors de la sauvegarde de l'historique :", err);
        }
    };

    // Ouvre le dialog de confirmation
    const openConfirmationDialog = () => {
        setOpenDialog(true);
    };

    // Ferme le dialog sans supprimer
    const closeConfirmationDialog = () => {
        setOpenDialog(false);
    };

    // Confirme la suppression de tout l'historique
    const confirmDeleteAll = () => {
        clearHistory();
        closeConfirmationDialog(); // Fermer le dialog après confirmation
    };

    return (
        <Box sx={{ padding: '2rem', backgroundColor: '#f9f9f9', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Action buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={handleCaptureAndExtract}
                        disabled={loading}
                        sx={{ width: '48%' }}
                    >
                        {loading ? "Traitement..." : "Capturer et Extraire"}
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={handleUploadAndExtract}
                        disabled={loading || !selectedFile}
                        sx={{ width: '48%' }}
                    >
                        {loading ? "Upload et Extraction..." : "Uploader et Extraire"}
                    </Button>
                </Box>

                {/* File upload input */}
                <Box sx={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <TextField
                        type="file"
                        variant="outlined"
                        onChange={handleFileUpload}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '10px',
                                borderColor: '#4CAF50',
                                padding: '5px 12px',
                            },
                            '& input': {
                                padding: '10px',
                            },
                        }}
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                </Box>

                {/* Error message */}
                {error && (
                    <Alert severity="error" sx={{ marginTop: '1rem' }}>
                        {error}
                    </Alert>
                )}
            </Box>

            {/* History List */}
            <Box
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    marginTop: '1rem',
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
                        Aucun historique disponible pour le moment.
                    </Typography>
                )}
            </Box>

            {/* Dialog de confirmation de suppression */}
            <Dialog open={openDialog} onClose={closeConfirmationDialog}>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogContent>
                    <Typography>
                        Êtes-vous sûr de vouloir supprimer tous les éléments de l'historique ?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeConfirmationDialog} color="primary">
                        Annuler
                    </Button>
                    <Button onClick={confirmDeleteAll} color="error">
                        Supprimer
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Supprimer tout l'historique */}
            <Button
                variant="outlined"
                color="error"
                onClick={openConfirmationDialog}
                sx={{ marginTop: '1rem', alignSelf: 'center' }}
            >
                Supprimer tout l'historique
            </Button>
        </Box>
    );
};

export default ScreenshotPage;
