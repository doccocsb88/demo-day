import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Alert,
  Divider,
} from '@mui/material';
import { Add, Edit, Delete, CheckCircle } from '@mui/icons-material';
import { projectApi } from '../services/api';
import { FirebaseProject } from '../types';
import { useProject } from '../contexts/ProjectContext';

export function Projects() {
  const [projects, setProjects] = useState<FirebaseProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<FirebaseProject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { selectedProject, setSelectedProject } = useProject();
  const [formData, setFormData] = useState({
    name: '',
    projectId: '',
    // Backend config
    privateKey: '',
    clientEmail: '',
    // Frontend config
    apiKey: '',
    authDomain: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: '',
    // Optional
    generalConfig: '',
    slackWebhookUrl: '',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectApi.list();
      setProjects(data);
      setError(null);
    } catch (err: any) {
      console.error('Error loading projects:', err);
      setError(err.response?.data?.error || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (project?: FirebaseProject) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        projectId: project.projectId,
        privateKey: '', // Don't show existing private key for security
        clientEmail: project.clientEmail,
        apiKey: project.apiKey,
        authDomain: project.authDomain,
        storageBucket: project.storageBucket,
        messagingSenderId: project.messagingSenderId,
        appId: project.appId,
        measurementId: project.measurementId || '',
        generalConfig: project.generalConfig || '',
        slackWebhookUrl: project.slackWebhookUrl || '',
      });
    } else {
      setEditingProject(null);
      setFormData({
        name: '',
        projectId: '',
        privateKey: '',
        clientEmail: '',
        apiKey: '',
        authDomain: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
        measurementId: '',
        generalConfig: '',
        slackWebhookUrl: '',
      });
    }
    setOpenDialog(true);
    setError(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProject(null);
    setFormData({
      name: '',
      projectId: '',
      privateKey: '',
      clientEmail: '',
      apiKey: '',
      authDomain: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
      measurementId: '',
      generalConfig: '',
      slackWebhookUrl: '',
    });
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      
      if (!formData.name || !formData.projectId || !formData.privateKey || !formData.clientEmail ||
          !formData.apiKey || !formData.authDomain || !formData.storageBucket || 
          !formData.messagingSenderId || !formData.appId) {
        setError('Please fill in all required fields');
        return;
      }

      if (editingProject) {
        await projectApi.update(editingProject.id, formData);
      } else {
        await projectApi.create(formData);
      }

      await loadProjects();
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error saving project:', err);
      setError(err.response?.data?.error || 'Failed to save project');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await projectApi.delete(id);
      // Clear selected project if it was deleted
      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }
      await loadProjects();
    } catch (err: any) {
      console.error('Error deleting project:', err);
      setError(err.response?.data?.error || 'Failed to delete project');
    }
  };

  const handleSelectProject = (project: FirebaseProject) => {
    setSelectedProject(project);
    navigate('/');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4">Firebase Projects</Typography>
          {selectedProject && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Selected Project: <strong>{selectedProject.name}</strong>
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Create Project
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Project Name</TableCell>
              <TableCell>Project ID</TableCell>
              <TableCell>Client Email</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No projects found. Create your first project!
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow 
                  key={project.id}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'action.hover' },
                    backgroundColor: selectedProject?.id === project.id ? 'action.selected' : 'inherit'
                  }}
                  onClick={() => handleSelectProject(project)}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {project.name}
                      {selectedProject?.id === project.id && (
                        <CheckCircle color="primary" fontSize="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{project.projectId}</TableCell>
                  <TableCell>{project.clientEmail}</TableCell>
                  <TableCell>{project.createdBy}</TableCell>
                  <TableCell>{new Date(project.createdAt).toLocaleString('en-US')}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(project)}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(project.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProject ? 'Edit Project' : 'Create New Project'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2, maxHeight: '70vh', overflow: 'auto' }}>
            <TextField
              label="Project Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Project ID *"
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              fullWidth
              required
              helperText="Firebase Project ID"
            />
            
            <Divider sx={{ my: 1 }}>Backend Config (Firebase Admin SDK)</Divider>
            
            <TextField
              label="Client Email *"
              value={formData.clientEmail}
              onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
              fullWidth
              required
              helperText="Service account email"
            />
            <TextField
              label="Private Key *"
              value={formData.privateKey}
              onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
              fullWidth
              required
              multiline
              rows={4}
              helperText="Firebase service account private key (-----BEGIN PRIVATE KEY-----...)"
            />
            
            <Divider sx={{ my: 1 }}>Frontend Config (Firebase Client SDK)</Divider>
            
            <TextField
              label="API Key *"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              fullWidth
              required
              helperText="Firebase Web API Key"
            />
            <TextField
              label="Auth Domain *"
              value={formData.authDomain}
              onChange={(e) => setFormData({ ...formData, authDomain: e.target.value })}
              fullWidth
              required
              helperText="e.g., project-id.firebaseapp.com"
            />
            <TextField
              label="Storage Bucket *"
              value={formData.storageBucket}
              onChange={(e) => setFormData({ ...formData, storageBucket: e.target.value })}
              fullWidth
              required
              helperText="e.g., project-id.appspot.com"
            />
            <TextField
              label="Messaging Sender ID *"
              value={formData.messagingSenderId}
              onChange={(e) => setFormData({ ...formData, messagingSenderId: e.target.value })}
              fullWidth
              required
              helperText="Numeric sender ID"
            />
            <TextField
              label="App ID *"
              value={formData.appId}
              onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
              fullWidth
              required
              helperText="e.g., 1:123456789:web:abc123"
            />
            <TextField
              label="Measurement ID (Optional)"
              value={formData.measurementId}
              onChange={(e) => setFormData({ ...formData, measurementId: e.target.value })}
              fullWidth
              helperText="Google Analytics Measurement ID (G-XXXXXXXXXX)"
            />
            
            <Divider sx={{ my: 1 }}>Optional</Divider>
            
            <TextField
              label="General Config (Optional)"
              value={formData.generalConfig}
              onChange={(e) => setFormData({ ...formData, generalConfig: e.target.value })}
              fullWidth
              multiline
              rows={6}
              helperText="Full service account JSON (optional)"
            />
            <TextField
              label="Slack Webhook URL (Optional)"
              value={formData.slackWebhookUrl}
              onChange={(e) => setFormData({ ...formData, slackWebhookUrl: e.target.value })}
              fullWidth
              helperText="Slack webhook URL for notifications (e.g., https://hooks.slack.com/services/...)"
              placeholder="https://hooks.slack.com/services/..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingProject ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

