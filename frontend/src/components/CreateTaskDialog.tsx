import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Checkbox,
  ListItemText,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Skill, CreateTaskPayload } from '../types';
import { SkillChip } from './SkillChip';

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  availableSkills: Skill[];
  onSubmit: (payload: CreateTaskPayload) => Promise<void>;
}

export const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onClose,
  availableSkills,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [titleError, setTitleError] = useState('');

  const handleClose = () => {
    setTitle('');
    setSelectedSkillIds([]);
    setTitleError('');
    onClose();
  };

  const handleRemoveSkill = (skillIdToRemove: number) => {
    setSelectedSkillIds((prev) => prev.filter((id) => id !== skillIdToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError('Task title is required');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        title: title.trim(),
        status: 'To-do',
        task_skills: selectedSkillIds,
      });
      handleClose();
    } catch (err) {
      // Error handled by parent notification
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={700} color="#0f172a">
          Create New Task
        </Typography>
        <IconButton onClick={handleClose} size="small" sx={{ color: '#64748b' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ p: 3 }}>
          <Box display="flex" flexDirection="column" gap={3}>
            <TextField
              label="Task Title"
              placeholder="e.g. As a visitor, I want a responsive homepage"
              multiline
              rows={3}
              fullWidth
              variant="outlined"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (e.target.value) setTitleError('');
              }}
              error={Boolean(titleError)}
              helperText={titleError}
              autoFocus
            />

            <FormControl fullWidth variant="outlined">
              <InputLabel id="skills-select-label">Required Skill(s)</InputLabel>
              <Select
                labelId="skills-select-label"
                multiple
                value={selectedSkillIds}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedSkillIds(typeof val === 'string' ? val.split(',').map(Number) : val);
                }}
                input={<OutlinedInput label="Required Skill(s)" />}
                renderValue={(selected) => (
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {selected.map((skillId) => {
                      const skill = availableSkills.find((s) => s.id === skillId);
                      if (!skill) return null;
                      return (
                        <Box
                          key={skill.id}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          display="inline-block"
                        >
                          <SkillChip
                            name={skill.name}
                            onDelete={() => handleRemoveSkill(skill.id)}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                )}
              >
                {availableSkills.map((skill) => (
                  <MenuItem key={skill.id} value={skill.id}>
                    <Checkbox checked={selectedSkillIds.includes(skill.id)} size="small" />
                    <ListItemText primary={skill.name} />
                  </MenuItem>
                ))}
              </Select>

              {/* Selected skills quick-deselect badges section */}
              {selectedSkillIds.length > 0 && (
                <Box mt={1.5}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                    Selected Skills (Click 'X' to remove):
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {selectedSkillIds.map((skillId) => {
                      const skill = availableSkills.find((s) => s.id === skillId);
                      if (!skill) return null;
                      return (
                        <SkillChip
                          key={skill.id}
                          name={skill.name}
                          onDelete={() => handleRemoveSkill(skill.id)}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, ml: 0.5 }}>
                Developers do not need to be assigned at task creation.
              </Typography>
            </FormControl>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc' }}>
          <Button onClick={handleClose} disabled={loading} sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}>
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
              px: 3,
              py: 1,
              borderRadius: 2,
              '&:hover': {
                bgcolor: '#1d4ed8',
              },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Task'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
