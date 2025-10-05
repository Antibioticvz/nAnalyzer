import React from 'react';
import { Snackbar, Alert, AlertTitle } from '@mui/material';

export interface AlertPopupProps {
  open: boolean;
  severity: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  message: string;
  onClose: () => void;
  autoHideDuration?: number;
}

const AlertPopup: React.FC<AlertPopupProps> = ({
  open,
  severity,
  title,
  message,
  onClose,
  autoHideDuration = 6000,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {message}
      </Alert>
    </Snackbar>
  );
};

export default AlertPopup;
