import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const customClass = {
  popup: 'glass-panel !rounded-[2rem] !text-text-primary !border-2 !border-white/50 !shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] backdrop-blur-xl',
  title: '!text-section !font-bold !text-text-primary',
  htmlContainer: '!text-body !text-text-secondary !font-medium',
  confirmButton: 'ui-transition pressable !rounded-full !bg-brand !px-8 !py-3 !font-semibold !text-on-brand hover:!bg-brand-hover !shadow-lg',
  cancelButton: 'ui-transition pressable !rounded-full !bg-surface-secondary !px-8 !py-3 !font-semibold !text-text-secondary hover:!bg-brand-soft hover:!text-brand !ml-3 !shadow-sm',
}

const baseOptions = {
  customClass,
  buttonsStyling: false,
  confirmButtonText: 'ตกลง',
  cancelButtonText: 'ยกเลิก',
  reverseButtons: true, // typical for macOS/mobile styles, putting confirm on the right if shown
}

export const showAlert = {
  success: (title: string, text?: string) => {
    return MySwal.fire({
      ...baseOptions,
      icon: 'success',
      iconColor: 'var(--color-success)',
      title,
      text,
    })
  },

  error: (title: string, text?: string) => {
    return MySwal.fire({
      ...baseOptions,
      icon: 'error',
      iconColor: 'var(--color-error)',
      title,
      text,
    })
  },

  info: (title: string, text?: string) => {
    return MySwal.fire({
      ...baseOptions,
      icon: 'info',
      iconColor: 'var(--color-info)',
      title,
      text,
    })
  },

  confirm: async (title: string, text?: string, confirmText = 'ยืนยัน', cancelText = 'ยกเลิก') => {
    const result = await MySwal.fire({
      ...baseOptions,
      icon: 'warning',
      iconColor: 'var(--color-warning)',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      customClass: {
        ...customClass,
        confirmButton: 'ui-transition pressable !rounded-full !bg-brand !px-8 !py-3 !font-semibold !text-on-brand hover:!bg-brand-hover !shadow-lg',
      }
    })
    return result.isConfirmed
  },

  confirmDestructive: async (title: string, text?: string, confirmText = 'ลบข้อมูล', cancelText = 'ยกเลิก') => {
    const result = await MySwal.fire({
      ...baseOptions,
      icon: 'warning',
      iconColor: 'var(--color-error)',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      customClass: {
        ...customClass,
        confirmButton: 'ui-transition pressable !rounded-full !bg-error !px-8 !py-3 !font-semibold !text-white hover:!bg-error-strong !shadow-lg',
      }
    })
    return result.isConfirmed
  }
}
