import React, { useState, useEffect } from 'react';
import client from '../api/client';

export default function DbStatus() {
  const [connected, setConnected] = useState(null); // null = checking

  useEffect(() => {
    const check = () =>
      client.get('/health/db')
        .then(r => setConnected(r.data.connected))
        .catch(() => setConnected(false));

    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  const isChecking = connected === null;
  const dotColor = isChecking ? 'bg-gray-400' : connected ? 'bg-green-500' : 'bg-red-500';
  const pingColor = connected ? 'bg-green-400' : null;
  const label = isChecking ? 'بررسی...' : connected ? 'دیتابیس متصل' : 'دیتابیس قطع';

  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        {pingColor && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pingColor} opacity-60 [animation-duration:2s]`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
      </span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}
