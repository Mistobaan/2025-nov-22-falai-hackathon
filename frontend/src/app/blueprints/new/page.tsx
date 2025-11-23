'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewBlueprintPage() {
  const router = useRouter()

  useEffect(() => {
    // Generate a new UUID for the blueprint
    const blueprintId = crypto.randomUUID()
    
    // For now, use a default project ID. In a real app, this would come from user context
    // or you'd show a project selector
    const defaultProjectId = 'default-project'
    
    // Redirect to the new blueprint
    router.push(`/projects/${defaultProjectId}/blueprints/${blueprintId}`)
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center bg-[#0a0e1a]">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
        <p className="mt-4 text-gray-400">Creating new blueprint...</p>
      </div>
    </div>
  )
}
