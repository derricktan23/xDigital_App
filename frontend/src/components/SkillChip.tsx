import React from 'react';
import { Chip } from '@mui/material';

interface SkillChipProps {
  name: string;
  onDelete?: (e?: any) => void;
}

export const SkillChip: React.FC<SkillChipProps> = ({ name, onDelete }) => {
  const isFrontend = name.toLowerCase().includes('frontend');
  const isBackend = name.toLowerCase().includes('backend');

  const bgColor = isFrontend ? '#eff6ff' : isBackend ? '#f0fdf4' : '#f8fafc';
  const textColor = isFrontend ? '#1d4ed8' : isBackend ? '#15803d' : '#475569';
  const borderColor = isFrontend ? '#bfdbfe' : isBackend ? '#bbf7d0' : '#e2e8f0';

  return (
    <Chip
      label={name}
      size="small"
      onDelete={onDelete}
      sx={{
        bgcolor: bgColor,
        color: textColor,
        border: `1px solid ${borderColor}`,
        fontWeight: 600,
        fontSize: '0.75rem',
        borderRadius: '6px',
        mr: 0.5,
        mb: 0.5,
        '& .MuiChip-deleteIcon': {
          color: textColor,
          opacity: 0.7,
          '&:hover': {
            opacity: 1,
            color: textColor,
          },
        },
      }}
    />
  );
};
