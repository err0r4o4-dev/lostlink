import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState, PageContainer, buttonVariants } from '../components/ui'

export function NotFoundPage() {
  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl">
        <EmptyState icon={Compass} title="Page not found" description="The address does not match a LostLink frontend route." />
        <div className="mt-5 flex justify-center"><Link to="/" className={buttonVariants({ variant: 'primary' })}>Return home</Link></div>
      </div>
    </PageContainer>
  )
}
