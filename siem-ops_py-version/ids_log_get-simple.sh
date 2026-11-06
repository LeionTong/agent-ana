#!/bin/bash

# 显示帮助信息的函数
show_help() {
    echo "用法: $(basename "$0") [选项] [日期]"
    echo
    echo "功能描述:"
    echo "  从Elasticsearch查询指定日期的IDS日志数据。"
    echo "  主要查询条件："
    echo "    - 查询来源：logfmt_746_YYYYMMDD"
    echo '    - 查询内容：sip_addr不包含"局域网"，且host_state包含"攻击成功"和"失陷"的记录'
    echo '    - 对应IDS筛选条件：attack_dimension = "外部攻击" AND host_state IN ("攻击成功", "失陷")'
    echo "  查询结果将保存到 log_files/ids-log-YYYY-MM-DD.json 文件中"
    echo
    echo "选项:"
    echo "  -h, --help    显示此帮助信息"
    echo "  -f, --QUERY  选择过滤条件组合 (默认: 1)"
    echo "                0: 无过滤条件"
    echo "                1: 基础过滤 (sip_addr != '局域网')"
    echo "                2: 攻击成功+失陷过滤"
    echo "                3: SQL注入攻击过滤"
    echo "                4: Web组件信息泄露过滤"
    echo "                5: 扫描工具过滤"
    echo "                6: Web弱口令过滤"
    echo
    echo "参数:"
    echo "  日期          可选，格式为 YYYY-MM-DD"
    echo "                如果不指定，默认使用当前日期"
    echo
    echo "示例:"
    echo "  $(basename "$0")"
    echo "  $(basename "$0") 2025-07-11"
    echo "  $(basename "$0") --QUERY 2 2025-07-11"
    echo "  $(basename "$0") --help"
    exit 0
}

# 调试开关
DEBUG=true
# 过滤条件类型
QUERY_TYPE=1
# 设置默认日期为当前日期
DATE=$(date +%Y-%m-%d)

# 处理命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            ;;
        -f|--QUERY)
            if [[ -n "$2" && "$2" =~ ^[0-9]$ ]]; then
                QUERY_TYPE=$2
                shift
            else
                echo "错误：过滤条件参数无效，必须是0-9之间的数字"
                echo "使用 -h 或 --help 查看帮助信息"
                exit 1
            fi
            ;;
        *)
            # 验证日期格式 (YYYY-MM-DD)
            if [[ $1 =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
                DATE=$1
            else
                echo "错误：日期格式不正确，请使用 YYYY-MM-DD 格式"
                echo "使用 -h 或 --help 查看帮助信息"
                exit 1
            fi
            ;;
    esac
    shift
done

# 确保输出目录存在
mkdir -p log_files

# 将日期转换为YYYYMMDD格式用于索引名
DATE_INDEX=$(date -d "$DATE" +%Y%m%d)

# 定义过滤条件
## 无过滤条件 - 获取所有记录
QUERY_0="SELECT * FROM logfmt_746_${DATE_INDEX} ORDER BY field_values.access_time DESC LIMIT 100"

## 基础过滤 - sip_addr != '局域网'
QUERY_1="SELECT * FROM logfmt_746_${DATE_INDEX} WHERE field_values.sip_addr != '局域网' ORDER BY field_values.access_time DESC LIMIT 100"

## 攻击成功+失陷过滤
QUERY_2="SELECT * FROM logfmt_746_${DATE_INDEX} WHERE field_values.sip_addr != '局域网' AND (field_values.host_state = '攻击成功' OR field_values.host_state = '失陷') ORDER BY field_values.access_time DESC LIMIT 100"

## SQL注入攻击过滤
QUERY_3="SELECT * FROM logfmt_746_${DATE_INDEX} WHERE field_values.sip_addr != '局域网' AND field_values.vuln_type = 'SQL注入' ORDER BY field_values.access_time DESC LIMIT 100"

## Web组件信息泄露过滤
QUERY_4="SELECT * FROM logfmt_746_${DATE_INDEX} WHERE field_values.sip_addr != '局域网' AND field_values.vuln_type = '信息泄露' ORDER BY field_values.access_time DESC LIMIT 100"

## 扫描工具过滤
QUERY_5="SELECT * FROM logfmt_746_${DATE_INDEX} WHERE field_values.sip_addr != '局域网' AND field_values.attack_type LIKE '%扫描%' ORDER BY field_values.access_time DESC LIMIT 100"

## Web弱口令过滤
QUERY_6="SELECT * FROM logfmt_746_${DATE_INDEX} WHERE field_values.sip_addr != '局域网' AND field_values.vuln_type LIKE '%弱口令%' ORDER BY field_values.access_time DESC LIMIT 100"

## 预留查询7-9
QUERY_7="SELECT * FROM logfmt_746_${DATE_INDEX} WHERE field_values.sip_addr != '局域网' ORDER BY field_values.access_time DESC LIMIT 50"
QUERY_8="SELECT * FROM logfmt_746_${DATE_INDEX} WHERE field_values.sip_addr != '局域网' ORDER BY field_values.access_time DESC LIMIT 50"
QUERY_9="SELECT * FROM logfmt_746_${DATE_INDEX} WHERE field_values.sip_addr != '局域网' ORDER BY field_values.access_time DESC LIMIT 50"

# 根据选择的过滤类型获取过滤条件
get_QUERYs() {
    local QUERY_type=$1
    case $QUERY_type in
        0) echo "$QUERY_0";;
        1) echo "$QUERY_1";;
        2) echo "$QUERY_2";;
        3) echo "$QUERY_3";;
        4) echo "$QUERY_4";;
        5) echo "$QUERY_5";;
        6) echo "$QUERY_6";;
        7) echo "$QUERY_7";;
        8) echo "$QUERY_8";;
        9) echo "$QUERY_9";;
    esac
}

# 调试信息
if [ "$DEBUG" = "true" ]; then
    echo "DEBUG: QUERY type = $QUERY_TYPE"
    echo "DEBUG: Date = $DATE"
    echo "DEBUG: Index date = $DATE_INDEX"
    echo "DEBUG: Selected QUERY = $(get_QUERYs $QUERY_TYPE)"
fi

# 获取选定的过滤条件
SELECTED_QUERY=$(get_QUERYs $QUERY_TYPE)

# 构建JSON请求体
JSON_DATA=$(cat << EOF
{
  "query": "$SELECTED_QUERY"
}
EOF
)

# 发送请求到Elasticsearch SQL API
echo "正在查询 $DATE 的IDS日志..."
curl -X GET "http://203.0.113.10:9200/_sql" \
  -H "Content-Type: application/json" \
  -u "elastic:changeme" \
  -d "$JSON_DATA" \
  -o "log_files/ids-log-$DATE.json"

# 检查curl命令是否成功
if [ $? -ne 0 ]; then
    echo "错误：获取日志失败"
    exit 1
fi

# 检查输出文件是否生成
if [ ! -f "log_files/ids-log-$DATE.json" ]; then
    echo "错误：日志文件未生成"
    exit 1
fi

# 检查文件大小
FILE_SIZE=$(stat -c%s "log_files/ids-log-$DATE.json" 2>/dev/null || stat -f%z "log_files/ids-log-$DATE.json" 2>/dev/null)
if [ "$FILE_SIZE" -eq 0 ]; then
    echo "警告：生成的日志文件为空"
else
    echo "成功获取 $DATE 的IDS日志，文件大小: ${FILE_SIZE} 字节"
fi

# 可选：生成文本格式的输出
if [ "$DEBUG" = "true" ]; then
    echo "正在生成文本格式输出..."
    jq -r '.rows[] | @tsv' "log_files/ids-log-$DATE.json" > "log_files/ids-log-$DATE.txt" 2>/dev/null || {
        echo "警告：无法生成文本格式输出，可能需要安装jq工具"
    }
fi

echo "查询完成！结果保存在: log_files/ids-log-$DATE.json"
