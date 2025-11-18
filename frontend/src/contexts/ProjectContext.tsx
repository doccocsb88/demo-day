import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FirebaseProject } from '../types';

interface ProjectContextType {
  selectedProject: FirebaseProject | null;
  setSelectedProject: (project: FirebaseProject | null) => void;
  clearProject: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const PROJECT_STORAGE_KEY = 'selectedFirebaseProject';

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [selectedProject, setSelectedProjectState] = useState<FirebaseProject | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(PROJECT_STORAGE_KEY);
    if (stored) {
      try {
        setSelectedProjectState(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored project:', e);
        localStorage.removeItem(PROJECT_STORAGE_KEY);
      }
    }
  }, []);

  const setSelectedProject = (project: FirebaseProject | null) => {
    setSelectedProjectState(project);
    if (project) {
      localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(project));
    } else {
      localStorage.removeItem(PROJECT_STORAGE_KEY);
    }
  };

  const clearProject = () => {
    setSelectedProjectState(null);
    localStorage.removeItem(PROJECT_STORAGE_KEY);
  };

  return (
    <ProjectContext.Provider value={{ selectedProject, setSelectedProject, clearProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

