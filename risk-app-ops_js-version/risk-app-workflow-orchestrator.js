#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * 显示帮助信息
 */
function showHelp() {
    const scriptName = path.basename(process.argv[1]);
    console.log(`用法: npm run aio [选项] [日期]`);
    console.log();
    console.log('功能描述:');
    console.log('  执行风险应用运营分析的完整工作流程');
    console.log('  包括: 获取日志 -> 转换为Markdown -> 分析报告');
    console.log();
    console.log('选项:');
    console.log('  -h, --help    显示此帮助信息');
    console.log();
    console.log('参数:');
    console.log('  日期          可选，格式为 YYYY-MM，将处理该月份');
    console.log('                如果不指定，默认使用上个月');
    console.log();
    console.log('示例:');
    console.log(`  npm run aio`);
    console.log(`  npm run aio 2025-04`);
    console.log(`  npm run aio --help`);
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
 * 执行命令
 */
function runCommand(command, args, description) {
    return new Promise((resolve, reject) => {
        console.log(`\n🚀 ${description}...`);
        
        const child = spawn(command, args, {
            stdio: 'inherit',
            shell: true,
            cwd: process.cwd()
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ ${description} 完成`);
                resolve();
            } else {
                console.error(`❌ ${description} 失败，退出码: ${code}`);
                reject(new Error(`${description} 失败，退出码: ${code}`));
            }
        });
        
        child.on('error', (error) => {
            console.error(`❌ ${description} 执行出错: ${error.message}`);
            reject(error);
        });
    });
}

/**
 * 等待用户按键继续
 */
function waitForKey() {
    return new Promise((resolve) => {
        process.stdout.write('\n按回车键继续...');
        process.stdin.setEncoding('utf8');
        process.stdin.once('data', () => {
            resolve();
        });
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
    
    console.log('🎯 开始执行风险应用运营分析完整工作流程');
    console.log('=' * 60);
    
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
        const month = formatMonth(date);
        
        console.log(`📅 目标日期: ${dateStr} (月份: ${month})`);
        
        // 步骤 1: 获取风险应用运营数据
        await runCommand('node', ['risk-app-data-fetcher.js', dateStr], `获取 ${dateStr} 的风险应用运营数据`);
        
        // 等待用户确认
        await waitForKey();
        
        // 步骤 2: 将 JSON 转换为 Markdown 表格
        const jsonFile = path.join('output', 'raw-data', `risk-app-raw-data-${month}.json`);
        const mdFile = path.join('output', 'formatted-data', `risk-app-formatted-data-${month}.md`);
        
        // 检查 JSON 文件是否存在
        if (!fs.existsSync(jsonFile)) {
            console.error(`❌ JSON 文件不存在: ${jsonFile}`);
            process.exit(1);
        }
        
        await runCommand('node', ['risk-app-format-converter.js', jsonFile], '将 JSON 转换为 Markdown 表格');
        
        // 等待用户确认
        await waitForKey();
        
        // 步骤 3: 分析风险应用运营数据
        await runCommand('node', ['risk-app-report-generator.js', mdFile], '分析风险应用运营数据');
        
        console.log('\n🎉 完整工作流程执行完成！');
        console.log('📁 生成的文件:');
        console.log(`   - 分析报告: output/analysis-reports/risk-app-analysis-report-${month}.md`);
        console.log(`   - 格式数据: ${mdFile}`);
        console.log(`   - 原始数据: ${jsonFile}`);
        
        // 自动退出程序
        setTimeout(() => {
            process.exit(0);
        }, 1000); // 等待1秒后退出，让用户能看到完成信息
        
    } catch (error) {
        console.error(`\n❌ 工作流程执行失败: ${error.message}`);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}
