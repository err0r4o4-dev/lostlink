import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const customClass = {
  popup: 'kg-swal-popup',
  title: 'kg-swal-title',
  htmlContainer: 'kg-swal-text',
  actions: 'kg-swal-actions',
  confirmButton: 'kg-swal-button kg-swal-button-primary',
  cancelButton: 'kg-swal-button kg-swal-button-secondary',
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
        confirmButton: 'kg-swal-button kg-swal-button-primary',
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
        confirmButton: 'kg-swal-button kg-swal-button-danger',
      }
    })
    return result.isConfirmed
  }
}
