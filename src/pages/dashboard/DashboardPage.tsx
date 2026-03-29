import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Package, Truck, ShieldAlert, Activity, ArrowRight, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { format } from 'date-fns';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import RiskBadge from '../../components/ui/RiskBadge';
import { batchApi } from '../../api/batchApi';
import { movementApi } from '../../api/movementApi';
import { ROUTES } from '../../constants/routes';
import { formatRelativeTime } from '../../utils/formatDate';
import { STATUS_COLORS } from '../../constants/statusColors';

export default function DashboardPage() {
  const { data: batchesData, isLoading: isLoadingBatches } = useQuery({
    queryKey: ['batches'],
    queryFn: () => batchApi.getAll(),
  });

  const { data: movementsData, isLoading: isLoadingMovements } = useQuery({
    queryKey: ['movements'],
    queryFn: () => movementApi.getAll(),
  });

  const batches = batchesData?.data || [];
  const movements = movementsData?.data || [];

  // Calculate stats
  const totalBatches = batches.length;
  const inTransitBatches = batches.filter((b: any) => b.status === 'IN_TRANSIT').length;
  const highRiskBatches = batches.filter((b: any) => b.riskLevel === 'HIGH');
  const movementsToday = movements.filter((m: any) => {
    const today = new Date();
    const eventDate = new Date(m.timestamp);
    return eventDate.getDate() === today.getDate() && eventDate.getMonth() === today.getMonth() && eventDate.getFullYear() === today.getFullYear();
  }).length;

  // Chart Data: Registration over last 30 days (mocked for visual)
  const lineChartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: format(d, 'MMM dd'),
      count: Math.floor(Math.random() * 20) + 5,
    };
  });

  // Chart Data: Status Distribution
  const statusCounts = batches.reduce((acc: any, batch: any) => {
    acc[batch.status] = (acc[batch.status] || 0) + 1;
    return acc;
  }, {});
  
  const pieChartData = Object.keys(statusCounts).map(status => ({
    name: status.replace('_', ' '),
    value: statusCounts[status],
    color: STATUS_COLORS[status as keyof typeof STATUS_COLORS]?.text.replace('text-', 'bg-').replace('800', '500') || '#94a3b8'
  }));

  // Chart Data: Risk Distribution
  const riskCounts = batches.reduce((acc: any, batch: any) => {
    if (batch.riskLevel !== 'UNKNOWN') {
      acc[batch.riskLevel] = (acc[batch.riskLevel] || 0) + 1;
    }
    return acc;
  }, { LOW: 0, MEDIUM: 0, HIGH: 0 });

  const riskBarData = [
    { name: 'Low', count: riskCounts.LOW, fill: '#10b981' },
    { name: 'Medium', count: riskCounts.MEDIUM, fill: '#f59e0b' },
    { name: 'High', count: riskCounts.HIGH, fill: '#ef4444' },
  ];

  // Chart Data: Top Mines
  const mineCounts = batches.reduce((acc: any, batch: any) => {
    acc[batch.mineName] = (acc[batch.mineName] || 0) + 1;
    return acc;
  }, {});
  
  const topMinesData = Object.keys(mineCounts)
    .map(name => ({ name, count: mineCounts[name] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Package} 
          label="Total Batches" 
          value={totalBatches} 
          colorClass="text-blue-600 bg-blue-100" 
          loading={isLoadingBatches} 
        />
        <StatCard 
          icon={Truck} 
          label="In Transit" 
          value={inTransitBatches} 
          colorClass="text-amber-600 bg-amber-100" 
          loading={isLoadingBatches} 
        />
        <StatCard 
          icon={ShieldAlert} 
          label="High Risk Flagged" 
          value={highRiskBatches.length} 
          colorClass="text-red-600 bg-red-100" 
          loading={isLoadingBatches} 
        />
        <StatCard 
          icon={Activity} 
          label="Movements Today" 
          value={movementsToday} 
          colorClass="text-green-600 bg-green-100" 
          loading={isLoadingMovements} 
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Registrations (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                />
                <Line type="monotone" dataKey="count" stroke="#1e3a5f" strokeWidth={3} dot={{ r: 4, fill: '#1e3a5f', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Batch Status Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            {batches.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#3b82f6', '#f59e0b', '#94a3b8', '#10b981', '#ef4444'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400 text-sm">No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fraud Risk Levels</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskBarData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {riskBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Mines by Volume</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topMinesData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={100} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Link to={ROUTES.MOVEMENTS} className="text-sm font-medium text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          <div className="p-0 flex-1 overflow-y-auto max-h-[400px]">
            {isLoadingMovements ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>)}
              </div>
            ) : movements.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {movements.slice(0, 10).map((movement: any) => (
                  <li key={movement.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {movement.eventType}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          <Link to={ROUTES.BATCH_DETAIL(movement.batchId)} className="hover:underline text-primary-600 font-mono">
                            {movement.batchCode}
                          </Link>
                        </p>
                        <div className="mt-1 flex items-center text-sm text-gray-500 gap-2">
                          <span className="truncate">{movement.fromLocation}</span>
                          <ArrowRight className="h-3 w-3 flex-shrink-0 text-gray-400" />
                          <span className="truncate">{movement.toLocation}</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-400">
                          Recorded by {movement.recordedBy} • {formatRelativeTime(movement.timestamp)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-gray-500">No recent activity</div>
            )}
          </div>
        </div>

        {/* High Risk Alerts */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">High Risk Alerts</h3>
            <Link to={ROUTES.FRAUD} className="text-sm font-medium text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          <div className="p-0 flex-1 overflow-y-auto max-h-[400px] bg-slate-50/50">
            {isLoadingBatches ? (
              <div className="p-6 space-y-4">
                {[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>)}
              </div>
            ) : highRiskBatches.length > 0 ? (
              <ul className="p-4 space-y-3">
                {highRiskBatches.map((batch: any) => (
                  <li key={batch.id} className="bg-white border border-red-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                    <div className="flex justify-between items-start mb-2">
                      <Link to={ROUTES.BATCH_DETAIL(batch.id)} className="font-mono text-sm font-bold text-gray-900 hover:text-primary-600">
                        {batch.batchCode}
                      </Link>
                      <RiskBadge level="HIGH" />
                    </div>
                    <div className="flex justify-between items-end mt-3">
                      <div className="text-xs text-gray-500">
                        {batch.mineralType} • {batch.mineName}
                      </div>
                      <div className="text-right">
                        <span className="block text-xs text-gray-500 mb-0.5">Anomaly Score</span>
                        <span className="text-sm font-bold text-red-600">{batch.anomalyScore.toFixed(1)}/5.0</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 flex flex-col items-center justify-center text-center h-full">
                <div className="bg-green-100 p-3 rounded-full mb-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="text-sm font-medium text-gray-900">No high risk batches</h4>
                <p className="text-xs text-gray-500 mt-1">All monitored batches are within normal parameters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
