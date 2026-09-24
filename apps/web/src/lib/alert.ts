import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const customClass = {
  popup: 'lostlink-swal-popup',
  title: 'lostlink-swal-title',
  htmlContainer: 'lostlink-swal-text',
  actions: 'lostlink-swal-actions',
  confirmButton: 'lostlink-swal-button lostlink-swal-button-primary',
  cancelButton: 'lostlink-swal-button lostlink-swal-button-secondary',
}

function buttonLabels() {
  const isThai = typeof document !== 'undefined' && document.documentElement.lang === 'th'
  return {
    cancel: isThai ? 'ยกเลิก' : 'Cancel',
    confirm: isThai ? 'ตกลง' : 'OK',
    delete: isThai ? 'ลบข้อมูล' : 'Delete',
  }
}

function baseOptions() {
  const labels = buttonLabels()
  return {
    customClass,
    buttonsStyling: false,
    confirmButtonText: labels.confirm,
    cancelButtonText: labels.cancel,
    reverseButtons: true,
    allowOutsideClick: false,
    returnFocus: true,
    heightAuto: false,
  }
}

function removeSuccessIconMasks(popup: HTMLElement) {
  // SweetAlert's opaque animation masks become visible over the translucent popup.
  popup.querySelectorAll('[class^="swal2-success-circular-line"], .swal2-success-fix').forEach((mask) => mask.remove())
  popup.querySelectorAll<HTMLElement>('[class^="swal2-success-line"]').forEach((line) => {
    line.style.animation = 'none'
  })
}

export const showAlert = {
  success: (title: string, text?: string) => {
    return MySwal.fire({
      ...baseOptions(),
      icon: 'success',
      iconColor: 'var(--color-success)',
      title,
      text,
      didRender: removeSuccessIconMasks,
    })
  },

  error: (title: string, text?: string) => {
    return MySwal.fire({
      ...baseOptions(),
      icon: 'error',
      iconColor: 'var(--color-error)',
      title,
      text,
    })
  },

  info: (title: string, text?: string) => {
    return MySwal.fire({
      ...baseOptions(),
      icon: 'info',
      iconColor: 'var(--color-info)',
      title,
      text,
    })
  },

  confirm: async (title: string, text?: string, confirmText?: string, cancelText?: string) => {
    const labels = buttonLabels()
    const result = await MySwal.fire({
      ...baseOptions(),
      icon: 'warning',
      iconColor: 'var(--color-warning)',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText ?? labels.confirm,
      cancelButtonText: cancelText ?? labels.cancel,
      customClass: {
        ...customClass,
        confirmButton: 'lostlink-swal-button lostlink-swal-button-primary',
      }
    })
    return result.isConfirmed
  },

  confirmDestructive: async (title: string, text?: string, confirmText?: string, cancelText?: string) => {
    const labels = buttonLabels()
    const result = await MySwal.fire({
      ...baseOptions(),
      icon: 'warning',
      iconColor: 'var(--color-error)',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText ?? labels.delete,
      cancelButtonText: cancelText ?? labels.cancel,
      customClass: {
        ...customClass,
        confirmButton: 'lostlink-swal-button lostlink-swal-button-danger',
      }
    })
    return result.isConfirmed
  }
}
