export type ToastType = 'success' | 'error' | 'info';

export const showToast = (message: string, type: ToastType = 'info') => {
  try {
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white font-medium max-w-sm ${
      type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'
    } transition-all duration-300 transform translate-x-full`;
    toast.textContent = `${emoji} ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 50);
    setTimeout(() => {
      toast.style.transform = 'translateX(full)';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 2800);
  } catch (e) {}
};
