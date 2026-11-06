const fs = require('fs');
const path = require('path');

/**
 * 获取上个月的 YYYY-MM 格式
 * @returns {string} - 上个月的 YYYY-MM 格式日期
 */
function getLastMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    let lastMonth = month - 1;
    let lastYear = year;
    
    if (lastMonth === 0) {
        lastMonth = 12;
        lastYear = year - 1;
    }
    
    return `${lastYear}-${String(lastMonth).padStart(2, '0')}`;
}

/**
 * 显示帮助信息
 */
function showHelp() {
    const scriptName = path.basename(process.argv[1]);
    console.log(`用法: ${scriptName} [选项] [文件路径]`);
    console.log();
    console.log('功能描述:');
    console.log('  分析 Markdown 格式的风险应用运营数据，生成详细的分析报告。');
    console.log('  生成的报告包含：');
    console.log('    - 基础统计分析');
    console.log('    - 应用分布统计');
    console.log('    - 用户分布统计');
    console.log('    - 日期统计分析');
    console.log('  分析结果将保存到 output/analysis-reports/risk-app-analysis-report-YYYY-MM.md 文件中');
    console.log();
    console.log('选项:');
    console.log('  -h, --help    显示此帮助信息');
    console.log();
    console.log('参数:');
    console.log('  文件路径      可选，Markdown 格式的风险应用运营数据文件路径');
    console.log('                如果不指定，默认使用上个月的日志文件');
    console.log('                默认路径：output/formatted-data/risk-app-formatted-data-YYYY-MM.md');
    console.log();
    console.log('示例:');
    console.log(`  ${scriptName}`);
    console.log(`  ${scriptName} output/formatted-data/risk-app-formatted-data-2025-11.md`);
    console.log(`  ${scriptName} --help`);
    console.log();
    console.log('输出说明:');
    console.log('  1. 基础统计：显示总记录数、用户数、应用数等基础信息');
    console.log('  2. 用户统计：显示每个用户的安装和运行情况');
    console.log('  3. 日期统计：按日期统计安装和运行情况');
    console.log('  4. 可视化图表：在 output/analysis-reports 目录下生成统计图表占位符');
}

// 配置管理
const CONFIG = {
    output: {
        base_dir: 'output/analysis-reports',
        file_prefix: 'risk-app-analysis-report-'
    },
    table: {
        headers: {
            user_stats: ['用户', '已安装状态数', '正在运行状态数'],
            daily_stats: ['日期', '活跃用户数', '已安装状态数', '正在运行状态数', '活跃用户'],
            app_stats: ['应用名称', '已安装状态数', '正在运行状态数'],
            user_date_stats: ['用户', '活跃天数', '已安装状态数', '正在运行状态数', '活动日期', '应用名称'],
            user_detail_stats: ['日期', '已安装状态数', '正在运行状态数', '活动时间', '应用名称']
        }
    },
    filter: {
        invalid_users: ['用户', '---', ''],
        invalid_apps: ['应用名称', '---', '应用名称 ']
    }
};

// 设置日志
function logInfo(message) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
}

function logWarning(message) {
    console.log(`[WARN] ${new Date().toISOString()} - ${message}`);
}

function logError(message) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
}

/**
 * 格式化表格头部
 * 
 * @param {string[]} headers - 表头列表
 * @returns {string} - 格式化后的表头字符串
 */
function formatTableHeaders(headers) {
    return `| ${headers.join(' | ')} |\n|${headers.map(() => '---').join('|')}|`;
}

/**
 * 格式化表格行
 * 
 * @param {any[]} rowData - 行数据列表
 * @returns {string} - 格式化后的行字符串
 */
function formatTableRow(rowData) {
    return `| ${rowData.map(item => String(item)).join(' | ')} |`;
}

/**
 * 从文件名中提取日期信息
 * 
 * @param {string} filePath - 文件路径
 * @returns {string} - 提取的日期字符串
 */
function extractDateFromFilename(filePath) {
    const filename = path.basename(filePath);
    const match = filename.match(/(\d{4}-\d{2})/);
    return match ? match[1] : 'unknown_date';
}

/**
 * 设置输出目录
 * @param {string} filePath - 输入文件路径，用于提取日期
 * @returns {string} - 输出目录路径
 */
function setupOutputDirectory(filePath) {
    const baseOutputDir = CONFIG.output.base_dir;
    if (!fs.existsSync(baseOutputDir)) {
        fs.mkdirSync(baseOutputDir, { recursive: true });
    }
    
    // 直接返回基础目录，不创建月份子目录
    return baseOutputDir;
}

/**
 * 风险应用运营分析器
 */
class RiskAnalyzer {
    /**
     * 初始化分析器
     * 
     * @param {string} filePath - 日志文件路径
     */
    constructor(filePath) {
        this.filePath = filePath;
        this.data = [];
        this.outputDir = null;
        this.outputBuffer = '';
    }
    
    /**
     * 加载并预处理数据
     */
    loadData() {
        try {
            // 读取Markdown格式的数据
            const content = fs.readFileSync(this.filePath, 'utf-8');
            const lines = content.split('\n');
            
            // 找到表格开始的行（包含 | 的行）
            let tableStart = null;
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.includes('|') && line.includes('创建日期')) {
                    tableStart = i;
                    break;
                }
            }
            
            if (tableStart === null) {
                throw new Error('未找到表格数据');
            }
            
            // 提取表格数据（跳过表头和分隔行）
            const tableLines = [];
            for (let i = tableStart; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line && line.includes('|') && !line.startsWith('|--')) {
                    tableLines.push(line);
                }
            }
            
            // 解析表格数据
            for (const line of tableLines) {
                // 分割并清理每个字段
                const fields = line.split('|').slice(1, -1).map(field => field.trim());
                if (fields.length >= 8) { // 确保有足够的字段
                    this.data.push({
                        创建日期: fields[0],
                        应用名称: fields[1],
                        应用版本: fields[2],
                        应用类型: fields[3],
                        安装状态: fields[4],
                        运行状态: fields[5],
                        风险等级: fields[6],
                        用户: fields[7]
                    });
                }
            }
            
            // 清理数据
            this.data = this.data.map(row => {
                const cleanedRow = {};
                for (const [key, value] of Object.entries(row)) {
                    cleanedRow[key] = String(value).trim();
                }
                return cleanedRow;
            });
            
            // 过滤数据
            this.data = this.filterData(this.data);
            
            // 转换日期
            this.data = this.data.map(row => {
                const newRow = { ...row };
                if (newRow.创建日期) {
                    newRow.日期时间 = new Date(newRow.创建日期);
                    newRow.日期 = newRow.日期时间.toISOString().split('T')[0];
                }
                return newRow;
            });
            
            logInfo(`成功加载数据，共 ${this.data.length} 条记录`);
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                logError(`找不到文件：${this.filePath} (${error.message})`);
            } else {
                logError(`加载数据失败: ${error.message}\n${error.stack}`);
            }
            throw error;
        }
    }
    
    /**
     * 过滤数据
     * 
     * @param {Array} data - 原始数据数组
     * @returns {Array} - 过滤后的数据数组
     */
    filterData(data) {
        return data.filter(row => {
            // 过滤无效的应用名称
            const isValidApp = !CONFIG.filter.invalid_apps.includes(row.应用名称) &&
                              !/^[-\s|]+$/.test(row.应用名称) &&
                              row.应用名称.trim() !== '';
            
            // 过滤无效的用户
            const isValidUser = !CONFIG.filter.invalid_users.includes(row.用户) &&
                              row.用户.trim() !== '';
            
            return isValidApp && isValidUser;
        });
    }
    
    /**
     * 检查用户是否有效
     * 
     * @param {string} user - 用户名
     * @returns {boolean} - 用户是否有效
     */
    isValidUser(user) {
        return !CONFIG.filter.invalid_users.includes(user) && user.trim() !== '';
    }
    
    /**
     * 基础统计分析
     */
    analyzeBasicStats() {
        this.outputBuffer += '# 📊 风险应用运营分析报告\n';
        this.outputBuffer += `\n## 🕒 分析时间：${new Date().toISOString().replace('T', ' ').slice(0, 19)}`;
        this.outputBuffer += `\n## 📁 分析文件：${this.filePath}`;
        this.outputBuffer += '\n\n## 1️⃣ 基础统计';
        this.outputBuffer += `\n- 总记录数: ${this.data.length}`;
        
        // 计算唯一用户数
        const uniqueUsers = new Set(this.data.map(row => row.用户));
        this.outputBuffer += `\n- 唯一用户数: ${uniqueUsers.size}`;
        
        // 计算应用名称数
        const uniqueApps = new Set(this.data.map(row => row.应用名称));
        this.outputBuffer += `\n- 应用名称数: ${uniqueApps.size}`;
        
        this.outputBuffer += '\n\n### 📈 应用分布';
        
        // 应用分布统计
        const appStats = {};
        for (const row of this.data) {
            if (!appStats[row.应用名称]) {
                appStats[row.应用名称] = {
                    已安装: 0,
                    正在运行: 0
                };
            }
            appStats[row.应用名称].已安装 += 1;
            if (row.运行状态 === '正在运行') {
                appStats[row.应用名称].正在运行 += 1;
            }
        }
        
        this.outputBuffer += `\n${formatTableHeaders(['应用名称', '已安装状态数', '正在运行状态数'])}`;
        for (const [app, stats] of Object.entries(appStats)) {
            this.outputBuffer += `\n${formatTableRow([app, stats.已安装, stats.正在运行])}`;
        }
    }
    
    /**
     * 用户统计分析
     * 
     * @returns {Object} - 用户统计数据
     */
    analyzeUserStats() {
        const userStats = {};
        
        for (const row of this.data) {
            const user = row.用户;
            if (this.isValidUser(user)) {
                if (!userStats[user]) {
                    userStats[user] = {
                        安装: 0,
                        运行: 0
                    };
                }
                userStats[user].安装 += 1;
                if (row.运行状态 === '正在运行') {
                    userStats[user].运行 += 1;
                }
            }
        }
        
        this.outputBuffer += '\n\n### 👥 用户分布';
        this.outputBuffer += `\n${formatTableHeaders(CONFIG.table.headers.user_stats)}`;
        for (const [user, stats] of Object.entries(userStats)) {
            this.outputBuffer += `\n${formatTableRow([user, stats.安装, stats.运行])}`;
        }
        
        return userStats;
    }
    
    /**
     * 日期统计分析
     */
    analyzeDateStats() {
        if (!this.data[0] || !this.data[0].创建日期) {
            logWarning('数据中缺少创建日期列');
            return;
        }
        
        // 1. 按日期的用户统计
        this.outputBuffer += '\n\n## 2️⃣ 按日期的用户统计';
        
        // 按日期分组
        const dateGroups = {};
        for (const row of this.data) {
            if (!dateGroups[row.日期]) {
                dateGroups[row.日期] = [];
            }
            dateGroups[row.日期].push(row);
        }
        
        // 按日期排序
        const sortedDates = Object.keys(dateGroups).sort();
        
        this.outputBuffer += '\n\n### 📅 每日用户活动统计';
        this.outputBuffer += `\n${formatTableHeaders(CONFIG.table.headers.daily_stats)}`;
        
        for (const date of sortedDates) {
            const dateData = dateGroups[date];
            const uniqueUsers = new Set(dateData.map(row => row.用户));
            const installedCount = dateData.filter(row => row.安装状态 === '已安装').length;
            const runningCount = dateData.filter(row => row.运行状态 === '正在运行').length;
            const activeUsers = Array.from(uniqueUsers).join(', ');
            
            this.outputBuffer += `\n${formatTableRow([date, uniqueUsers.size, installedCount, runningCount, activeUsers])}`;
        }
        
        // 2. 每个日期的详细用户活动统计
        this.outputBuffer += '\n\n### 📊 每日详细用户活动统计';
        
        for (const date of sortedDates) {
            const dateData = dateGroups[date];
            this.outputBuffer += `\n\n#### 📌 ${date} 的用户活动统计`;
            
            // 按用户统计当天的活动
            const dailyUserStats = {};
            for (const row of dateData) {
                if (!dailyUserStats[row.用户]) {
                    dailyUserStats[row.用户] = {
                        已安装: 0,
                        正在运行: 0
                    };
                }
                dailyUserStats[row.用户].已安装 += 1;
                if (row.运行状态 === '正在运行') {
                    dailyUserStats[row.用户].正在运行 += 1;
                }
            }
            
            // 按安装状态数量降序排序
            const sortedDailyUsers = Object.entries(dailyUserStats).sort((a, b) => b[1].已安装 - a[1].已安装);
            
            this.outputBuffer += `\n${formatTableHeaders(CONFIG.table.headers.user_stats)}`;
            for (const [user, stats] of sortedDailyUsers) {
                if (this.isValidUser(user)) {
                    this.outputBuffer += `\n${formatTableRow([user, stats.已安装, stats.正在运行])}`;
                }
            }
        }
        
        // 3. 按用户的日期统计
        this.outputBuffer += '\n\n## 3️⃣ 按用户的日期统计';
        
        // 按用户分组
        const userGroups = {};
        for (const row of this.data) {
            if (!userGroups[row.用户]) {
                userGroups[row.用户] = [];
            }
            userGroups[row.用户].push(row);
        }
        
        this.outputBuffer += '\n\n### 📈 每用户活动日期统计';
        this.outputBuffer += `\n${formatTableHeaders(CONFIG.table.headers.user_date_stats)}`;
        
        // 按用户活动天数降序排序
        const sortedUsers = Object.entries(userGroups).sort((a, b) => {
            const aDates = new Set(a[1].map(row => row.日期));
            const bDates = new Set(b[1].map(row => row.日期));
            return bDates.size - aDates.size;
        });
        
        for (const [user, userData] of sortedUsers) {
            if (this.isValidUser(user)) {
                const uniqueDates = new Set(userData.map(row => row.日期));
                const installedCount = userData.filter(row => row.安装状态 === '已安装').length;
                const runningCount = userData.filter(row => row.运行状态 === '正在运行').length;
                const activeDates = Array.from(uniqueDates).sort().join(', ');
                const uniqueApps = new Set(userData.map(row => row.应用名称));
                const appNames = Array.from(uniqueApps).join(', ');
                
                this.outputBuffer += `\n${formatTableRow([user, uniqueDates.size, installedCount, runningCount, activeDates, appNames])}`;
            }
        }
        
        // 4. 每个用户的详细日期统计
        this.outputBuffer += '\n\n### 📊 每用户详细活动日期统计';
        
        for (const user of Object.keys(userGroups)) {
            if (this.isValidUser(user)) {
                const userData = userGroups[user];
                this.outputBuffer += `\n\n#### 👤 用户 ${user} 的日期统计`;
                
                // 按日期分组
                const userDateGroups = {};
                for (const row of userData) {
                    if (!userDateGroups[row.日期]) {
                        userDateGroups[row.日期] = [];
                    }
                    userDateGroups[row.日期].push(row);
                }
                
                // 按日期排序
                const sortedUserDates = Object.keys(userDateGroups).sort();
                
                if (sortedUserDates.length > 0) {
                    this.outputBuffer += `\n${formatTableHeaders(CONFIG.table.headers.user_detail_stats)}`;
                    
                    for (const date of sortedUserDates) {
                        const dateData = userDateGroups[date];
                        const installedCount = dateData.filter(row => row.安装状态 === '已安装').length;
                        const runningCount = dateData.filter(row => row.运行状态 === '正在运行').length;
                        const activityTimes = dateData.map(row => row.创建日期).sort().join(', ');
                        const uniqueApps = new Set(dateData.map(row => row.应用名称));
                        const appNames = Array.from(uniqueApps).join(', ');
                        
                        this.outputBuffer += `\n${formatTableRow([date, installedCount, runningCount, activityTimes, appNames])}`;
                    }
                }
            }
        }
    }
    
    /**
     * 生成可视化图表
     * 
     * @param {Object} userStats - 用户统计数据
     */
    generateVisualizations(userStats) {
        // 设置输出目录
        this.outputDir = setupOutputDirectory(this.filePath);
        
        // 注意：由于JavaScript环境限制，本实现暂时不生成实际的图表文件
        // 仅在报告中添加图表占位符
        
        this.outputBuffer += '\n\n## 4️⃣ 可视化图表';
        this.outputBuffer += '\n- 📊 应用分布图：[应用分布](app_name.png)';
        this.outputBuffer += '\n- 📈 日期活动分布图：[日期活动分布](daily_activity_pie.png)';
        this.outputBuffer += '\n- 👥 用户统计图：[用户统计](user_stats.png)';
        this.outputBuffer += '\n- 📅 每日活跃用户统计图：[每日活跃用户统计](daily_active_users.png)';
        
        logInfo('图表生成功能已预留扩展接口，可集成图表库实现实际图表生成');
    }
    
    /**
     * 生成分析报告
     */
    generateReport() {
        if (!this.outputDir) {
            this.outputDir = setupOutputDirectory(this.filePath);
        }
        
        const outputFile = path.join(this.outputDir, `${CONFIG.output.file_prefix}${extractDateFromFilename(this.filePath)}.md`);
        fs.writeFileSync(outputFile, this.outputBuffer, 'utf-8');
        logInfo(`分析报告已保存至：${outputFile}`);
    }
}

/**
 * 主函数
 */
function main() {
    // 获取命令行参数
    const args = process.argv.slice(2);
    
    // 处理帮助参数
    if (args.length > 0 && (args[0] === '-h' || args[0] === '--help')) {
        showHelp();
        return;
    }
    
    // 设置默认文件路径为上个月
    const lastMonth = getLastMonth();
    let filePath = `output/formatted-data/risk-app-formatted-data-${lastMonth}.md`;
    
    // 如果用户指定了文件路径，使用用户指定的路径
    if (args.length > 0) {
        filePath = args[0];
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
        logError(`错误: 文件不存在: ${filePath}`);
        logError('请确认文件路径是否正确，或者先运行 risk-app-format-converter.js 转换数据');
        process.exit(1);
    }
    
    try {
        // 创建分析器实例
        const analyzer = new RiskAnalyzer(filePath);
        
        // 执行分析流程
        logInfo('开始加载数据...');
        analyzer.loadData();
        
        logInfo('开始基础统计分析...');
        analyzer.analyzeBasicStats();
        
        logInfo('开始用户统计分析...');
        const userStats = analyzer.analyzeUserStats();
        
        logInfo('开始日期统计分析...');
        analyzer.analyzeDateStats();
        
        logInfo('生成可视化图表占位符...');
        analyzer.generateVisualizations(userStats);
        
        logInfo('生成分析报告...');
        analyzer.generateReport();
        
        logInfo('分析完成！');
        
    } catch (error) {
        logError(`分析失败: ${error.message}`);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = { RiskAnalyzer };
