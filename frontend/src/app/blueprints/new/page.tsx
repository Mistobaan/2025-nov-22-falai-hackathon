import { redirect } from 'next/navigation'
import { createBlueprint, saveBlueprint, loadBlueprint } from '@/lib/blueprintStorage'

export default async function NewBlueprintPage() {
  const blueprintId = crypto.randomUUID()
  const defaultProjectId = 'default-project'

  // Try the API first to keep a single codepath; fall back to direct creation if it fails.
  try {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/blueprints/${blueprintId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'draft' }),
      cache: 'no-store',
    })
  } catch (err) {
    // If the API call fails (e.g., dev server race), ensure the blueprint exists on disk.
    const existing = await loadBlueprint(blueprintId)
    if (!existing) {
      await createBlueprint(blueprintId)
    } else {
      await saveBlueprint(existing)
    }
  }

  redirect(`/projects/${defaultProjectId}/blueprints/${blueprintId}/upload`)
}
