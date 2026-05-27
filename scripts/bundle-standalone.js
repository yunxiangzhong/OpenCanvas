// Bundle all modules into a single standalone HTML file
// that works when double-clicked (no ES modules, no dev server needed)

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const src = resolve(root, 'src')

function read(name) {
  return readFileSync(resolve(src, name), 'utf-8')
}

// CSS files to inline
const stylesCss = read('styles.css')
const knowledgeCanvasCss = read('knowledgeCanvas.css')

// JS files in dependency order
const jsFiles = [
  'slide_recommend.js',       // no deps
  'knowledgeData.js',         // no deps
  'canvasRecommendation.js',  // no deps
  'knowledge_graph.js',       // depends on slide_recommend.js
  'mockApi.js',               // depends on slide_recommend.js
  'knowledgeCanvasApp.js',    // depends on knowledgeData, mockApi, canvasRecommendation
  'main.js',                  // depends on slide_recommend, knowledge_graph, knowledgeCanvasApp
]

// Concatenate JS, stripping import/export statements
const bundledJs = jsFiles
  .map((file) => {
    let code = readFileSync(resolve(src, file), 'utf-8')
    // Remove import lines (single-line and multi-line)
    code = code.replace(/^import\s+.*?(?:from\s+['"][^'"]+['"]|['"][^'"]+['"])\s*;?\s*$/gm, '')
    code = code.replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"]\s*;?\s*$/gm, '')
    // Remove export statements but keep the declarations
    code = code.replace(/^export\s+(default\s+)?/gm, '')
    return `// === ${file} ===\n${code}`
  })
  .join('\n')

// Build the standalone HTML
const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="黑松客精选画布 Demo：轻量静态推荐流与知识画布体验。"
    />
    <title>黑松客精选画布 Demo</title>
    <style>
${stylesCss}
    </style>
    <style>
${knowledgeCanvasCss}
    </style>
  </head>
  <body>
    <main id="app" class="app-shell" aria-live="polite"></main>
    <script>
"use strict";
${bundledJs}
    </script>
  </body>
</html>
`

writeFileSync(resolve(root, 'index.html'), html, 'utf-8')
console.log('Done: index.html')

