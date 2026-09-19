import Swal from 'sweetalert2';

export const showAlert = {
  success: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      confirmButtonColor: '#10b981',
      timer: 2500,
      timerProgressBar: true,
      customClass: {
        popup: 'rounded-2xl shadow-2xl border border-emerald-500/20 font-sans',
      },
    });
  },
  error: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'error',
      title,
      text,
      confirmButtonColor: '#ef4444',
      customClass: {
        popup: 'rounded-2xl shadow-2xl border border-red-500/20 font-sans',
      },
    });
  },
  warning: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      confirmButtonColor: '#f59e0b',
      customClass: {
        popup: 'rounded-2xl shadow-2xl font-sans',
      },
    });
  },
  confirm: async (title: string, text: string, confirmButtonText: string = 'Yes, confirm', cancelButtonText: string = 'Cancel') => {
    const result = await Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText,
      cancelButtonText,
      customClass: {
        popup: 'rounded-2xl shadow-2xl font-sans',
      },
    });
    return result.isConfirmed;
  },
  toast: (title: string, icon: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
    return Toast.fire({ icon, title });
  }
};
