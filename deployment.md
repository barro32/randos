# Deployment Documentation

This file documents the deployment process for this project.

The project is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

The GitHub Actions workflow `.github/workflows/deploy.yml` handles the build and deployment.

Key settings:
- Node.js version: 22
- Build command: `npm run build:prod`
- Publish directory: `./dist`
- Target branch: `gh-pages`
- Jekyll is disabled for the Pages site.
