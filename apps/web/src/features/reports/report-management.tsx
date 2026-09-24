import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, PackageSearch, Pencil, SearchCheck, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { apiErrorMessage } from '../../api/error'
import { FileUpload } from '../../components/file-upload'
import { Badge, Button, Card, EmptyState, ErrorState, Input, LoadingState, Notice, StatusBadge, Textarea, buttonVariants } from '../../components/ui'
import { showAlert } from '../../lib/alert'
import { useAuth } from '../auth/auth-state'
import {
  deleteReportImage,
  listMyReports,
  listReportImages,
  reportImageUrl,
  updateReport,
  uploadReportImage,
  withdrawReport,
} from './report-api'

function stringValue(values: FormData, key: string) {
  const value = values.get(key)
  return typeof value === 'string' ? value : ''
}

export function OwnedReportsPanel() {
  const { request } = useAuth()
  const reports = useQuery({ queryKey: ['reports', 'mine'], queryFn: () => listMyReports(request) })

  if (reports.isPending) return <LoadingState label="Loading your reports" />
  if (reports.isError) return <ErrorState title="Reports unavailable" description="Your reports could not be loaded." onRetry={() => void reports.refetch()} />
  if (!reports.data.reports.length) return <EmptyState icon={PackageSearch} title="No reports yet" description="Create a lost or found report to begin the discovery workflow." />

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {reports.data.reports.map((report) => (
        <Card key={report.id} className="p-5">
          <div className="flex flex-wrap items-center gap-2"><StatusBadge tone={report.report_type === 'lost' ? 'brand' : 'info'}>{report.report_type}</StatusBadge><StatusBadge>{report.status}</StatusBadge></div>
          <h3 className="mt-4 text-card font-semibold">{report.item_name}</h3>
          <p className="mt-2 text-caption text-text-secondary">{report.category} · {report.approximate_location}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to={`/reports/${encodeURIComponent(report.id)}/manage`} className={buttonVariants({ variant: 'secondary', size: 'compact' })}><Pencil aria-hidden="true" className="size-4" />Manage</Link>
            {report.report_type === 'lost' && report.status === 'active' && <Link to={`/matches?report=${encodeURIComponent(report.id)}`} className={buttonVariants({ variant: 'ghost', size: 'compact' })}><SearchCheck aria-hidden="true" className="size-4" />Find matches</Link>}
          </div>
        </Card>
      ))}
    </div>
  )
}

export function ManageReport({ reportId }: { reportId: string }) {
  const { request } = useAuth()
  const queryClient = useQueryClient()
  const [image, setImage] = useState<File | null>(null)
  const [uploadVersion, setUploadVersion] = useState(0)
  const reports = useQuery({ queryKey: ['reports', 'mine'], queryFn: () => listMyReports(request) })
  const report = reports.data?.reports.find((entry) => entry.id === reportId)
  const images = useQuery({ queryKey: ['reports', reportId, 'images'], queryFn: () => listReportImages(reportId), enabled: report?.status === 'active' })

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['reports', 'mine'] }),
      queryClient.invalidateQueries({ queryKey: ['report', reportId] }),
      queryClient.invalidateQueries({ queryKey: ['reports', reportId, 'images'] }),
    ])
  }

  const update = useMutation({
    mutationFn: (input: Parameters<typeof updateReport>[2]) => updateReport(request, reportId, input),
    onSuccess: async () => { await refresh(); await showAlert.success('Report updated', 'Your public-safe report details were saved.') },
  })
  const withdraw = useMutation({
    mutationFn: () => withdrawReport(request, reportId),
    onSuccess: async () => { await refresh(); await showAlert.success('Report withdrawn', 'The report is no longer active in public discovery.') },
  })
  const upload = useMutation({
    mutationFn: (file: File) => uploadReportImage(request, reportId, file),
    onSuccess: async () => { setImage(null); setUploadVersion((value) => value + 1); await refresh(); await showAlert.success('Image uploaded', 'The sanitized image is now attached to the report.') },
  })
  const removeImage = useMutation({
    mutationFn: (imageId: string) => deleteReportImage(request, reportId, imageId),
    onSuccess: refresh,
  })

  function submitUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    update.mutate({
      item_name: stringValue(values, 'item_name'),
      category: stringValue(values, 'category'),
      public_description: stringValue(values, 'public_description'),
      event_date: stringValue(values, 'event_date'),
      approximate_time: stringValue(values, 'approximate_time'),
      approximate_location: stringValue(values, 'approximate_location'),
    })
  }

  async function confirmWithdraw() {
    if (await showAlert.confirmDestructive('Withdraw report?', 'This removes the report from active public discovery.', 'Withdraw report', 'Keep report')) withdraw.mutate()
  }

  if (reports.isPending) return <LoadingState label="Loading report" />
  if (reports.isError) return <ErrorState title="Report unavailable" description="Your report could not be loaded." onRetry={() => void reports.refetch()} />
  if (!report) return <EmptyState icon={PackageSearch} title="Report not found" description="This report is not owned by the active account or is no longer available." />

  const actionError = update.error ?? withdraw.error ?? upload.error ?? removeImage.error

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-5">
        <Card className="p-5 md:p-7">
          <div className="mb-6 flex flex-wrap items-center gap-2"><StatusBadge tone={report.report_type === 'lost' ? 'brand' : 'info'}>{report.report_type}</StatusBadge><StatusBadge>{report.status}</StatusBadge><Badge>{report.id}</Badge></div>
          <form className="space-y-5" onSubmit={submitUpdate} key={`${report.id}-${report.item_name}-${report.status}`}>
            <div className="grid gap-5 md:grid-cols-2"><Input name="item_name" label="Item name" required minLength={2} maxLength={100} defaultValue={report.item_name} disabled={report.status !== 'active'} /><Input name="category" label="Category" required minLength={2} maxLength={80} defaultValue={report.category} disabled={report.status !== 'active'} /></div>
            <Textarea name="public_description" label="Public description" required minLength={10} maxLength={1000} defaultValue={report.public_description} disabled={report.status !== 'active'} />
            <div className="grid gap-5 md:grid-cols-3"><Input name="event_date" label="Event date" type="date" required defaultValue={report.event_date} disabled={report.status !== 'active'} /><Input name="approximate_time" label="Approximate time" type="time" defaultValue={report.approximate_time ?? ''} disabled={report.status !== 'active'} /><Input name="approximate_location" label="Approximate location" required minLength={2} maxLength={120} defaultValue={report.approximate_location} disabled={report.status !== 'active'} /></div>
            {report.status === 'active' && <div className="flex flex-wrap gap-3"><Button type="submit" disabled={update.isPending}>{update.isPending ? 'Saving…' : 'Save changes'}</Button><Button type="button" variant="secondary" disabled={withdraw.isPending} onClick={() => void confirmWithdraw()}>{withdraw.isPending ? 'Withdrawing…' : 'Withdraw report'}</Button></div>}
          </form>
        </Card>

        <Card className="p-5 md:p-7">
          <div className="flex items-center gap-3"><ImagePlus aria-hidden="true" className="size-5 text-brand" /><h2 className="text-card font-semibold">Report images</h2></div>
          {images.isPending && <div className="mt-5"><LoadingState label="Loading report images" /></div>}
          {images.isError && <div className="mt-5"><ErrorState title="Images unavailable" description="Report images could not be loaded." onRetry={() => void images.refetch()} /></div>}
          {images.data && <div className="mt-5 grid gap-4 sm:grid-cols-2">{images.data.images.map((entry) => <div key={entry.id} className="overflow-hidden rounded-card border border-border"><img src={reportImageUrl(entry.content_url)} alt="" className="aspect-video w-full object-cover" /><div className="flex items-center justify-between gap-3 p-3"><span className="text-label text-text-secondary">{entry.width}×{entry.height}</span>{report.status === 'active' && <Button type="button" variant="ghost" disabled={removeImage.isPending} onClick={() => removeImage.mutate(entry.id)}><Trash2 aria-hidden="true" className="size-4" />Delete</Button>}</div></div>)}</div>}
          {report.status === 'active' && <div className="mt-5 space-y-3"><FileUpload key={uploadVersion} onChange={setImage} disabled={upload.isPending} /><Button type="button" disabled={!image || upload.isPending} onClick={() => image && upload.mutate(image)}>{upload.isPending ? 'Uploading…' : 'Upload image'}</Button></div>}
        </Card>
      </div>

      <aside className="space-y-4">
        {report.report_type === 'lost' && report.status === 'active' && <Link to={`/matches?report=${encodeURIComponent(report.id)}`} className={buttonVariants({ variant: 'primary', className: 'w-full' })}><SearchCheck aria-hidden="true" className="size-4" />Run matching</Link>}
        <Notice title="Public-safe fields only">Editing this report never changes private claim evidence or ownership decisions.</Notice>
        {actionError && <Notice announce title="Action failed" tone="error">{apiErrorMessage(actionError, 'The report action could not be completed.')}</Notice>}
      </aside>
    </div>
  )
}
