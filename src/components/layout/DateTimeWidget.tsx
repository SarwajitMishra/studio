
'use client';

import { useEffect, useState } from 'react';

export default function DateTimeWidget() {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-sm text-primary-foreground font-medium text-right">
      <span>{dateTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
      <span className="ml-2">{dateTime.toLocaleTimeString()}</span>
    </div>
  );
}
