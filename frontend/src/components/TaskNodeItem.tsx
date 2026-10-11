import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Skill } from '../types';
import { SkillChip } from './SkillChip';

export interface TaskFormNode {
  id: string;
  isRoot?: boolean;
  title: string;
  task_skills: number[];
  subtasks: TaskFormNode[];
}

interface TaskNodeItemProps {
  node: TaskFormNode;
  availableSkills: Skill[];
  onUpdateTitle: (id: string, title: string) => void;
  onUpdateSkills: (id: string, skillIds: number[]) => void;
  onAddSubtask: (parentId: string) => void;
  onRemoveSubtask: (id: string) => void;
  error?: string;
}

export const TaskNodeItem: React.FC<TaskNodeItemProps> = ({
  node,
  availableSkills,
  onUpdateTitle,
  onUpdateSkills,
  onAddSubtask,
  onRemoveSubtask,
  error,
}) => {
  const isRoot = Boolean(node.isRoot);

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      {/* Task / Subtask Container Box (Enterprise wireframe design) */}
      <Box
        sx={{
          border: error ? '1.5px dashed #ef4444' : '1.5px dashed #cbd5e1',
          borderRadius: 2.5,
          p: 2.5,
          bgcolor: isRoot ? '#ffffff' : '#f8fafc',
          boxShadow: isRoot ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            borderColor: error ? '#ef4444' : '#94a3b8',
          },
        }}
      >
        {/* Header Row: Enterprise Nomenclature & Action Buttons */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={1}
          mb={2}
        >
          <Box display="flex" alignItems="center" gap={1.2}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{
                color: '#0f172a',
                letterSpacing: '-0.01em',
              }}
            >
              {isRoot ? 'New Task' : 'New Subtask'}
            </Typography>

            {/* Subtask indicator badge cleanly matching design */}
            {!isRoot && (
              <Typography
                variant="caption"
                sx={{
                  bgcolor: '#e0f2fe',
                  color: '#0369a1',
                  px: 1,
                  py: 0.3,
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  border: '1px solid #bae6fd',
                  lineHeight: 1,
                }}
              >
                Subtask
              </Typography>
            )}
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            {/* + Add Subtask Button */}
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => onAddSubtask(node.id)}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                borderColor: '#cbd5e1',
                color: '#334155',
                bgcolor: '#ffffff',
                '&:hover': {
                  borderColor: '#2563eb',
                  color: '#2563eb',
                  bgcolor: '#eff6ff',
                },
              }}
            >
              + Add Subtask
            </Button>

            {/* Remove Subtask Icon Button (only on subtasks) */}
            {!isRoot && (
              <Tooltip title="Remove this subtask">
                <IconButton
                  size="small"
                  onClick={() => onRemoveSubtask(node.id)}
                  sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Input Fields: Task Title & Required Skills */}
        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Task Title"
            placeholder={isRoot ? 'Enter task title...' : 'Enter subtask title...'}
            size="small"
            fullWidth
            value={node.title}
            onChange={(e) => onUpdateTitle(node.id, e.target.value)}
            error={Boolean(error)}
            helperText={error}
          />

          <FormControl size="small" fullWidth>
            <InputLabel id={`skills-label-${node.id}`}>Required Skill(s)</InputLabel>
            <Select
              labelId={`skills-label-${node.id}`}
              multiple
              value={node.task_skills}
              onChange={(e) => {
                const val = e.target.value;
                onUpdateSkills(
                  node.id,
                  typeof val === 'string' ? val.split(',').map(Number) : val
                );
              }}
              input={<OutlinedInput label="Required Skill(s)" />}
              renderValue={(selected) => (
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {selected.map((skillId) => {
                    const skill = availableSkills.find((s) => s.id === skillId);
                    if (!skill) return null;
                    return (
                      <SkillChip
                        key={skill.id}
                        name={skill.name}
                        onDelete={() =>
                          onUpdateSkills(
                            node.id,
                            node.task_skills.filter((id) => id !== skill.id)
                          )
                        }
                      />
                    );
                  })}
                </Box>
              )}
            >
              {availableSkills.map((skill) => (
                <MenuItem key={skill.id} value={skill.id}>
                  <Checkbox checked={node.task_skills.includes(skill.id)} size="small" />
                  <ListItemText primary={skill.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Nested Subtasks Container (Indented with connecting dashed line) */}
      {node.subtasks.length > 0 && (
        <Box
          sx={{
            pl: { xs: 2.5, sm: 4 },
            mt: 2,
            borderLeft: '2px dashed #93c5fd',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {node.subtasks.map((childNode) => (
            <TaskNodeItem
              key={childNode.id}
              node={childNode}
              availableSkills={availableSkills}
              onUpdateTitle={onUpdateTitle}
              onUpdateSkills={onUpdateSkills}
              onAddSubtask={onAddSubtask}
              onRemoveSubtask={onRemoveSubtask}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};
