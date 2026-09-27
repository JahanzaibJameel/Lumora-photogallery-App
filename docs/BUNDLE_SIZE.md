# Bundle Size Analysis

Lumora uses [Expo Atlas](https://docs.expo.dev/guides/analyzing-bundle-size/) to analyze and monitor bundle size. This helps ensure the app remains performant and identifies opportunities for optimization.

## Running Locally

To generate a bundle size report locally:

```bash
npm run bundle-size
```

This generates two files in `.expo/`:
- `atlas.json` — Raw analysis data
- `atlas.html` — Interactive visualization

Open `.expo/atlas.html` in your browser to explore:
- Module size breakdown
- Dependency tree
- Largest modules and packages
- Code splitting effectiveness

## CI Integration

Bundle size analysis runs automatically on every push and pull request via GitHub Actions. The analysis artifacts are available for 30 days:

1. Navigate to the **Actions** tab in GitHub
2. Select the workflow run
3. Download the `bundle-analysis` artifact
4. Open `atlas.html` locally

## Interpreting Results

### Key Metrics

- **Total Bundle Size**: Complete app bundle size after minification
- **JavaScript Size**: Size of all JavaScript code
- **Asset Size**: Images, fonts, and other static assets

### Common Issues

**Large Dependencies**
If a single package is unusually large, consider:
- Alternative, lighter packages
- Tree-shaking (ensure you're importing only what you need)
- Code splitting to lazy-load heavy modules

**Duplicate Modules**
Multiple versions of the same package indicate dependency conflicts. Run:
```bash
npm ls <package-name>
```

**Unused Code**
Use the tree view to identify imported but unused modules.

## Bundle Size Budgets

Current bundle size targets (uncompressed):

| Platform | Target | Warning | Critical |
|----------|--------|---------|----------|
| iOS      | < 2 MB | 2.5 MB  | 3 MB     |
| Android  | < 2 MB | 2.5 MB  | 3 MB     |
| Web      | < 1 MB | 1.5 MB  | 2 MB     |

*Note: These are initial targets and may be adjusted based on feature requirements.*

## Optimization Tips

1. **Use FlashList over FlatList** — Already implemented
2. **Lazy load screens** — Use React.lazy() for rarely-accessed screens
3. **Optimize images** — Use WebP format, appropriate resolutions
4. **Tree-shake libraries** — Import only what you need:
   ```typescript
   // ✅ Good
   import { useTheme } from './hooks/useTheme';
   
   // ❌ Avoid
   import * as hooks from './hooks';
   ```
5. **Analyze before adding dependencies** — Check bundlephobia.com
6. **Remove unused dependencies** — Audit regularly with `depcheck`

## Resources

- [Expo Atlas Documentation](https://docs.expo.dev/guides/analyzing-bundle-size/)
- [React Native Performance](https://reactnative.dev/docs/performance)
- [Bundle Phobia](https://bundlephobia.com/) — Check package sizes before installing
