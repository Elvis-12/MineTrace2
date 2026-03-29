import { RISK_COLORS } from '../../constants/statusColors';
import { cn } from '../../lib/utils';

interface RiskBadgeProps {
  level: keyof typeof RISK_COLORS | string;
  className?: string;
}

export default function RiskBadge({ level, className }: RiskBadgeProps) {
  const colorClass = RISK_COLORS[level as keyof typeof RISK_COLORS] || RISK_COLORS.UNKNOWN;
  const isHigh = level === 'HIGH';
  
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", colorClass.bg, colorClass.text, className)}>
      <span className={cn("mr-1.5 h-2 w-2 rounded-full", colorClass.dot, isHigh && "animate-pulse")}></span>
      {level}
    </span>
  );
}
