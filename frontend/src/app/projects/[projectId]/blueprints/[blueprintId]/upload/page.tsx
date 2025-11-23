import { redirect } from 'next/navigation'
import BlueprintBuilder from '@/components/blueprint-builder/BlueprintBuilder'
import { loadBlueprint } from '@/lib/blueprintStorage'

interface PageProps {
  params: Promise<{
    projectId: string
    blueprintId: string
  }>
}

export default async function UploadPage({ params }: PageProps) {
  const { projectId, blueprintId } = await params
  const blueprint = await loadBlueprint(blueprintId)

  if (!blueprint) {
    redirect('/blueprints/new')
  }

  return (
    <BlueprintBuilder
      projectId={projectId}
      blueprintId={blueprintId}
      initialStep={1}
    />
  )
}
