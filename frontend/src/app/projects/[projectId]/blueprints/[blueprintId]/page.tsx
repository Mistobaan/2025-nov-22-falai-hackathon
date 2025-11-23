import BlueprintBuilder from '@/components/blueprint-builder/BlueprintBuilder'

interface PageProps {
  params: Promise<{
    projectId: string
    blueprintId: string
  }>
}

export default async function Page({ params }: PageProps) {
  const { projectId, blueprintId } = await params
  
  return <BlueprintBuilder projectId={projectId} blueprintId={blueprintId} />
}
