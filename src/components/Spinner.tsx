import React from 'react';
import { Box, Text } from 'ink';
import { SPINNER_FRAMES } from '../utils/icons.js';

interface SpinnerProps {
  label?: string;
  color?: string;
  frame: number;
}

export default function Spinner({ label, color = 'cyan', frame }: SpinnerProps) {
  return (
    <Box gap={1}>
      <Text color={color}>{SPINNER_FRAMES[frame % SPINNER_FRAMES.length]}</Text>
      {label && <Text>{label}</Text>}
    </Box>
  );
}
