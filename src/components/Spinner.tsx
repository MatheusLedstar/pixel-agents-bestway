import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { SPINNER_FRAMES } from '../utils/icons.js';

interface SpinnerProps {
  label?: string;
  color?: string;
}

export default function Spinner({ label, color = 'cyan' }: SpinnerProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % SPINNER_FRAMES.length);
    }, 80);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box gap={1}>
      <Text color={color}>{SPINNER_FRAMES[frame]}</Text>
      {label && <Text>{label}</Text>}
    </Box>
  );
}
