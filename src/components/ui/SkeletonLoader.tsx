import { cn } from '../../lib/utils';

interface SkeletonLoaderProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export default function SkeletonLoader({ rows = 5, columns = 4, className }: SkeletonLoaderProps) {
  return (
    <div className={cn("w-full animate-pulse space-y-4", className)}>
      <div className="h-10 bg-gray-200 rounded-md w-full"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="h-8 bg-gray-200 rounded-md flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  );
}
