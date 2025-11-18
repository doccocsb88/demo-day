import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Visibility, Assignment } from '@mui/icons-material';
import { changeRequestApi } from '../services/api';
import { RemoteConfigChangeRequest } from '../types';
import { useAuth } from '../hooks/useAuth';

export function ReviewRequestsList() {
  const [reviewRequests, setReviewRequests] = useState<RemoteConfigChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadReviewRequests();
    }
  }, [user]);

  const loadReviewRequests = async () => {
    try {
      setLoading(true);
      const data = await changeRequestApi.list({
        status: 'pending_review',
      });
      
      // Filter to only show requests where current user is a reviewer
      if (user) {
        const filtered = data.filter(cr => 
          cr.reviewers.some(r => r.userId === user.uid || r.userId === user.email)
        );
        setReviewRequests(filtered);
      } else {
        setReviewRequests([]);
      }
    } catch (error) {
      console.error('Error loading review requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReviewerStatus = (changeRequest: RemoteConfigChangeRequest) => {
    if (!user) return null;
    
    const currentUserReviewer = changeRequest.reviewers.find(
      r => r.userId === user.uid || r.userId === user.email
    );
    
    return currentUserReviewer;
  };

  const isAssignedReviewer = (changeRequest: RemoteConfigChangeRequest) => {
    return getReviewerStatus(changeRequest) !== undefined;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Assignment sx={{ mr: 2, fontSize: 32 }} />
        <Typography variant="h4">Review Requests</Typography>
      </Box>

      {reviewRequests.length === 0 ? (
        <Card>
          <CardContent>
            <Alert severity="info" sx={{ py: 3 }}>
              <Typography variant="h6" gutterBottom>
                No Review Requests Assigned to You
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You don't have any change requests assigned for review at the moment.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Environment</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Reviewers</TableCell>
                <TableCell>Your Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reviewRequests.map((cr) => {
                const reviewerStatus = getReviewerStatus(cr);
                const approvedCount = cr.reviewers.filter(r => r.status === 'approved').length;
                const totalReviewers = cr.reviewers.length;

                return (
                  <TableRow key={cr.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {cr.title}
                      </Typography>
                      {cr.description && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {cr.description.length > 50 
                            ? `${cr.description.substring(0, 50)}...` 
                            : cr.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={cr.env.toUpperCase()} 
                        size="small" 
                        color={cr.env === 'prod' ? 'error' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>{cr.createdBy}</TableCell>
                    <TableCell>
                      {new Date(cr.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {approvedCount} / {totalReviewers} approved
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={reviewerStatus?.status || 'pending'}
                        size="small"
                        color={
                          reviewerStatus?.status === 'approved'
                            ? 'success'
                            : reviewerStatus?.status === 'denied'
                            ? 'error'
                            : 'warning'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => navigate(`/preview/${cr.id}`)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </Box>
  );
}

