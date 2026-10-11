import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  Typography,
  Box,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { TaskStatus } from '../types';

export interface PendingAction {
  type: 'status' | 'assignee';
  taskId: number;
  taskTitle: string;
  newValue: TaskStatus | number | null;
  displayLabel: string;
}

interface ConfirmDialogProps {
  open: boolean;
  action: PendingAction | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  action,
  loading,
  onConfirm,
  onCancel,
}) => {
  if (!action) return null;

  const isStatus = action.type === 'status';
  const isUnassign = action.type === 'assignee' && action.newValue === null;

  const headerBgColor = isStatus ? '#eff6ff' : isUnassign ? '#fef2f2' : '#f0fdf4';
  const headerIconColor = isStatus ? '#2563eb' : isUnassign ? '#dc2626' : '#16a34a';
  const buttonBgColor = isStatus ? '#2563eb' : isUnassign ? '#dc2626' : '#16a34a';
  const buttonHoverColor = isStatus ? '#1d4ed8' : isUnassign ? '#b91c1c' : '#15803d';

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <Box
          sx={{
            bgcolor: headerBgColor,
            color: headerIconColor,
            p: 1,
            borderRadius: '50%',
            display: 'flex',
          }}
        >
          <HelpOutlineIcon fontSize="medium" />
        </Box>
        <Typography variant="h6" fontWeight={700} color="#0f172a">
          {isStatus
            ? 'Confirm Status Change'
            : isUnassign
            ? 'Confirm Unassign Developer'
            : 'Confirm Developer Assignment'}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <DialogContentText color="#475569" fontSize="0.95rem">
          {isStatus ? (
            <>
              Are you sure you want to change the status of task <strong>"{action.taskTitle}"</strong> to{' '}
              <strong style={{ color: '#2563eb' }}>"{action.displayLabel}"</strong>?
            </>
          ) : isUnassign ? (
            <>
              Are you sure you want to unassign the developer from task{' '}
              <strong>"{action.taskTitle}"</strong>?
            </>
          ) : (
            <>
              Are you sure you want to assign task <strong>"{action.taskTitle}"</strong> to developer{' '}
              <strong style={{ color: '#16a34a' }}>"{action.displayLabel}"</strong>?
            </>
          )}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading} sx={{ color: '#64748b', fontWeight: 600, textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disableElevation
          disabled={loading}
          sx={{
            bgcolor: buttonBgColor,
            color: '#ffffff',
            fontWeight: 600,
            textTransform: 'none',
            px: 2.5,
            py: 0.8,
            borderRadius: 2,
            '&:hover': {
              bgcolor: buttonHoverColor,
            },
          }}
        >
          {loading ? (
            <CircularProgress size={22} color="inherit" />
          ) : isUnassign ? (
            'Unassign'
          ) : (
            'Confirm'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
