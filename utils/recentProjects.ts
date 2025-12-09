/**
 * @fileoverview Recent Projects Manager
 * Manages the list of recently opened projects using localStorage
 */

const RECENT_PROJECTS_KEY = 'mideas_recent_projects';
const RECENT_PROJECTS_DATA_KEY = 'mideas_recent_projects_data';
const MAX_RECENT_PROJECTS = 10;

/**
 * Interface for a recent project entry
 */
export interface RecentProject {
    /** Project name */
    name: string;
    /** File path or identifier */
    path: string;
    /** Last opened timestamp */
    lastOpened: number;
}

/**
 * Internal helper to get the cached project data map from localStorage.
 */
function getRecentProjectDataMap(): Record<string, string> {
    const raw = localStorage.getItem(RECENT_PROJECTS_DATA_KEY);
    if (!raw) return {};
    try {
        return JSON.parse(raw);
    } catch (error) {
        console.error('Error parsing recent projects data cache:', error);
        return {};
    }
}

/**
 * Internal helper to persist the project data cache map.
 */
function saveRecentProjectDataMap(map: Record<string, string>) {
    try {
        localStorage.setItem(RECENT_PROJECTS_DATA_KEY, JSON.stringify(map));
    } catch (error) {
        console.error('Error saving recent projects data cache:', error);
    }
}

/**
 * Get the list of recent projects from localStorage
 */
export function getRecentProjects(): RecentProject[] {
    try {
        const stored = localStorage.getItem(RECENT_PROJECTS_KEY);
        if (!stored) return [];
        const projects = JSON.parse(stored) as RecentProject[];
        // Sort by most recently opened
        return projects.sort((a, b) => b.lastOpened - a.lastOpened);
    } catch (error) {
        console.error('Error reading recent projects:', error);
        return [];
    }
}

/**
 * Add a project to the recent projects list
 * @param name - Project name
 * @param path - File path or identifier
 * @param serializedData - Optional serialized project data to cache for quick reopening
 */
export function addRecentProject(name: string, path: string, serializedData?: string): void {
    try {
        const projects = getRecentProjects();

        // Remove if already exists (will be re-added at top)
        const filtered = projects.filter(p => p.path !== path);

        // Add new project at the beginning
        const newProject: RecentProject = {
            name,
            path,
            lastOpened: Date.now()
        };

        filtered.unshift(newProject);

        // Keep only MAX_RECENT_PROJECTS
        const trimmed = filtered.slice(0, MAX_RECENT_PROJECTS);

        localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(trimmed));

        // Persist cached data if provided and prune old cached entries
        const dataMap = getRecentProjectDataMap();
        if (serializedData) {
            dataMap[path] = serializedData;
        }
        // Remove cached data for entries no longer tracked
        Object.keys(dataMap).forEach(key => {
            if (!trimmed.find(p => p.path === key)) {
                delete dataMap[key];
            }
        });
        saveRecentProjectDataMap(dataMap);
    } catch (error) {
        console.error('Error saving recent project:', error);
    }
}

/**
 * Remove a project from the recent projects list
 * @param path - File path or identifier to remove
 */
export function removeRecentProject(path: string): void {
    try {
        const projects = getRecentProjects();
        const filtered = projects.filter(p => p.path !== path);
        localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(filtered));

        const dataMap = getRecentProjectDataMap();
        if (dataMap[path]) {
          delete dataMap[path];
          saveRecentProjectDataMap(dataMap);
        }
    } catch (error) {
        console.error('Error removing recent project:', error);
    }
}

/**
 * Clear all recent projects
 */
export function clearRecentProjects(): void {
    try {
        localStorage.removeItem(RECENT_PROJECTS_KEY);
        localStorage.removeItem(RECENT_PROJECTS_DATA_KEY);
    } catch (error) {
        console.error('Error clearing recent projects:', error);
    }
}

/**
 * Retrieve cached serialized project data for a given path, if available.
 */
export function getRecentProjectData(path: string): string | null {
    try {
        const dataMap = getRecentProjectDataMap();
        return dataMap[path] || null;
    } catch (error) {
        console.error('Error reading cached recent project data:', error);
        return null;
    }
}

/**
 * Format a timestamp for display
 */
export function formatRecentDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - timestamp;

    // Less than 1 hour ago
    if (diff < 60 * 60 * 1000) {
        const minutes = Math.floor(diff / (60 * 1000));
        return minutes <= 1 ? 'Just now' : `${minutes} min ago`;
    }

    // Less than 24 hours ago
    if (diff < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (60 * 60 * 1000));
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }

    // Less than 7 days ago
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    // Show date
    return date.toLocaleDateString();
}
