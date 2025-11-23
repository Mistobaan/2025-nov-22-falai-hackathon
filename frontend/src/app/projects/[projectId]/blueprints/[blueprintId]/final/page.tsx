import { redirect } from 'next/navigation'
import BlueprintBuilder from '@/components/blueprint-builder/BlueprintBuilder'
import { loadBlueprint } from '@/lib/blueprintStorage'

interface PageProps {
  params: Promise<{
    projectId: string
    blueprintId: string
  }>
}

export default async function FinalPage({ params }: PageProps) {
  const { projectId, blueprintId } = await params
  const blueprint = await loadBlueprint(blueprintId)

  if (!blueprint) {
    redirect('/blueprints/new')
  }

  if (blueprint.status !== 'ready_for_review' && blueprint.status !== 'completed') {
    redirect(`/projects/${projectId}/blueprints/${blueprintId}/review`)
  }

  return (
    <BlueprintBuilder
      projectId={projectId}
      blueprintId={blueprintId}
      initialStep={4}
    />
  )
}
