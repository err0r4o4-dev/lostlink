import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from '../src/App'

describe('App', () => {
  it('renders the guest home with the matching and privacy trust boundaries', () => {
    render(<App />)

    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
    expect(screen.getByRole('heading', { level: 1, name: /ของที่หาย.*อาจกำลังรอให้คุณมาพบ/i })).toBeInTheDocument()
    expect(screen.getByText(/AI เป็นเพียงเครื่องมือช่วยค้นหาและจัดอันดับ/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /ไม่ต้องเปิดเผยข้อมูลเกินความจำเป็น/ })).toBeInTheDocument()
    expect(screen.getByText('ตรวจสอบก่อนรับของคืน')).toBeInTheDocument()
  })

  it('sends guest calls to action only to authentication routes', () => {
    render(<App />)

    for (const link of screen.getAllByRole('link', { name: /เข้าสู่ระบบ/ })) {
      expect(link).toHaveAttribute('href', '/login')
    }
    for (const link of screen.getAllByRole('link', { name: /สร้างบัญชี|เริ่มต้นใช้งาน/ })) {
      expect(link).toHaveAttribute('href', '/register')
    }
    expect(screen.queryByRole('link', { name: /แจ้งของหาย|รายการที่อาจตรงกัน|ติดตามสถานะ/ })).not.toBeInTheDocument()
  })

  it('does not mount authenticated navigation for a guest session', () => {
    render(<App />)

    expect(screen.getByRole('link', { name: 'ข้ามไปยังเนื้อหา' })).toHaveAttribute('href', '#main-content')
    expect(screen.queryByRole('navigation', { name: 'Primary' })).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Mobile primary' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Search' })).not.toBeInTheDocument()
  })

  it('exposes only the requested public footer destinations', () => {
    render(<App />)

    expect(screen.getByRole('link', { name: 'ความเป็นส่วนตัว' })).toHaveAttribute('href', '/privacy')
    expect(screen.getByRole('link', { name: 'ข้อกำหนดการใช้งาน' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: 'ช่วยเหลือ' })).toHaveAttribute('href', '/help')
  })
})
