# Logs Directory

This directory contains log files for debugging and monitoring the application. The logs are organized into subdirectories based on their source:

## Directory Structure

### `/vercel/`
- **Purpose**: Vercel deployment and build logs
- **Contents**: 
  - Deployment logs from Vercel CLI
  - Build process logs
  - Runtime logs from Vercel functions
- **File formats**: `.log`, `.txt`, `.out`

### `/npm/`
- **Purpose**: NPM package management and build logs
- **Contents**:
  - NPM install logs
  - NPM build process logs
  - Package dependency resolution logs
  - NPM error logs
- **File formats**: `.log`, `.txt`, `.out`

### `/server/`
- **Purpose**: Application server runtime logs
- **Contents**:
  - Next.js server logs
  - API endpoint logs
  - Database connection logs
  - Application error logs
- **File formats**: `.log`, `.txt`, `.out`, `.err`

### `/debug/`
- **Purpose**: General debugging logs and development logs
- **Contents**:
  - Development debugging information
  - Custom logging output
  - Test run logs
  - Performance monitoring logs
- **File formats**: `.log`, `.txt`, `.out`

## Usage

### Adding Logs Programmatically

To write logs to these directories from your application:

```typescript
// Example: Writing to server logs
import fs from 'fs';
import path from 'path';

const logToFile = (category: 'vercel' | 'npm' | 'server' | 'debug', message: string) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  const logPath = path.join(process.cwd(), 'logs', category, `${Date.now()}.log`);
  
  fs.appendFileSync(logPath, logEntry);
};
```

### Manual Log Collection

You can also manually save logs to these directories:

```bash
# Save Vercel deployment logs
vercel --debug > logs/vercel/deployment-$(date +%Y%m%d-%H%M%S).log 2>&1

# Save NPM logs
npm install --verbose > logs/npm/install-$(date +%Y%m%d-%H%M%S).log 2>&1

# Save custom server logs
node server.js > logs/server/runtime-$(date +%Y%m%d-%H%M%S).log 2>&1
```

## Git Ignore

The actual log files are ignored by Git (configured in `.gitignore`), but the directory structure is tracked. This ensures:
- Log files don't clutter the repository
- The directory structure is available for all developers
- Consistent logging locations across environments

## Best Practices

1. **Timestamp logs**: Always include timestamps in log entries
2. **Categorize properly**: Use the appropriate subdirectory for different log types
3. **Rotate logs**: Consider implementing log rotation for long-running processes
4. **Security**: Avoid logging sensitive information like API keys or user data
5. **Cleanup**: Periodically clean old log files to manage disk space

## Log Retention

Consider setting up automated cleanup of old log files:

```bash
# Clean logs older than 30 days
find logs/ -name "*.log" -type f -mtime +30 -delete
```