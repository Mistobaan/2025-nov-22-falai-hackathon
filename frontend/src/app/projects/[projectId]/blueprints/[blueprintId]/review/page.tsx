import { redirect } from 'next/navigation'
import BlueprintBuilder from '@/components/blueprint-builder/BlueprintBuilder'
import { loadBlueprint } from '@/lib/blueprintStorage'

interface PageProps {
  params: Promise<{
    projectId: string
    blueprintId: string
  }>
}

export default async function ReviewPage({ params }: PageProps) {
  const { projectId, blueprintId } = await params
  const blueprint = await loadBlueprint(blueprintId)

  if (!blueprint) {
    redirect('/blueprints/new')
  }

  const hasDefects =
    (blueprint.suggestedDefects && blueprint.suggestedDefects.length > 0) ||
    (blueprint.customDefects && blueprint.customDefects.length > 0)

  if (!hasDefects) {
    redirect(`/projects/${projectId}/blueprints/${blueprintId}/categories`)
  }

  return (
    <BlueprintBuilder
      projectId={projectId}
      blueprintId={blueprintId}
      initialStep={3}
    />
  )
}
