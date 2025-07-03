# Deployment Documentation

## GitHub Pages Deployment Fix

### Issue
The GitHub Pages deployment was failing with the error:
```
failed to load config from /home/runner/work/randos/randos/vite.config.ts
```

### Root Cause
The issue was caused by an ES Module compatibility problem in the GitHub Actions CI environment. The error message showed:
```
Error [ERR_REQUIRE_ESM]: require() of ES Module /home/runner/work/randos/randos/node_modules/vite/dist/node/index.js from /home/runner/work/randos/randos/vite.config.ts not supported.
```

This occurs because:
1. Vite v7+ is a pure ES Module
2. The package.json didn't specify `"type": "module"`
3. Node.js in the CI environment was treating the configuration as CommonJS, causing conflicts

### Solution
**Updated package.json**: Added `"type": "module"` to ensure proper ES Module handling in all environments, including CI/CD pipelines.

The existing configurations were already correct:
- `vite.config.ts` already used absolute paths with `resolve(__dirname, ...)`
- GitHub Actions workflow already had the `--config ./vite.config.ts` flag

### Changes Made

#### package.json
```json
// Before
{
  "name": "randos",
  "version": "1.0.0",
  ...
}

// After  
{
  "name": "randos",
  "version": "1.0.0",
  "type": "module",
  ...
}
```

The vite.config.ts and GitHub Actions workflow were already correctly configured:

#### vite.config.ts (already correct)
```typescript
root: resolve(__dirname, 'src'),
outDir: resolve(__dirname, 'dist'),
```

#### .github/workflows/deploy.yml (already correct)
```yaml
- name: Build for production
  run: npm run build:prod -- --config ./vite.config.ts
```

### Testing
The fix has been tested to ensure:
- ✅ Local development server works (`npm run dev`)
- ✅ Local builds work (`npm run build` and `npm run build:prod`)
- ✅ Builds work from different working directories (simulating CI environment)
- ✅ Application functions correctly after build (game starts and runs properly)

### Future Reference
When working with Vite configurations in CI/CD environments:
1. **Always add `"type": "module"` to package.json** when using Vite v7+ to ensure proper ES Module handling
2. Use absolute paths with `resolve(__dirname, ...)` for directory configurations (already implemented)
3. Explicitly specify the config file path in CI scripts when needed (already implemented)
4. Test builds from different working directories to catch path resolution issues early

### Application Verification
The built application has been verified to work correctly:
- Main menu loads and displays properly
- Game starts when "Start Game" is clicked
- Battle arena renders with players and health bars
- All game functionality works as expected

Screenshots:
- [Main Menu](https://github.com/user-attachments/assets/788310fb-ff94-4ab3-84e2-5a6f9c6e6852)
- [Game Running](https://github.com/user-attachments/assets/953fecc0-daff-4b7b-9ac6-481adad4f697)