import fs from 'fs';

/**
 * Deletes local files. Handles a single path string or an array of path strings.
 * @param {string | string[]} paths - The path or array of paths to the files to be deleted.
 */
export const cleanUpFiles = (paths) => {
    // This check makes the utility robust. It handles cases where `paths` is a single string.
    const pathsToDelete = Array.isArray(paths) ? paths : (typeof paths === 'string' ? [paths] : []);

    if (pathsToDelete.length === 0) {
        return;
    }

    pathsToDelete.forEach(path => {
        if (fs.existsSync(path)) {
            // Using asynchronous unlink is slightly better for performance
            fs.unlink(path, (err) => {
                if (err) {
                    console.error(`Error deleting file: ${path}`, err);
                } else {
                    console.log(`Successfully deleted temp file: ${path}`);
                }
            });
        } else {
            console.warn(`File not found, could not delete: ${path}`);
        }
    });
};

