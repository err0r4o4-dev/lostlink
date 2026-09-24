import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Swal from 'sweetalert2'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { showAlert } from '../src/lib/alert'

beforeEach(() => {
  Object.defineProperty(window, 'scrollTo', {
    configurable: true,
    value: vi.fn(),
  })
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

afterEach(() => {
  Swal.close()
  document.documentElement.lang = 'en'
})

describe('SweetAlert feedback', () => {
  it('keeps the success icon transparent on the glass popup', async () => {
    const user = userEvent.setup()
    const result = showAlert.success('Signed out', 'Your session has ended.')

    expect(await screen.findByText('Signed out')).toBeInTheDocument()
    expect(document.querySelector('.swal2-success-circular-line-left')).not.toBeInTheDocument()
    expect(document.querySelector('.swal2-success-circular-line-right')).not.toBeInTheDocument()
    expect(document.querySelector('.swal2-success-fix')).not.toBeInTheDocument()
    document.querySelectorAll<HTMLElement>('[class^="swal2-success-line"]').forEach((line) => {
      expect(line.style.animation).toBe('none')
    })

    await user.click(screen.getByRole('button', { name: 'OK' }))
    await expect(result).resolves.toMatchObject({ isConfirmed: true })
  })

  it('returns false when a confirmation is cancelled', async () => {
    const user = userEvent.setup()
    const result = showAlert.confirm(
      'Sign out?',
      'You will need to sign in again.',
      'Sign out',
      'Stay signed in',
    )

    expect(await screen.findByText('Sign out?')).toBeInTheDocument()
    expect(document.querySelector('.lostlink-swal-popup')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Stay signed in' }))

    await expect(result).resolves.toBe(false)
  })

  it('uses Thai defaults and returns true for destructive confirmation', async () => {
    const user = userEvent.setup()
    document.documentElement.lang = 'th'
    const result = showAlert.confirmDestructive('ลบข้อมูลนี้หรือไม่')

    await user.click(await screen.findByRole('button', { name: 'ลบข้อมูล' }))

    await expect(result).resolves.toBe(true)
  })
})
