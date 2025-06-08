import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'node:url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
import prettier from 'prettier'

/**
 * @description 格式化 HTML 內容，讓縮排美觀
 * @param {string} html - HTML 原始字串
 * @returns {string} - 格式化後的 HTML
 */
function formatHtml(html, parser = 'html') {
  try {
    return prettier.format(html, {
      parser,
      printWidth: 120,
      tabWidth: 2,
      useTabs: false,
      singleQuote: true,
      semi: false,
      trailingComma: 'es5',
      bracketSpacing: true,
      arrowParens: 'always',
      endOfLine: 'lf',
    })
  } catch {
    return html
  }
}

/**
 * @description 檢查 SVG 是否需要修改（包含 width、height 或 fill 屬性）
 * @param {string} svgContent - SVG 檔案的內容
 * @returns {boolean} - 是否需要修改
 */
function needsModification(svgContent) {
  // 檢查 svg 標籤是否有 width 或 height 屬性
  const svgTag = svgContent.match(/<svg[^>]*>/)[0]
  if (svgTag.includes('width=') || svgTag.includes('height=')) {
    return true
  }

  // 檢查是否有 fill 屬性，且值不是 "currentColor" 或 "none"
  const fillMatches = svgContent.match(/fill=["']([^"']*)["']/g)
  if (fillMatches) {
    for (const match of fillMatches) {
      const value = match.match(/["']([^"']*)["']/)[1]
      if (value !== 'currentColor' && value !== 'none') {
        return true
      }
    }
  }

  // 檢查是否有 stroke 屬性，且值不是 "currentColor" 或 "none"
  const strokeMatches = svgContent.match(/stroke=["']([^"']*)["']/g)
  if (strokeMatches) {
    for (const match of strokeMatches) {
      const value = match.match(/["']([^"']*)["']/)[1]
      if (value !== 'currentColor' && value !== 'none') {
        return true
      }
    }
  }

  return false
}

/**
 * @description 移除 SVG 標籤中的 width 和 height 屬性
 * @param {string} svgContent - SVG 檔案的內容
 * @returns {string} - 處理後的 SVG 內容
 */
function removeSvgDimensions(svgContent) {
  return svgContent.replace(/<svg[^>]*\s(width|height)=["'][^"']*["'][^>]*>/g, (match) => {
    return match.replace(/\s(width|height)=["'][^"']*["']/g, '')
  })
}

/**
 * @description 將 SVG 中的 fill 和 stroke 屬性替換為 currentColor
 * @param {string} svgContent - SVG 檔案的內容
 * @returns {string} - 處理後的 SVG 內容
 */
function replaceFillWithCurrentColor(svgContent) {
  return svgContent.replace(/<(path|circle|rect)[^>]*>/g, (match) => {
    return match
      .replace(/\sfill=["'][^"']*["']/g, ' fill="currentColor"')
      .replace(/\sstroke=["'][^"']*["']/g, ' stroke="currentColor"')
  })
}

/**
 * @description 處理 SVG 內容，移除尺寸並更新 fill 屬性
 * @param {string} svgContent - SVG 檔案的內容
 * @returns {string} - 處理後的 SVG 內容
 */
function processSvgContent(svgContent) {
  return replaceFillWithCurrentColor(removeSvgDimensions(svgContent))
}

/**
 * @description 提取 SVG 檔案中的 name 屬性
 * TODO: 之後可以改成多語系
 * @param {string} svgContent - SVG 檔案的內容
 * @returns {string | null} - 提取的 name 屬性值或 null
 */
function extractSvgName(svgContent) {
  const nameMatch = svgContent.match(/name=["']([^"']+)["']/)
  return nameMatch ? nameMatch[1] : null
}

/**
 * @description 生成圖示名稱的型別定義檔案
 */
async function generateIconTypes() {
  const svgDir = path.join(__dirname, '..', 'svg')
  const withColorDir = path.join(svgDir, 'withColor')
  const typesDir = path.join(__dirname, '..', 'types')
  const demoDir = path.join(__dirname, '..', 'demo')
  const outputFile = path.join(typesDir, 'iconNames.ts')
  const demoFile = path.join(demoDir, 'index.html')

  if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir, { recursive: true })
  }
  if (!fs.existsSync(demoDir)) {
    fs.mkdirSync(demoDir, { recursive: true })
  }

  try {
    // 取得主 svg 資料夾下的 svg
    const files = fs.readdirSync(svgDir).filter((f) => f.endsWith('.svg'))
    // 取得 withColor 資料夾下的 svg
    let withColorFiles = []
    if (fs.existsSync(withColorDir)) {
      withColorFiles = fs.readdirSync(withColorDir).filter((f) => f.endsWith('.svg'))
    }

    const iconNames = [
      ...files.map((file) => file.replace('.svg', '')),
      ...withColorFiles.map((file) => 'withColor/' + file.replace('.svg', '')),
    ].sort()

    if (iconNames.length === 0) {
      console.warn('在 svg 及 withColor 資料夾中找不到任何 SVG 檔案')
      return
    }

    // 更新需要修改的 SVG 檔案
    const updatedFiles = []
    // 主 svg
    files.forEach((name) => {
      const svgPath = path.join(svgDir, `${name}`)
      const svgContent = fs.readFileSync(svgPath, 'utf8')
      if (needsModification(svgContent)) {
        const processedContent = processSvgContent(svgContent)
        if (svgContent !== processedContent) {
          fs.writeFileSync(svgPath, processedContent, 'utf8')
          updatedFiles.push(name)
        }
      }
    })

    // withColor 只移除寬高
    withColorFiles.forEach((file) => {
      const svgPath = path.join(withColorDir, file)
      const svgContent = fs.readFileSync(svgPath, 'utf8')
      // 只檢查 width/height
      const svgTag = svgContent.match(/<svg[^>]*>/)?.[0] || ''
      if (svgTag.includes('width=') || svgTag.includes('height=')) {
        const processedContent = removeSvgDimensions(svgContent)
        if (svgContent !== processedContent) {
          fs.writeFileSync(svgPath, processedContent, 'utf8')
          updatedFiles.push('withColor/' + file.replace('.svg', ''))
        }
      }
    })

    const typeDefinition = `export type IconName =
${iconNames.map((name) => `  | '${name}'`).join('\n')}

export const availableIconNames: IconName[] = [
${iconNames.map((name) => `  '${name}',`).join('\n')}
]
`

    fs.writeFileSync(outputFile, typeDefinition, 'utf8')

    const getSvgContentByName = (name) => {
      if (name.startsWith('withColor/')) {
        const file = name.replace('withColor/', '')
        return fs.readFileSync(path.join(withColorDir, file + '.svg'), 'utf8')
      }
      return fs.readFileSync(path.join(svgDir, name + '.svg'), 'utf8')
    }

    const htmlContent = (() => {
      const svgElements = iconNames
        .map((name) => {
          const svgContent = getSvgContentByName(name)
          const displayName = extractSvgName(svgContent)
          return `
                <div class="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-2 group relative icon-item"
                    data-name="${name}"
                    data-display-name="${displayName || ''}"
                    onclick="copyIconName('${name}')">
                    <div class="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-slate-50 rounded-lg p-3">
                        ${svgContent}
                    </div>
                    ${displayName ? `<div class="text-sm text-slate-500 text-center mb-1">${displayName}</div>` : ''}
                    <div class="text-sm font-semibold text-slate-700 text-center break-all">${name}</div>
                    <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div class="bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg">
                            點擊複製
                        </div>                </div>
                </div>`
        })
        .join('')

      return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SVG Icon Demo - ${iconNames.length} 個圖示</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Microsoft JhengHei', 'sans-serif']
          }
        }
      }
    }
  </script>
  <style>
    .gradient-bg {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .toast {
      position: fixed;
      top: 2rem;
      right: 2rem;
      z-index: 1000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    }
    
    .toast.show {
      transform: translateX(0);
    }

    .icon-item {
      transition: all 0.3s ease;
    }

    .icon-item.hidden {
      display: none;
    }
  </style>
</head>

<body class="gradient-bg min-h-screen p-8 font-sans">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-4 text-white">
      <h1 class="text-4xl md:text-5xl font-bold mb-2 drop-shadow-lg">🎨 SVG 圖示庫</h1>
      <p class="text-xl opacity-90">點擊複製名稱</p>
    </div>
    
    <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-white text-center mb-8 border border-white/20">
      <strong>總共 ${iconNames.length} 個圖示</strong> | 最後更新：${new Date().toLocaleString('zh-TW')}
    </div>
    <div class="mb-8">
      <div class="relative">
        <input type="text" id="searchInput"
          class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
          placeholder="搜尋圖示名稱或中文名稱..." oninput="searchIcons(this.value)">
        <div class="absolute right-3 top-1/2 -translate-y-1/2 text-white/50">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </div>
    </div>
    
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        ${svgElements}
    </div>
  </div>

  <!-- Toast 通知 -->
  <div id="toast" class="toast bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg right-0">
    <div class="flex items-center">
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span id="toast-message">已複製到剪貼簿</span>
    </div>
  </div>

  <script>
    function copyIconName(iconName) {
      navigator.clipboard.writeText(iconName).then(() => {
        showToast('已複製 "' + iconName + '" 到剪貼簿');
      }).catch(err => {
        console.error('複製失敗:', err);
        showToast('複製失敗，請手動複製', 'error');
      });
    }

    function showToast(message, type = 'success') {
      const toast = document.getElementById('toast');
      const toastMessage = document.getElementById('toast-message');

      toastMessage.textContent = message;

      if (type === 'error') {
        toast.className = 'toast bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg';
      } else {
        toast.className = 'toast bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg';
      }

      toast.classList.add('show');

      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }

    function searchIcons(query) {
      const searchText = query.toLowerCase();
      const items = document.querySelectorAll('.icon-item');

      items.forEach(item => {
        const name = item.dataset.name.toLowerCase();
        const displayName = item.dataset.displayName.toLowerCase();

        if (name.includes(searchText) || displayName.includes(searchText)) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });
    }
  </script>
</body>

</html>`
    })()

    const html = await formatHtml(htmlContent)

    fs.writeFileSync(demoFile, html, 'utf8')

    console.log(`\n✅ 成功生成檔案！`)
    console.log(`📁 型別檔案: ${outputFile}`)
    console.log(`🎨 Demo 檔案: ${demoFile}`)
    console.log(`🎯 包含 ${iconNames.length} 個圖示`)

    if (updatedFiles.length > 0) {
      console.log(`\n🔄 已更新以下 ${updatedFiles.length} 個 SVG 檔案：`)
      updatedFiles.forEach((name) => {
        console.log(`   - ${name}.svg`)
      })
    } else {
      console.log('\n✨ 所有 SVG 檔案都已經符合規範，無需更新')
    }
  } catch (error) {
    console.error('❌ 生成檔案時發生錯誤:', error.message)
    process.exit(1)
  }
}

generateIconTypes()
