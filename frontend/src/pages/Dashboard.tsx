import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  TextField,
} from '@mui/material';
import { Add, Visibility } from '@mui/icons-material';
import { changeRequestApi } from '../services/api';
import { RemoteConfigChangeRequest } from '../types';

const statusColors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  draft: 'default',
  pending_review: 'warning',
  approved: 'success',
  rejected: 'error',
  published: 'primary',
};

export function Dashboard() {
  const [changeRequests, setChangeRequests] = useState<RemoteConfigChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    env: '' as 'prod' | 'staging' | '',
    status: '',
    createdBy: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadChangeRequests();
  }, [filters]);

  const loadChangeRequests = async () => {
    try {
      setLoading(true);
      const data = await changeRequestApi.list({
        env: filters.env || undefined,
        status: filters.status || undefined,
        createdBy: filters.createdBy || undefined,
      });
      setChangeRequests(data);
    } catch (error) {
      console.error('Error loading change requests:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Change Requests</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/editor')}
        >
          Create Change Request
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Environment</InputLabel>
              <Select
                value={filters.env}
                label="Environment"
                onChange={(e) => setFilters({ ...filters, env: e.target.value as any })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="prod">Production</MenuItem>
                <MenuItem value="staging">Staging</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="pending_review">Pending Review</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="published">Published</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Created By"
              value={filters.createdBy}
              onChange={(e) => setFilters({ ...filters, createdBy: e.target.value })}
              sx={{ minWidth: 200 }}
            />
          </Box>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Environment</TableCell>
              <TableCell>Status</TableCell>
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
            ) : changeRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No change requests found
                </TableCell>
              </TableRow>
            ) : (
              changeRequests.map((cr) => (
                <TableRow key={cr.id}>
                  <TableCell>{cr.title}</TableCell>
                  <TableCell>
                    <Chip label={cr.env} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={cr.status}
                      color={statusColors[cr.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{cr.createdBy}</TableCell>
                  <TableCell>{new Date(cr.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => navigate(`/preview/${cr.id}`)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </Box>
  );
}

