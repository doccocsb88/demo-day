import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ProjectProvider } from './contexts/ProjectContext';
import { Layout } from './components/Layout';
import { ProjectsLayout } from './components/ProjectsLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Editor } from './pages/Editor';
import { PreviewChanges } from './pages/PreviewChanges';
import { ReviewRequestsList } from './pages/ReviewRequestsList';
import { AuditLogPage } from './pages/AuditLog';
import { Projects } from './pages/Projects';
import { useAuth } from './hooks/useAuth';
import { useProject } from './contexts/ProjectContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function ProjectRequiredRoute({ children }: { children: React.ReactNode }) {
  const { selectedProject } = useProject();
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!selectedProject) {
    return <Navigate to="/projects" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ProjectProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/projects"
              element={
                <PrivateRoute>
                  <ProjectsLayout>
                    <Projects />
                  </ProjectsLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProjectRequiredRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProjectRequiredRoute>
              }
            />
            <Route
              path="/editor"
              element={
                <ProjectRequiredRoute>
                  <Layout>
                    <Editor />
                  </Layout>
                </ProjectRequiredRoute>
              }
            />
            <Route
              path="/preview"
              element={
                <ProjectRequiredRoute>
                  <Layout>
                    <ReviewRequestsList />
                  </Layout>
                </ProjectRequiredRoute>
              }
            />
            <Route
              path="/preview/:id"
              element={
                <ProjectRequiredRoute>
                  <Layout>
                    <PreviewChanges />
                  </Layout>
                </ProjectRequiredRoute>
              }
            />
            <Route
              path="/audit"
              element={
                <ProjectRequiredRoute>
                  <Layout>
                    <AuditLogPage />
                  </Layout>
                </ProjectRequiredRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </ProjectProvider>
    </ThemeProvider>
  );
}

export default App;

