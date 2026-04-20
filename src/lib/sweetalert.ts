import Swal from 'sweetalert2';

// Common custom styling configuration
const commonConfig = {
  customClass: {
    popup: 'swal2-popup-custom',
    title: 'swal2-title-custom',
    htmlContainer: 'swal2-html-container-custom',
    confirmButton: 'swal2-confirm-custom',
    cancelButton: 'swal2-cancel-custom',
    denyButton: 'swal2-deny-custom',
    icon: 'swal2-icon-custom',
  },
  buttonsStyling: false,
  reverseButtons: true,
  showClass: {
    popup: 'animate-fade-in-up',
  },
  hideClass: {
    popup: 'animate-fade-out',
  },
};

// Toast Configuration
const Toast = Swal.mixin({
  toast: true,
  position: 'bottom-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: {
    popup: 'swal2-toast-custom rounded-xl shadow-lg border border-slate-100',
    title: 'text-sm font-medium',
  },
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

// Success Alert
export const showSuccess = (title: string, message?: string) => {
  return Toast.fire({
    icon: 'success',
    iconColor: '#10b981',
    title: `<div class="flex flex-col"><span class="text-slate-800 font-bold">${title}</span>${message ? `<span class="text-slate-500 text-xs mt-1 font-normal">${message}</span>` : ''}</div>`,
    background: '#ffffff',
  });
};

// Error Alert
export const showError = (title: string, message?: string) => {
  return Toast.fire({
    icon: 'error',
    iconColor: '#ef4444',
    title: `<div class="flex flex-col"><span class="text-slate-800 font-bold">${title}</span>${message ? `<span class="text-slate-500 text-xs mt-1 font-normal">${message}</span>` : ''}</div>`,
    background: '#ffffff',
  });
};

// Warning Alert
export const showWarning = (title: string, message?: string) => {
  return Toast.fire({
    icon: 'warning',
    iconColor: '#f59e0b',
    title: `<div class="flex flex-col"><span class="text-slate-800 font-bold">${title}</span>${message ? `<span class="text-slate-500 text-xs mt-1 font-normal">${message}</span>` : ''}</div>`,
    background: '#ffffff',
  });
};

// Info Alert
export const showInfo = (title: string, message?: string) => {
  return Toast.fire({
    icon: 'info',
    iconColor: '#3b82f6',
    title: `<div class="flex flex-col"><span class="text-slate-800 font-bold">${title}</span>${message ? `<span class="text-slate-500 text-xs mt-1 font-normal">${message}</span>` : ''}</div>`,
    background: '#ffffff',
  });
};

// Confirmation Dialog
export const showConfirm = (
  title: string,
  message: string,
  confirmText: string = 'Yes',
  cancelText: string = 'Cancel'
) => {
  return Swal.fire({
    ...commonConfig,
    icon: 'question',
    iconColor: '#8b5cf6',
    title: `<span class="text-violet-600 font-bold text-2xl">${title}</span>`,
    html: `<p class="text-slate-600 text-base mt-2">${message}</p>`,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: '#8b5cf6',
    cancelButtonColor: '#6b7280',
    background: '#ffffff',
    backdrop: 'rgba(0, 0, 0, 0.4)',
  });
};

// Delete Confirmation
export const showDeleteConfirm = (itemName?: string) => {
  return Swal.fire({
    ...commonConfig,
    icon: 'warning',
    iconColor: '#ef4444',
    title: `<span class="text-red-600 font-bold text-2xl">Are you sure?</span>`,
    html: `<p class="text-slate-600 text-base mt-2">${itemName ? `You want to delete "${itemName}"?` : 'This action cannot be undone!'}</p>`,
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    background: '#ffffff',
    backdrop: 'rgba(0, 0, 0, 0.4)',
  });
};

// Loading Alert
export const showLoading = (title: string = 'Loading...') => {
  Swal.fire({
    ...commonConfig,
    title: `<span class="text-violet-600 font-semibold text-xl">${title}</span>`,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    background: '#ffffff',
    backdrop: 'rgba(0, 0, 0, 0.4)',
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

// Close Loading
export const closeLoading = () => {
  Swal.close();
};

// Toast-like notifications (for non-blocking messages)
export const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  const iconColors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };

  return Toast.fire({
    icon: type,
    iconColor: iconColors[type],
    title: `<span class="text-slate-800 font-medium">${message}</span>`,
    background: '#ffffff',
  });
};

