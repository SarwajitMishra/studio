
'use client';

import { useEffect, useState } from 'react';

export default function DateTimeWidget() {
  const [dateTime, setDateTime] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Prevent hydration mismatch by only rendering the dynamic time on the client
  if (!isMounted) {
    return (
        <div className="text-sm text-primary-foreground font-medium text-right h-5 w-48 bg-primary/50 animate-pulse rounded-md" />
    );
  }

  return (
    <div className="text-sm text-primary-foreground font-medium text-right">
      <span>{dateTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
      <span className="ml-2">{dateTime.toLocaleTimeString()}</span>
    </div>
  );
}
