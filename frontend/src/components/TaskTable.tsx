import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  Box,
  Typography,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Task, Developer, TaskStatus } from '../types';
import { SkillChip } from './SkillChip';

interface TaskTableProps {
  tasks: Task[];
  developers: Developer[];
  loading: boolean;
  updatingTaskId: number | null;
  onRequestStatusChange: (task: Task, newStatus: TaskStatus) => void;
  onRequestAssigneeChange: (task: Task, developerId: number | null, developerName: string) => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  developers,
  loading,
  updatingTaskId,
  onRequestStatusChange,
  onRequestAssigneeChange,
}) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={10}>
        <CircularProgress size={40} sx={{ color: '#2563eb' }} />
      </Box>
    );
  }

  if (tasks.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
        <Typography variant="h6" color="#64748b" fontWeight={600}>
          No tasks available
        </Typography>
        <Typography variant="body2" color="#94a3b8" sx={{ mt: 1 }}>
          Click the "Create Task" button above to get started.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        bgcolor: '#ffffff',
      }}
    >
      <Table sx={{ minWidth: 650 }}>
        <TableHead sx={{ bgcolor: '#f8fafc' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, color: '#475569', py: 2 }}>Task Title</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#475569', py: 2, width: '220px' }}>Skills</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#475569', py: 2, width: '170px' }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#475569', py: 2, width: '210px' }}>Assignee</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.map((task) => {
            const taskSkillIds = task.skills.map((s) => s.id);
            const isRowUpdating = updatingTaskId === task.id;

            return (
              <TableRow
                key={task.id}
                hover
                sx={{
                  '&:last-child td, &:last-child th': { border: 0 },
                  transition: 'background-color 0.15s ease',
                  opacity: isRowUpdating ? 0.7 : 1,
                  bgcolor: isRowUpdating ? '#f8fafc' : 'inherit',
                }}
              >
                {/* Task Title */}
                <TableCell sx={{ color: '#0f172a', fontWeight: 500, fontSize: '0.95rem' }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    {isRowUpdating && <CircularProgress size={16} sx={{ color: '#2563eb' }} />}
                    {task.title}
                  </Box>
                </TableCell>

                {/* Skills */}
                <TableCell>
                  {task.skills && task.skills.length > 0 ? (
                    <Box display="flex" flexWrap="wrap">
                      {task.skills.map((skill) => (
                        <SkillChip key={skill.id} name={skill.name} />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary" fontStyle="italic">
                      None specified
                    </Typography>
                  )}
                </TableCell>

                {/* Status Dropdown */}
                <TableCell>
                  <FormControl size="small" fullWidth disabled={isRowUpdating}>
                    <Select
                      value={task.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as TaskStatus;
                        if (newStatus !== task.status) {
                          onRequestStatusChange(task, newStatus);
                        }
                      }}
                      sx={{
                        borderRadius: 2,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        bgcolor: task.status === 'Done' ? '#f0fdf4' : '#f8fafc',
                        color: task.status === 'Done' ? '#166534' : '#1e293b',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: task.status === 'Done' ? '#bbf7d0' : '#cbd5e1',
                        },
                      }}
                    >
                      <MenuItem value="To-do">
                        <Box display="flex" alignItems="center" gap={1}>
                          <HourglassEmptyIcon fontSize="small" color="action" />
                          To-do
                        </Box>
                      </MenuItem>
                      <MenuItem value="In Progress">
                        <Box display="flex" alignItems="center" gap={1}>
                          <HourglassEmptyIcon fontSize="small" color="primary" />
                          In Progress
                        </Box>
                      </MenuItem>
                      <MenuItem value="Done">
                        <Box display="flex" alignItems="center" gap={1}>
                          <CheckCircleOutlineIcon fontSize="small" color="success" />
                          Done
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>

                {/* Assignee Dropdown */}
                <TableCell>
                  <FormControl size="small" fullWidth disabled={isRowUpdating}>
                    <Select
                      displayEmpty
                      value={task.assigned_developer_id ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          if (task.assigned_developer_id !== null) {
                            onRequestAssigneeChange(task, null, 'Unassigned');
                          }
                        } else {
                          const devId = Number(val);
                          if (devId && devId !== task.assigned_developer_id) {
                            const targetDev = developers.find((d) => d.id === devId);
                            const devName = targetDev ? targetDev.name : `Developer #${devId}`;
                            onRequestAssigneeChange(task, devId, devName);
                          }
                        }
                      }}
                      renderValue={(selected) => {
                        if (!selected) {
                          return (
                            <Box display="flex" alignItems="center" gap={1} color="#94a3b8">
                              <PersonOutlineIcon fontSize="small" />
                              <em>Unassigned</em>
                            </Box>
                          );
                        }
                        const dev = developers.find((d) => d.id === Number(selected));
                        return (
                          <Box display="flex" alignItems="center" gap={1} fontWeight={600} color="#0f172a">
                            <PersonOutlineIcon fontSize="small" color="primary" />
                            {dev ? dev.name : task.assigned_developer?.name || `Dev #${selected}`}
                          </Box>
                        );
                      }}
                      sx={{
                        borderRadius: 2,
                        fontSize: '0.875rem',
                        bgcolor: '#ffffff',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#cbd5e1',
                        },
                      }}
                    >
                      <MenuItem value="">
                        <Box display="flex" alignItems="center" gap={1} color="#64748b">
                          <PersonOutlineIcon fontSize="small" />
                          <em>Unassigned</em>
                        </Box>
                      </MenuItem>
                      {developers.map((dev) => {
                        const devSkillIds = dev.skills.map((s) => s.id);
                        const hasAllSkills = taskSkillIds.every((skId) => devSkillIds.includes(skId));

                        return (
                          <MenuItem key={dev.id} value={dev.id}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                              <Typography variant="body2" fontWeight={hasAllSkills ? 600 : 400}>
                                {dev.name}
                              </Typography>
                              {!hasAllSkills && (
                                <Tooltip title="Lacks required skills for this task">
                                  <WarningAmberIcon fontSize="small" color="warning" sx={{ ml: 1 }} />
                                </Tooltip>
                              )}
                            </Box>
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
