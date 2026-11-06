# AGENTS.md

This file provides guidelines for AI agents working in this codebase.

## Project Overview

This is a **pure JavaScript Node.js** project (no TypeScript, no build tools) for risk app operations data analysis. It fetches data from Elasticsearch, processes it, and generates analysis reports.

**Key characteristics:**
- Pure JavaScript (ES6+), no TypeScript
- CommonJS modules (`require/module.exports`)
- Node.js CLI tools with shebang headers
- No testing framework, no linter, no formatter
- Single language: Chinese (code comments, strings, output)
- Data pipeline: fetch → convert → analyze → report

---

## Build / Lint / Test Commands

**No build process** - Pure Node.js execution.

**Run tools:**
```bash
# Main analyzer (recommended)
npm start                    # or npm run analyzer
npm run analyzer-help        # Show help

# Individual tools
npm run data-fetcher         # Fetch raw data
npm run format-converter     # JSON → Markdown
npm run report-generator     # Generate analysis report
npm run workflow             # Full pipeline (interactive)

# Execute directly with node
node risk-app-operation-analyzer.js [options] [YYYY-MM]
```

**No testing** - This project has no test framework. Manual testing only.

**No linting/formatting** - No ESLint, Prettier, or similar tools configured.

---

## Code Style Guidelines

### File Naming Convention

**Pattern:** `risk-app-[function]-[role].js`

Examples:
- `risk-app-operation-analyzer.js` - Main orchestrator/analyzer
- `risk-app-data-fetcher.js` - Data fetching
- `risk-app-format-converter.js` - Format conversion
- `risk-app-report-generator.js` - Report generation
- `risk-app-workflow-orchestrator.js` - Workflow automation

**Output files:** `risk-app-[type]-[date].[ext]`
- Raw data: `risk-app-raw-data-YYYY-MM.json`
- Formatted: `risk-app-formatted-data-YYYY-MM.md`
- Reports: `risk-app-analysis-report-YYYY-MM.md`

### File Structure

**CLI executables** (top level scripts):
```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Helper functions
function showHelp() { ... }

function validateDateFormat(dateStr) { ... }

// Main function
async function main() {
    // Parse args, execute logic
}

// Entry point
if (require.main === module) {
    main();
}

module.exports = { ... };
```

**Class-based modules:**
```javascript
const fs = require('fs');
const chalk = require('chalk');

class ClassName {
    constructor(options = {}) {
        this.prop = options.prop || defaultValue;
    }

    async methodName(params) {
        try {
            // Logic here
        } catch (error) {
            console.error(`Error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = ClassName;
```

### Imports and Exports

**Always use CommonJS:**
```javascript
// Import
const fs = require('fs');
const path = require('path');
const { someFunc } = require('./other-module');

// Export named functions
module.exports = { func1, func2, Class };

// Export class
module.exports = ClassName;
```

**Import order:**
1. Node.js built-ins (fs, path, http, https)
2. External packages (chalk)
3. Local modules (relative paths)

### Formatting

- **Indentation:** 2 spaces
- **Semicolons:** Always use
- **Quotes:** Single quotes for strings, backticks for template literals
- **Line length:** Soft limit ~100 chars
- **Spacing:**
  - Space after `if/for/while`: `if (condition) {`
  - No space before parentheses in function calls: `func(arg)`
  - Spaces around operators: `a + b`, `x = 1`

### Naming Conventions

| Context | Style | Example |
|---------|-------|---------|
| Variables | camelCase | `const lastMonth = ...` |
| Functions | camelCase | `function validateDate() {}` |
| Classes | PascalCase | `class RiskAppAnalyzer {}` |
| Constants | UPPER_SNAKE_CASE | `const DEFAULT_SIZE = 10000;` |
| File names | kebab-case | `risk-app-data-fetcher.js` |
| Private properties | underscore prefix | `this._internalState` |

### Comments and Documentation

**Use JSDoc for all public functions:**
```javascript
/**
 * 显示帮助信息
 */
function showHelp() {
    const scriptName = path.basename(process.argv[1]);
    console.log(`用法: ${scriptName} [选项] [日期]`);
}

/**
 * 验证日期格式
 * @param {string} dateStr - 日期字符串
 * @returns {boolean} - 格式是否正确
 */
function validateDateFormat(dateStr) {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}
```

**Inline comments:** Chinese, concise, explain "why" not "what"
```javascript
// 获取上个月（如果当前是一月，则去年十二月）
let lastMonth = month - 1;
let lastYear = year;
if (lastMonth === 0) {
    lastMonth = 12;
    lastYear = year - 1;
}
```

### Error Handling

**Pattern:** Try-catch with descriptive error messages
```javascript
try {
    const data = JSON.parse(content);
    // Process data
} catch (error) {
    console.error(`解析JSON失败: ${error.message}`);
    throw error;  // Re-throw to let caller handle
}
```

**CLI scripts:** Exit with status code 1 on error
```javascript
try {
    await main();
} catch (error) {
    console.error(`执行失败: ${error.message}`);
    process.exit(1);
}
```

**File operations:** Check ENOENT for missing files
```javascript
try {
    fs.readFileSync(filePath);
} catch (error) {
    if (error.code === 'ENOENT') {
        console.error(`文件不存在: ${filePath}`);
    }
    throw error;
}
```

### Console Output

**Use `chalk` for colored output:**
```javascript
const chalk = require('chalk');

console.log(chalk.cyan('=== 标题 ==='));
console.log(chalk.green('✅ 成功'));
console.log(chalk.red('❌ 失败'));
console.log(chalk.yellow('⚠️ 警告'));
console.log(chalk.gray('次要信息'));
```

**Progress feedback:**
```javascript
console.log(`开始加载数据...`);
// ... work ...
console.log(`✅ 成功加载数据，共 ${count} 条记录`);
```

**Emojis for UX:** Use sparingly, consistently (✅ ❌ ⚠️ 📊 📈)

### Date Handling

**Standard format:** YYYY-MM (year-month)
```javascript
function formatMonth(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

// Get last month
function getLastMonth() {
    const now = new Date();
    let month = now.getMonth() + 1;
    let year = now.getFullYear();

    if (month === 1) {
        month = 12;
        year = year - 1;
    } else {
        month = month - 1;
    }

    return `${year}-${String(month).padStart(2, '0')}`;
}
```

**Validation:** Regex pattern
```javascript
function validateYearMonthFormat(yearMonthStr) {
    return /^\d{4}-\d{2}$/.test(yearMonthStr);
}
```

### Configuration

**Use CONFIG object at module level:**
```javascript
const CONFIG = {
    output: {
        base_dir: 'output/analysis-reports',
        file_prefix: 'risk-app-analysis-report-'
    },
    api: {
        host: 'http://203.0.113.10:9200',
        username: 'sec_read',
        password: 'changeme'
    },
    filter: {
        invalid_users: ['用户', '---', ''],
        invalid_apps: ['应用名称', '---', '']
    }
};
```

### Data Processing Patterns

**De-duplication by user+date:**
```javascript
const userRecords = {};
const sortedEntities = [...entities].sort((a, b) => {
    return a.field_values.create_date.localeCompare(b.field_values.create_date);
});

for (const entity of sortedEntities) {
    const user = entity.field_values.user;
    const date = entity.field_values.create_date;

    if (!userRecords[user]) {
        userRecords[user] = {};
    }
    if (userRecords[user][date]) {
        continue;  // Skip duplicate
    }

    userRecords[user][date] = entity;
    // Process record...
}
```

**Grouping and counting:**
```javascript
const stats = {};
data.forEach(item => {
    const key = item.category;
    if (!stats[key]) {
        stats[key] = { count: 0, items: [] };
    }
    stats[key].count++;
    stats[key].items.push(item);
});
```

### HTTP Requests

**Promise-based HTTP:**
```javascript
function httpPost(url, data) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;

        const postData = JSON.stringify(data);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = client.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => { responseData += chunk; });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseData);
                    resolve(parsedData);
                } catch (error) {
                    reject(new Error(`响应解析失败: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`请求失败: ${error.message}`));
        });

        req.write(postData);
        req.end();
    });
}
```

### Command Line Parsing

**Simple argument parsing:**
```javascript
async function main() {
    const args = process.argv.slice(2);
    let targetDate = null;
    let workflow = 'all';

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '-h' || arg === '--help') {
            showHelp();
            return;
        } else if (arg === '-f' || arg === '--fetch') {
            workflow = 'fetch';
        } else if (validateDateFormat(arg)) {
            targetDate = arg;
        }
    }

    // Execute...
}
```

**Help function pattern:**
```javascript
function showHelp() {
    const scriptName = path.basename(process.argv[1]);
    console.log(`用法: ${scriptName} [选项] [日期]`);
    console.log();
    console.log('功能描述:');
    console.log('  从日志服务器查询指定月份的风险应用使用日志。');
    console.log();
    console.log('选项:');
    console.log('  -h, --help    显示此帮助信息');
    console.log('  -f, --fetch   仅获取数据');
    console.log();
    console.log('参数:');
    console.log('  日期          可选，格式为 YYYY-MM');
}
```

---

## Important Notes

1. **No TypeScript:** This is pure JavaScript. Do not add TypeScript.
2. **No build step:** Files run directly with Node.js.
3. **Chinese language:** All user-facing text, comments, and log messages must be in Chinese.
4. **No testing:** Manual testing required. Write code defensively.
5. **Single dependency:** Only `chalk` for terminal colors.
6. **Date defaults:** All tools default to "last month" when no date specified.
7. **Output directory:** All outputs go to `output/` subdirectories (raw-data, formatted-data, analysis-reports).
8. **Exit codes:** Use `process.exit(0)` for success, `process.exit(1)` for errors.

---

## Common Tasks

### Adding a new CLI tool

1. Create file: `risk-app-[function]-[role].js`
2. Add shebang: `#!/usr/bin/env node`
3. Export named functions or a class
4. Add `require.main === module` check
5. Add to `package.json` scripts:
   ```json
   "scripts": {
     "new-tool": "node risk-app-new-tool.js"
   }
   ```

### Processing JSON data

1. Read with `fs.readFileSync()`
2. Parse with `JSON.parse()`
3. Validate structure
4. Process with filtering/grouping
5. Output as JSON or Markdown

### Generating Markdown tables

```javascript
// Header
let mdContent = '| 列1 | 列2 | 列3 |\n';
mdContent += '|-----|-----|-----|\n';

// Rows (escape pipes)
data.forEach(row => {
    const escaped = Object.values(row)
        .map(cell => String(cell).replace(/\|/g, '\\|'));
    mdContent += `| ${escaped.join(' | ')} |\n`;
});

fs.writeFileSync(outputPath, mdContent, 'utf-8');
```

### Running the full pipeline

```bash
npm run analyzer -- --all 2025-12
```

This executes: fetch → convert → analyze → report
