import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import { Info, BookOpen, Compass, MessageSquare, Users, HelpCircle } from 'lucide-react'; // Added more icons

const drawerWidth = 240;
const collapsedDrawerWidth = 60; // Width when collapsed

interface PermanentDrawerLeftProps {
  children: React.ReactNode;
  onDisclaimerClick: () => void;
  onSlokasClick: () => void;
  onDashboardClick: () => void;
  onBlessingsClick: () => void; // Added for BalaSwamiji's Blessings
  onGuideClick: () => void; // Added for User Guide
}

export default function PermanentDrawerLeft({ 
  children, 
  onDisclaimerClick, 
  onSlokasClick,
  onDashboardClick,
  onBlessingsClick,
  onGuideClick
}: PermanentDrawerLeftProps) {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(true);

  const handleDrawerToggle = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const currentDrawerWidth = isDrawerOpen ? drawerWidth : collapsedDrawerWidth;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${currentDrawerWidth}px)`,
          ml: `${currentDrawerWidth}px`,
          bgcolor: 'rgba(12, 10, 9, 0.7)', // Darker, less transparent AppBar
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 215, 0, 0.2)' // Subtle gold border
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: 2, color: '#FFD700' }} // Style for the icon button
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ color: '#FFD700', fontWeight: 'bold' }}>
            Sri Guru Dig Vandanam
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: currentDrawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: currentDrawerWidth,
            boxSizing: 'border-box',
            bgcolor: 'rgba(12, 10, 9, 0.85)', // Dark background for drawer
            color: '#EAEAEA', // Light text color for drawer
            borderRight: '1px solid rgba(255, 215, 0, 0.2)',
            overflowX: 'hidden', // Prevent horizontal scroll when collapsed
            transition: (theme) => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
        variant="permanent"
        anchor="left"
        open={isDrawerOpen} // Control open state
      >
        <Toolbar /> 
        <Divider sx={{ borderColor: 'rgba(255, 215, 0, 0.1)' }} />
        <List>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton 
              onClick={onDashboardClick} 
              sx={{ 
                minHeight: 48,
                justifyContent: isDrawerOpen ? 'initial' : 'center',
                px: 2.5,
                '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.1)' } 
              }}
            >              <ListItemIcon sx={{ minWidth: 0, mr: isDrawerOpen ? 3 : 'auto', justifyContent: 'center', color: 'hsl(var(--primary))' }}>
                <Compass />
              </ListItemIcon>
              <ListItemText primary="Guru Connect" sx={{ opacity: isDrawerOpen ? 1 : 0, color: 'hsl(var(--foreground))', fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton 
              onClick={onSlokasClick} 
              sx={{ minHeight: 48, justifyContent: isDrawerOpen ? 'initial' : 'center', px: 2.5, '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.1)' } }}
            >              <ListItemIcon sx={{ minWidth: 0, mr: isDrawerOpen ? 3 : 'auto', justifyContent: 'center', color: 'hsl(var(--primary))' }}>
                <BookOpen />
              </ListItemIcon>
              <ListItemText primary="Sacred Slokas" sx={{ opacity: isDrawerOpen ? 1 : 0, color: 'hsl(var(--foreground))', fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton 
              onClick={onBlessingsClick} 
              sx={{ minHeight: 48, justifyContent: isDrawerOpen ? 'initial' : 'center', px: 2.5, '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.1)' } }}
            >              <ListItemIcon sx={{ minWidth: 0, mr: isDrawerOpen ? 3 : 'auto', justifyContent: 'center', color: 'hsl(var(--primary))' }}>
                <Users />
              </ListItemIcon>
              <ListItemText primary="Anugraha Sandesham" sx={{ opacity: isDrawerOpen ? 1 : 0, color: 'hsl(var(--foreground))', fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
        </List>
        <Divider sx={{ borderColor: 'rgba(255, 215, 0, 0.1)' }} />
        <List>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton 
              onClick={onGuideClick} 
              sx={{ minHeight: 48, justifyContent: isDrawerOpen ? 'initial' : 'center', px: 2.5, '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.1)' } }}
            >              <ListItemIcon sx={{ minWidth: 0, mr: isDrawerOpen ? 3 : 'auto', justifyContent: 'center', color: 'hsl(var(--primary))' }}>
                 <HelpCircle />
              </ListItemIcon>
              <ListItemText primary="User Guide" sx={{ opacity: isDrawerOpen ? 1 : 0, color: 'hsl(var(--foreground))', fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton 
              onClick={onDisclaimerClick} 
              sx={{ minHeight: 48, justifyContent: isDrawerOpen ? 'initial' : 'center', px: 2.5, '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.1)' } }}
            >              <ListItemIcon sx={{ minWidth: 0, mr: isDrawerOpen ? 3 : 'auto', justifyContent: 'center', color: 'hsl(var(--primary))' }}>
                <Info />
              </ListItemIcon>
              <ListItemText primary="Disclaimer" sx={{ opacity: isDrawerOpen ? 1 : 0, color: 'hsl(var(--foreground))', fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
      <Box
        component="main"
        // Set a dark background for the main content area to match the rest of the app
        sx={{
          flexGrow: 1, 
          bgcolor: '#0C0A09', 
          p: 3, 
          color: '#EAEAEA',
          transition: (theme) => theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: `-${isDrawerOpen ? 0 : drawerWidth - collapsedDrawerWidth}px`, // Adjust margin based on drawer state
          width: `calc(100% - ${currentDrawerWidth}px)` // Ensure main content takes remaining width
        }}
      >
        <Toolbar /> {/* This Toolbar is crucial to offset content below the AppBar */}
        {children}
      </Box>
    </Box>
  );
} 