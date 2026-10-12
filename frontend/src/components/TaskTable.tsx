import React, { useState } from 'react';
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
  IconButton,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Button,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import { Task, Developer, Skill, TaskStatus } from '../types';
import { SkillChip } from './SkillChip';

interface TaskTableProps {
  tasks: Task[];
  developers: Developer[];
  availableSkills: Skill[];
  loading: boolean;
  updatingTaskId: number | null;
  analyzingTaskIds?: Set<number>;
  aiRecommendations?: Record<number, Skill[]>;
  onRequestStatusChange: (task: Task, newStatus: TaskStatus) => void;
  onRequestAssigneeChange: (task: Task, developerId: number | null, developerName: string) => void;
  onRequestSkillsChange: (task: Task, newSkillIds: number[]) => void;
  onApplyRecommendation?: (taskId: number, skills: Skill[]) => void;
  onDismissRecommendation?: (taskId: number) => void;
}

/**
 * Organizes tasks hierarchically so that any subtask is rendered
 * immediately beneath its parent task row in tree order.
 */
function getHierarchicalTasks(tasks: Task[]): Task[] {
  const childrenMap = new Map<number, Task[]>();
  const rootTasks: Task[] = [];

  for (const task of tasks) {
    if (task.parent_task_id) {
      const list = childrenMap.get(task.parent_task_id) || [];
      list.push(task);
      childrenMap.set(task.parent_task_id, list);
    } else {
      rootTasks.push(task);
    }
  }

  const result: Task[] = [];
  function appendTree(task: Task) {
    result.push(task);
    const children = childrenMap.get(task.id) || [];
    for (const child of children) {
      appendTree(child);
    }
  }

  for (const root of rootTasks) {
    appendTree(root);
  }

  // Handle any orphan subtasks whose parent wasn't found in rootTasks
  const visited = new Set(result.map((t) => t.id));
  for (const task of tasks) {
    if (!visited.has(task.id)) {
      result.push(task);
    }
  }

  return result;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  developers,
  availableSkills,
  loading,
  updatingTaskId,
  analyzingTaskIds,
  aiRecommendations,
  onRequestStatusChange,
  onRequestAssigneeChange,
  onRequestSkillsChange,
  onApplyRecommendation,
  onDismissRecommendation,
}) => {
  // Collapsed task IDs (starts empty so all rows are expanded by default)
  const [collapsedTaskIds, setCollapsedTaskIds] = useState<Set<number>>(new Set());

  const toggleExpand = (taskId: number) => {
    setCollapsedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={10}>
        <CircularProgress size={40} sx={{ color: '#2563eb' }} />
      </Box>
    );
  }

  if (tasks.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 6,
          textAlign: 'center',
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
        }}
      >
        <Typography variant="h6" color="#64748b" fontWeight={600}>
          No tasks available
        </Typography>
        <Typography variant="body2" color="#94a3b8" sx={{ mt: 1 }}>
          Click the "Create Task" button above to get started.
        </Typography>
      </Paper>
    );
  }

  const taskMap = new Map<number, Task>(tasks.map((t) => [t.id, t]));

  // Calculate total descendant subtasks for each task
  const descendantCountMap = new Map<number, number>();
  for (const task of tasks) {
    let curr = task.parent_task_id;
    while (curr) {
      descendantCountMap.set(curr, (descendantCountMap.get(curr) || 0) + 1);
      const parent = taskMap.get(curr);
      curr = parent?.parent_task_id;
    }
  }

  // Calculate nesting depth for indentation
  const getTaskDepth = (task: Task): number => {
    let depth = 0;
    let curr = task.parent_task_id;
    while (curr) {
      depth++;
      const parent = taskMap.get(curr);
      curr = parent?.parent_task_id;
    }
    return depth;
  };

  const isRowHidden = (task: Task): boolean => {
    let currentParentId = task.parent_task_id;
    while (currentParentId) {
      if (collapsedTaskIds.has(currentParentId)) {
        return true;
      }
      const parent = taskMap.get(currentParentId);
      currentParentId = parent?.parent_task_id;
    }
    return false;
  };

  // Map main tasks (root tasks without a parent) to sequential display IDs: 1, 2, 3, 4, ...
  // Subtasks do not consume main task IDs
  const mainTaskIdToDisplayNum = new Map<number, number>();
  const rootTasksSorted = tasks
    .filter((t) => !t.parent_task_id)
    .sort((a, b) => a.id - b.id);
  rootTasksSorted.forEach((t, index) => {
    mainTaskIdToDisplayNum.set(t.id, index + 1);
  });

  // Helper to find the main/root ancestor display number for any task or subtask
  const getMainTaskDisplayNum = (task: Task): number | undefined => {
    let curr: Task | undefined = task;
    while (curr && curr.parent_task_id) {
      curr = taskMap.get(curr.parent_task_id);
    }
    return curr ? mainTaskIdToDisplayNum.get(curr.id) : undefined;
  };

  const orderedTasks = getHierarchicalTasks(tasks);

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
      <Table sx={{ minWidth: 700 }}>
        <TableHead sx={{ bgcolor: '#f8fafc' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, color: '#475569', py: 2, width: '80px' }}>
              ID
            </TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#475569', py: 2 }}>
              Task Title
            </TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#475569', py: 2, width: '200px' }}>
              Skills
            </TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#475569', py: 2, width: '160px' }}>
              Status
            </TableCell>
            <TableCell sx={{ fontWeight: 700, color: '#475569', py: 2, width: '200px' }}>
              Assignee
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orderedTasks.map((task) => {
            // Hide row if its parent or any ancestor task is collapsed (minimized)
            if (isRowHidden(task)) {
              return null;
            }

            const taskSkillIds = task.skills.map((s) => s.id);
            const isRowUpdating = updatingTaskId === task.id;
            const isSubtask = Boolean(task.parent_task_id);
            const depth = getTaskDepth(task);
            const subtaskCount = descendantCountMap.get(task.id) || 0;
            const hasSubtasks = subtaskCount > 0;
            const isExpanded = !collapsedTaskIds.has(task.id);

            return (
              <TableRow
                key={task.id}
                hover
                sx={{
                  '&:last-child td, &:last-child th': { border: 0 },
                  transition: 'background-color 0.15s ease',
                  opacity: isRowUpdating ? 0.7 : 1,
                  bgcolor: isRowUpdating ? '#f8fafc' : isSubtask ? '#fcfdfd' : 'inherit',
                }}
              >
                {/* 1. ID Column (Only main tasks are numbered sequentially; subtasks do not consume IDs) */}
                <TableCell
                  sx={{
                    color: '#0f172a',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    verticalAlign: isSubtask ? 'top' : 'middle',
                    pt: isSubtask ? 2.5 : 2,
                  }}
                >
                  {!isSubtask ? `#${mainTaskIdToDisplayNum.get(task.id) || task.id}` : null}
                </TableCell>

                {/* 2. Task Title Column (with expand/collapse controls) */}
                <TableCell
                  sx={{
                    color: '#0f172a',
                    fontSize: '0.95rem',
                    verticalAlign: isSubtask ? 'top' : 'middle',
                    pt: isSubtask ? 2.2 : 2,
                  }}
                >
                  {isSubtask ? (
                    <Box
                      display="flex"
                      alignItems="flex-start"
                      gap={1}
                      pl={depth > 1 ? (depth - 1) * 3 + 2 : 2}
                    >
                      {isRowUpdating && (
                        <CircularProgress size={16} sx={{ color: '#2563eb', mt: 0.5 }} />
                      )}
                      <SubdirectoryArrowRightIcon
                        sx={{ color: '#94a3b8', fontSize: 20, mt: '2px', flexShrink: 0 }}
                      />
                      <Box flex={1}>
                        <Box
                          display="flex"
                          alignItems="center"
                          gap={0.5}
                          onClick={hasSubtasks ? () => toggleExpand(task.id) : undefined}
                          sx={{
                            cursor: hasSubtasks ? 'pointer' : 'default',
                            userSelect: 'none',
                          }}
                        >
                          {hasSubtasks ? (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(task.id);
                              }}
                              sx={{ p: 0.2, color: '#64748b', '&:hover': { color: '#0f172a' } }}
                              title={isExpanded ? 'Minimize subtasks' : 'Expand subtasks'}
                            >
                              {isExpanded ? (
                                <KeyboardArrowDownIcon fontSize="small" />
                              ) : (
                                <KeyboardArrowRightIcon fontSize="small" />
                              )}
                            </IconButton>
                          ) : null}
                          <Typography
                            sx={{
                              fontWeight: 500,
                              color: '#1e293b',
                              fontSize: '0.95rem',
                              lineHeight: 1.4,
                            }}
                          >
                            {task.title}
                          </Typography>
                          {!isExpanded && hasSubtasks && (
                            <Typography
                              variant="caption"
                              sx={{
                                bgcolor: '#e2e8f0',
                                color: '#475569',
                                px: 0.8,
                                py: 0.2,
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                ml: 0.5,
                              }}
                            >
                              +{subtaskCount} subtask{subtaskCount > 1 ? 's' : ''}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ mt: 0.6 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              bgcolor: '#f1f5f9',
                              color: '#64748b',
                              px: 1,
                              py: 0.3,
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              display: 'inline-block',
                            }}
                          >
                            Subtask of #{getMainTaskDisplayNum(task) || task.parent_task_id}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ) : (
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={1}
                      onClick={hasSubtasks ? () => toggleExpand(task.id) : undefined}
                      sx={{
                        cursor: hasSubtasks ? 'pointer' : 'default',
                        userSelect: 'none',
                      }}
                    >
                      {isRowUpdating && <CircularProgress size={16} sx={{ color: '#2563eb' }} />}
                      {hasSubtasks ? (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(task.id);
                          }}
                          sx={{
                            p: 0.3,
                            color: '#64748b',
                            '&:hover': { color: '#0f172a', bgcolor: '#f1f5f9' },
                          }}
                          title={isExpanded ? 'Minimize subtasks' : 'Expand subtasks'}
                        >
                          {isExpanded ? (
                            <KeyboardArrowDownIcon fontSize="small" />
                          ) : (
                            <KeyboardArrowRightIcon fontSize="small" />
                          )}
                        </IconButton>
                      ) : (
                        <Box sx={{ width: 26 }} />
                      )}
                      <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>
                        {task.title}
                      </Typography>
                      {!isExpanded && hasSubtasks && (
                        <Typography
                          variant="caption"
                          sx={{
                            bgcolor: '#e2e8f0',
                            color: '#475569',
                            px: 0.8,
                            py: 0.2,
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            ml: 0.5,
                          }}
                        >
                          +{subtaskCount} subtask{subtaskCount > 1 ? 's' : ''}
                        </Typography>
                      )}
                    </Box>
                  )}
                </TableCell>

                {/* 3. Skills Column (Interactive Multi-Select with Separate Enterprise AI Recommendation UI) */}
                <TableCell sx={{ verticalAlign: isSubtask ? 'top' : 'middle', pt: isSubtask ? 2 : 2, minWidth: 230 }}>
                  <Box display="flex" flexDirection="column" gap={0.8}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <FormControl size="small" fullWidth disabled={isRowUpdating}>
                        <Select
                          multiple
                          displayEmpty
                          value={task.skills.map((s) => s.id)}
                          onChange={(e) => {
                            const val = e.target.value;
                            const rawList = typeof val === 'string' ? val.split(',') : (val as (number | string)[]);
                            if (rawList.includes('__AI_RECOMMEND__')) {
                              onRequestAiRecommend?.(task);
                              return;
                            }
                            const newSkillIds = rawList
                              .map(Number)
                              .filter((id) => !isNaN(id));
                            onRequestSkillsChange(task, newSkillIds);
                          }}
                          input={<OutlinedInput size="small" />}
                          renderValue={(selected) => {
                            const sel = (selected as number[]).filter((id) => typeof id === 'number' && !isNaN(id));
                            if (!sel || sel.length === 0) {
                              return (
                                <Box display="flex" alignItems="center" gap={0.5} color="#94a3b8">
                                  <Typography variant="body2" sx={{ fontStyle: 'italic', fontSize: '0.82rem' }}>
                                    None specified
                                  </Typography>
                                </Box>
                              );
                            }
                            return (
                              <Box display="flex" flexWrap="wrap" gap={0.5}>
                                {sel.map((skillId) => {
                                  const skill = (availableSkills || []).find((s) => s.id === skillId);
                                  return skill ? <SkillChip key={skill.id} name={skill.name} /> : null;
                                })}
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
                          {(availableSkills || []).map((skill) => (
                            <MenuItem key={skill.id} value={skill.id}>
                              <Checkbox
                                checked={task.skills.some((s) => s.id === skill.id)}
                                size="small"
                              />
                              <ListItemText primary={skill.name} />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    {/* SEPARATE ENTERPRISE UI FOR AUTOMATIC AI RECOMMENDATIONS */}
                    {/* 1. If currently analyzing with AI */}
                    {analyzingTaskIds?.has(task.id) && (
                      <Box
                        sx={{
                          p: 0.8,
                          borderRadius: 1.5,
                          bgcolor: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.8,
                          color: '#1d4ed8',
                        }}
                      >
                        <CircularProgress size={12} color="inherit" />
                        <Typography variant="caption" fontWeight={600} fontSize="0.72rem">
                          AI analyzing task title...
                        </Typography>
                      </Box>
                    )}

                    {/* 2. If recommendation is available and task has no confirmed skills */}
                    {aiRecommendations?.[task.id] &&
                      aiRecommendations[task.id].length > 0 &&
                      !analyzingTaskIds?.has(task.id) && (
                        <Box
                          sx={{
                            p: 0.8,
                            borderRadius: 1.5,
                            bgcolor: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 0.8,
                          }}
                        >
                          <Box display="flex" alignItems="center" gap={0.6} flexWrap="wrap">
                            <AutoAwesomeIcon sx={{ fontSize: 13, color: '#16a34a' }} />
                            <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#15803d' }}>
                              AI Suggestion:
                            </Typography>
                            {aiRecommendations[task.id].map((sk) => (
                              <SkillChip key={sk.id} name={sk.name} />
                            ))}
                          </Box>

                          <Box display="flex" alignItems="center" gap={0.4}>
                            <Button
                              size="small"
                              variant="contained"
                              disabled={isRowUpdating}
                              onClick={(e) => {
                                e.stopPropagation();
                                onApplyRecommendation?.(task.id, aiRecommendations[task.id]);
                              }}
                              sx={{
                                minWidth: 'auto',
                                px: 1,
                                py: 0.2,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                bgcolor: '#16a34a',
                                '&:hover': { bgcolor: '#15803d' },
                                borderRadius: 1,
                              }}
                            >
                              Apply
                            </Button>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDismissRecommendation?.(task.id);
                              }}
                              sx={{ p: 0.2, color: '#94a3b8' }}
                            >
                              <CloseIcon sx={{ fontSize: 13 }} />
                            </IconButton>
                          </Box>
                        </Box>
                      )}
                  </Box>
                </TableCell>

                {/* 4. Status Dropdown Column */}
                <TableCell sx={{ verticalAlign: isSubtask ? 'top' : 'middle', pt: isSubtask ? 2 : 2 }}>
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

                {/* 5. Assignee Dropdown Column */}
                <TableCell sx={{ verticalAlign: isSubtask ? 'top' : 'middle', pt: isSubtask ? 2 : 2 }}>
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
