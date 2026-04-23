# Release Guide

Home Topology Mapper uses simple semantic versioning once tags start.

## Versioning

- `0.x.y`: MVP and pre-1.0 releases.
- Patch version bumps should be bug fixes, docs, or small deployment improvements.
- Minor version bumps can include new MVP features or notable UI/API behavior.

## Release Checklist

1. Confirm `main` is green in CI.
2. Confirm `TASKS.md` accurately reflects completed work.
3. Run local checks:

   ```bash
   cd frontend && npm ci && npm run build
   cd ../backend && python -m compileall app
   cd .. && docker build -t home-topology-mapper:release .
   ```

4. Update README if deployment steps or environment variables changed.
5. Create and push a tag:

   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

6. Draft a GitHub release with:

   - What changed
   - Upgrade notes
   - Docker/LXC notes
   - Known limitations

## Pre-1.0 Release Notes Template

```md
## Highlights

- 

## Changes

- 

## Upgrade Notes

- 

## Known Limitations

- 
```
