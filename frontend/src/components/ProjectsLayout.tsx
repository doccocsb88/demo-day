import { ReactNode } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useProject } from '../contexts/ProjectContext';

interface ProjectsLayoutProps {
  children: ReactNode;
}

export function ProjectsLayout({ children }: ProjectsLayoutProps) {
  const { user, logout } = useAuth();
  const { clearProject } = useProject();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            🧩 Remote Config Review System
          </Typography>
          {user && (
            <>
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
      <Container sx={{ flexGrow: 1, py: 3 }}>{children}</Container>
    </Box>
  );
}

