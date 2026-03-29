import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorClass?: string;
  loading?: boolean;
}

export default function StatCard({ icon: Icon, label, value, trend, colorClass = "text-primary-600 bg-primary-100", loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-12 w-12 rounded-full bg-gray-200"></div>
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
        </div>
        <div className="mt-4 h-8 w-24 bg-gray-200 rounded"></div>
        <div className="mt-2 h-4 w-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-full", colorClass)}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && (
          <div className={cn("flex items-center text-sm font-medium", trend.isPositive ? "text-green-600" : "text-red-600")}>
            {trend.isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
            {trend.value}%
          </div>
        )}
      </div>
      <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
      <p className="text-sm font-medium text-gray-500 mt-1">{label}</p>
    </div>
  );
}
