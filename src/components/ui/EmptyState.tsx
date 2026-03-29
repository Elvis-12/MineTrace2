import { ReactNode } from 'react';
import { SearchX } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon = <SearchX className="h-12 w-12 text-gray-400" />,
  title = "No data found",
  description = "There is no data to display at this time.",
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="mb-4 rounded-full bg-gray-100 p-4">
        {icon}
      </div>
      <h3 className="mb-1 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mb-4 text-sm text-gray-500 max-w-sm">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
