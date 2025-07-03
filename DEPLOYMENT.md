# Deployment Documentation

## GitHub Pages Deployment Fix

### Issue
The GitHub Pages deployment was failing with the error:
```
failed to load config from /home/runner/work/randos/randos/vite.config.ts
```

### Root Cause
The issue was caused by relative path resolution in the Vite configuration file. When GitHub Actions runs the build process, it may execute from a different working directory than expected, causing Vite to be unable to resolve relative paths like `./src` and `../dist`.

### Solution
1. **Updated vite.config.ts**: Changed relative paths to absolute paths using `resolve(__dirname, ...)` to ensure paths work regardless of the current working directory.

2. **Updated GitHub Actions workflow**: Added explicit `--config ./vite.config.ts` flag to ensure the config file is found reliably.

### Changes Made

#### vite.config.ts
```typescript
// Before (relative paths)
root: './src',
outDir: '../dist',

// After (absolute paths)
root: resolve(__dirname, 'src'),
outDir: resolve(__dirname, 'dist'),
```

#### .github/workflows/deploy.yml
```yaml
# Before
- name: Build for production
  run: npm run build:prod

# After
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
1. Use absolute paths with `resolve(__dirname, ...)` for directory configurations
2. Explicitly specify the config file path in CI scripts when needed
3. Test builds from different working directories to catch path resolution issues early

### Application Verification
The built application has been verified to work correctly:
- Main menu loads and displays properly
- Game starts when "Start Game" is clicked
- Battle arena renders with players and health bars
- All game functionality works as expected

Screenshots:
- [Main Menu](https://github.com/user-attachments/assets/788310fb-ff94-4ab3-84e2-5a6f9c6e6852)
- [Game Running](https://github.com/user-attachments/assets/953fecc0-daff-4b7b-9ac6-481adad4f697)