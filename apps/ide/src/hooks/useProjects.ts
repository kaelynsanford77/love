import { useState, useCallback } from "react";
import type { Project } from "../types";
import { getProjects } from "../api";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const data = await getProjects();
      const list = Array.isArray(data) ? data : [];
      setProjects(list);
      if (!activeProject && list.length > 0) setActiveProject(list[0]);
    } catch {
      // offline mode
    }
  }, [activeProject]);

  return { projects, activeProject, setActiveProject, loadProjects, setProjects };
}
