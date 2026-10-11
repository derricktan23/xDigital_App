import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Container,
  Typography,
  Paper,
} from '@mui/material';
import { Header } from './components/Header';
import { TaskTable } from './components/TaskTable';
import { CreateTaskDialog } from './components/CreateTaskDialog';
import { ConfirmDialog, PendingAction } from './components/ConfirmDialog';
import { NotificationSnackbar } from './components/NotificationSnackbar';
import { Task, Developer, Skill, CreateTaskPayload, TaskStatus } from './types';
import * as api from './api/client';

const theme = createTheme({
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  palette: {
    primary: {
      main: '#2563eb', // Corporate Blue
    },
    background: {
      default: '#f8fafc',
    },
  },
});

export const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  // Updating row loading state
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  // Modal Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Notification Toast State
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedTasks, fetchedDevs, fetchedSkills] = await Promise.all([
        api.getTasks(),
        api.getDevelopers(),
        api.getSkills(),
      ]);
      setTasks(fetchedTasks);
      setDevelopers(fetchedDevs);
      setSkills(fetchedSkills);
    } catch (err: any) {
      showSnackbar(err.response?.data?.error || 'Failed to connect to backend server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreateTask = async (payload: CreateTaskPayload) => {
    try {
      await api.createTask(payload);
      showSnackbar('Task created successfully!', 'success');
      await loadData();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to create task';
      showSnackbar(errMsg, 'error');
      throw err;
    }
  };

  const handleRequestStatusChange = (task: Task, newStatus: TaskStatus) => {
    setPendingAction({
      type: 'status',
      taskId: task.id,
      taskTitle: task.title,
      newValue: newStatus,
      displayLabel: newStatus,
    });
  };

  const handleRequestAssigneeChange = (task: Task, developerId: number | null, developerName: string) => {
    setPendingAction({
      type: 'assignee',
      taskId: task.id,
      taskTitle: task.title,
      newValue: developerId,
      displayLabel: developerName,
    });
  };

  const handleRequestSkillsChange = async (task: Task, newSkillIds: number[]) => {
    try {
      setUpdatingTaskId(task.id);
      const updatedTask = await api.updateTaskSkills(task.id, newSkillIds);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? updatedTask : t))
      );
      showSnackbar(`Skills updated for "${task.title}" successfully!`, 'success');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to update skills';
      showSnackbar(errMsg, 'error');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleExecutePendingAction = async () => {
    if (!pendingAction) return;

    const { type, taskId, newValue, displayLabel } = pendingAction;
    try {
      setConfirmLoading(true);
      setUpdatingTaskId(taskId);

      if (type === 'status') {
        const newStatus = newValue as TaskStatus;
        const updatedTask = await api.updateTaskStatus(taskId, newStatus);
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? updatedTask : t))
        );
        showSnackbar(`Task status updated to "${displayLabel}" successfully!`, 'success');
      } else if (type === 'assignee') {
        const devId = newValue as number | null;
        const updatedTask = await api.assignDeveloper(taskId, devId);
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? updatedTask : t))
        );
        if (devId === null) {
          showSnackbar('Task unassigned successfully!', 'success');
        } else {
          showSnackbar(`Task assigned to ${displayLabel} successfully!`, 'success');
        }
      }

      setPendingAction(null);
    } catch (err: any) {
      // Catch backend 400 skill validation error or server error and display red alert toast
      const errMsg = err.response?.data?.error || 'Operation failed';
      showSnackbar(errMsg, 'error');
      setPendingAction(null);
    } finally {
      setConfirmLoading(false);
      setUpdatingTaskId(null);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', pb: 8 }}>
        <Header onOpenCreateDialog={() => setCreateDialogOpen(true)} />

        <Container maxWidth="lg" sx={{ mt: 4 }}>
          {/* Main Content Area */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              mb: 3,
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h5" fontWeight={700} color="#0f172a">
                  Task List
                </Typography>
                <Typography variant="body2" color="#64748b">
                  Manage tasks, assign qualified developers, and track status.
                </Typography>
              </Box>
            </Box>

            <TaskTable
              tasks={tasks}
              developers={developers}
              availableSkills={skills}
              loading={loading}
              updatingTaskId={updatingTaskId}
              onRequestStatusChange={handleRequestStatusChange}
              onRequestAssigneeChange={handleRequestAssigneeChange}
              onRequestSkillsChange={handleRequestSkillsChange}
            />
          </Paper>
        </Container>

        {/* Create Task Dialog */}
        <CreateTaskDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          availableSkills={skills}
          onSubmit={handleCreateTask}
        />

        {/* Confirmation Modal Dialog for Status & Assignee updates */}
        <ConfirmDialog
          open={Boolean(pendingAction)}
          action={pendingAction}
          loading={confirmLoading}
          onConfirm={handleExecutePendingAction}
          onCancel={() => setPendingAction(null)}
        />

        {/* Notification Toast Alert (Snackbar) */}
        <NotificationSnackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        />
      </Box>
    </ThemeProvider>
  );
};

export default App;
