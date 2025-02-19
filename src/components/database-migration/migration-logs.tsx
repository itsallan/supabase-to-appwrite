import React from 'react';
import { Card } from '@/components/ui/card';
import type { LogEntry } from '@/lib/types';

interface MigrationLogsProps {
  logs: LogEntry[];
}

export function MigrationLogs({ logs }: MigrationLogsProps) {
  if (logs.length === 0) return null;

  const getLogColor = (type: LogEntry['type']): string => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Migration Logs</h3>
      <Card className="bg-gray-50 p-4 max-h-96 overflow-y-auto">
        {logs.map((log) => (
          <div 
            key={log.id} 
            className={`mb-1 text-sm ${getLogColor(log.type)}`}
          >
            {log.timestamp.toLocaleTimeString()}: {log.message}
          </div>
        ))}
      </Card>
    </div>
  );
}