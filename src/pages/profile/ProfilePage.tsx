import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { User, Mail, Shield, Building, Key, Loader2 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import PasswordStrengthBar from '../../components/ui/PasswordStrengthBar';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/authApi';
import { ROLE_COLORS } from '../../utils/roleColors';
import { cn } from '../../lib/utils';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const newPasswordValue = watch('newPassword', '');

  const updatePasswordMutation = useMutation({
    mutationFn: (data: PasswordForm) => authApi.updatePassword(data),
    onSuccess: () => {
      toast.success('Password updated successfully');
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update password');
    },
  });

  const onSubmitPassword = (data: PasswordForm) => {
    updatePasswordMutation.mutate(data);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader title="Profile & Settings" />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={cn(
              "px-6 py-4 text-sm font-medium transition-colors flex items-center gap-2",
              activeTab === 'profile' ? "border-b-2 border-primary-600 text-primary-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            <User className="h-4 w-4" />
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={cn(
              "px-6 py-4 text-sm font-medium transition-colors flex items-center gap-2",
              activeTab === 'security' ? "border-b-2 border-primary-600 text-primary-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            <Key className="h-4 w-4" />
            Security
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex items-center gap-6">
                <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-3xl font-bold border-4 border-white shadow-md">
                  {user.fullName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{user.fullName}</h2>
                  <p className="text-gray-500">{user.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", ROLE_COLORS[user.role as keyof typeof ROLE_COLORS] || 'bg-gray-100 text-gray-800')}>
                      {user.role.replace('_', ' ')}
                    </span>
                    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Details</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <User className="h-4 w-4" /> Full Name
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.fullName}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Mail className="h-4 w-4" /> Email Address
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Shield className="h-4 w-4" /> Role
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.role.replace('_', ' ')}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Building className="h-4 w-4" /> Organization
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.organizationName || 'N/A'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8 animate-in fade-in duration-300 max-w-md">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Change Password</h3>
                <p className="text-sm text-gray-500 mb-6">Ensure your account is using a long, random password to stay secure.</p>
                
                <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Password</label>
                    <input
                      type="password"
                      {...register('currentPassword')}
                      className={`mt-1 block w-full px-3 py-2 border ${errors.currentPassword ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    />
                    {errors.currentPassword && <p className="mt-1 text-sm text-red-600">{errors.currentPassword.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <input
                      type="password"
                      {...register('newPassword')}
                      className={`mt-1 block w-full px-3 py-2 border ${errors.newPassword ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    />
                    <div className="mt-2">
                      <PasswordStrengthBar password={newPasswordValue} />
                    </div>
                    {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input
                      type="password"
                      {...register('confirmPassword')}
                      className={`mt-1 block w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    />
                    {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
