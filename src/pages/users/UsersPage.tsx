import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { UserPlus, Loader2, FileSpreadsheet } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable, { Column } from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatusBadge from '../../components/ui/StatusBadge';
import { authApi } from '../../api/authApi';
import { organizationApi } from '../../api/organizationApi';
import { formatDate } from '../../utils/formatDate';
import { exportToCsv } from '../../utils/exportCsv';
import { ROLE_COLORS } from '../../utils/roleColors';
import { cn } from '../../lib/utils';

const userSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['ADMIN', 'MINE_OFFICER', 'SUPPLY_OFFICER', 'INSPECTOR']),
  organizationId: z.string().min(1, 'Organization is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type UserForm = z.infer<typeof userSchema>;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; userId: string; action: 'activate' | 'deactivate' | null }>({
    isOpen: false,
    userId: '',
    action: null,
  });
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => authApi.getAllUsers(),
  });

  const { data: orgsData } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationApi.getAll(),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'MINE_OFFICER' }
  });

  const createUserMutation = useMutation({
    mutationFn: (data: UserForm) => {
      const org = orgsData?.data.find((o: any) => o.id === data.organizationId);
      return authApi.register({ ...data, organizationName: org?.name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
      setIsCreateModalOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create user');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'activate' | 'deactivate' }) => {
      return action === 'activate' ? authApi.activateUser(id) : authApi.deactivateUser(id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`User ${variables.action}d successfully`);
      setConfirmDialog({ isOpen: false, userId: '', action: null });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user status');
      setConfirmDialog({ isOpen: false, userId: '', action: null });
    },
  });

  const onSubmit = (data: UserForm) => {
    createUserMutation.mutate(data);
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    setConfirmDialog({
      isOpen: true,
      userId: id,
      action: currentStatus === 'ACTIVE' ? 'deactivate' : 'activate',
    });
  };

  const columns: Column<any>[] = [
    { key: 'fullName', label: 'Full Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { 
      key: 'role', 
      label: 'Role', 
      sortable: true,
      render: (row) => {
        const color = ROLE_COLORS[row.role as keyof typeof ROLE_COLORS] || { bg: 'bg-gray-100', text: 'text-gray-800' };
        return (
          <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", color.bg, color.text)}>
            {row.role.replace('_', ' ')}
          </span>
        );
      }
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />
    },
    { key: 'organizationName', label: 'Organization', sortable: true },
    { 
      key: 'createdAt', 
      label: 'Date Created', 
      sortable: true,
      render: (row) => formatDate(row.createdAt)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleStatus(row.id, row.status);
          }}
          className={cn(
            "text-sm font-medium transition-colors",
            row.status === 'ACTIVE' ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"
          )}
        >
          {row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        </button>
      )
    }
  ];

  let filteredUsers = usersData?.data || [];
  if (roleFilter) {
    filteredUsers = filteredUsers.filter((u: any) => u.role === roleFilter);
  }
  if (statusFilter) {
    filteredUsers = filteredUsers.filter((u: any) => u.status === statusFilter);
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="User Management" 
        subtitle="Manage system users, roles, and access."
        action={
          <div className="flex gap-3">
            <button
              onClick={() => {
                const exportData = filteredUsers.map((u: any) => ({
                  'Full Name': u.fullName,
                  'Email': u.email,
                  'Role': u.role,
                  'Status': u.status,
                  'Organization': u.organizationName,
                  'Date Created': formatDate(u.createdAt),
                }));
                exportToCsv(exportData, 'minetrace-users');
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export CSV
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </button>
          </div>
        }
      />

      <DataTable 
        columns={columns} 
        data={filteredUsers} 
        loading={isLoadingUsers}
        searchPlaceholder="Search by name or email..."
        filters={
          <>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="MINE_OFFICER">Mine Officer</option>
              <option value="SUPPLY_OFFICER">Supply Officer</option>
              <option value="INSPECTOR">Inspector</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </>
        }
      />

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          reset();
        }}
        title="Create New User"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                reset();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-lg bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create User
            </button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              {...register('fullName')}
              className={`mt-1 block w-full px-3 py-2 border ${errors.fullName ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
            />
            {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              {...register('email')}
              className={`mt-1 block w-full px-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                {...register('password')}
                className={`mt-1 block w-full px-3 py-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                type="password"
                {...register('confirmPassword')}
                className={`mt-1 block w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              {...register('role')}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="ADMIN">Admin</option>
              <option value="MINE_OFFICER">Mine Officer</option>
              <option value="SUPPLY_OFFICER">Supply Officer</option>
              <option value="INSPECTOR">Inspector</option>
            </select>
            {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Organization</label>
            <select
              {...register('organizationId')}
              className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border ${errors.organizationId ? 'border-red-300' : 'border-gray-300'} focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md`}
            >
              <option value="">Select an organization</option>
              {orgsData?.data.map((org: any) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
            {errors.organizationId && <p className="mt-1 text-sm text-red-600">{errors.organizationId.message}</p>}
          </div>
        </form>
      </Modal>

      {/* Confirm Status Change Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onCancel={() => setConfirmDialog({ isOpen: false, userId: '', action: null })}
        onConfirm={() => toggleStatusMutation.mutate({ id: confirmDialog.userId, action: confirmDialog.action! })}
        title={confirmDialog.action === 'activate' ? 'Activate User' : 'Deactivate User'}
        message={`Are you sure you want to ${confirmDialog.action} this user? ${confirmDialog.action === 'deactivate' ? 'They will no longer be able to log in.' : ''}`}
        confirmLabel={confirmDialog.action === 'activate' ? 'Activate' : 'Deactivate'}
        danger={confirmDialog.action === 'deactivate'}
        loading={toggleStatusMutation.isPending}
      />
    </div>
  );
}
