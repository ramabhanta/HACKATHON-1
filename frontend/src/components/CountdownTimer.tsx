import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt?: string;
  onExpire?: () => void;
  showIcon?: boolean;
  className?: string;
  urgencyThresholdHours?: number;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  expiresAt,
  onExpire,
  showIcon = true,
  className = '',
  urgencyThresholdHours = 4
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    totalMs: number;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    totalMs: 0
  });

  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true, totalMs: 0 });
        onExpire?.();
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, isExpired: false, totalMs: diff });
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (!expiresAt) return null;

  if (timeLeft.isExpired) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-100 text-red-800 font-black text-xs border border-red-200 ${className}`}>
        {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
        <span>24h Window Expired</span>
      </span>
    );
  }

  const isUrgent = timeLeft.hours < urgencyThresholdHours;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black border transition-all ${
        isUrgent
          ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
          : 'bg-amber-50 text-amber-900 border-amber-200'
      } ${className}`}
      title="Order confirmation required within 24 hours of booking submission"
    >
      {showIcon && <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-600' : 'text-amber-600'}`} />}
      <span>
        {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s left
      </span>
      {isUrgent && (
        <span className="text-[9px] uppercase tracking-wider bg-rose-600 text-white px-1.5 py-0.5 rounded font-black ml-0.5">
          Urgent SLA
        </span>
      )}
    </span>
  );
};
