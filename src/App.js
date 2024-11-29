import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Box, Drawer, IconButton, CssBaseline, Tooltip } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import CameraAltIcon from "@mui/icons-material/CameraAlt";

// Import des pages
import CustomizeChatGPT from "./components/CustomizeChatGPT";
import ScreenshotPage from "./components/ScreenshotPage";

const App = () => {
  const drawerWidth = "10vw"; // Largeur de la barre latérale

  return (
    <Router>
      <Box sx={{ display: "flex", height: "100vh", overflowX: "hidden" }}>
        <CssBaseline />

        {/* Sidebar */}
        <Drawer
          variant="permanent"
          sx={{
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              backgroundColor: "#f5f5f5",
              height: "100vh",
              overflowX: "hidden", // Empêcher le scroll horizontal ici
            },
          }}
        >
          {/* Icônes de navigation carrées */}
          <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", mt: 2 }}>
            <Tooltip title="Customize ChatGPT" placement="right">
              <IconButton
                component={Link}
                to="/customize"
                sx={{
                  width: "90%", // Taille carrée des icônes
                  height: "auto", // Taille carrée des icônes
                  marginBottom: "1rem",
                  backgroundColor: "#e0e0e0",
                  "&:hover": { backgroundColor: "#4CAF50", color: "#fff" },
                  borderRadius: "0.5rem", // Coins arrondis pour les boutons
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <SettingsIcon fontSize="large" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Screenshot Page" placement="right">
              <IconButton
                component={Link}
                to="/screenshot"
                sx={{
                  width: "90%", // Taille carrée des icônes
                  height: "auto", // Taille carrée des icônes
                  marginBottom: "1rem",
                  backgroundColor: "#e0e0e0",
                  "&:hover": { backgroundColor: "#4CAF50", color: "#fff" },
                  borderRadius: "0.5rem", // Coins arrondis pour les boutons
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <CameraAltIcon fontSize="large" />
              </IconButton>
            </Tooltip>
          </Box>
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            backgroundColor: "#f9f9f9",
            padding: 0,
            width: "90vw", // La largeur du contenu principal est 90vw
            marginLeft: `${drawerWidth}`, // Ajoute la marge pour la sidebar
            overflowX: "hidden", // Empêche le défilement horizontal dans le contenu principal
          }}
        >
          <Routes>
            <Route path="/customize" element={<CustomizeChatGPT />} />
            <Route path="/screenshot" element={<ScreenshotPage />} />
            <Route path="/" element={<CustomizeChatGPT />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
};

export default App;
