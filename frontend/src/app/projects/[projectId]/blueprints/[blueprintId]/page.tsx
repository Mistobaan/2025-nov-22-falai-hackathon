import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{
    projectId: string
    blueprintId: string
  }>
}

export default async function Page({ params }: PageProps) {
  const { projectId, blueprintId } = await params
  redirect(`/projects/${projectId}/blueprints/${blueprintId}/upload`)
}
