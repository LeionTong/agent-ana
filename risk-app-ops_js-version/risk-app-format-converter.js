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
    console.log(`用法: ${scriptName} [选项] [输入文件] [输出文件]`);
    console.log();
    console.log('功能描述:');
    console.log('  将 JSON 格式的日志文件转换为 Markdown 表格格式。');
    console.log('  支持对同一用户的时间戳重复条目进行去重。');
    console.log();
    console.log('选项:');
    console.log('  -h, --help    显示此帮助信息');
    console.log();
    console.log('参数:');
    console.log('  输入文件      可选，JSON 格式的日志文件路径');
    console.log('                如果不指定，默认使用上个月的日志文件');
    console.log('                默认路径：output/raw-data/risk-app-raw-data-YYYY-MM.json');
    console.log('  输出文件      可选，输出的 Markdown 文件路径');
    console.log('                如果未指定，默认使用输入文件名，将 .json 替换为 .md');
    console.log();
    console.log('示例:');
    console.log(`  ${scriptName}`);
    console.log(`  ${scriptName} output/raw-data/risk-app-raw-data-2025-11.json`);
    console.log(`  ${scriptName} output/raw-data/risk-app-raw-data-2025-11.json output/formatted-data/risk-app-formatted-data.md`);
    console.log(`  ${scriptName} --help`);
}

/**
 * 将JSON文件转换为markdown表格格式，对风险应用运营数据中同一用户的时间戳重复条目进行去重
 * 
 * @param {string} inputFile - 输入的JSON文件路径
 * @param {string} [outputFile] - 输出的markdown文件路径，如果为null则使用输入文件名
 * @returns {boolean} - 转换是否成功
 */
function convertJsonToMdTable(inputFile, outputFile = null) {
    try {
        // 如果未指定输出文件，则使用新的命名规范
        if (!outputFile) {
            // 从输入文件名中提取日期
            const dateMatch = inputFile.match(/(\d{4}-\d{2})/);
            const date = dateMatch ? dateMatch[1] : getLastMonth();
            outputFile = `output/formatted-data/risk-app-formatted-data-${date}.md`;
        }
        
        // 读取JSON文件
        const rawData = fs.readFileSync(inputFile, 'utf-8');
        const data = JSON.parse(rawData);

        // 确保输出目录存在
        const outputDir = path.dirname(outputFile);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // 提取实体数据
        const entities = data['data']['entity'];

        let mdContent = '';

        // 根据文件类型生成不同的表格
        if (inputFile.includes('risk-log') || inputFile.includes('raw-data')) {
            // 生成风险应用运营数据的markdown表格头部
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
                
        } else if (inputFile.includes('ids-log') || inputFile.includes('ids')) {
            // 生成威胁感知日志的markdown表格头部
            mdContent = '# 威胁感知日志分析\n\n';
            mdContent += '| 时间 | 攻击IP地理信息:sip_addr | 攻击IP:attack_sip | 源端口:sport | 受害IP:alarm_sip | 目的端口:dport | 告警类型:type | 威胁名称:vuln_type | 攻击结果:host_state | 威胁级别:hazard_rating | 攻击次数:repeat_count |\n';
            mdContent += '|------|----------------|--------|--------|--------|----------|----------|----------|----------|----------|----------|\n';

            // 添加数据行（IDS日志不做去重处理）
            for (const entity of entities) {
                const fieldValues = entity['field_values'];
                const row = [
                    entity['time'],
                    fieldValues['sip_addr'] || '未知',
                    fieldValues['attack_sip'] || '未知',
                    fieldValues['sport'] || '未知',
                    fieldValues['alarm_sip'] || '未知',
                    fieldValues['dport'] || '未知',
                    fieldValues['type'] || '未知',
                    fieldValues['vuln_type'] || '未知',
                    fieldValues['host_state'] || '未知',
                    fieldValues['hazard_rating'] || '未知',
                    fieldValues['repeat_count'] || '未知'
                ];
                // 转义表格中的特殊字符
                const escapedRow = row.map(cell => String(cell).replace(/\|/g, '\\|'));
                mdContent += '| ' + escapedRow.join(' | ') + ' |\n';
            }
        } else {
            throw new Error(`不支持的文件类型: ${inputFile}`);
        }

        // 写入markdown文件
        fs.writeFileSync(outputFile, mdContent, 'utf-8');
        
        console.log(`成功将JSON转换为markdown表格，保存至: ${outputFile}`);
        return true;
        
    } catch (error) {
        console.error(`转换过程中出错: ${error.message}`);
        return false;
    }
}

// 如果直接运行该文件，则处理命令行参数
if (require.main === module) {
    const args = process.argv.slice(2);
    
    // 处理帮助参数
    if (args.length > 0 && (args[0] === '-h' || args[0] === '--help')) {
        showHelp();
        process.exit(0);
    }
    
    // 设置默认输入文件路径为上个月
    const lastMonth = getLastMonth();
    let inputFile = `output/raw-data/risk-app-raw-data-${lastMonth}.json`;
    let outputFile = null;
    
    // 解析参数
    if (args.length > 0) {
        inputFile = args[0];
    }
    if (args.length > 1) {
        outputFile = args[1];
    }
    
    // 检查输入文件是否存在
    if (!fs.existsSync(inputFile)) {
        console.error(`错误: 输入文件不存在: ${inputFile}`);
        console.error('请确认文件路径是否正确，或者先运行 risk-app-data-fetcher.js 获取日志数据');
        process.exit(1);
    }
    
    console.log(`开始转换: ${inputFile} -> ${outputFile || inputFile.replace('.json', '.md')}`);
    const success = convertJsonToMdTable(inputFile, outputFile);
    process.exit(success ? 0 : 1);
}

module.exports = { convertJsonToMdTable };