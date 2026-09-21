import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export const showAlert = {
  success: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      confirmButtonColor: '#176752',
      timer: 3000,
      timerProgressBar: true,
      customClass: {
        popup: 'rounded-2xl shadow-2xl border border-emerald-500/20 font-sans bg-card text-foreground',
        confirmButton: 'rounded-xl px-5 py-2.5 font-bold text-sm bg-[#176752] text-white hover:bg-[#0f4d3d] transition-all',
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
        popup: 'rounded-2xl shadow-2xl border border-red-500/20 font-sans bg-card text-foreground',
        confirmButton: 'rounded-xl px-5 py-2.5 font-bold text-sm bg-red-600 text-white hover:bg-red-700 transition-all',
      },
    });
  },
  warning: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      confirmButtonColor: '#d4af37',
      customClass: {
        popup: 'rounded-2xl shadow-2xl border border-amber-500/20 font-sans bg-card text-foreground',
        confirmButton: 'rounded-xl px-5 py-2.5 font-bold text-sm bg-[#d4af37] text-[#071f19] hover:bg-[#b89528] transition-all',
      },
    });
  },
  confirm: async (title: string, text: string, confirmButtonText: string = 'Yes, confirm', cancelButtonText: string = 'Cancel') => {
    const result = await Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#176752',
      cancelButtonColor: '#6b7280',
      confirmButtonText,
      cancelButtonText,
      customClass: {
        popup: 'rounded-2xl shadow-2xl font-sans bg-card text-foreground border border-border',
        confirmButton: 'rounded-xl px-5 py-2.5 font-bold text-sm bg-[#176752] text-white hover:bg-[#0f4d3d] transition-all mr-2',
        cancelButton: 'rounded-xl px-5 py-2.5 font-bold text-sm bg-muted text-muted-foreground hover:bg-muted/80 transition-all',
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
      customClass: {
        popup: 'rounded-xl shadow-lg border border-border font-sans bg-card text-foreground',
      },
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
    return Toast.fire({ icon, title });
  }
};

