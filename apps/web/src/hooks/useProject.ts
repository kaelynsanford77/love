import { useState, useEffect, useCallback } from 'react'
import { projectsApi } from '../lib/api'
import type { Project } from '../types'

export function useProject(projectId: string | undefined) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) { setLoading(false); return }
    try {
      setLoading(true)
      const data = await projectsApi.get(projectId)
      setProject(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { load() }, [load])

  const update = useCallback(async (data: Partial<Project>) => {
    if (!projectId) return
    const updated = await projectsApi.update(projectId, data)
    setProject(updated)
    return updated
  }, [projectId])

  return { project, loading, error, reload: load, update }
}
