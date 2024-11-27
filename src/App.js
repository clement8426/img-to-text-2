import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import {
  Box,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemText,
  CssBaseline,
  Divider,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

// Import des pages
import CustomizeChatGPT from "./components/CustomizeChatGPT";
import ScreenshotPage from "./components/ScreenshotPage";

const App = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const drawerWidth = 240;

  return (
    <Router>
      <Box sx={{ display: "flex", height: "100vh" }}>
        <CssBaseline />

        {/* Sidebar */}
        <Drawer
          variant={isSmallScreen ? "temporary" : "permanent"}
          sx={{
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              backgroundColor: "#fff",
            },
          }}
        >
          <Box
            sx={{
              background: "linear-gradient(90deg, #4CAF50, #66BB6A)",
              color: "#fff",
              padding: "1rem",
              textAlign: "center",
            }}
          >
            <Typography variant="h6" noWrap>
              Navigation
            </Typography>
          </Box>
          <Divider />
          <List>
            <ListItem
              button
              component={Link}
              to="/customize"
              sx={{
                "&:hover": { backgroundColor: "#f0f0f0" },
              }}
            >
              <SettingsIcon sx={{ mr: 1, color: "#4CAF50" }} />
              <ListItemText primary="Personnaliser ChatGPT" />
            </ListItem>

            <ListItem
              button
              component={Link}
              to="/screenshot"
              sx={{
                "&:hover": { backgroundColor: "#f0f0f0" },
              }}
            >
              <CameraAltIcon sx={{ mr: 1, color: "#4CAF50" }} />
              <ListItemText primary="Capture d'Écran" />
            </ListItem>
          </List>
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            marginLeft: isSmallScreen ? 0 : `${drawerWidth}px`,
            backgroundColor: "#f9f9f9",
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
