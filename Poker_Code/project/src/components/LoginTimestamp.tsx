import React from 'react';
import { Clock } from 'lucide-react';
import { useDisplaySettings } from '../contexts/DisplaySettingsContext';
import { formatTime } from '../utils/formatters';

interface LoginTimestampProps {
  loginTime: Date;
}

export function LoginTimestamp({ loginTime }: LoginTimestampProps) {
  const { settings } = useDisplaySettings();

  return (
    <div className="flex items-center gap-2 text-gray-300">
      <Clock size={16} className="text-gray-400" />
      <span>{formatTime(loginTime, settings.timeFormat)}</span>
    </div>
  );
}