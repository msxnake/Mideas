/**
 * @fileoverview Recent Projects Manager
 * Manages the list of recently opened projects using localStorage
 */

const RECENT_PROJECTS_KEY = 'mideas_recent_projects';
const RECENT_PROJECTS_DATA_KEY = 'mideas_recent_projects_data';
const MAX_RECENT_PROJECTS = 10;
// localStorage is commonly limited to roughly 5 MiB per origin and stores
// strings as UTF-16 in several browsers. Project JSON can exceed 100 MiB, so a
// recent-project convenience cache must never try to mirror the whole file.
export const MAX_RECENT_PROJECT_CACHE_CHARS = 1_000_000;

export type RecentProjectCacheResult = 'cached' | 'metadata-only' | 'failed';

export function shouldCacheRecentProjectData(serializedData?: string): boolean {
    return typeof serializedData === 'string'
        && serializedData.length > 0
        && serializedData.length <= MAX_RECENT_PROJECT_CACHE_CHARS;
}

function isQuotaExceededError(error: unknown): boolean {
    if (!(error instanceof DOMException)) return false;
    return error.name === 'QuotaExceededError'
        || error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
        || error.code === 22
        || error.code === 1014;
}

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
function saveRecentProjectDataMap(map: Record<string, string>): boolean {
    try {
        if (Object.keys(map).length === 0) {
            localStorage.removeItem(RECENT_PROJECTS_DATA_KEY);
        } else {
            localStorage.setItem(RECENT_PROJECTS_DATA_KEY, JSON.stringify(map));
        }
        return true;
    } catch (error) {
        if (isQuotaExceededError(error)) return false;
        console.error('Error saving recent projects data cache:', error);
        return false;
    }
}

function saveRecentProjectsMetadata(projects: RecentProject[]): boolean {
    const serialized = JSON.stringify(projects);
    try {
        localStorage.setItem(RECENT_PROJECTS_KEY, serialized);
        return true;
    } catch (error) {
        if (isQuotaExceededError(error)) {
            // Cached project bodies are disposable. Remove them and retry the
            // tiny metadata list so large projects still appear under Recent.
            try {
                localStorage.removeItem(RECENT_PROJECTS_DATA_KEY);
                localStorage.setItem(RECENT_PROJECTS_KEY, serialized);
                return true;
            } catch (retryError) {
                if (!isQuotaExceededError(retryError)) {
                    console.error('Error saving recent projects metadata:', retryError);
                }
                return false;
            }
        }
        console.error('Error saving recent projects metadata:', error);
        return false;
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
export function addRecentProject(name: string, path: string, serializedData?: string): RecentProjectCacheResult {
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

        if (!saveRecentProjectsMetadata(trimmed)) return 'failed';

        // Persist cached data if provided and prune old cached entries
        const dataMap = getRecentProjectDataMap();
        if (shouldCacheRecentProjectData(serializedData)) {
            dataMap[path] = serializedData;
        } else {
            // Remove an older cached copy when the current project has grown
            // beyond the safe localStorage budget.
            delete dataMap[path];
        }
        // Remove cached data for entries no longer tracked
        Object.keys(dataMap).forEach(key => {
            if (!trimmed.find(p => p.path === key)) {
                delete dataMap[key];
            }
        });
        if (saveRecentProjectDataMap(dataMap)) {
            return dataMap[path] ? 'cached' : 'metadata-only';
        }

        // Quota may already be occupied by older cached projects. Evict oldest
        // bodies one at a time; metadata remains intact and reopening from File
        // continues to work even when no body can be cached.
        for (const recent of [...trimmed].reverse()) {
            if (!(recent.path in dataMap)) continue;
            delete dataMap[recent.path];
            if (saveRecentProjectDataMap(dataMap)) {
                return dataMap[path] ? 'cached' : 'metadata-only';
            }
        }
        try {
            localStorage.removeItem(RECENT_PROJECTS_DATA_KEY);
        } catch {
            // The metadata list was already saved; cache cleanup is best effort.
        }
        return 'metadata-only';
    } catch (error) {
        console.error('Error saving recent project:', error);
        return 'failed';
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
