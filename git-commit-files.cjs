const { execSync } = require('child_process');

/**
 * Script to commit all changed files one by one.
 * This helps in maintaining a granular history for large refactors.
 */

function runCommand(command) {
    try {
        return execSync(command, { encoding: 'utf8' }).trim();
    } catch (error) {
        console.error(`Error executing command: ${command}`);
        console.error(error.message);
        return null;
    }
}

function commitFiles() {
    console.log('Fetching changed files...');
    const status = runCommand('git status --porcelain -uall');
    
    if (!status) {
        console.log('No changes detected.');
        return;
    }

    const lines = status.split('\n');
    let commitCount = 0;

    for (const line of lines) {
        if (!line.trim()) continue;

        // git status --porcelain output:
        // XY path/to/file
        // We need 'path/to/file'. If it's a rename (R), it looks like 'R old -> new'
        const parts = line.substring(3).trim().split(' -> ');
        const filePath = parts[parts.length - 1];

        console.log(`\nStaging: ${filePath}`);
        runCommand(`git add "${filePath}"`);

        const commitMessage = `Refactor: modularize ${filePath}`;
        console.log(`Committing: ${commitMessage}`);
        runCommand(`git commit -m "${commitMessage}"`);
        commitCount++;
    }

    console.log(`\nSuccessfully committed ${commitCount} files individually.`);
    console.log('You can now push your changes manually using: git push');
}

commitFiles();
