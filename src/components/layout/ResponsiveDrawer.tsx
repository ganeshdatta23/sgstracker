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
import HomeIcon from '@mui/icons-material/Home';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import useMediaQuery from '@mui/material/useMediaQuery'; // For responsive design
import { useTheme } from '@mui/material/styles'; // To access theme breakpoints
import { Info, BookOpen, Compass, Users, HelpCircle } from 'lucide-react';
import Link from 'next/link'; // Import Link from Next.js

const drawerWidth = 240;

interface ResponsiveDrawerProps {
  children: React.ReactNode;
  onDisclaimerClick: () => void;
  onSlokasClick: () => void;
  onDashboardClick: () => void;
  onGuideClick: () => void;
}

export default function ResponsiveDrawer({ 
  children, 
  onDisclaimerClick, 
  onSlokasClick,
  onDashboardClick,
  onGuideClick
}: ResponsiveDrawerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // md breakpoint (900px) can be adjusted
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    }
    // On desktop, drawer is permanent, so toggle doesn't change its visibility directly
    // but the icon is still there for consistency or future use.
  };

  const drawerContent = (
    <>
      <Toolbar /> 
      <Divider sx={{ borderColor: 'hsla(var(--primary), 0.2)' }} />
      <List>
        <ListItem disablePadding>
          <Link href="/" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
            <ListItemButton onClick={() => { if(isMobile) setMobileOpen(false); }} sx={{ '&:hover': { bgcolor: 'hsla(var(--primary), 0.1)' }, color: 'hsl(var(--primary))', transition: 'background-color 0.2s ease-in-out' }}>
              <ListItemIcon sx={{ color: 'hsl(var(--primary))' }}><HomeIcon /></ListItemIcon>
              <ListItemText primary="Home" sx={{ color: 'hsl(var(--primary))' }}/>
            </ListItemButton>
          </Link>
        </ListItem>
        <ListItem disablePadding>
          <Link href="/admin" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
            <ListItemButton onClick={() => { if(isMobile) setMobileOpen(false); }} sx={{ '&:hover': { bgcolor: 'hsla(var(--primary), 0.1)' }, color: 'hsl(var(--primary))', transition: 'background-color 0.2s ease-in-out' }}>
              <ListItemIcon sx={{ color: 'hsl(var(--primary))' }}><AdminPanelSettingsIcon /></ListItemIcon>
              <ListItemText primary="Admin" sx={{ color: 'hsl(var(--primary))' }} />
            </ListItemButton>
          </Link>
        </ListItem>
        <Divider sx={{ borderColor: 'hsla(var(--primary), 0.2)', my:1 }} />
        <ListItem disablePadding>
          <ListItemButton onClick={() => { onDashboardClick(); if(isMobile) setMobileOpen(false); }} sx={{ '&:hover': { bgcolor: 'hsla(var(--primary), 0.1)' }, color: 'hsl(var(--foreground))', transition: 'background-color 0.2s ease-in-out' }}>
            <ListItemIcon sx={{ color: 'hsl(var(--primary))' }}><Compass /></ListItemIcon>
            <ListItemText primary="Guru Connect" sx={{ color: 'hsl(var(--foreground))' }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => { onSlokasClick(); if(isMobile) setMobileOpen(false); }} sx={{ '&:hover': { bgcolor: 'hsla(var(--primary), 0.1)' }, color: 'hsl(var(--foreground))', transition: 'background-color 0.2s ease-in-out' }}>
            <ListItemIcon sx={{ color: 'hsl(var(--primary))' }}><BookOpen /></ListItemIcon>
            <ListItemText primary="Sacred Slokas" sx={{ color: 'hsl(var(--foreground))' }} />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider sx={{ borderColor: 'hsla(var(--primary), 0.2)' }} />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => { onGuideClick(); if(isMobile) setMobileOpen(false); }} sx={{ '&:hover': { bgcolor: 'hsla(var(--primary), 0.1)' }, color: 'hsl(var(--foreground))', transition: 'background-color 0.2s ease-in-out' }}>
            <ListItemIcon sx={{ color: 'hsl(var(--primary))' }}><HelpCircle /></ListItemIcon>
            <ListItemText primary="User Guide" sx={{ color: 'hsl(var(--foreground))' }}/>
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => { onDisclaimerClick(); if(isMobile) setMobileOpen(false); }} sx={{ '&:hover': { bgcolor: 'hsla(var(--primary), 0.1)' }, color: 'hsl(var(--foreground))', transition: 'background-color 0.2s ease-in-out' }}>
            <ListItemIcon sx={{ color: 'hsl(var(--primary))' }}><Info /></ListItemIcon>
            <ListItemText primary="About" sx={{ color: 'hsl(var(--foreground))' }} />
          </ListItemButton>
        </ListItem>
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'rgba(12, 10, 9, 0.7)', // Glassmorphism
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid hsla(var(--primary), 0.3)' // Use primary color for border
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' }, color: 'hsl(var(--primary))' }} // Use primary color for menu icon
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ color: 'hsl(var(--primary))', fontWeight: 'bold', flexGrow: 1 }}> {/* Use primary for title */}
            GuruDarshini
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        <Box
          component="nav"
          sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
          aria-label="mailbox folders"
        >
          {/* Temporary Drawer for Mobile */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }} // Better open performance on mobile.
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth, 
                bgcolor: 'rgba(12, 10, 9, 0.95)', // Glassmorphism
                color: 'hsl(var(--foreground))', // Use foreground for general text in drawer
                borderRight: '1px solid hsla(var(--primary), 0.3)' // Use primary for border
              }
            }}
          >
            {drawerContent}
          </Drawer>
          {/* Permanent Drawer for Desktop */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth, 
                bgcolor: 'rgba(12, 10, 9, 0.85)', // Glassmorphism
                color: 'hsl(var(--foreground))', // Use foreground for general text in drawer
                borderRight: '1px solid hsla(var(--primary), 0.3)' // Use primary for border
              }
            }}
            open // Always open on desktop
          >
            {drawerContent}
          </Drawer>
        </Box>
        <Box
          component="main"
          sx={{ 
            flexGrow: 1, 
            bgcolor: 'hsl(var(--background))', // Use background from theme
            p: { xs: 1, sm: 2, md: 3 },
            color: 'hsl(var(--foreground))', // Use foreground from theme
            width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` }
          }}
        >
          <Toolbar /> 
          {children}
        </Box>
      </Box>

      {/* Footer Section */}
      <Box 
        component="footer"
        sx={{
          py: 2, 
          px: 2, 
          mt: 'auto', // Pushes footer to the bottom
          bgcolor: 'rgba(12, 10, 9, 0.85)', // Glassmorphism
          borderTop: '1px solid hsla(var(--primary), 0.3)', // Use primary for border
          color: 'hsl(var(--muted-foreground))' // Muted foreground for footer text
        }}
      >
        <Typography variant="caption" align="center" display="block" /* sx={{color: 'grey.500'}} REMOVED, using theme */ >
          © {new Date().getFullYear()} GuruDarshini. All rights reserved.
        </Typography>
        <Typography variant="caption" align="center" display="block" /* sx={{color: 'grey.500'}} REMOVED, using theme */ >
          <Link href="mailto:dattadev.sgs@gmail.com">dattadev.sgs@gmail.com</Link>
        </Typography>
      </Box>
    </Box>
  );
} 