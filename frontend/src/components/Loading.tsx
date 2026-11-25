export default function Loading({ text = 'Завантаження…' }: { text?: string }) {
  return (
    <div role="status" className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
      {text}
    </div>
  )
}
