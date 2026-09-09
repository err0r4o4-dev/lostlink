import { ImagePlus, Trash2, UploadCloud } from 'lucide-react'
import { useEffect, useId, useState, type ChangeEvent, type DragEvent } from 'react'

import { Button, Notice } from './ui'
import { Localize } from '../i18n/language'

const previewLimitBytes = 5 * 1024 * 1024
const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']

interface FileUploadProps {
  disabled?: boolean
  onChange?: (file: File | null) => void
}

export function FileUpload({ disabled, onChange }: FileUploadProps) {
  const inputId = useId()
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string>()
  const [previewUrl, setPreviewUrl] = useState<string>()

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  function acceptFile(nextFile?: File) {
    setError(undefined)
    if (!nextFile) return
    if (!acceptedTypes.includes(nextFile.type)) {
      setError('Choose a JPG, PNG, or WebP image.')
      return
    }
    if (nextFile.size > previewLimitBytes) {
      setError('Choose an image smaller than 5 MB for the local preview.')
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    const nextUrl = URL.createObjectURL(nextFile)
    setFile(nextFile)
    setPreviewUrl(nextUrl)
    onChange?.(nextFile)
  }

  function removeFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(undefined)
    setError(undefined)
    onChange?.(null)
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    acceptFile(event.target.files?.[0])
    event.target.value = ''
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    if (!disabled) acceptFile(event.dataTransfer.files[0])
  }

  if (file && previewUrl) {
    return (
      <Localize><div className="overflow-hidden rounded-card border border-border bg-surface">
        <img src={previewUrl} alt="Selected item preview" className="aspect-video w-full object-cover" />
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="truncate text-caption font-semibold text-text-primary">{file.name}</p>
            <p className="text-label text-text-secondary">Local preview only · {Math.ceil(file.size / 1024)} KB</p>
          </div>
          <Button type="button" variant="ghost" onClick={removeFile}>
            <Trash2 aria-hidden="true" className="size-4" /> Remove
          </Button>
        </div>
      </div></Localize>
    )
  }

  return (
    <Localize><div>
      <label
        htmlFor={inputId}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className="ui-transition flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface-secondary p-6 text-center hover:border-brand"
      >
        <span className="flex size-12 items-center justify-center rounded-control bg-surface text-brand shadow-card">
          {disabled ? <ImagePlus aria-hidden="true" className="size-6" /> : <UploadCloud aria-hidden="true" className="size-6" />}
        </span>
        <span className="mt-4 text-caption font-semibold text-text-primary">Choose an item photo or drop it here</span>
        <span className="mt-1 text-label text-text-secondary">JPG, PNG, or WebP · local preview limit 5 MB</span>
      </label>
      <input id={inputId} className="sr-only" type="file" accept={acceptedTypes.join(',')} disabled={disabled} onChange={onInputChange} />
      {error && <div className="mt-3"><Notice title="Image not accepted" tone="error">{error}</Notice></div>}
    </div></Localize>
  )
}
