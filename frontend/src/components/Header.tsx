import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AssignmentIcon from '@mui/icons-material/Assignment';

interface HeaderProps {
  onOpenCreateDialog: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCreateDialog }) => {
  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: '#0f172a', borderBottom: '1px solid #1e293b' }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 1, justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                bgcolor: '#2563eb',
                p: 1,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              }}
            >
              <AssignmentIcon sx={{ color: '#ffffff' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                xDigital Task Manager
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Enterprise Task Assignment Platform
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            disableElevation
            startIcon={<AddIcon />}
            onClick={onOpenCreateDialog}
            sx={{
              bgcolor: '#2563eb',
              color: '#ffffff',
              fontWeight: 600,
              textTransform: 'none',
              px: 2.5,
              py: 1,
              borderRadius: 2,
              '&:hover': {
                bgcolor: '#1d4ed8',
              },
            }}
          >
            Create Task
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
};
