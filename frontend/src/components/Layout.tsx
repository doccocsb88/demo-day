import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useProject } from '../contexts/ProjectContext';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { selectedProject, clearProject } = useProject();

  const getTabValue = () => {
    if (location.pathname === '/') return 0;
    if (location.pathname.startsWith('/editor')) return 1;
    if (location.pathname.startsWith('/preview')) return 2;
    if (location.pathname.startsWith('/audit')) return 3;
    return -1;
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    switch (newValue) {
      case 0:
        navigate('/');
        break;
      case 1:
        navigate('/editor');
        break;
      case 2:
        navigate('/preview');
        break;
      case 3:
        navigate('/audit');
        break;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            🧩 Remote Config Review System
          </Typography>
          {user && (
            <>
              {selectedProject && (
                <Chip
                  label={selectedProject.name}
                  color="secondary"
                  sx={{ mr: 2 }}
                  onDelete={() => {
                    clearProject();
                    navigate('/projects');
                  }}
                />
              )}
              {!selectedProject && (
                <Button
                  color="inherit"
                  onClick={() => navigate('/projects')}
                  sx={{ mr: 2 }}
                >
                  Select Project
                </Button>
              )}
              <Typography variant="body2" sx={{ mr: 2 }}>
                {user.email}
              </Typography>
              <Button 
                color="inherit" 
                onClick={() => {
                  clearProject();
                  logout();
                }}
              >
                Logout
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      {user && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Container>
            <Tabs value={getTabValue()} onChange={handleTabChange}>
              <Tab label="Dashboard" />
              <Tab label="Editor" />
              <Tab label="Preview Changes" />
              <Tab label="Audit Log" />
            </Tabs>
          </Container>
        </Box>
      )}
      <Container sx={{ flexGrow: 1, py: 3 }}>{children}</Container>
    </Box>
  );
}

