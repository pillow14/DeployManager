interface PlaceholderPageProps {
  title: string
  message?: string
}

export function PlaceholderPage({ title, message = 'No content yet.' }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>
      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-gray-500">{message}</p>
      </div>
    </div>
  )
}
