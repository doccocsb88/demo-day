import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Tab,
  Tabs,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Paper,
} from '@mui/material';
import { Add, Edit, Delete, Save } from '@mui/icons-material';
import { remoteConfigApi, changeRequestApi } from '../services/api';
import {
  RemoteConfigParameter,
  RemoteConfigCondition,
  RemoteConfigSnapshot,
} from '../types';
import { useProject } from '../contexts/ProjectContext';

export function Editor() {
  const { selectedProject } = useProject();
  const [searchParams] = useSearchParams();
  const changeRequestId = searchParams.get('id');
  const [tab, setTab] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [env, setEnv] = useState<'prod' | 'staging'>('prod');
  const [parameters, setParameters] = useState<RemoteConfigParameter[]>([]);
  const [conditions, setConditions] = useState<RemoteConfigCondition[]>([]);
  const [editingParam, setEditingParam] = useState<RemoteConfigParameter | null>(null);
  const [editingCondition, setEditingCondition] = useState<RemoteConfigCondition | null>(null);
  const [paramDialogOpen, setParamDialogOpen] = useState(false);
  const [conditionDialogOpen, setConditionDialogOpen] = useState(false);
  const [editingConditionName, setEditingConditionName] = useState<string>('');
  const [editingConditionValue, setEditingConditionValue] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    if (changeRequestId) {
      loadChangeRequest();
    } else {
      loadCurrentConfig();
    }
  }, [changeRequestId]);

  const loadCurrentConfig = async () => {
    try {
      const snapshot = await remoteConfigApi.getSnapshot(env);
      setParameters(snapshot.parameters);
      setConditions(snapshot.conditions);
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const loadChangeRequest = async () => {
    try {
      const cr = await changeRequestApi.get(changeRequestId!);
      setTitle(cr.title);
      setDescription(cr.description || '');
      setEnv(cr.env);
      setParameters(cr.newConfig.parameters);
      setConditions(cr.newConfig.conditions);
    } catch (error) {
      console.error('Error loading change request:', error);
    }
  };

  const handleSaveParam = () => {
    if (!editingParam) return;
    const index = parameters.findIndex((p) => p.key === editingParam.key);
    if (index >= 0) {
      setParameters([...parameters.slice(0, index), editingParam, ...parameters.slice(index + 1)]);
    } else {
      setParameters([...parameters, editingParam]);
    }
    setParamDialogOpen(false);
    setEditingParam(null);
  };

  const handleDeleteParam = (key: string) => {
    setParameters(parameters.filter((p) => p.key !== key));
  };

  const handleSaveCondition = () => {
    if (!editingCondition) return;
    const index = conditions.findIndex((c) => c.name === editingCondition.name);
    if (index >= 0) {
      setConditions([
        ...conditions.slice(0, index),
        editingCondition,
        ...conditions.slice(index + 1),
      ]);
    } else {
      setConditions([...conditions, editingCondition]);
    }
    setConditionDialogOpen(false);
    setEditingCondition(null);
  };

  const handleDeleteCondition = (name: string) => {
    setConditions(conditions.filter((c) => c.name !== name));
  };

  const handleSaveDraft = async () => {
    try {
      const newConfig: RemoteConfigSnapshot = {
        id: `snapshot-${Date.now()}`,
        parameters,
        conditions,
        createdAt: new Date().toISOString(),
        createdBy: 'current-user',
      };

      await changeRequestApi.create({
        title: title || 'Untitled',
        description,
        newConfig,
        env,
        projectId: selectedProject?.id,
      });
      navigate('/');
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const newConfig: RemoteConfigSnapshot = {
        id: `snapshot-${Date.now()}`,
        parameters,
        conditions,
        createdAt: new Date().toISOString(),
        createdBy: 'current-user',
      };

      const cr = await changeRequestApi.create({
        title: title || 'Untitled',
        description,
        newConfig,
        env,
        projectId: selectedProject?.id,
      });

      await changeRequestApi.submit(cr.id);
      navigate(`/preview/${cr.id}`);
    } catch (error) {
      console.error('Error submitting:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={2}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Chip label={`Environment: ${env}`} />
          <Button
            variant="outlined"
            size="small"
            onClick={() => setEnv(env === 'prod' ? 'staging' : 'prod')}
          >
            Switch to {env === 'prod' ? 'Staging' : 'Production'}
          </Button>
        </Box>
      </Box>

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Parameters" />
          <Tab label="Conditions" />
        </Tabs>

        {tab === 0 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  setEditingParam({ key: '', defaultValue: '' });
                  setEditingConditionName('');
                  setEditingConditionValue('');
                  setParamDialogOpen(true);
                }}
              >
                Add Parameter
              </Button>
            </Box>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Key</TableCell>
                  <TableCell>Default Value</TableCell>
                  <TableCell>Conditional Values</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parameters.map((param) => (
                  <TableRow key={param.key}>
                    <TableCell>{param.key}</TableCell>
                    <TableCell>{param.defaultValue || '-'}</TableCell>
                    <TableCell>
                      {param.conditionalValues && Object.keys(param.conditionalValues).length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {Object.keys(param.conditionalValues).map((condName) => (
                            <Chip
                              key={condName}
                              label={condName}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No conditions
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{param.description || '-'}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingParam({ ...param });
                          setEditingConditionName('');
                          setEditingConditionValue('');
                          setParamDialogOpen(true);
                        }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteParam(param.key)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}

        {tab === 1 && (
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  setEditingCondition({ name: '', expression: '' });
                  setConditionDialogOpen(true);
                }}
              >
                Add Condition
              </Button>
            </Box>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Expression</TableCell>
                  <TableCell>Tag</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {conditions.map((condition) => (
                  <TableRow key={condition.name}>
                    <TableCell>{condition.name}</TableCell>
                    <TableCell>
                      <code>{condition.expression}</code>
                    </TableCell>
                    <TableCell>{condition.tag || '-'}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingCondition(condition);
                          setConditionDialogOpen(true);
                        }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteCondition(condition.name)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>

      <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
        <Button variant="outlined" startIcon={<Save />} onClick={handleSaveDraft}>
          Save as Draft
        </Button>
        <Button variant="contained" onClick={handleSubmit}>
          Submit for Review
        </Button>
      </Box>

      {/* Parameter Dialog */}
      <Dialog open={paramDialogOpen} onClose={() => setParamDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Parameter</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Key"
            value={editingParam?.key || ''}
            onChange={(e) =>
              setEditingParam({ ...editingParam!, key: e.target.value })
            }
            margin="normal"
            disabled={!!editingParam?.key}
          />
          <TextField
            fullWidth
            label="Default Value"
            value={editingParam?.defaultValue || ''}
            onChange={(e) =>
              setEditingParam({ ...editingParam!, defaultValue: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={editingParam?.description || ''}
            onChange={(e) =>
              setEditingParam({ ...editingParam!, description: e.target.value })
            }
            margin="normal"
            multiline
            rows={2}
          />
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" sx={{ mb: 2 }}>
            Conditional Values
          </Typography>
          
          {/* Add/Edit Conditional Value Section */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            {conditions.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                No conditions available. Please create conditions first in the Conditions tab.
              </Typography>
            ) : (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Condition</InputLabel>
                <Select
                  value={editingConditionName || ''}
                  label="Select Condition"
                  onChange={(e) => setEditingConditionName(e.target.value)}
                >
                  {conditions.map((cond) => (
                    <MenuItem key={cond.name} value={cond.name}>
                      {cond.name} - {cond.expression}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {editingConditionName && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  label={`Value for condition "${editingConditionName}"`}
                  value={editingConditionValue || ''}
                  onChange={(e) => setEditingConditionValue(e.target.value)}
                  placeholder="Enter value for this condition"
                />
                <Button
                  variant="contained"
                  onClick={() => {
                    if (editingConditionName && editingConditionValue) {
                      const updatedConditionalValues = {
                        ...(editingParam?.conditionalValues || {}),
                        [editingConditionName]: editingConditionValue,
                      };
                      setEditingParam({
                        ...editingParam!,
                        conditionalValues: updatedConditionalValues,
                      });
                      setEditingConditionName('');
                      setEditingConditionValue('');
                    }
                  }}
                  disabled={!editingConditionName || !editingConditionValue}
                >
                  Add/Update
                </Button>
              </Box>
            )}
          </Box>

          {/* List of Existing Conditional Values */}
          {editingParam?.conditionalValues && Object.keys(editingParam.conditionalValues).length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Current Conditional Values:
              </Typography>
              {Object.entries(editingParam.conditionalValues).map(([condName, value]) => (
                <Paper
                  key={condName}
                  sx={{
                    p: 2,
                    mb: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      {condName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {conditions.find((c) => c.name === condName)?.expression || 'N/A'}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      Value: <code>{value}</code>
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingConditionName(condName);
                        setEditingConditionValue(value);
                      }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        const updatedConditionalValues = { ...editingParam.conditionalValues };
                        delete updatedConditionalValues[condName];
                        setEditingParam({
                          ...editingParam,
                          conditionalValues: Object.keys(updatedConditionalValues).length > 0
                            ? updatedConditionalValues
                            : undefined,
                        });
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setParamDialogOpen(false);
            setEditingConditionName('');
            setEditingConditionValue('');
          }}>
            Cancel
          </Button>
          <Button onClick={handleSaveParam} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Condition Dialog */}
      <Dialog
        open={conditionDialogOpen}
        onClose={() => setConditionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Condition</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={editingCondition?.name || ''}
            onChange={(e) =>
              setEditingCondition({ ...editingCondition!, name: e.target.value })
            }
            margin="normal"
            disabled={!!editingCondition?.name}
          />
          <TextField
            fullWidth
            label="Expression"
            value={editingCondition?.expression || ''}
            onChange={(e) =>
              setEditingCondition({ ...editingCondition!, expression: e.target.value })
            }
            margin="normal"
            multiline
            rows={3}
            placeholder="e.g., device.os == 'iOS' && user.country == 'US'"
          />
          <TextField
            fullWidth
            label="Tag"
            value={editingCondition?.tag || ''}
            onChange={(e) =>
              setEditingCondition({ ...editingCondition!, tag: e.target.value })
            }
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConditionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveCondition} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

