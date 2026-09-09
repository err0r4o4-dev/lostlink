import { Box, PackageSearch } from 'lucide-react'

import { RouteCard } from '../components/route-card'
import { PageContainer, PageHeader } from '../components/ui'
import { ReportForm } from '../features/reports/report-form'

export function ReportHubPage() {
  return (
    <PageContainer>
      <PageHeader eyebrow="Report an item" title="What happened?" description="Choose the report that matches your situation. Details are reviewed before any public or ownership workflow can proceed." />
      <div className="grid gap-5 md:grid-cols-2">
        <RouteCard to="/report/lost" icon={PackageSearch} title="I lost something" description="Create a public-safe description and keep identifying evidence private for later verification." />
        <RouteCard to="/report/found" icon={Box} title="I found something" description="Record where and when it was found without exposing private handoff or contact details." />
      </div>
    </PageContainer>
  )
}

export function ReportLostPage() {
  return <PageContainer><PageHeader eyebrow="Lost report" title="Report a lost item" description="Create a structured draft, preview an image, and review every detail before submission." /><ReportForm reportType="lost" /></PageContainer>
}

export function ReportFoundPage() {
  return <PageContainer><PageHeader eyebrow="Found report" title="Report a found item" description="Share enough public-safe information to support discovery while preserving a safe return process." /><ReportForm reportType="found" /></PageContainer>
}
