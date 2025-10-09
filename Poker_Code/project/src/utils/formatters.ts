import { DisplaySettings } from '../contexts/DisplaySettingsContext';

export function formatNumber(value: number, format: DisplaySettings['numberFormat']) {
  return format === 'comma'
    ? value.toLocaleString('en-US')
    : value.toLocaleString('de-DE');
}

export function formatTime(date: Date, format: DisplaySettings['timeFormat']) {
  return format === '12h'
    ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
    : date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}