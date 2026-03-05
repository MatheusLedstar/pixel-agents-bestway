import React from 'react';
import { Box, Text } from 'ink';
import InkSpinner from 'ink-spinner';

interface SpinnerProps {
  label?: string;
}

export default function Spinner({ label }: SpinnerProps) {
  return (
    <Box gap={1}>
      <Text color="cyan">
        <InkSpinner type="dots" />
      </Text>
      {label && <Text>{label}</Text>}
    </Box>
  );
}
