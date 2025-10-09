import { CodeModernizer } from '@/components/code-modernizer'

export default function ModernizerPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <CodeModernizer />
    </div>
  )
}

export const metadata = {
  title: 'Cadence Code Modernizer - VibeMore',
  description: 'Modernize your legacy Cadence code to Cadence 1.0 syntax with interactive explanations and educational content.',
}