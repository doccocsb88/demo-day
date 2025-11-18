import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  TextField,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableRow,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  ExpandMore,
  Publish,
  ArrowBack,
  PersonAdd,
  ThumbUp,
  ThumbDown,
} from '@mui/icons-material';
// import ReactMarkdown from 'react-markdown';
import { changeRequestApi } from '../services/api';
import { RemoteConfigChangeRequest, RemoteConfigParameter } from '../types';
import { useAuth } from '../hooks/useAuth';

export function PreviewChanges() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [changeRequest, setChangeRequest] = useState<RemoteConfigChangeRequest | null>(null);
  const [newReviewerId, setNewReviewerId] = useState('');
  const [reviewerMessage, setReviewerMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadChangeRequest();
    }
  }, [id]);

  const loadChangeRequest = async () => {
    try {
      const cr = await changeRequestApi.get(id!);
      setChangeRequest(cr);
    } catch (error) {
      console.error('Error loading change request:', error);
    } finally {
      setLoading(false);
    }
  };


  const handlePublish = async () => {
    if (!id) return;
    try {
      await changeRequestApi.publish(id);
      await loadChangeRequest();
    } catch (error) {
      console.error('Error publishing:', error);
    }
  };

  const handleAddReviewer = async () => {
    if (!id || !newReviewerId) return;
    try {
      await changeRequestApi.addReviewer(id, newReviewerId);
      setNewReviewerId('');
      await loadChangeRequest();
    } catch (error: any) {
      console.error('Error adding reviewer:', error);
      alert(error.response?.data?.error || 'Failed to add reviewer');
    }
  };

  const handleReviewerApprove = async () => {
    if (!id) return;
    try {
      await changeRequestApi.reviewerApprove(id, reviewerMessage);
      setReviewerMessage('');
      await loadChangeRequest();
    } catch (error: any) {
      console.error('Error approving:', error);
      alert(error.response?.data?.error || 'Failed to approve');
    }
  };

  const handleReviewerDeny = async () => {
    if (!id) return;
    try {
      await changeRequestApi.reviewerDeny(id, reviewerMessage);
      setReviewerMessage('');
      await loadChangeRequest();
    } catch (error: any) {
      console.error('Error denying:', error);
      alert(error.response?.data?.error || 'Failed to deny');
    }
  };

  const isCreator = user?.uid === changeRequest?.createdBy;
  // Check reviewer by both uid and email
  const currentUserReviewer = changeRequest?.reviewers.find(
    r => r.userId === user?.uid || r.userId === user?.email
  );
  const approvedReviewersCount = changeRequest?.reviewers.filter(r => r.status === 'approved').length || 0;
  const canPublish = approvedReviewersCount >= 1;

  const renderParameterValue = (param: RemoteConfigParameter | null) => {
    if (!param) {
      return <Typography variant="body2" color="text.secondary">(removed)</Typography>;
    }

    return (
      <Box>
        {param.defaultValue !== undefined && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Default:
            </Typography>
            <Typography variant="body2" component="code" sx={{ ml: 1 }}>
              {param.defaultValue}
            </Typography>
          </Box>
        )}
        {param.conditionalValues && Object.keys(param.conditionalValues).length > 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Conditional Values:
            </Typography>
            <Table size="small" sx={{ mt: 0.5 }}>
              <TableBody>
                {Object.entries(param.conditionalValues).map(([conditionName, value]) => (
                  <TableRow key={conditionName}>
                    <TableCell sx={{ py: 0.5, border: 'none', width: '40%' }}>
                      <Chip label={conditionName} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell sx={{ py: 0.5, border: 'none' }}>
                      <Typography variant="body2" component="code">
                        {value}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
        {param.description && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Description: {param.description}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  const renderParameterDiff = (update: { key: string; from: RemoteConfigParameter | null; to: RemoteConfigParameter | null }) => {
    const from = update.from;
    const to = update.to;
    
    // Compare default values
    const defaultChanged = from?.defaultValue !== to?.defaultValue;
    
    // Compare conditional values
    const fromConditions = from?.conditionalValues || {};
    const toConditions = to?.conditionalValues || {};
    const allConditionNames = new Set([
      ...Object.keys(fromConditions),
      ...Object.keys(toConditions),
    ]);
    
    const conditionChanges: Array<{
      name: string;
      fromValue?: string;
      toValue?: string;
      action: 'added' | 'removed' | 'updated' | 'unchanged';
    }> = [];
    
    allConditionNames.forEach((condName) => {
      const fromValue = fromConditions[condName];
      const toValue = toConditions[condName];
      
      if (!fromValue && toValue) {
        conditionChanges.push({ name: condName, toValue, action: 'added' });
      } else if (fromValue && !toValue) {
        conditionChanges.push({ name: condName, fromValue, action: 'removed' });
      } else if (fromValue !== toValue) {
        conditionChanges.push({ name: condName, fromValue, toValue, action: 'updated' });
      } else {
        conditionChanges.push({ name: condName, fromValue, toValue, action: 'unchanged' });
      }
    });

    return (
      <Box>
        {/* Default Value Changes */}
        {defaultChanged && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Default Value:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Paper sx={{ p: 1.5, bgcolor: 'error.light', color: 'error.contrastText' }}>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                    From:
                  </Typography>
                  <Typography variant="body2" component="code">
                    {from?.defaultValue || '(empty)'}
                  </Typography>
                </Paper>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Paper sx={{ p: 1.5, bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                    To:
                  </Typography>
                  <Typography variant="body2" component="code">
                    {to?.defaultValue || '(empty)'}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          </Box>
        )}

        {/* Conditional Values Changes */}
        {conditionChanges.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Conditional Values:
            </Typography>
            {conditionChanges.map((change) => {
              if (change.action === 'unchanged') return null;
              
              return (
                <Box key={change.name} sx={{ mb: 1.5 }}>
                  <Chip label={change.name} size="small" sx={{ mb: 1 }} />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Paper sx={{ p: 1.5, bgcolor: 'error.light', color: 'error.contrastText' }}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                          From:
                        </Typography>
                        <Typography variant="body2" component="code">
                          {change.fromValue || '(not set)'}
                        </Typography>
                      </Paper>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Paper sx={{ p: 1.5, bgcolor: 'success.light', color: 'success.contrastText' }}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                          To:
                        </Typography>
                        <Typography variant="body2" component="code">
                          {change.toValue || '(not set)'}
                        </Typography>
                      </Paper>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}

        {/* Description Changes */}
        {from?.description !== to?.description && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Description:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Paper sx={{ p: 1.5, bgcolor: 'error.light', color: 'error.contrastText' }}>
                  <Typography variant="body2">
                    {from?.description || '(empty)'}
                  </Typography>
                </Paper>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Paper sx={{ p: 1.5, bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <Typography variant="body2">
                    {to?.description || '(empty)'}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          </Box>
        )}

        {/* Show full parameter if no specific changes detected */}
        {!defaultChanged && conditionChanges.every(c => c.action === 'unchanged') && from?.description === to?.description && (
          <Box>
            <Typography variant="body2" color="text.secondary">
              Parameter structure changed
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  if (loading || !changeRequest) {
    return <Typography>Loading...</Typography>;
  }

  const { diff, aiSummary, status } = changeRequest;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/')} sx={{ mr: 2 }}>
          Back
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {changeRequest.title}
        </Typography>
        <Chip label={status} color={status === 'approved' ? 'success' : 'default'} />
      </Box>

      {changeRequest.description && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="body1">{changeRequest.description}</Typography>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {/* Left Panel - Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Added: {diff.addedParams.length} params
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Updated: {diff.updatedParams.length} params
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Removed: {diff.removedParams.length} params
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Conditions: +{diff.addedConditions.length} / -{diff.removedConditions.length} / ~{diff.updatedConditions.length}
                </Typography>
              </Box>

              {aiSummary && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    AI Summary
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                      {aiSummary}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* Add Reviewer Section */}
              {isCreator && status === 'pending_review' && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Reviewers
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="User ID or Email"
                      value={newReviewerId}
                      onChange={(e) => setNewReviewerId(e.target.value)}
                      placeholder="Enter reviewer user ID or email"
                      helperText="Enter Firebase UID or email address"
                    />
                    <Button
                      variant="contained"
                      startIcon={<PersonAdd />}
                      onClick={handleAddReviewer}
                      disabled={!newReviewerId}
                      sx={{ minWidth: 100 }}
                    >
                      Add
                    </Button>
                  </Box>
                  {changeRequest.reviewers.length > 0 && (
                    <List dense>
                      {changeRequest.reviewers.map((reviewer, index) => {
                        const isCurrentUser = reviewer.userId === user?.uid || reviewer.userId === user?.email;
                        return (
                          <ListItem 
                            key={index}
                            sx={{
                              bgcolor: isCurrentUser ? 'action.selected' : 'transparent',
                              borderRadius: 1,
                              mb: 0.5,
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" fontWeight={isCurrentUser ? 'bold' : 'normal'}>
                                    {reviewer.userId}
                                  </Typography>
                                  {isCurrentUser && (
                                    <Chip label="You" size="small" color="primary" />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Chip
                                    label={reviewer.status}
                                    size="small"
                                    color={
                                      reviewer.status === 'approved'
                                        ? 'success'
                                        : reviewer.status === 'denied'
                                        ? 'error'
                                        : 'default'
                                    }
                                    sx={{ mr: 1 }}
                                  />
                                  {reviewer.message && (
                                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                      {reviewer.message}
                                    </Typography>
                                  )}
                                  {reviewer.reviewedAt && (
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      {new Date(reviewer.reviewedAt).toLocaleString()}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  )}
                  {changeRequest.reviewers.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No reviewers added yet
                    </Typography>
                  )}
                  <Alert severity="info" sx={{ mt: 2 }}>
                    You cannot approve your own change request. Add reviewers to review it.
                  </Alert>
                </Box>
              )}

              {/* Reviewer Actions */}
              {!isCreator && status === 'pending_review' && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  {currentUserReviewer ? (
                    <>
                      <Typography variant="h6" gutterBottom>
                        Your Review
                      </Typography>
                      <TextField
                        fullWidth
                        label="Message (optional)"
                        value={reviewerMessage}
                        onChange={(e) => setReviewerMessage(e.target.value)}
                        multiline
                        rows={3}
                        sx={{ mb: 2 }}
                        placeholder="Add your review comments..."
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<ThumbUp />}
                          onClick={handleReviewerApprove}
                          fullWidth
                          disabled={currentUserReviewer.status === 'approved'}
                        >
                          {currentUserReviewer.status === 'approved' ? 'Approved' : 'Approve'}
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<ThumbDown />}
                          onClick={handleReviewerDeny}
                          fullWidth
                          disabled={currentUserReviewer.status === 'denied'}
                        >
                          {currentUserReviewer.status === 'denied' ? 'Denied' : 'Deny'}
                        </Button>
                      </Box>
                      {currentUserReviewer.status !== 'pending' && currentUserReviewer.message && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          Your previous message: {currentUserReviewer.message}
                        </Alert>
                      )}
                      {currentUserReviewer.status === 'approved' && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                          You have approved this change request
                        </Alert>
                      )}
                      {currentUserReviewer.status === 'denied' && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                          You have denied this change request
                        </Alert>
                      )}
                    </>
                  ) : (
                    <Alert severity="info">
                      <Typography variant="body2" gutterBottom>
                        You are not assigned as a reviewer for this change request.
                      </Typography>
                      {user && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" display="block">
                            <strong>Your information:</strong>
                          </Typography>
                          <Typography variant="caption" display="block">
                            Email: {user.email || 'N/A'}
                          </Typography>
                          <Typography variant="caption" display="block">
                            UID: {user.uid || 'N/A'}
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
                            Ask the creator to add you as a reviewer using either your email or UID above.
                          </Typography>
                        </Box>
                      )}
                    </Alert>
                  )}
                </Box>
              )}

              {/* Publish Button - Only for Creator */}
              {isCreator && status === 'pending_review' && canPublish && (
                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Publish />}
                    onClick={handlePublish}
                    fullWidth
                  >
                    Publish to {changeRequest.env.toUpperCase()}
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    {approvedReviewersCount} reviewer(s) approved
                  </Typography>
                </Box>
              )}

              {isCreator && status === 'pending_review' && !canPublish && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  At least 1 reviewer must approve before publishing
                </Alert>
              )}

              {!isCreator && status === 'pending_review' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Only the creator can publish this change request after approval.
                </Alert>
              )}

              {status === 'rejected' && changeRequest.rejectedReason && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Rejected: {changeRequest.rejectedReason}
                </Alert>
              )}

              {status === 'published' && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Published to {changeRequest.env.toUpperCase()} at{' '}
                  {changeRequest.publishedAt
                    ? new Date(changeRequest.publishedAt).toLocaleString()
                    : ''}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Middle Panel - Parameter Diff */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Parameter Changes
              </Typography>

              {diff.addedParams.map((key) => {
                const newParam = changeRequest.newConfig.parameters.find(p => p.key === key);
                return (
                  <Accordion key={key}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="Added" color="success" size="small" />
                        <Typography>{key}</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      {newParam ? (
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            New Parameter:
                          </Typography>
                          {renderParameterValue(newParam)}
                        </Box>
                      ) : (
                        <Typography variant="body2">
                          New parameter added to configuration.
                        </Typography>
                      )}
                    </AccordionDetails>
                  </Accordion>
                );
              })}

              {diff.removedParams.map((key) => {
                // Try to find the removed parameter from updatedParams (if it was updated then removed)
                const removedParam = diff.updatedParams.find(u => u.key === key)?.from || null;
                return (
                  <Accordion key={key}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="Removed" color="error" size="small" />
                        <Typography>{key}</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      {removedParam ? (
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Removed Parameter:
                          </Typography>
                          {renderParameterValue(removedParam)}
                        </Box>
                      ) : (
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            This parameter will be removed from configuration.
                          </Typography>
                          <Alert severity="warning" sx={{ mt: 1 }}>
                            Parameter details not available in diff.
                          </Alert>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                );
              })}

              {diff.updatedParams.map((update) => (
                <Accordion key={update.key}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label="Updated" color="warning" size="small" />
                      <Typography>{update.key}</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {renderParameterDiff(update)}
                  </AccordionDetails>
                </Accordion>
              ))}

              {diff.addedParams.length === 0 &&
                diff.removedParams.length === 0 &&
                diff.updatedParams.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No parameter changes
                  </Typography>
                )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel - Condition Diff */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Condition Changes
              </Typography>

              {diff.addedConditions.map((name) => (
                <Accordion key={name}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label="Added" color="success" size="small" />
                      <Typography>{name}</Typography>
                    </Box>
                  </AccordionSummary>
                </Accordion>
              ))}

              {diff.removedConditions.map((name) => (
                <Accordion key={name}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label="Removed" color="error" size="small" />
                      <Typography>{name}</Typography>
                    </Box>
                  </AccordionSummary>
                </Accordion>
              ))}

              {diff.updatedConditions.map((update) => (
                <Accordion key={update.name}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label="Updated" color="warning" size="small" />
                      <Typography>{update.name}</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        From:
                      </Typography>
                      <Paper sx={{ p: 1, mb: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                        <Typography variant="body2" component="code">
                          {update.from?.expression || 'none'}
                        </Typography>
                      </Paper>
                      <Typography variant="subtitle2" gutterBottom>
                        To:
                      </Typography>
                      <Paper sx={{ p: 1, bgcolor: 'success.light', color: 'success.contrastText' }}>
                        <Typography variant="body2" component="code">
                          {update.to?.expression || 'none'}
                        </Typography>
                      </Paper>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}

              {diff.addedConditions.length === 0 &&
                diff.removedConditions.length === 0 &&
                diff.updatedConditions.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No condition changes
                  </Typography>
                )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

