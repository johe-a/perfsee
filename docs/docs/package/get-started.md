---
id: get-started
title: Get Started
sidebar_position: 1
---

## Step 1: Install the SDK

```bash
# or any package manager you are using, e.g. npm/pnpm
yarn add @johfe/perfsee-package -D
```

## Step 2: Create Benchmark files (optional)

Create a file named `test.bench.js` under the project.

```js
const Benchmark = require('@johfe/perfsee-package')

Benchmark('foo', () => {
  bar()
})

Benchmark('bar', [
  {
    test: () => {
      baz()
    },
    options: { name: 'baz' },
  },
  {
    test: async () => {
      await setup()
      return () => {
        quz()
      }
    },
    options: { name: 'quz with async setup' },
  },
])
```

More about benchmark api, please refer to [Benchmark API](./benchmark-api).

## Step 3: Analyze and upload (ONLY on CI)

Before analysis, it's necessary to create a perfsee project and apply API Token on the [Token Management](https://perfsee.com/me/access-token) page.

```bash
PERFSEE_TOKEN=<your-token> npx @johfe/perfsee-package <path-to-package> --project=<perfsee-project-id>
```

If there are benchmark files named `xxx.{bench,benchmark}.{js,ts}`(by default), this command will run benchmarks before uploading.

On CI environment, the result will be uploaded to the platform. Otherwise, results will be shown in a html page.

### Cli Options

### project

Id of your perfsee project on the platform.

### customImports

By default, the default export is used for calculating sizes. Setting this option allows calculation of package stats based on more granular top-level exports.

### minifier: `'esbuild'` | `'terser'`

### default: `'esbuild'`

ESbuild is faster, albeit with marginally larger file sizes.

### target: `'browser'` | `'node'`

#### default: `'node'`

If target is `browser`, benchmarks will be bundled and run in headless chrome (on server if in CI environment).

### benchmarkPattern

#### default: `'*.{bench|benchmark}.{js|ts}'`

Glob pattern to find benchmark files.

### benchmarkTimeout

Timeout for benchmark running. Unit: sec.

## Step 4: View the report

When the analysis finished, we will automatically generate a report link. It will show the result of your package after a while. For more details, please refer to [Report Details](./package-report).
