import { useState, useCallback } from 'react'
import { fsApi } from '../lib/api'
import type { FileNode } from '../types'

export function useFileTree(projectId: string | undefined) {
  const [tree, setTree] = useState<FileNode[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['src', '']))

  const loadTree = useCallback(async () => {
    if (!projectId) return
    try {
      setLoading(true)
      const { tree: data } = await fsApi.tree(projectId)
      setTree(data)
    } catch {}
    finally { setLoading(false) }
  }, [projectId])

  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const createFile = useCallback(async (filePath: string, content = '') => {
    if (!projectId) return
    await fsApi.write(projectId, filePath, content)
    await loadTree()
  }, [projectId, loadTree])

  const deleteFile = useCallback(async (filePath: string) => {
    if (!projectId) return
    await fsApi.delete(projectId, filePath)
    await loadTree()
  }, [projectId, loadTree])

  const renameFile = useCallback(async (oldPath: string, newPath: string) => {
    if (!projectId) return
    await fsApi.rename(projectId, oldPath, newPath)
    await loadTree()
  }, [projectId, loadTree])

  const createDir = useCallback(async (dirPath: string) => {
    if (!projectId) return
    await fsApi.mkdir(projectId, dirPath)
    await loadTree()
  }, [projectId, loadTree])

  return {
    tree,
    loading,
    expandedPaths,
    loadTree,
    toggleExpand,
    createFile,
    deleteFile,
    renameFile,
    createDir,
  }
}
