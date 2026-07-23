import Swal from 'sweetalert2';

/**
 * Standardized SweetAlert2 confirmation dialog for the entire project.
 * Ensure buttons have consistent positioning (reverseButtons: true)
 * and adapt to dark/light mode automatically.
 */
export const confirmDialog = async ({
  title = 'Konfirmasi',
  text = 'Apakah Anda yakin ingin melanjutkan aksi ini?',
  confirmButtonText = 'Ya',
  cancelButtonText = 'Batal',
  icon = 'warning',
  confirmButtonColor = '#dc2626', // default red for destructive actions
}) => {
  const isDarkMode = document.documentElement.classList.contains('dark');

  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true, // This ensures button position consistency across project
    background: isDarkMode ? '#020817' : '#ffffff',
    color: isDarkMode ? '#e2e8f0' : '#0f172a',
    backdrop: 'rgba(15, 23, 42, 0.45)',
    confirmButtonColor,
    cancelButtonColor: isDarkMode ? '#334155' : '#e2e8f0',
    customClass: {
      popup: 'admin-swal-popup',
      confirmButton: 'admin-swal-confirm',
      cancelButton: 'admin-swal-cancel',
      container: 'admin-swal-container',
    },
  });

  return result;
};
