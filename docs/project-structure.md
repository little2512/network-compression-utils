# Project Structure

This document outlines the structure of the Network Compression Utils project.

## Directory Structure

```
network-common-support/
├── src/                          # Source code
│   ├── index.js                  # Main entry point
│   ├── main.js                   # Main NetworkCompressionUtils class
│   ├── network-detector.js       # Network detection functionality
│   ├── compression-manager.js    # Compression functionality
│   ├── index.test.js             # Basic tests
│   └── test/
│       └── setup.js              # Jest test setup
├── dist/                         # Build output
│   ├── index.js                  # CommonJS build
│   ├── index.esm.js              # ES Module build
│   └── index.umd.js              # UMD build for browsers
├── types/                        # TypeScript definitions
│   └── index.d.ts                # Type definitions
├── docs/                         # Documentation
│   └── project-structure.md      # This file
├── examples/                     # Usage examples
│   └── basic.html                # Basic HTML example
├── .gitignore                    # Git ignore file
├── .eslintrc.js                  # ESLint configuration
├── .prettierrc                   # Prettier configuration
├── package.json                  # Project configuration
├── rollup.config.js              # Rollup build configuration
└── README.md                     # Project documentation
```

## Build System

The project uses Rollup for bundling with the following outputs:

1. **ES Module** (`dist/index.esm.js`) - Modern ES module format
2. **CommonJS** (`dist/index.js`) - Node.js compatible format
3. **UMD** (`dist/index.umd.js`) - Browser compatible format

## Development Scripts

- `npm run build` - Build the library
- `npm run dev` - Watch mode for development
- `npm run test` - Run tests
- `npm run lint` - Check code style
- `npm run lint:fix` - Fix code style issues
- `npm run format` - Format code with Prettier

## Stage Status

### Stage 1: Project Initialization ✅ COMPLETED

- [x] Created project structure
- [x] Configured build tools (Rollup, Babel)
- [x] Set up code quality tools (ESLint, Prettier)
- [x] Configured testing framework (Jest)
- [x] Created TypeScript definitions
- [x] Set up package.json and configuration files
- [x] Created basic module placeholders
- [x] Verified build system works

### Next Stage

Stage 2 will implement the network detection functionality.