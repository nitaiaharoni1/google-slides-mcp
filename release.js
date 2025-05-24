#!/usr/bin/env node

/**
 * Release Script for PostgreSQL MCP Server
 * 
 * Handles the complete release workflow:
 * - Version bumping
 * - Testing
 * - Package creation
 * - Publishing to npm
 * - Cleanup
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, description) {
    try {
        log(`\n${description}`, 'blue');
        const result = execSync(command, { encoding: 'utf8', stdio: 'inherit' });
        return result;
    } catch (error) {
        log(`❌ Failed: ${description}`, 'red');
        log(`Error: ${error.message}`, 'red');
        process.exit(1);
    }
}

function getCurrentVersion() {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return packageJson.version;
}

function cleanup() {
    log('\n🧹 Cleaning up...', 'cyan');
    try {
        // Remove any .tgz files created during packaging
        const files = fs.readdirSync('.');
        const tgzFiles = files.filter(file => file.endsWith('.tgz'));
        tgzFiles.forEach(file => {
            fs.unlinkSync(file);
            log(`  Removed ${file}`, 'yellow');
        });
    } catch (error) {
        log(`⚠️  Cleanup warning: ${error.message}`, 'yellow');
    }
}

function main() {
    const args = process.argv.slice(2);
    
    // Filter out option flags to find version type
    const versionType = args.find(arg => !arg.startsWith('--') && ['patch', 'minor', 'major'].includes(arg));
    
    log('🚀 PostgreSQL MCP Server Release Script', 'magenta');
    log('=' .repeat(50), 'magenta');

    // Show current version
    const currentVersion = getCurrentVersion();
    log(`📋 Current version: ${currentVersion}`, 'cyan');

    // Handle version bumping
    if (versionType) {
        exec(`npm version ${versionType}`, `🔢 Bumping ${versionType} version`);
        const newVersion = getCurrentVersion();
        log(`✅ Version updated: ${currentVersion} → ${newVersion}`, 'green');
    }

    // Run tests
    exec('npm test', '🧪 Running comprehensive tests');
    log('✅ All tests passed!', 'green');

    // Create package
    exec('npm pack', '📦 Creating npm package');
    log('✅ Package created successfully!', 'green');

    // Dry run option
    if (args.includes('--dry-run')) {
        log('\n🔍 Dry run completed successfully!', 'yellow');
        log('To actually publish, run without --dry-run flag', 'yellow');
        cleanup();
        return;
    }

    // Confirm publication
    if (!args.includes('--yes')) {
        log('\n⚠️  Ready to publish to npm!', 'yellow');
        log('This will make the package publicly available.', 'yellow');
        log('Continue? (y/N): ', 'yellow');
        
        // Simple confirmation (in a real script, you'd use readline)
        // For now, we'll proceed with a warning
        log('Use --yes flag to skip confirmation, or --dry-run to test without publishing', 'yellow');
        
        if (!args.includes('--force')) {
            log('❌ Publication cancelled. Use --yes or --force to proceed.', 'red');
            cleanup();
            process.exit(1);
        }
    }

    // Publish to npm
    exec('npm publish', '🚀 Publishing to npm registry');
    log('✅ Successfully published to npm!', 'green');

    // Push git changes (if version was bumped)
    if (versionType && ['patch', 'minor', 'major'].includes(versionType)) {
        try {
            exec('git push origin main --tags', '📤 Pushing changes and tags to git');
            log('✅ Changes pushed to git!', 'green');
        } catch (error) {
            log('⚠️  Git push failed. You may need to push manually.', 'yellow');
        }
    }

    cleanup();

    // Success summary
    const finalVersion = getCurrentVersion();
    log('\n🎉 Release completed successfully!', 'green');
    log('=' .repeat(50), 'green');
    log(`📦 Version: ${finalVersion}`, 'green');
    log(`🌐 Available at: https://www.npmjs.com/package/postgresql-mcp-server`, 'green');
    log(`💾 Install with: npm install -g postgresql-mcp-server`, 'green');
}

// Handle script arguments and help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
PostgreSQL MCP Server Release Script

Usage:
  node release.js [version] [options]

Version Types:
  patch    Increment patch version (1.0.0 → 1.0.1)
  minor    Increment minor version (1.0.0 → 1.1.0)  
  major    Increment major version (1.0.0 → 2.0.0)
  (none)   Use current version

Options:
  --dry-run    Test the release process without publishing
  --yes        Skip confirmation prompts
  --force      Force publication even without --yes
  --help, -h   Show this help message

Examples:
  node release.js patch              # Bump patch version and release
  node release.js minor --dry-run    # Test minor version bump
  node release.js --yes              # Release current version without prompts
  node release.js major --force      # Force major version release

The script will:
1. Run tests (npm test)
2. Create package (npm pack) 
3. Publish to npm (npm publish)
4. Push git changes and tags
5. Clean up temporary files
`);
    process.exit(0);
}

// Run the release process
try {
    main();
} catch (error) {
    log(`\n❌ Release failed: ${error.message}`, 'red');
    cleanup();
    process.exit(1);
} 