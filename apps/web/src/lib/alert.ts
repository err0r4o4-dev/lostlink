import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

// Custom styles matching the design system
const customClass = {
  popup: 'rounded-overlay glass-panel !bg-surface !text-text-primary !border !border-border shadow-floating',
  title: '!text-section !font-bold !text-text-primary',
  htmlContainer: '!text-body !text-text-secondary !font-medium',
  confirmButton: 'ui-transition pressable !rounded-control !bg-brand !px-6 !py-2.5 !font-semibold !text-on-brand hover:!bg-brand-hover',
  cancelButton: 'ui-transition pressable !rounded-control !bg-surface-secondary !px-6 !py-2.5 !font-semibold !text-text-secondary hover:!bg-brand-soft hover:!text-brand !ml-3',
}

const baseOptions = {
  customClass,
  buttonsStyling: false,
  confirmButtonText: 'ตกลง',
  cancelButtonText: 'ยกเลิก',
  reverseButtons: true, // typical for macOS/mobile styles, putting confirm on the right if shown
}

export const showAlert = {
  /**
   * แจ้งเตือนเมื่อทำสำเร็จ
   */
  success: (title: string, text?: string) => {
    return MySwal.fire({
      ...baseOptions,
      icon: 'success',
      iconColor: 'var(--color-success)',
      title,
      text,
    })
  },

  /**
   * แจ้งเตือนข้อผิดพลาด
   */
  error: (title: string, text?: string) => {
    return MySwal.fire({
      ...baseOptions,
      icon: 'error',
      iconColor: 'var(--color-error)',
      title,
      text,
    })
  },

  /**
   * แจ้งเตือนทั่วไป (Info)
   */
  info: (title: string, text?: string) => {
    return MySwal.fire({
      ...baseOptions,
      icon: 'info',
      iconColor: 'var(--color-info)',
      title,
      text,
    })
  },

  /**
   * แจ้งเตือนสำหรับยืนยันการทำรายการบางอย่าง
   */
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
        confirmButton: 'ui-transition pressable !rounded-control !bg-brand !px-6 !py-2.5 !font-semibold !text-on-brand hover:!bg-brand-hover',
      }
    })
    return result.isConfirmed
  },

  /**
   * แจ้งเตือนสำหรับยืนยันการลบ (ปุ่มกดยืนยันจะเป็นสีแดง)
   */
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
        confirmButton: 'ui-transition pressable !rounded-control !bg-error !px-6 !py-2.5 !font-semibold !text-white hover:!bg-error-strong',
      }
    })
    return result.isConfirmed
  }
}
