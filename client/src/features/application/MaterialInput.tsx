import { useState } from 'react'
import { FileText, Type, Upload, X } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { Profile } from './profile'

type Mode = 'text' | 'file'

// Upload is off until the server reads files; for now it would send only the file names.
const modes = [
  { id: 'text', label: 'Paste text', icon: Type, disabled: false },
  { id: 'file', label: 'Upload files (soon)', icon: Upload, disabled: true },
] as const

// One place to add learning material: one box of pasted text, or files, which are listed below.
function MaterialInput({
  profile,
  update,
}: {
  profile: Profile
  update: (patch: Partial<Profile>) => void
}) {
  const [mode, setMode] = useState<Mode>('text')

  const addFiles = (files: FileList | null) => {
    if (files?.length) update({ files: [...profile.files, ...files] })
  }

  const items = profile.files.map((file, i) => ({
    key: `f${i}`,
    icon: FileText,
    label: file.name,
    remove: () => update({ files: profile.files.filter((_, j) => j !== i) }),
  }))

  return (
    <div className="flex flex-col gap-4">
      <fieldset
        aria-label="How to add material"
        className="flex flex-wrap gap-2"
      >
        {modes.map(({ id, label, icon: Icon, disabled }) => (
          <button
            key={id}
            type="button"
            disabled={disabled}
            aria-pressed={mode === id}
            onClick={() => setMode(id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-[0.88rem] font-normal transition-colors',
              mode === id
                ? 'border-pine bg-pine-soft text-pine-deep'
                : 'border-rule bg-paper hover:border-graphite',
              disabled && 'cursor-not-allowed opacity-50 hover:border-rule',
            )}
          >
            <Icon className="size-4" strokeWidth={1.75} aria-hidden />
            {label}
          </button>
        ))}
      </fieldset>

      {mode === 'text' && (
        <Textarea
          aria-label="Paste your text"
          value={profile.text}
          onChange={(e) => update({ text: e.target.value })}
          placeholder="Paste a chapter, your lecture notes, or an exercise sheet"
          // A pasted chapter can be very long, so the box stays 8 rows high and scrolls.
          rows={8}
          className="field-sizing-fixed resize-y overflow-y-auto"
        />
      )}

      {mode === 'file' && (
        // Drag and drop is a mouse shortcut; the file input inside is the keyboard path.
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <label
          className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-graphite bg-paper px-6 py-8 text-center hover:bg-sheet"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            addFiles(e.dataTransfer.files)
          }}
        >
          <Upload className="size-6 text-pine" strokeWidth={1.5} aria-hidden />
          <span className="font-normal">Drop files here or choose them</span>
          <span className="text-sm text-graphite">
            PDF, Word, slides, images, or audio
          </span>
          <input
            type="file"
            multiple
            className="sr-only"
            onChange={(e) => {
              addFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </label>
      )}

      {items.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Added material">
          {items.map(({ key, icon: Icon, label, remove }) => (
            <li
              key={key}
              className="flex items-center gap-3 rounded-xl border border-pine bg-pine-soft px-3 py-2 text-sm text-pine-deep"
            >
              <Icon
                className="size-4 shrink-0"
                strokeWidth={1.75}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate">{label}</span>
              <button
                type="button"
                onClick={remove}
                aria-label={`Remove ${label}`}
                className="rounded-md p-1 hover:bg-sheet"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export { MaterialInput }
