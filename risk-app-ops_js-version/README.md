# 风险应用运营数据分析工具

本项目是一套经过系统性优化的风险应用运营监测数据分析工具集，实现了从运营监测数据获取、格式转换到分析报告生成的完整流程。所有工具均使用纯JavaScript实现，采用清晰一致的命名规范和模块化架构，确保代码的可维护性和扩展性。

**🎯 最新功能**: 新增了 `risk-app-operation-analyzer.js` 工具，提供完整的一体化解决方案，支持"原始数据获取 → 数据处理 → 分析报告"的完整业务能力。

## 🎯 优化亮点

- **统一命名规范**: 采用 `risk-app-[function]-[role].js` 命名模式
- **优化目录结构**: 统一输出目录，逻辑清晰便于维护
- **精简npm脚本**: 简洁易用的脚本命令设计
- **模块化架构**: 独立功能模块，易于扩展和维护
- **完善错误处理**: 增强的异常处理和用户反馈机制

## 目录结构

```
risk-app-ops_js-version/
├── risk-app-operation-analyzer.js     # 🎯 风险应用运营分析器 - 一体化解决方案
├── risk-app-data-fetcher.js           # 风险应用运营监测数据获取工具
├── risk-app-format-converter.js       # 风险应用运营监测数据格式化工具
├── risk-app-report-generator.js       # 风险应用运营监测数据分析工具
├── risk-app-workflow-orchestrator.js  # 一键完整工作流程工具
├── es-monthly-query.js                # ES查询工具 (旧版本，保留兼容性)
├── package.json                       # 项目依赖配置
├── package-lock.json                  # 依赖锁定文件
├── node_modules/                      # 依赖模块目录
├── output/                            # 统一输出目录
│   ├── raw-data/                      # 原始数据文件
│   │   └── risk-app-raw-data-YYYY-MM.json
│   ├── formatted-data/                # 格式化后的运营监测数据文件
│   │   └── risk-app-formatted-data-YYYY-MM.md
│   └── analysis-reports/              # 分析报告文件
│       └── risk-app-analysis-report-YYYY-MM.md
└── README.md                          # 本说明文件
```

## 工具说明

### 🎯 推荐工具：风险应用运营分析器 (risk-app-operation-analyzer.js)

**最新的一体化解决方案**，完整复现"原始数据获取→数据处理→分析报告"的业务能力。

#### 使用方法
```bash
# 使用 npm 脚本 (推荐)
npm start
npm run analyzer

# 直接使用 node 命令
node risk-app-operation-analyzer.js [选项] [年-月]
```

#### 选项
- `-h, --help` 显示帮助信息
- `-a, --all` 执行完整工作流程 (数据获取→转换→分析)
- `-f, --fetch` 仅执行数据获取
- `-c, --convert` 仅执行格式转换
- `-r, --report` 仅执行分析报告
- `-t, --type TYPE` 查询类型: basic|scroll|agg (默认: basic)
- `-s, --size SIZE` 结果大小限制 (默认: 10000)
- `-o, --output DIR` 输出目录 (默认: ./output)
- `-H, --host HOST` ES服务器地址 (默认: http://203.0.113.10:9200)
- `-u, --username USER` ES用户名 (默认: sec_read)
- `-p, --password PASS` ES密码 (默认: changeme)

#### 参数
- `年-月` 可选，格式为 YYYY-MM
  - 如果不指定，**默认使用上个月份**

#### 特性
- ✨ **一体化解决方案**: 一个工具完成所有工作流程
- 🔍 **多种查询模式**: 支持 basic、scroll、aggregation 查询
- 🔒 **内置认证**: 自动处理 ES 认证，支持 Basic Auth
- 📊 **严格模板格式**: 报告格式严格按照现有模板规范
- 🎨 **友好界面**: 彩色输出，实时进度显示
- 🛡️ **错误处理**: 完善的异常捕获和用户反馈
- 📁 **统一输出**: 所有文件按统一规范保存

#### 示例
```bash
# 执行完整流程 (推荐)
npm start
npm run analyzer

# 仅生成报告
npm run analyzer -- --report 2025-12

# 仅获取数据
npm run analyzer -- --fetch 2025-11

# 指定查询参数
npm run analyzer -- --all --size 5000 --host http://custom-es:9200 2025-10

# 显示帮助
npm run help
```

#### 输出
- 原始数据：`output/raw-data/risk-app-raw-data-YYYY-MM.json`
- 格式化数据：`output/formatted-data/risk-app-formatted-data-YYYY-MM.md`
- 分析报告：`output/analysis-reports/risk-app-analysis-report-YYYY-MM.md`

---

### 1. 风险应用日志获取工具 (risk-app-data-fetcher.js)

从日志服务器查询指定月份的风险应用运营监测数据数据，支持自定义查询日期范围。采用统一的命名规范和输出目录结构。

#### 使用方法
```bash
# 直接使用 node 命令
node risk-app-data-fetcher.js [选项] [日期]

# 使用 npm 脚本
npm run data-fetcher [选项] [日期]
```

#### 选项
- `-h, --help` 显示帮助信息

#### 参数
- `日期` 可选，格式为 YYYY-MM
  - 如果不指定，**默认使用上个月**
  - 如果使用 YYYY-MM 格式，将自动使用该月

#### 示例
```bash
node risk-app-data-fetcher.js
node risk-app-data-fetcher.js 2025-04
node risk-app-data-fetcher.js --help
npm run data-fetcher -- --help
```

#### 输出
- 查询结果将保存到 `output/raw-data/risk-app-raw-data-YYYY-MM.json` 文件中

### 2. JSON 转 Markdown 表格工具 (risk-app-format-converter.js)

将 JSON 格式的风险应用运营监测数据文件转换为 Markdown 表格格式，支持对同一用户的时间戳重复条目进行去重。采用统一命名规范和输出目录结构。

#### 使用方法
```bash
# 直接使用 node 命令
node risk-app-format-converter.js [选项] [输入文件] [输出文件]

# 使用 npm 脚本
npm run format-converter [选项] [输入文件] [输出文件]
```

#### 参数
- `输入文件` 可选，JSON 格式的风险应用运营监测数据文件路径
  - 如果不指定，默认使用上个月的运营监测数据文件
  - 默认路径：`output/raw-data/risk-app-raw-data-YYYY-MM.json`
- `输出文件` 可选，输出的 Markdown 文件路径
  - 如果未指定，默认使用统一命名规范：`output/formatted-data/risk-app-formatted-data-YYYY-MM.md`

#### 示例
```bash
node risk-app-format-converter.js
node risk-app-format-converter.js output/raw-data/risk-app-raw-data-2025-12.json
node risk-app-format-converter.js output/raw-data/risk-app-raw-data-2025-12.json custom-output.md
node risk-app-format-converter.js --help
npm run format-converter -- --help
```

### 3. 风险应用运营监测数据分析工具 (risk-app-report-generator.js)

分析 Markdown 格式的风险应用运营监测数据，生成详细的分析报告，包括基础统计、应用分布、用户分布和日期统计等。采用统一命名规范和输出目录结构。

#### 使用方法
```bash
# 直接使用 node 命令
node risk-app-report-generator.js [选项] [文件路径]

# 使用 npm 脚本
npm run report-generator [选项] [文件路径]
```

#### 参数
- `文件路径` 可选，Markdown 格式的风险应用运营监测数据文件路径
  - 如果不指定，默认使用上个月的运营监测数据文件
  - 默认路径：`output/formatted-data/risk-app-formatted-data-YYYY-MM.md`

#### 示例
```bash
node risk-app-report-generator.js
node risk-app-report-generator.js output/formatted-data/risk-app-formatted-data-2025-11.md
node risk-app-report-generator.js --help
npm run report-generator -- --help
```

#### 输出
- 分析报告将保存到 `output/analysis-reports/risk-app-analysis-report-YYYY-MM.md` 文件中
- 生成的报告包含：
  - 基础统计分析
  - 应用分布统计
  - 用户分布统计
  - 日期统计分析
  - 可视化图表占位符

### 4. 一键完整工作流程工具 (risk-app-workflow-orchestrator.js)

自动执行完整的工作流程，包括获取运营监测数据、转换格式和分析报告。支持交互式操作，每一步之间可以暂停等待用户确认。支持灵活的日期参数指定。采用统一命名规范和输出目录结构。

#### 使用方法
```bash
# 直接使用 node 命令
node risk-app-workflow-orchestrator.js [选项] [日期]

# 使用 npm 脚本
npm run aio [选项] [日期]
```

#### 选项
- `-h, --help` 显示帮助信息

#### 参数
- `日期` 可选，格式为 YYYY-MM
  - 如果不指定，**默认使用上个月**
  - 如果使用 YYYY-MM 格式，将处理整个月
  - 如果使用 YYYY-MM-DD 格式，将处理指定日期

#### 特性
- **灵活的日期处理**: 支持指定特定月份或日期，默认使用上个月
- **参数验证**: 自动验证日期格式，确保输入正确
- **交互式操作**: 每步执行后暂停，等待用户按回车继续
- **进度跟踪**: 实时显示执行进度和结果
- **错误处理**: 完善的错误捕获和处理机制
- **跨平台兼容**: 支持 Windows 和 Unix 系统
- **统一输出**: 所有文件统一输出到 `output/` 目录下

#### 执行流程
1. 获取指定日期或月份的风险应用运营监测数据到 `output/raw-data/`
2. 将 JSON 转换为 Markdown 表格格式保存到 `output/formatted-data/`
3. 分析风险应用运营监测数据并生成详细报告保存到 `output/analysis-reports/`
4. 显示所有生成文件的路径

#### 示例
```bash
# 使用上个月（默认）
node risk-app-workflow-orchestrator.js
npm run aio

# 处理指定月份
node risk-app-workflow-orchestrator.js 2025-04
npm run aio 2025-04

# 显示帮助信息
node risk-app-workflow-orchestrator.js --help
npm run aio -- --help
```

#### 输出
- 完整的运营监测数据获取和转换过程
- 详细的执行状态反馈
- 生成的所有文件路径信息

## 安装说明

### 环境要求
- Node.js 12.0.0 或更高版本

### 项目依赖
本项目使用以下 npm 包：
- `chalk` (^4.1.2) - 用于终端输出颜色美化

### 安装步骤
1. 确保已安装 Node.js (版本 12.0.0 或更高)
2. 克隆或下载本项目到本地
3. 进入 `risk-app-ops_js-version` 目录
4. 安装依赖：
   ```bash
   npm install
   ```

## 完整工作流程

### 使用 node 命令

1. **获取风险应用运营监测数据**
   ```bash
   node risk-app-data-fetcher.js 2025-12
   ```

2. **转换风险应用运营监测数据为 Markdown 表格**
   ```bash
   node risk-app-format-converter.js output/raw-data/risk-app-raw-data-2025-12.json
   ```

3. **分析风险应用运营监测数据**
   ```bash
   node risk-app-report-generator.js output/formatted-data/risk-app-formatted-data-2025-12.md
   ```

### 使用 npm 脚本

1. **获取风险应用运营监测数据**
   ```bash
   npm run data-fetcher 2025-12
   ```

2. **转换风险应用运营监测数据格式为 Markdown 表格**
   ```bash
   npm run format-converter output/raw-data/risk-app-raw-data-2025-12.json
   ```

3. **分析风险应用运营监测数据**
   ```bash
   npm run report-generator output/formatted-data/risk-app-formatted-data-2025-12.md
   ```

## 🚀 一键完整工作流程

为了简化操作，我们提供了专门的 npm 脚本来自动执行完整的工作流程：

### 方式一：使用新版一体化分析器（推荐）

```bash
# 执行完整流程 (默认上个月)
npm start
npm run analyzer

# 处理指定月份
npm run analyzer -- --all 2025-12

# 仅生成报告
npm run analyzer -- --report 2025-11

# 显示帮助信息
npm run help
```

### 方式二：交互式完整工作流程

```bash
# 使用上个月（默认）
npm run aio

# 处理指定月份
npm run aio 2025-04

# 显示帮助信息
npm run aio -- --help
```

这个命令将：
1. 获取指定月份的风险应用运营监测数据到 `output/raw-data/`
2. 将 JSON 转换为 Markdown 表格保存到 `output/formatted-data/`
3. 分析风险应用运营监测数据并生成报告保存到 `output/analysis-reports/`
4. 在每一步之间暂停，等待用户确认

## ⚡ 快速开始

对于新用户，我们强烈推荐使用新版的一体化分析器：

### 最简单的使用方式

```bash
# 1. 进入项目目录
cd risk-app-ops_js-version

# 2. 安装依赖 (首次使用)
npm install

# 3. 运行分析器 (默认处理上个月数据)
npm start

# 4. 查看生成的分析报告
cat output/analysis-reports/risk-app-analysis-report-$(date -d "last month" +%Y-%m).md
```

### 高级用法

```bash
# 处理指定月份
npm run analyzer -- --all 2025-12

# 仅生成报告 (使用现有数据)
npm run analyzer -- --report 2025-12

# 自定义查询参数
npm run analyzer -- --all --size 5000 --host http://custom-es:9200 2025-11

# 测试功能
npm test
```

### 方式二：直接使用分析工具

如果您已经准备好了数据文件，可以直接使用分析工具：

```bash
npm run report-generator output/formatted-data/risk-app-formatted-data-2025-12.md
```

### 可用的 npm 脚本列表

运行以下命令查看所有可用脚本：

```bash
npm run
```

可用脚本：
- `npm start` / `npm run analyzer` - 🎯 **新版一体化分析器** (推荐)
- `npm run help` - 显示帮助信息
- `npm test` - 测试功能 (生成2025-12报告)
- `npm run data-fetcher` - 获取风险应用运营监测数据
- `npm run format-converter` - 转换风险应用运营监测数据格式为 Markdown 表格
- `npm run report-generator` - 分析风险应用运营监测数据并生成报告
- `npm run aio` / `npm run workflow` - 交互式完整工作流程

4. **查看分析报告**
   报告将生成在 `output/analysis-reports/risk-app-analysis-report-2025-12.md`

## 输出目录结构

本项目采用统一的输出目录结构，所有生成的文件都组织在 `output/` 目录下：

```
output/
├── raw-data/                          # 原始数据文件
│   └── risk-app-raw-data-YYYY-MM.json # 从服务器获取的原始运营监测数据
├── formatted-data/                    # 格式化数据文件
│   └── risk-app-formatted-data-YYYY-MM.md # 转换为表格格式的运营监测数据
└── analysis-reports/                  # 分析报告文件
    └── risk-app-analysis-report-YYYY-MM.md # 详细分析报告
```

### 目录说明

- **raw-data/**: 存储从服务器获取的原始JSON格式运营监测数据
- **formatted-data/**: 存储转换为Markdown表格格式的运营监测数据
- **analysis-reports/**: 存储生成的分析报告，包含统计信息和可视化占位符

## 注意事项

1. **服务器连接**
   - `risk-app-data-fetcher.js` 工具默认连接到内部服务器 `http://203.0.113.20:7777`
   - 如果服务器地址或端口发生变化，需要修改代码中的相关配置

2. **输出目录**
   - 所有文件统一保存到 `output/` 目录下
   - 工具会自动创建所需的输出子目录
   - 采用统一命名规范：`risk-app-[type]-[date].[ext]`

3. **可视化图表**
   - 目前工具仅生成图表占位符
   - 如需生成实际图表，可集成图表库扩展功能

4. **性能考虑**
   - 工具默认支持最大 10000 条记录的查询
   - 如需处理更大规模的数据，可调整 `pageSize` 参数

## 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。

## 贡献

欢迎提交问题和建议，或直接参与代码贡献。

## 更新日志

### v2.0.1 (2026-01-04) - 包管理和文档完善
- 📦 **完善**: 更新 package.json 配置，添加完整的项目元数据
- ✨ **新增**: 添加 npm 脚本支持 (start, analyzer, help, test)
- 📝 **更新**: 完善 README.md，新增快速开始指南
- 🎯 **突出**: 新增风险应用运营分析器使用说明
- 📊 **优化**: 详细的命令行参数和示例说明
- 🛠️ **维护**: 更新引擎要求和兼容性信息

### v2.0.0 (2026-01-04) - 系统性优化版本
- 🏗️ **重构**: 全面采用统一命名规范 `risk-app-[function]-[role].js`
- 📁 **优化**: 建立统一的 `output/` 目录结构，包含 `raw-data/`、`formatted-data/`、`analysis-reports/`
- ⚡ **精简**: 优化 npm 脚本名称，提升命令行使用体验
- 🔄 **迁移**: 完成目录重命名和文件重命名，保持功能完整性
- 📝 **文档**: 全面更新 README.md，反映所有优化成果和最佳实践
- 🛠️ **维护**: 更新所有代码引用，确保新旧版本的平滑过渡

### v1.1.1 (2025-12-30)
- ✨ **增强**: full_workflow.js 支持命令行参数，可指定 YYYY-MM
- ✨ **新增**: 完整的帮助信息显示 (-h, --help)
- 🔧 **优化**: 参数验证和错误处理机制
- 📝 **更新**: 完善 README.md 文档，增加详细的命令使用说明

### v1.1.0 (2025-12-30)
- ✨ **新增**: 一键完整工作流程工具 (full_workflow.js)
- ✨ **新增**: 交互式完整工作流程 npm 脚本 (full-workflow-auto)
- ✨ **新增**: 自动完整工作流程 npm 脚本 (full-workflow)
- 🔧 **优化**: risk_log_get.js 默认使用上月，无需手动指定
- 🔧 **优化**: 增强跨平台兼容性，支持 Windows 和 Unix 系统
- 📝 **更新**: 完善文档说明，添加详细的使用示例和指令说明
- 🛠️ **改进**: 优化 npm 脚本配置，提供更多便捷操作选项

### v1.0.1 (2025-12-30)
- 添加了 npm 脚本支持
- 更新了 README.md 文档，添加了 npm 脚本使用方法
- 优化了文档结构，增加了完整工作流程的 npm 脚本示例

### v1.0.0 (2025-12-30)
- 初始版本
- 实现了风险应用运营监测数据获取功能
- 实现了 JSON 转 Markdown 表格功能
- 实现了风险应用运营监测数据分析功能
