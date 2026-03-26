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

        const match = line.match(/^.{2} (.+)$/);
        if (!match) continue;
        
        const pathPart = match[1];
        const parts = pathPart.split(' -> ');
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
