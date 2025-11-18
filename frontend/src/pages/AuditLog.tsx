import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
import { auditLogApi } from '../services/api';
import { AuditLog } from '../types';

export function AuditLogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const changeRequestId = searchParams.get('changeRequestId') || '';
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterId, setFilterId] = useState(changeRequestId);

  useEffect(() => {
    loadLogs();
  }, [changeRequestId]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await auditLogApi.list(
        changeRequestId || undefined,
        100
      );
      setLogs(data);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    if (filterId) {
      setSearchParams({ changeRequestId: filterId });
    } else {
      setSearchParams({});
    }
    loadLogs();
  };

  const getActionColor = (action: string): 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' => {
    switch (action) {
      case 'created':
        return 'primary';
      case 'submitted_for_review':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'published':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Audit Log
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Filter by Change Request ID"
              value={filterId}
              onChange={(e) => setFilterId(e.target.value)}
              size="small"
              sx={{ flexGrow: 1 }}
            />
            <Button variant="contained" onClick={handleFilter}>
              Filter
            </Button>
            {changeRequestId && (
              <Button variant="outlined" onClick={() => {
                setFilterId('');
                setSearchParams({});
                loadLogs();
              }}>
                Clear
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {loading ? (
            <Typography>Loading...</Typography>
          ) : logs.length === 0 ? (
            <Typography color="text.secondary">No audit logs found</Typography>
          ) : (
            <List>
              {logs.map((log, index) => (
                <Box key={log.id}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6" component="span">
                            {log.performedBy}
                          </Typography>
                          <Chip
                            label={log.action.replace(/_/g, ' ').toUpperCase()}
                            color={getActionColor(log.action)}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {new Date(log.performedAt).toLocaleString()}
                          </Typography>
                          {log.changeRequestId && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              Change Request: {log.changeRequestId}
                            </Typography>
                          )}
                          {log.details && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {JSON.stringify(log.details, null, 2)}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < logs.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

