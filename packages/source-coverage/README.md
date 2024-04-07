# source-coverage

Applying sourcemap to js coverage data.

## Example:

```js
import { generateSourceCoverageTreemapData } from '@fe/perfsee-source-coverage'

generateSourceCoverageTreemapData({
  pageUrl: 'https://example.com',
  source: [...],
  jsCoverageData: {...}
})
```
