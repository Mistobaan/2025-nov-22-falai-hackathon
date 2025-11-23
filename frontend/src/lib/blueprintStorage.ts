import { promises as fs } from 'fs';
import path from 'path';
import lockfile from 'proper-lockfile';
import { Blueprint, validateBlueprint } from './schema';

/**
 * JSON file-based blueprint persistence with file locking
 * Storage location: .blueprints/{blueprintId}.json
 */

const BLUEPRINTS_DIR = path.join(process.cwd(), '.blueprints');

/**
 * Ensure blueprints directory exists
 */
async function ensureBlueprintsDir(): Promise<void> {
    try {
        await fs.mkdir(BLUEPRINTS_DIR, { recursive: true });
    } catch (error) {
        // Directory might already exist
    }
}

/**
 * Get the file path for a blueprint
 */
function getBlueprintPath(blueprintId: string): string {
    return path.join(BLUEPRINTS_DIR, `${blueprintId}.json`);
}

/**
 * Load a blueprint from disk
 */
export async function loadBlueprint(blueprintId: string): Promise<Blueprint | null> {
    await ensureBlueprintsDir();

    const filepath = getBlueprintPath(blueprintId);

    try {
        const data = await fs.readFile(filepath, 'utf-8');
        const blueprint = JSON.parse(data);

        if (!validateBlueprint(blueprint)) {
            console.error(`Invalid blueprint structure for ${blueprintId}`);
            return null;
        }

        return blueprint;
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            // File doesn't exist
            return null;
        }
        console.error(`Error loading blueprint ${blueprintId}:`, error);
        throw error;
    }
}

/**
 * Save a blueprint to disk with file locking
 */
export async function saveBlueprint(blueprint: Blueprint): Promise<void> {
    await ensureBlueprintsDir();

    const filepath = getBlueprintPath(blueprint.id);

    // Update timestamp
    blueprint.updatedAt = new Date().toISOString();

    // Validate before saving
    if (!validateBlueprint(blueprint)) {
        throw new Error('Invalid blueprint structure');
    }

    // Acquire lock
    let release: (() => Promise<void>) | null = null;

    try {
        // Create file if it doesn't exist
        try {
            await fs.access(filepath);
        } catch {
            await fs.writeFile(filepath, '{}');
        }

        // Lock the file
        release = await lockfile.lock(filepath, {
            retries: {
                retries: 5,
                minTimeout: 100,
                maxTimeout: 1000
            }
        });

        // Write the blueprint
        await fs.writeFile(filepath, JSON.stringify(blueprint, null, 2), 'utf-8');

    } catch (error) {
        console.error(`Error saving blueprint ${blueprint.id}:`, error);
        throw error;
    } finally {
        // Release lock
        if (release) {
            try {
                await release();
            } catch (error) {
                console.error('Error releasing lock:', error);
            }
        }
    }
}

/**
 * Create a new blueprint
 */
export async function createBlueprint(blueprintId: string): Promise<Blueprint> {
    const blueprint: Blueprint = {
        id: blueprintId,
        status: 'draft',
        suggestedDefects: [],
        customDefects: [],
        jobs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    await saveBlueprint(blueprint);
    return blueprint;
}

/**
 * Delete a blueprint
 */
export async function deleteBlueprint(blueprintId: string): Promise<void> {
    const filepath = getBlueprintPath(blueprintId);

    try {
        await fs.unlink(filepath);
    } catch (error: any) {
        if (error.code !== 'ENOENT') {
            console.error(`Error deleting blueprint ${blueprintId}:`, error);
            throw error;
        }
    }
}

/**
 * List all blueprints
 */
export async function listBlueprints(): Promise<Blueprint[]> {
    await ensureBlueprintsDir();

    try {
        const files = await fs.readdir(BLUEPRINTS_DIR);
        const blueprintFiles = files.filter(f => f.endsWith('.json'));

        const blueprints: Blueprint[] = [];

        for (const file of blueprintFiles) {
            const blueprintId = file.replace('.json', '');
            const blueprint = await loadBlueprint(blueprintId);
            if (blueprint) {
                blueprints.push(blueprint);
            }
        }

        return blueprints;
    } catch (error) {
        console.error('Error listing blueprints:', error);
        return [];
    }
}

/**
 * Update blueprint status
 */
export async function updateBlueprintStatus(
    blueprintId: string,
    status: Blueprint['status']
): Promise<void> {
    const blueprint = await loadBlueprint(blueprintId);
    if (!blueprint) {
        throw new Error(`Blueprint ${blueprintId} not found`);
    }

    blueprint.status = status;
    await saveBlueprint(blueprint);
}

/**
 * Check if blueprint needs defect analysis
 * Returns true if: has image + no defects suggested yet
 */
export function needsDefectAnalysis(blueprint: Blueprint): boolean {
    return (
        blueprint.image !== undefined &&
        blueprint.suggestedDefects.length === 0 &&
        blueprint.status === 'draft'
    );
}
