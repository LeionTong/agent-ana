#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const chalk = require('chalk');

/**
 * 风险应用运营分析工具
 * 完整复现：原始数据获取 → 数据处理 → 分析报告
 * 支持ES直接查询、格式转换和统计分析
 */
class RiskAppOperationAnalyzer {
    constructor(options = {}) {
        this.esHost = options.esHost || 'http://203.0.113.10:9200';
        this.username = options.username || 'sec_read';
        this.password = options.password || 'changeme';
        this.riskApps = ['TeamViewer', 'ToDesk', '向日葵'];
        
        // 构建认证头
        if (this.username && this.password) {
            const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
            this.authHeader = `Basic ${credentials}`;
        } else {
            this.authHeader = '';
        }
        
        // 输出目录配置
        this.outputDirs = {
            raw: 'output/raw-data',
            formatted: 'output/formatted-data', 
            reports: 'output/analysis-reports'
        };
    }

    /**
     * 显示帮助信息
     */
    showHelp() {
        console.log(chalk.cyan('=== 风险应用运营分析工具 ==='));
        console.log();
        console.log(chalk.yellow('功能描述:'));
        console.log('  完整复现"原始数据获取 → 数据处理 → 分析报告"业务能力');
        console.log('  支持ES直接查询、格式转换和统计分析');
        console.log('  输出格式与现有脚本保持完全一致');
        console.log();
        console.log(chalk.yellow('用法:'));
        console.log('  node risk-app-operation-analyzer.js [选项] [年-月]');
        console.log();
        console.log(chalk.yellow('选项:'));
        console.log('  -h, --help          显示此帮助信息');
        console.log('  -a, --all           执行完整工作流程 (数据获取→转换→分析)');
        console.log('  -f, --fetch         仅执行数据获取');
        console.log('  -c, --convert       仅执行格式转换');
        console.log('  -r, --report        仅执行分析报告');
        console.log('  -t, --type TYPE     查询类型: basic|scroll|agg (默认: basic)');
        console.log('  -s, --size SIZE     结果大小限制 (默认: 10000)');
        console.log('  -o, --output DIR    输出目录 (默认: ./output)');
        console.log('  -H, --host HOST     ES服务器地址 (默认: http://203.0.113.10:9200)');
        console.log('  -u, --username USER ES用户名 (默认: sec_read)');
        console.log('  -p, --password PASS ES密码 (默认: changeme)');
        console.log();
        console.log(chalk.yellow('参数:'));
        console.log('  年-月               可选，格式为 YYYY-MM');
        console.log('                     如果不指定，默认使用上个月份');
        console.log();
        console.log(chalk.yellow('示例:'));
        console.log('  node risk-app-operation-analyzer.js --all                    # 执行完整流程');
        console.log('  node risk-app-operation-analyzer.js --fetch                  # 仅获取数据');
        console.log('  node risk-app-operation-analyzer.js --convert                # 仅转换格式');
        console.log('  node risk-app-operation-analyzer.js --report                 # 仅生成报告');
        console.log('  node risk-app-operation-analyzer.js 2025-11                  # 指定月份');
        console.log('  node risk-app-operation-analyzer.js --all --size 1000 2025-10');
    }

    /**
     * 验证年月格式
     * @param {string} yearMonthStr - 年月字符串
     * @returns {boolean} - 格式是否正确
     */
    validateYearMonthFormat(yearMonthStr) {
        return /^\d{4}-\d{2}$/.test(yearMonthStr);
    }
    
    /**
     * 确保输出目录存在
     */
    ensureOutputDirectories() {
        Object.values(this.outputDirs).forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    /**
     * 获取上个月的YYYY-MM格式
     */
    getLastMonth() {
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
     * 获取月份的第一天
     * @param {Date} date - 日期对象
     * @returns {string} - YYYY-MM-01格式的日期字符串
     */
    getMonthStart(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}-01`;
    }
    
    /**
     * 获取月份的最后一天
     * @param {Date} date - 日期对象
     * @returns {string} - YYYY-MM-31格式的日期字符串
     */
    getMonthEnd(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}-31`;
    }

    /**
     * 解析年月参数
     * @param {string} yearMonthStr - 年月字符串
     * @returns {Object} - 解析结果
     */
    parseYearMonth(yearMonthStr) {
        if (!yearMonthStr) {
            const now = new Date();
            // 获取上个月份
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return {
                year: lastMonth.getFullYear(),
                month: lastMonth.getMonth() + 1,
                yearMonth: `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`
            };
        }

        const [year, month] = yearMonthStr.split('-').map(Number);
        return {
            year,
            month,
            yearMonth: yearMonthStr
        };
    }

    /**
     * 获取月份范围
     * @param {number} year - 年份
     * @param {number} month - 月份
     * @returns {Object} - 月份范围
     */
    getMonthRange(year, month) {
        // 使用month-1，因为JavaScript的Date构造函数中月份从0开始
        const startDate = new Date(year, month - 1, 1);
        // 获取下个月的第一天，然后减去1毫秒得到当月最后一天
        const endDate = new Date(year, month, 1);
        const lastDayOfMonth = new Date(endDate.getTime() - 1);
        
        return {
            start: startDate.toISOString().split('T')[0],
            end: lastDayOfMonth.toISOString().split('T')[0],
            startTime: `${startDate.toISOString().split('T')[0]}T00:00:00`,
            endTime: `${lastDayOfMonth.toISOString().split('T')[0]}T23:59:59`
        };
    }

    /**
     * 生成索引模式
     * @param {number} year - 年份
     * @param {number} month - 月份
     * @returns {string} - 索引模式
     */
    getIndexPattern(year, month) {
        return `logfmt_761_${year}${String(month).padStart(2, '0')}*`;
    }

    /**
     * 构建基本查询体
     * @param {Object} monthRange - 月份范围
     * @param {number} size - 结果大小
     * @returns {Object} - 查询体
     */
    buildBasicQuery(monthRange, size = 100) {
        return {
            query: {
                bool: {
                    must: [
                        {
                            terms: {
                                'field_values.risk_app_name': this.riskApps
                            }
                        },
                        {
                            range: {
                                timestamp: {
                                    gte: monthRange.startTime,
                                    lte: monthRange.endTime
                                }
                            }
                        }
                    ]
                }
            },
            sort: [
                {
                    timestamp: {
                        order: 'desc'
                    }
                }
            ],
            size: size
        };
    }

    /**
     * 构建聚合查询体
     * @param {Object} monthRange - 月份范围
     * @returns {Object} - 聚合查询体
     */
    buildAggregationQuery(monthRange) {
        return {
            query: {
                bool: {
                    filter: [
                        {
                            range: {
                                timestamp: {
                                    gte: monthRange.startTime,
                                    lte: monthRange.endTime
                                }
                            }
                        }
                    ]
                }
            },
            aggs: {
                risk_apps: {
                    terms: {
                        field: 'field_values.risk_app_name',
                        size: 50
                    }
                },
                daily_counts: {
                    date_histogram: {
                        field: 'timestamp',
                        calendar_interval: '1d',
                        format: 'yyyy-MM-dd'
                    }
                },
                hourly_counts: {
                    date_histogram: {
                        field: 'timestamp',
                        calendar_interval: '1h',
                        format: 'yyyy-MM-dd HH:mm'
                    }
                }
            },
            size: 0
        };
    }

    /**
     * 发送HTTP请求到ES
     * @param {string} url - 请求URL
     * @param {Object} data - 请求数据
     * @returns {Promise<Object>} - 响应数据
     */
    async httpRequest(url, data) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const client = isHttps ? https : http;
            
            const postData = JSON.stringify(data);
            
            const headers = {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            };
            
            // 添加认证头（如果配置了用户名和密码）
            if (this.authHeader) {
                headers['Authorization'] = this.authHeader;
            }
            
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname,
                method: 'POST',
                headers: headers,
                timeout: 30000
            };
            
            const req = client.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
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
            
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('请求超时'));
            });
            
            req.write(postData);
            req.end();
        });
    }

    /**
     * 执行基本查询
     * @param {Object} params - 查询参数
     * @returns {Promise<Object>} - 查询结果
     */
    async queryBasic(params) {
        const { year, month, size } = params;
        const monthRange = this.getMonthRange(year, month);
        const indexPattern = this.getIndexPattern(year, month);
        const queryBody = this.buildBasicQuery(monthRange, size);
        
        console.log(chalk.blue(`🔍 查询 ${year}年${month}月 的数据...`));
        console.log(chalk.gray(`索引模式: ${indexPattern}`));
        
        const searchUrl = `${this.esHost}/${indexPattern}/_search`;
        
        try {
            const result = await this.httpRequest(searchUrl, queryBody);
            
            console.log(chalk.green(`✅ 查询成功!`));
            console.log(chalk.yellow(`找到 ${result.hits.total.value} 条记录`));
            console.log(chalk.yellow(`返回 ${result.hits.hits.length} 条数据`));
            
            return {
                success: true,
                data: result,
                info: {
                    total: result.hits.total.value,
                    returned: result.hits.hits.length,
                    monthRange: monthRange,
                    indexPattern: indexPattern
                }
            };
        } catch (error) {
            console.log(chalk.red(`❌ 查询失败: ${error.message}`));
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 执行聚合查询
     * @param {Object} params - 查询参数
     * @returns {Promise<Object>} - 查询结果
     */
    async queryAggregation(params) {
        const { year, month } = params;
        const monthRange = this.getMonthRange(year, month);
        const indexPattern = this.getIndexPattern(year, month);
        const queryBody = this.buildAggregationQuery(monthRange);
        
        console.log(chalk.blue(`📊 查询 ${year}年${month}月 的聚合统计...`));
        console.log(chalk.gray(`索引模式: ${indexPattern}`));
        
        const searchUrl = `${this.esHost}/${indexPattern}/_search`;
        
        try {
            const result = await this.httpRequest(searchUrl, queryBody);
            
            console.log(chalk.green(`✅ 聚合查询成功!`));
            
            // 显示聚合结果
            const aggs = result.aggregations;
            if (aggs) {
                console.log(chalk.cyan('\n📈 风险应用统计:'));
                aggs.risk_apps.buckets.forEach(bucket => {
                    console.log(chalk.white(`  ${bucket.key}: ${bucket.doc_count} 次`));
                });
                
                console.log(chalk.cyan('\n📅 每日统计 (前10天):'));
                aggs.daily_counts.buckets.slice(0, 10).forEach(bucket => {
                    console.log(chalk.white(`  ${bucket.key}: ${bucket.doc_count} 次`));
                });
            }
            
            return {
                success: true,
                data: result,
                info: {
                    monthRange: monthRange,
                    indexPattern: indexPattern,
                    aggregations: result.aggregations
                }
            };
        } catch (error) {
            console.log(chalk.red(`❌ 聚合查询失败: ${error.message}`));
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 保存查询结果
     * @param {Object} result - 查询结果
     * @param {string} outputDir - 输出目录
     * @param {string} yearMonth - 年月字符串
     * @param {string} queryType - 查询类型
     * @returns {string} - 保存的文件路径
     */
    saveResult(result, outputDir, yearMonth, queryType) {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `es-${queryType}-query-${yearMonth}-${timestamp}.json`;
        const filepath = path.join(outputDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(result, null, 2), 'utf-8');
        
        return filepath;
    }

    /**
     * 主执行函数
     * @param {Array} args - 命令行参数
     */
    async run(args) {
        let yearMonth = null;
        let workflow = 'all'; // all, fetch, convert, report
        let size = 10000;
        let outputDir = './output';
        let esHost = 'http://203.0.113.10:9200';
        let username = '';
        let password = '';
        
        // 解析命令行参数
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            
            if (arg === '-h' || arg === '--help') {
                this.showHelp();
                return;
            } else if (arg === '-a' || arg === '--all') {
                workflow = 'all';
            } else if (arg === '-f' || arg === '--fetch') {
                workflow = 'fetch';
            } else if (arg === '-c' || arg === '--convert') {
                workflow = 'convert';
            } else if (arg === '-r' || arg === '--report') {
                workflow = 'report';
            } else if (arg === '-s' || arg === '--size') {
                size = parseInt(args[++i]);
            } else if (arg === '-o' || arg === '--output') {
                outputDir = args[++i];
            } else if (arg === '-H' || arg === '--host') {
                esHost = args[++i];
            } else if (arg === '-u' || arg === '--username') {
                username = args[++i];
            } else if (arg === '-p' || arg === '--password') {
                password = args[++i];
            } else if (this.validateYearMonthFormat(arg)) {
                yearMonth = arg;
            }
        }
        
        // 更新ES连接参数
        this.esHost = esHost;
        if (username && password) {
            const credentials = Buffer.from(`${username}:${password}`).toString('base64');
            this.authHeader = `Basic ${credentials}`;
        } else {
            // 使用默认认证信息
            const credentials = Buffer.from('sec_read:changeme').toString('base64');
            this.authHeader = `Basic ${credentials}`;
        }
        
        // 解析年月
        const { year, month, yearMonth: formattedYearMonth } = this.parseYearMonth(yearMonth);
        
        // 确保输出目录存在
        this.ensureOutputDirectories();
        
        console.log(chalk.cyan(`\n🎯 风险应用运营数据分析工具`));
        console.log(chalk.gray(`工作流程: ${workflow}`));
        console.log(chalk.gray(`年月: ${formattedYearMonth}`));
        console.log(chalk.gray(`输出目录: ${outputDir}`));
        console.log(chalk.gray(`ES地址: ${esHost}`));
        if (username) {
            console.log(chalk.gray(`认证用户: ${username}`));
        } else {
            console.log(chalk.gray(`认证用户: sec_read (默认)`));
        }
        console.log();
        
        try {
            switch (workflow) {
                case 'fetch':
                    await this.fetchData(year, month, formattedYearMonth, size);
                    break;
                case 'convert':
                    await this.convertData(formattedYearMonth);
                    break;
                case 'report':
                    await this.generateReport(formattedYearMonth);
                    break;
                case 'all':
                default:
                    await this.executeFullWorkflow(year, month, formattedYearMonth, size);
                    break;
            }
        } catch (error) {
            console.log(chalk.red(`\n❌ 执行失败: ${error.message}`));
            process.exit(1);
        }
        
        console.log(chalk.green('\n✅ 操作完成!'));
    }

    /**
     * 执行完整工作流程
     * @param {number} year - 年份
     * @param {number} month - 月份
     * @param {string} yearMonth - 格式化年月
     * @param {number} size - 结果大小限制
     */
    async executeFullWorkflow(year, month, yearMonth, size = 10000) {
        console.log(chalk.cyan('📊 开始执行完整工作流程'));
        console.log(chalk.gray('步骤: 数据获取 → 格式转换 → 分析报告'));
        console.log();

        // 步骤1: 数据获取
        console.log(chalk.yellow('步骤 1/3: 数据获取...'));
        await this.fetchData(year, month, yearMonth, size);
        
        // 步骤2: 格式转换
        console.log(chalk.yellow('\n步骤 2/3: 格式转换...'));
        await this.convertData(yearMonth);
        
        // 步骤3: 分析报告
        console.log(chalk.yellow('\n步骤 3/3: 分析报告...'));
        await this.generateReport(yearMonth);
        
        console.log(chalk.green('\n🎉 完整工作流程执行完成!'));
        console.log(chalk.gray('📁 生成的文件:'));
        console.log(chalk.gray(`   - 分析报告: output/analysis-reports/risk-app-analysis-report-${yearMonth}.md`));
        console.log(chalk.gray(`   - 格式数据: output/formatted-data/risk-app-formatted-data-${yearMonth}.md`));
        console.log(chalk.gray(`   - 原始数据: output/raw-data/risk-app-raw-data-${yearMonth}.json`));
    }

    /**
     * 数据获取
     * @param {number} year - 年份
     * @param {number} month - 月份
     * @param {string} yearMonth - 格式化年月
     * @param {number} size - 结果大小限制
     */
    async fetchData(year, month, yearMonth, size = 10000) {
        const date = new Date(year, month - 1, 1);
        const monthStart = this.getMonthStart(date);
        const monthEnd = this.getMonthEnd(date);

        // 设置输出文件路径
        const outputFile = path.join(this.outputDirs.raw, `risk-app-raw-data-${yearMonth}.json`);

        // 构建请求数据
        const requestData = {
            indexName: 'logfmt_761_*',
            searchMessage: '',
            inKey: 'safeoperation_risk_01',
            beginTime: `${monthStart} 00:00:00`,
            endTime: `${monthEnd} 23:59:59`,
            timestamp: '',
            offset: '',
            pageSize: size,
            fields: [
                { key: 'risk_app_name', value: 'TeamViewer', relation: 4 },
                { key: 'risk_app_name', value: 'ToDesk', relation: 4 },
                { key: 'risk_app_name', value: '向日葵', relation: 4 }
            ]
        };

        try {
            // 发送HTTP请求到日志服务器
            const responseData = await this.httpPost('http://203.0.113.20:7777/wsg-log-server/v1/LogSearchController/queryLogFromEs', requestData);
            
            // 将响应数据保存到文件
            fs.writeFileSync(outputFile, JSON.stringify(responseData, null, 2), 'utf-8');
            
            console.log(chalk.green(`✅ 成功获取 ${yearMonth} 的风险应用运营数据，保存至 ${outputFile}`));
            
        } catch (error) {
            console.error(chalk.red(`❌ 数据获取失败: ${error.message}`));
            throw error;
        }
    }

    /**
     * 数据转换 (JSON → Markdown表格)
     * @param {string} yearMonth - 格式化年月
     */
    async convertData(yearMonth) {
        const inputFile = path.join(this.outputDirs.raw, `risk-app-raw-data-${yearMonth}.json`);
        const outputFile = path.join(this.outputDirs.formatted, `risk-app-formatted-data-${yearMonth}.md`);

        try {
            // 检查输入文件是否存在
            if (!fs.existsSync(inputFile)) {
                throw new Error(`输入文件不存在: ${inputFile}`);
            }

            // 读取JSON文件
            const rawData = fs.readFileSync(inputFile, 'utf-8');
            const data = JSON.parse(rawData);

            // 提取实体数据
            const entities = data['data']['entity'];

            let mdContent = '';

            // 生成风险应用运营数据的markdown表格
            mdContent = '# 风险应用运营数据格式化\n\n';
            mdContent += '| 创建日期 | 应用名称 | 应用版本 | 应用类型 | 安装状态 | 运行状态 | 风险等级 | 用户 |\n';
            mdContent += '|------|----------|----------|----------|----------|----------|----------|------|\n';

            // 使用对象存储每个用户的最新记录
            const userRecords = {};
            
            // 首先按create_date排序
            const sortedEntities = [...entities].sort((a, b) => {
                return a['field_values']['create_date'].localeCompare(b['field_values']['create_date']);
            });
            
            // 添加数据行，对同一用户的create_date重复条目进行去重
            for (const entity of sortedEntities) {
                const fieldValues = entity['field_values'];
                const user = fieldValues['user'];
                const createDate = fieldValues['create_date'];
                
                // 如果该用户在该createDate下已有记录，则跳过
                if (!userRecords[user]) {
                    userRecords[user] = {};
                }
                if (userRecords[user][createDate]) {
                    continue;
                }
                    
                // 记录该用户在该createDate下的数据
                userRecords[user][createDate] = entity;
                
                const row = [
                    fieldValues['create_date'],
                    fieldValues['risk_app_name'],
                    fieldValues['risk_app_version'],
                    fieldValues['app_version_type'],
                    fieldValues['risk_app_install'],
                    fieldValues['risk_app_run'],
                    fieldValues['risk_app_level'],
                    user
                ];
                // 转义表格中的特殊字符
                const escapedRow = row.map(cell => String(cell).replace(/\|/g, '\\|'));
                mdContent += '| ' + escapedRow.join(' | ') + ' |\n';
            }

            // 写入markdown文件
            fs.writeFileSync(outputFile, mdContent, 'utf-8');
            
            console.log(chalk.green(`✅ 成功转换数据，保存至 ${outputFile}`));
            
        } catch (error) {
            console.error(chalk.red(`❌ 数据转换失败: ${error.message}`));
            throw error;
        }
    }

    /**
     * 生成分析报告
     * @param {string} yearMonth - 格式化年月
     */
    async generateReport(yearMonth) {
        const inputFile = path.join(this.outputDirs.formatted, `risk-app-formatted-data-${yearMonth}.md`);
        const outputFile = path.join(this.outputDirs.reports, `risk-app-analysis-report-${yearMonth}.md`);

        try {
            // 检查输入文件是否存在
            if (!fs.existsSync(inputFile)) {
                throw new Error(`输入文件不存在: ${inputFile}`);
            }

            // 读取markdown文件
            const mdContent = fs.readFileSync(inputFile, 'utf-8');
            
            // 提取表格数据
            const tableData = this.parseMarkdownTable(mdContent);
            
            // 生成分析报告
            const reportContent = this.generateAnalysisReport(tableData, yearMonth);
            
            // 写入报告文件
            fs.writeFileSync(outputFile, reportContent, 'utf-8');
            
            console.log(chalk.green(`✅ 成功生成分析报告，保存至 ${outputFile}`));
            
        } catch (error) {
            console.error(chalk.red(`❌ 报告生成失败: ${error.message}`));
            throw error;
        }
    }

    /**
     * 解析Markdown表格数据
     * @param {string} mdContent - Markdown内容
     * @returns {Array} - 表格数据数组
     */
    parseMarkdownTable(mdContent) {
        const lines = mdContent.split('\n');
        const dataLines = lines.filter(line => line.startsWith('|') && !line.includes('---') && !line.includes('创建日期'));
        
        return dataLines.map(line => {
            const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell.length > 0);
            return {
                createDate: cells[0],
                appName: cells[1],
                appVersion: cells[2],
                appType: cells[3],
                installStatus: cells[4],
                runStatus: cells[5],
                riskLevel: cells[6],
                user: cells[7]
            };
        });
    }

    /**
     * 生成分析报告内容
     * @param {Array} data - 解析后的数据
     * @param {string} yearMonth - 格式化年月
     * @returns {string} - 报告内容
     */
    generateAnalysisReport(data, yearMonth) {
        // 基础统计
        const totalRecords = data.length;
        const uniqueUsers = new Set(data.map(item => item.user)).size;
        const uniqueApps = new Set(data.map(item => item.appName)).size;
        
        // 应用统计
        const appStats = {};
        data.forEach(item => {
            if (!appStats[item.appName]) {
                appStats[item.appName] = { install: 0, run: 0 };
            }
            if (item.installStatus === '已安装') appStats[item.appName].install++;
            if (item.runStatus === '正在运行') appStats[item.appName].run++;
        });
        
        // 用户统计
        const userStats = {};
        data.forEach(item => {
            if (!userStats[item.user]) {
                userStats[item.user] = { install: 0, run: 0 };
            }
            if (item.installStatus === '已安装') userStats[item.user].install++;
            if (item.runStatus === '正在运行') userStats[item.user].run++;
        });
        
        // 按日期统计
        const dateStats = {};
        data.forEach(item => {
            const date = item.createDate.split(' ')[0]; // 只取日期部分
            if (!dateStats[date]) {
                dateStats[date] = {
                    activeUsers: new Set(),
                    install: 0,
                    run: 0,
                    users: {}
                };
            }
            dateStats[date].activeUsers.add(item.user);
            if (item.installStatus === '已安装') dateStats[date].install++;
            if (item.runStatus === '正在运行') dateStats[date].run++;
            
            if (!dateStats[date].users[item.user]) {
                dateStats[date].users[item.user] = { install: 0, run: 0 };
            }
            if (item.installStatus === '已安装') dateStats[date].users[item.user].install++;
            if (item.runStatus === '正在运行') dateStats[date].users[item.user].run++;
        });
        
        // 按用户统计
        const userDateStats = {};
        data.forEach(item => {
            const date = item.createDate.split(' ')[0];
            const user = item.user;
            
            if (!userDateStats[user]) {
                userDateStats[user] = {
                    install: 0,
                    run: 0,
                    dates: {},
                    apps: new Set()
                };
            }
            
            if (!userDateStats[user].dates[date]) {
                userDateStats[user].dates[date] = { install: 0, run: 0, times: [] };
            }
            
            if (item.installStatus === '已安装') {
                userDateStats[user].dates[date].install++;
                userDateStats[user].install++;
            }
            if (item.runStatus === '正在运行') {
                userDateStats[user].dates[date].run++;
                userDateStats[user].run++;
            }
            
            userDateStats[user].dates[date].times.push(item.createDate);
            userDateStats[user].apps.add(item.appName);
        });
        
        // 生成报告
        let report = `# 📊 风险应用运营分析报告\n\n`;
        report += `## 🕒 分析时间：${new Date().toLocaleString()}\n`;
        report += `## 📁 分析文件：output/formatted-data/risk-app-formatted-data-${yearMonth}.md\n\n`;
        
        report += `## 1️⃣ 基础统计\n`;
        report += `- 总记录数: ${totalRecords}\n`;
        report += `- 唯一用户数: ${uniqueUsers}\n`;
        report += `- 应用名称数: ${uniqueApps}\n\n`;
        
        report += `### 📈 应用分布\n`;
        report += `| 应用名称 | 已安装状态数 | 正在运行状态数 |\n`;
        report += `|---|---|---|\n`;
        Object.entries(appStats).forEach(([app, stats]) => {
            report += `| ${app} | ${stats.install} | ${stats.run} |\n`;
        });
        
        report += `\n### 👥 用户分布\n`;
        report += `| 用户 | 已安装状态数 | 正在运行状态数 |\n`;
        report += `|---|---|---|\n`;
        Object.entries(userStats).forEach(([user, stats]) => {
            report += `| ${user} | ${stats.install} | ${stats.run} |\n`;
        });
        
        // 2️⃣ 按日期的用户统计
        report += `\n## 2️⃣ 按日期的用户统计\n\n`;
        
        report += `### 📅 每日用户活动统计\n`;
        report += `| 日期 | 活跃用户数 | 已安装状态数 | 正在运行状态数 | 活跃用户 |\n`;
        report += `|---|---|---|---|---|\n`;
        
        const sortedDates = Object.keys(dateStats).sort();
        sortedDates.forEach(date => {
            const stats = dateStats[date];
            const activeUsers = Array.from(stats.activeUsers).join(', ');
            report += `| ${date} | ${stats.activeUsers.size} | ${stats.install} | ${stats.run} | ${activeUsers} |\n`;
        });
        
        report += `\n### 📊 每日详细用户活动统计\n`;
        sortedDates.forEach(date => {
            const stats = dateStats[date];
            report += `\n#### 📌 ${date} 的用户活动统计\n`;
            report += `| 用户 | 已安装状态数 | 正在运行状态数 |\n`;
            report += `|---|---|---|\n`;
            Object.entries(stats.users).forEach(([user, userStats]) => {
                report += `| ${user} | ${userStats.install} | ${userStats.run} |\n`;
            });
        });
        
        // 3️⃣ 按用户的日期统计
        report += `\n## 3️⃣ 按用户的日期统计\n\n`;
        
        report += `### 📈 每用户活动日期统计\n`;
        report += `| 用户 | 活跃天数 | 已安装状态数 | 正在运行状态数 | 活动日期 | 应用名称 |\n`;
        report += `|---|---|---|---|---|---|\n`;
        
        Object.entries(userDateStats).forEach(([user, stats]) => {
            const activeDays = Object.keys(stats.dates).length;
            const activeDates = Object.keys(stats.dates).sort().join(', ');
            const apps = Array.from(stats.apps).join(', ');
            report += `| ${user} | ${activeDays} | ${stats.install} | ${stats.run} | ${activeDates} | ${apps} |\n`;
        });
        
        report += `\n### 📊 每用户详细活动日期统计\n`;
        Object.entries(userDateStats).forEach(([user, stats]) => {
            report += `\n#### 👤 用户 ${user} 的日期统计\n`;
            report += `| 日期 | 已安装状态数 | 正在运行状态数 | 活动时间 | 应用名称 |\n`;
            report += `|---|---|---|---|---|\n`;
            
            Object.entries(stats.dates).forEach(([date, dateStats]) => {
                const times = dateStats.times.join(', ');
                const apps = Array.from(stats.apps).join(', ');
                report += `| ${date} | ${dateStats.install} | ${dateStats.run} | ${times} | ${apps} |\n`;
            });
        });
        
        // 4️⃣ 可视化图表
        report += `\n## 4️⃣ 可视化图表\n`;
        report += `- 📊 应用分布图：[应用分布](app_name.png)\n`;
        report += `- 📈 日期活动分布图：[日期活动分布](daily_activity_pie.png)\n`;
        report += `- 👥 用户统计图：[用户统计](user_stats.png)\n`;
        report += `- 📅 每日活跃用户统计图：[每日活跃用户统计](daily_active_users.png)\n`;
        
        return report;
    }

    /**
     * HTTP POST请求
     * @param {string} url - 请求URL
     * @param {Object} data - 请求数据
     * @returns {Promise<Object>} - 响应数据
     */
    httpPost(url, data) {
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
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
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
}

// 主程序入口
async function main() {
    const esQuery = new RiskAppOperationAnalyzer();
    await esQuery.run(process.argv.slice(2));
}

// 如果直接运行此脚本，则执行主函数
if (require.main === module) {
    main();
}

module.exports = RiskAppOperationAnalyzer;