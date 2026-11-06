#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

/**
 * 显示帮助信息
 */
function showHelp() {
    const scriptName = path.basename(process.argv[1]);
    console.log(`用法: ${scriptName} [选项] [日期]`);
    console.log();
    console.log('功能描述:');
    console.log('  从日志服务器查询指定月份的风险应用使用日志。');
    console.log('  主要查询条件：');
    console.log('    - 查询来源：safeoperation_risk_01');
    console.log('    - 查询内容：风险应用包括 TeamViewer、ToDesk、向日葵');
    console.log('  查询结果将保存到 output/raw-data/risk-app-raw-data-YYYY-MM.json 文件中');
    console.log('  注意：查询范围为指定月份的1号到31号');
    console.log();
    console.log('选项:');
    console.log('  -h, --help    显示此帮助信息');
    console.log();
    console.log('参数:');
    console.log('  日期          可选，格式为 YYYY-MM，将自动使用该月第一天');
    console.log('                如果不指定，默认使用上个月');
    console.log();
    console.log('示例:');
    console.log(`  ${scriptName}`);
    console.log(`  ${scriptName} 2025-04`);
    console.log(`  ${scriptName} --help`);
    process.exit(0);
}

/**
 * 验证日期格式
 * @param {string} dateStr - 日期字符串
 * @returns {boolean} - 格式是否正确
 */
function validateDateFormat(dateStr) {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) || /^\d{4}-\d{2}$/.test(dateStr);
}

/**
 * 格式化日期
 * @param {string} dateStr - 日期字符串
 * @returns {Date} - 格式化后的日期对象
 */
function formatDate(dateStr) {
    if (/^\d{4}-\d{2}$/.test(dateStr)) {
        // YYYY-MM 格式，添加 -01 作为日期
        return new Date(`${dateStr}-01`);
    }
    return new Date(dateStr);
}

/**
 * 格式化日期为 YYYY-MM 格式
 * @param {Date} date - 日期对象
 * @returns {string} - 格式化后的日期字符串
 */
function formatMonth(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

/**
 * 获取上个月的 YYYY-MM 格式
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
 * 获取月份的第一天
 * @param {Date} date - 日期对象
 * @returns {string} - YYYY-MM-01 格式的日期字符串
 */
function getMonthStart(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
}

/**
 * 获取月份的最后一天
 * @param {Date} date - 日期对象
 * @returns {string} - YYYY-MM-31 格式的日期字符串
 */
function getMonthEnd(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-31`;
}

/**
 * 发送 HTTP POST 请求
 * @param {string} url - 请求URL
 * @param {Object} data - 请求数据
 * @returns {Promise<Object>} - 响应数据
 */
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

/**
 * 主函数
 */
async function main() {
    // 处理命令行参数，检查是否需要显示帮助
    const args = process.argv.slice(2);
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '-h' || arg === '--help') {
            showHelp();
            return; // 显示帮助后直接返回
        }
    }
    
    try {
        // 设置默认日期为上月
        let dateStr = getLastMonth();
        
        // 处理命令行参数
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (validateDateFormat(arg)) {
                dateStr = arg;
            } else {
                console.error('❌ 错误：日期格式不正确，请使用 YYYY-MM-DD 或 YYYY-MM 格式');
                console.error('使用 -h 或 --help 查看帮助信息');
                process.exit(1);
            }
        }
        
        // 格式化日期
        const date = formatDate(dateStr);
        
        // 提取年月信息
        const month = formatMonth(date);
        const monthStart = getMonthStart(date);
        const monthEnd = getMonthEnd(date);
        
        // 确保输出目录存在
        const outputDir = path.join(process.cwd(), 'output', 'raw-data');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // 设置输出文件路径
        const outputFile = path.join(outputDir, `risk-app-raw-data-${month}.json`);
        
        // 构建请求数据
        const requestData = {
            indexName: 'logfmt_761_*',
            searchMessage: '',
            inKey: 'safeoperation_risk_01',
            beginTime: `${monthStart} 00:00:00`,
            endTime: `${monthEnd} 23:59:59`,
            timestamp: '',
            offset: '',
            pageSize: 10000,
            fields: [
                { key: 'risk_app_name', value: 'TeamViewer', relation: 4 },
                { key: 'risk_app_name', value: 'ToDesk', relation: 4 },
                { key: 'risk_app_name', value: '向日葵', relation: 4 }
            ]
        };
        
        // 发送 HTTP 请求
        const responseData = await httpPost('http://203.0.113.20:7777/wsg-log-server/v1/LogSearchController/queryLogFromEs', requestData);
        
        // 将响应数据保存到文件
        fs.writeFileSync(outputFile, JSON.stringify(responseData, null, 2), 'utf-8');
        
        console.log(`成功获取 ${month} 的风险应用运营数据，保存至 ${outputFile}`);
        process.exit(0);
        
    } catch (error) {
        console.error(`错误：${error.message}`);
        process.exit(1);
    }
}

// 如果直接运行此脚本，则执行主函数
if (require.main === module) {
    main();
}

module.exports = { main, showHelp, validateDateFormat, formatDate, formatMonth, getLastMonth, getMonthStart, getMonthEnd, httpPost };