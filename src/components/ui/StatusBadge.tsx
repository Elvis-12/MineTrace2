import { STATUS_COLORS } from '../../constants/statusColors';
import { cn } from '../../lib/utils';

interface StatusBadgeProps {
  status: keyof typeof STATUS_COLORS | string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", colorClass.bg, colorClass.text, className)}>
      {status.replace('_', ' ')}
    </span>
  );
}
