import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Building2, Loader2, Users, FileSpreadsheet } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable, { Column } from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { organizationApi } from '../../api/organizationApi';
import { formatDate } from '../../utils/formatDate';
import { exportToCsv } from '../../utils/exportCsv';
import { ROUTES } from '../../constants/routes';

const orgSchema = z.object({
  name: z.string().min(2, 'Organization name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
});

type OrgForm = z.infer<typeof orgSchema>;

export default function OrganizationsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any | null>(null);

  const { data: orgsData, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationApi.getAll(),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
  });

  const openCreateModal = () => {
    setEditingOrg(null);
    reset({ name: '', address: '', phone: '', email: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (org: any) => {
    setEditingOrg(org);
    reset({ name: org.name, address: org.address || '', phone: org.phone || '', email: org.email || '' });
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data: OrgForm) => {
      if (editingOrg) {
        return organizationApi.update(editingOrg.id, data);
      }
      return organizationApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success(`Organization ${editingOrg ? 'updated' : 'created'} successfully`);
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save organization');
    },
  });

  const onSubmit = (data: OrgForm) => {
    saveMutation.mutate(data);
  };

  const columns: Column<any>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'address', label: 'Address', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'usersCount', label: 'Users', sortable: true },
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
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(row);
            }}
            className="text-sm font-medium text-primary-600 hover:text-primary-900 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // In a real app, we might pass state or use a query param
              navigate(ROUTES.USERS);
            }}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center"
            title="View Users"
          >
            <Users className="h-4 w-4 mr-1" />
            Users
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Organizations" 
        subtitle="Manage mining companies, logistics partners, and government bodies."
        action={
          <div className="flex gap-3">
            <button
              onClick={() => {
                const exportData = (orgsData?.data || []).map((org: any) => ({
                  'Name': org.name,
                  'Address': org.address || 'N/A',
                  'Phone': org.phone || 'N/A',
                  'Email': org.email || 'N/A',
                  'Users Count': org.usersCount,
                  'Date Created': formatDate(org.createdAt),
                }));
                exportToCsv(exportData, 'minetrace-organizations');
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export CSV
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Create Organization
            </button>
          </div>
        }
      />

      <DataTable 
        columns={columns} 
        data={orgsData?.data || []} 
        loading={isLoading}
        searchPlaceholder="Search organizations..."
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingOrg ? "Edit Organization" : "Create Organization"}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
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
              {editingOrg ? "Save Changes" : "Create"}
            </button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Organization Name *</label>
            <input
              type="text"
              {...register('name')}
              className={`mt-1 block w-full px-3 py-2 border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <input
              type="text"
              {...register('address')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="text"
                {...register('phone')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
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
          </div>
        </form>
      </Modal>
    </div>
  );
}
