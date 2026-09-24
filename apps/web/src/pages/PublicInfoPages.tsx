import { FileText, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import { buttonVariants } from '../components/ui'

function PublicInfoPage({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string
  title: string
  description: string
  icon: typeof ShieldCheck
}) {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-5 py-16 focus:outline-none md:px-7 md:py-24">
      <span className="flex size-14 items-center justify-center rounded-feature bg-brand-soft text-brand">
        <Icon aria-hidden="true" className="size-7" />
      </span>
      <p className="mt-7 text-caption font-semibold text-brand">{eyebrow}</p>
      <h1 className="mt-2 text-page-mobile font-bold tracking-tight text-text-primary md:text-page">{title}</h1>
      <p className="mt-4 max-w-2xl text-body text-text-secondary">{description}</p>
      <p className="mt-5 max-w-2xl text-caption text-text-secondary">
        หน้านี้ยังไม่ใช่นโยบายหรือข้อกำหนดฉบับสมบูรณ์ โปรดติดต่อผู้ดูแล LostLink หากต้องการข้อมูลเพิ่มเติมก่อนใช้งานจริง
      </p>
      <Link to="/" className={`${buttonVariants({ variant: 'secondary' })} mt-8`}>กลับหน้าแรก</Link>
    </main>
  )
}

export function PrivacyPage() {
  return (
    <PublicInfoPage
      icon={ShieldCheck}
      eyebrow="Privacy"
      title="ข้อมูลความเป็นส่วนตัว"
      description="LostLink อยู่ระหว่างจัดทำนโยบายที่อธิบายวัตถุประสงค์ การเข้าถึง ระยะเวลาการเก็บรักษา และการลบข้อมูลอย่างเป็นทางการ"
    />
  )
}

export function TermsPage() {
  return (
    <PublicInfoPage
      icon={FileText}
      eyebrow="Terms"
      title="ข้อกำหนดการใช้งาน"
      description="LostLink อยู่ระหว่างจัดทำข้อกำหนดการใช้งานที่ครอบคลุมสิทธิ หน้าที่ และกระบวนการตรวจสอบสำหรับผู้ใช้งานอย่างเป็นทางการ"
    />
  )
}
