# Publishing Guide

This guide explains how to publish the Network Compression Utils library to npm.

## 🚀 Automated Publishing (Recommended)

### GitHub Actions CI/CD

The repository is configured with automated publishing through GitHub Actions:

1. **Trigger Events**:
   - Push to `main` branch → Runs tests and builds
   - Tag push (v*) → Runs tests, builds, and publishes to npm
   - GitHub Release creation → Full publishing pipeline

2. **Automated Steps**:
   - ✅ Multi-node testing (Node.js 18.x, 20.x)
   - ✅ Build verification
   - ✅ Package validation
   - ✅ Automatic npm publishing
   - ✅ GitHub Release creation

3. **Requirements**:
   - `NPM_TOKEN` secret in GitHub repository settings
   - Proper version bumping (semantic versioning)

## 📦 Manual Publishing Options

### Option 1: Using Release Script

```bash
# Patch release (bug fixes)
npm run release patch

# Minor release (new features)
npm run release minor

# Major release (breaking changes)
npm run release major

# Publish current version
npm run release publish

# Test package creation
npm run release dry-run
```

### Option 2: Using npm Commands

```bash
# 1. Build the project
npm run build

# 2. Run tests
npm test

# 3. Check package
npm run dry-run

# 4. Bump version
npm version patch  # or minor/major
# npm version 1.0.1

# 5. Publish to npm
npm publish --access public

# 6. Push tags to GitHub
git push --tags
```

## 🔑 Setup for Publishing

### 1. npm Account Setup

1. [Create npm account](https://www.npmjs.com/signup)
2. Login to npm CLI:
   ```bash
   npm login
   ```

### 2. GitHub Actions Setup

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Add `NPM_TOKEN` secret:
   - Name: `NPM_TOKEN`
   - Value: Your npm access token (from npm settings)

### 3. Get npm Access Token

1. Go to [npmjs.com](https://www.npmjs.com)
2. Navigate to Account Settings → Access Tokens
3. Click "Generate New Token"
4. Select permissions: `Automation` or `Publish`
5. Copy the generated token
6. Add it to GitHub repository secrets

## 📋 Version Management

### Semantic Versioning

- `MAJOR.MINOR.PATCH` (e.g., 1.0.0 → 1.0.1)
- **Major**: Breaking changes
- **Minor**: New features (backward compatible)
- **Patch**: Bug fixes

### Pre-release Versions

```bash
# Alpha release
npm version 1.1.0-alpha.1

# Beta release
npm version 1.1.0-beta.1

# Release candidate
npm version 1.1.0-rc.1
```

### Release Workflow

1. **Development**: Work on `main` branch
2. **Testing**: Automated CI/CD tests
3. **Version Bump**: Use semantic versioning
4. **Publishing**: Automated or manual publish
5. **Release**: Create GitHub release

## 🏗️ Build Requirements

Before publishing, ensure:

1. ✅ All tests pass:
   ```bash
   npm test
   ```

2. ✅ Build completes successfully:
   ```bash
   npm run build
   ```

3. ✅ Package is valid:
   ```bash
   npm run dry-run
   ```

4. ✅ Required files are included:
   - `dist/` directory
   - `package.json` with correct fields
   - `README.md`

## 📦 Package Contents

The published npm package includes:

```
network-compression-utils/
├── dist/
│   ├── index.js          # CommonJS build
│   ├── index.esm.js      # ES module build
│   ├── index.umd.js      # UMD browser build
│   └── index.d.ts         # TypeScript definitions
├── package.json
├── README.md
└── LICENSE
```

## 🧪 Quality Gates

### Automated Tests

- ✅ **Unit Tests**: Core functionality
- ✅ **Integration Tests**: Component integration
- ✅ **Browser Tests**: Compatibility testing
- ✅ **Build Tests**: Build process validation
- ✅ **Package Tests**: npm package validation

### Build Validation

- ✅ **ES Module**: Modern JavaScript bundlers
- ✅ **CommonJS**: Node.js require()
- ✅ **UMD**: Browser script tag
- ✅ **TypeScript**: Type definitions

### Size Optimization

- ✅ **UMD**: ~39KB (minified, gzipped)
- ✅ **ESM**: ~93KB
- ✅ **CommonJS**: ~94KB

## 📊 Publishing Checklist

Before each release, verify:

- [ ] All tests passing (`npm test`)
- [ ] Build completes (`npm run build`)
- [ ] Package validation (`npm run dry-run`)
- [ ] Version number updated
- [ ] CHANGELOG.md updated
- [ ] README.md current
- [ ] npm access token configured

## 🚨 Common Issues

### 1. Permission Denied

```
npm ERR! code E401
npm ERR! 401 Unauthorized - PUT https://registry.npmjs.org/network-compression-utils - You must be logged in to publish packages
```

**Solution**: Log into npm or check NPM_TOKEN secret.

### 2. Package Name Taken

```
npm ERR! code E403
npm ERR! 403 Forbidden - network-compression-utils is already in the registry.
```

**Solution**: Use a different package name or check ownership.

### 3. Build Failures

```
Error: Build failed
```

**Solution**: Check build errors in `npm run build` output.

### 4. Test Failures

```
Test Suites: 1 failed, 0 total
```

**Solution**: Fix failing tests before publishing.

## 🎉 Post-Publish

### 1. Verify Publication

```bash
npm info network-compression-utils
```

### 2. Install and Test

```bash
npm install network-compression-utils
npm test network-compression-utils
```

### 3. Update Documentation

- Update README with version info
- Update CHANGELOG.md
- Tag release in GitHub

### 4. Promote Release

- Tweet about new release
- Create GitHub discussion
- Update project website

## 🔗 Useful Links

- [npm Registry](https://www.npmjs.com/package/network-compression-utils)
- [GitHub Repository](https://github.com/little2512/network-compression-utils)
- [npm Documentation](https://docs.npmjs.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)