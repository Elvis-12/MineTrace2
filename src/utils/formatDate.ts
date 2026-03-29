import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (dateString: string | Date | undefined | null) => {
  if (!dateString) return '-';
  try {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
  } catch (e) {
    return String(dateString);
  }
};

export const formatRelativeTime = (dateString: string | Date | undefined | null) => {
  if (!dateString) return '-';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch (e) {
    return String(dateString);
  }
};
