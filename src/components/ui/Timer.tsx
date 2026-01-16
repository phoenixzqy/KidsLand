
interface TimerProps {
  timeLeft: number; // in seconds
  totalTime: number;
  size?: 'sm' | 'md' | 'lg';
  showWarning?: boolean;
  warningThreshold?: number; // seconds
}

export function Timer({
  timeLeft,
  totalTime,
  size = 'md',
  showWarning = true,
  warningThreshold = 2
}: TimerProps) {
  const percentage = (timeLeft / totalTime) * 100;
  const isWarning = showWarning && timeLeft <= warningThreshold && timeLeft > 0;
  const isExpired = timeLeft === 0;

  // Size configurations
  const sizeConfig = {
    sm: { width: 48, height: 48, strokeWidth: 4, fontSize: 'text-sm' },
    md: { width: 64, height: 64, strokeWidth: 5, fontSize: 'text-lg' },
    lg: { width: 80, height: 80, strokeWidth: 6, fontSize: 'text-xl' }
  };

  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color based on state
  const getColor = () => {
    if (isExpired) return '#ef4444'; // Red
    if (isWarning) return '#f59e0b'; // Orange
    if (percentage < 30) return '#f59e0b'; // Orange
    return '#22c55e'; // Green
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center ${isWarning ? 'animate-shake' : ''}`}
      style={{ width: config.width, height: config.height }}
    >
      {/* Background circle */}
      <svg
        className="absolute transform -rotate-90"
        width={config.width}
        height={config.height}
      >
        <circle
          cx={config.width / 2}
          cy={config.height / 2}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={config.strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={config.width / 2}
          cy={config.height / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={config.strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>

      {/* Time display */}
      <span
        className={`${config.fontSize} font-bold ${isWarning ? 'text-warning' : isExpired ? 'text-error' : 'text-slate-700'}`}
      >
        {timeLeft}
      </span>
    </div>
  );
}

// Simple linear timer bar
interface TimerBarProps {
  timeLeft: number;
  totalTime: number;
  className?: string;
}

export function TimerBar({ timeLeft, totalTime, className = '' }: TimerBarProps) {
  const percentage = (timeLeft / totalTime) * 100;
  const isWarning = timeLeft <= 2 && timeLeft > 0;

  const getColor = () => {
    if (timeLeft === 0) return 'bg-error';
    if (percentage < 30) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <div className={`w-full h-2 bg-slate-200 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-linear ${getColor()} ${
          isWarning ? 'animate-pulse' : ''
        }`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
