import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Skill, CreateTaskPayload } from '../types';
import { TaskNodeItem, TaskFormNode } from './TaskNodeItem';

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  availableSkills: Skill[];
  onSubmit: (payload: CreateTaskPayload) => Promise<void>;
}

const createInitialRootNode = (): TaskFormNode => ({
  id: 'root-task',
  isRoot: true,
  title: '',
  task_skills: [],
  subtasks: [],
});

function addSubtaskToTree(node: TaskFormNode, targetParentId: string): TaskFormNode {
  if (node.id === targetParentId) {
    const newNode: TaskFormNode = {
      id: `subtask-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      isRoot: false,
      title: '',
      task_skills: [],
      subtasks: [],
    };
    return {
      ...node,
      subtasks: [...node.subtasks, newNode],
    };
  }
  return {
    ...node,
    subtasks: node.subtasks.map((child) => addSubtaskToTree(child, targetParentId)),
  };
}

function removeSubtaskFromTree(node: TaskFormNode, targetId: string): TaskFormNode {
  return {
    ...node,
    subtasks: node.subtasks
      .filter((child) => child.id !== targetId)
      .map((child) => removeSubtaskFromTree(child, targetId)),
  };
}

function updateNodeTitleInTree(node: TaskFormNode, targetId: string, title: string): TaskFormNode {
  if (node.id === targetId) {
    return { ...node, title };
  }
  return {
    ...node,
    subtasks: node.subtasks.map((child) => updateNodeTitleInTree(child, targetId, title)),
  };
}

function updateNodeSkillsInTree(node: TaskFormNode, targetId: string, skills: number[]): TaskFormNode {
  if (node.id === targetId) {
    return { ...node, task_skills: skills };
  }
  return {
    ...node,
    subtasks: node.subtasks.map((child) => updateNodeSkillsInTree(child, targetId, skills)),
  };
}

function validateTree(node: TaskFormNode): string | null {
  if (!node.title.trim()) {
    return node.isRoot ? 'Task title is required' : 'Subtask title is required';
  }
  for (const child of node.subtasks) {
    const err = validateTree(child);
    if (err) return err;
  }
  return null;
}

function treeToPayload(node: TaskFormNode): CreateTaskPayload {
  return {
    title: node.title.trim(),
    status: 'To-do',
    task_skills: node.task_skills,
    subtasks: node.subtasks.map(treeToPayload),
  };
}

export const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onClose,
  availableSkills,
  onSubmit,
}) => {
  const [rootNode, setRootNode] = useState<TaskFormNode>(createInitialRootNode);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleClose = () => {
    setRootNode(createInitialRootNode());
    setErrorMessage('');
    onClose();
  };

  const handleUpdateTitle = (nodeId: string, title: string) => {
    setRootNode((prev) => updateNodeTitleInTree(prev, nodeId, title));
    if (errorMessage) setErrorMessage('');
  };

  const handleUpdateSkills = (nodeId: string, skills: number[]) => {
    setRootNode((prev) => updateNodeSkillsInTree(prev, nodeId, skills));
  };

  const handleAddSubtask = (parentId: string) => {
    setRootNode((prev) => addSubtaskToTree(prev, parentId));
  };

  const handleRemoveSubtask = (nodeId: string) => {
    setRootNode((prev) => removeSubtaskFromTree(prev, nodeId));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateTree(rootNode);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setLoading(true);
      const payload = treeToPayload(rootNode);
      await onSubmit(payload);
      handleClose();
    } catch (err) {
      // Error is caught and surfaced in App notification toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <DialogTitle
        component="div"
        sx={{
          m: 0,
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <Typography component="span" variant="h6" fontWeight={700} color="#0f172a">
          Create Task(s)
        </Typography>
        <IconButton onClick={handleClose} size="small" sx={{ color: '#64748b' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSave}>
        <DialogContent sx={{ p: 3, maxHeight: '70vh', overflowY: 'auto' }}>
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <Box>
            <TaskNodeItem
              node={rootNode}
              availableSkills={availableSkills}
              onUpdateTitle={handleUpdateTitle}
              onUpdateSkills={handleUpdateSkills}
              onAddSubtask={handleAddSubtask}
              onRemoveSubtask={handleRemoveSubtask}
            />
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            p: 2.5,
            bgcolor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            justifyContent: 'flex-end',
          }}
        >
          <Button
            onClick={handleClose}
            disabled={loading}
            sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600, mr: 1 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disableElevation
            disabled={loading}
            sx={{
              bgcolor: '#2563eb',
              color: '#ffffff',
              fontWeight: 600,
              textTransform: 'none',
              px: 3.5,
              py: 0.9,
              borderRadius: 2,
              '&:hover': {
                bgcolor: '#1d4ed8',
              },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
