#!/bin/bash

# 增强版IDS日志获取脚本（Bash版）
# 支持从JSON配置文件读取查询模板，灵活选择查询条件，自动适配输出格式

CONFIG_FILE="config.json"

# 显示帮助信息的函数
show_help() {
    echo "用法: $(basename "$0") [选项] [日期]"
    echo
    echo "功能描述:"
    echo "  从Elasticsearch查询指定日期的IDS日志数据。"
    echo "  支持从配置文件读取查询模板，提供灵活的查询选项。"
    echo "  使用游标分页查询全量数据，每页1000条记录，性能更好。"
    echo "  查询结果将保存为JSON格式文件，文件名后缀自动与format参数保持一致。"
    echo "  自动统计并输出查询到的条目数量。"
    echo
    echo "选项:"
    echo "  -h, --help    显示此帮助信息"
    echo "  -f, --QUERY  选择过滤条件组合 (默认: 0)"
    echo "  -c, --config  指定配置文件路径 (默认: ids.json)"
    echo "  -l, --list    列出所有可用的查询类型"
    echo "  -v, --verbose 显示详细输出"
    echo
    echo "参数:"
    echo "  日期          可选，格式为 YYYY-MM-DD"
    echo "                如果不指定，默认使用当前日期"
    echo
    echo "示例:"
    echo "  $(basename "$0")                    # 查询今天的IDS日志（游标分页）"
    echo "  $(basename "$0") 2025-07-12         # 查询指定日期的IDS日志（游标分页）"
    echo "  $(basename "$0") -f 1 2025-07-12    # 使用查询条件1查询指定日期（游标分页）"
    echo "  $(basename "$0") -f 1 -c ids_queries.json 2025-07-12"
    echo "  $(basename "$0") --list             # 列出所有可用的查询类型"
    echo "  $(basename "$0") --help             # 显示帮助信息"
    echo
    echo "注意："
    echo "  - 使用游标分页，性能更好且不会出现重复数据"
    echo "  - SQL查询建议包含ORDER BY子句以确保结果一致性"
    echo "  - 每页默认查询1000条记录，自动循环直到获取全量数据"
    exit 0
}

# 检查jq是否安装
check_jq() {
    if ! command -v jq &> /dev/null; then
        echo "警告：jq工具未安装，某些功能可能不可用"
        echo "请安装jq: sudo apt-get install jq 或 sudo yum install jq"
        return 1
    fi
    return 0
}

# 从配置文件读取查询模板
load_queries() {
    if [ ! -f "$CONFIG_FILE" ]; then
        echo "错误：配置文件 $CONFIG_FILE 不存在"
        exit 1
    fi
    
    if ! check_jq; then
        echo "错误：需要jq工具来解析配置文件"
        exit 1
    fi
    
    # 验证JSON格式
    if ! jq empty "$CONFIG_FILE" 2>/dev/null; then
        echo "错误：配置文件 $CONFIG_FILE 格式不正确"
        exit 1
    fi
}

# 列出所有查询类型
list_queries() {
    load_queries
    
    echo "可用的查询类型："
    echo "=================="
    
    jq -r '.queries | to_entries[] | "\(.key): \(.value.name) - \(.value.description)"' "$CONFIG_FILE" | while read -r line; do
        echo "  $line"
    done
    echo
}

# 获取查询SQL
get_query_sql() {
    local query_type=$1
    local date_index=$2
    
    if ! check_jq; then
        echo "错误：需要jq工具来获取查询SQL"
        exit 1
    fi
    
    local sql=$(jq -r --arg type "$query_type" --arg date "$date_index" '.queries[$type].sql | gsub("\\{date_index\\}"; $date)' "$CONFIG_FILE" 2>/dev/null)
    
    if [ "$sql" = "null" ] || [ -z "$sql" ]; then
        echo "错误：查询类型 $query_type 不存在或SQL模板为空"
        exit 1
    fi
    
    echo "$sql"
}

# 获取游标查询SQL（移除LIMIT和OFFSET）
get_cursor_query_sql() {
    local query_type=$1
    local date_index=$2
    
    if ! check_jq; then
        echo "错误：需要jq工具来获取查询SQL"
        exit 1
    fi
    
    local sql=$(jq -r --arg type "$query_type" --arg date "$date_index" '.queries[$type].sql | gsub("\\{date_index\\}"; $date)' "$CONFIG_FILE" 2>/dev/null)
    
    if [ "$sql" = "null" ] || [ -z "$sql" ]; then
        echo "错误：查询类型 $query_type 不存在或SQL模板为空"
        exit 1
    fi
    
    # 移除LIMIT和OFFSET子句，用于游标查询
    sql=$(echo "$sql" | sed 's/LIMIT[^;]*//' | sed 's/OFFSET[^;]*//' | sed 's/limit[^;]*//' | sed 's/offset[^;]*//')
    
    echo "$sql"
}

# 获取Elasticsearch配置
get_es_config() {
    if ! check_jq; then
        echo "错误：需要jq工具来获取Elasticsearch配置"
        exit 1
    fi
    
    local host=$(jq -r '.elasticsearch.host' "$CONFIG_FILE")
    local port=$(jq -r '.elasticsearch.port' "$CONFIG_FILE")
    local username=$(jq -r '.elasticsearch.username' "$CONFIG_FILE")
    local password=$(jq -r '.elasticsearch.password' "$CONFIG_FILE")
    local endpoint=$(jq -r '.elasticsearch.api_endpoint' "$CONFIG_FILE")
    
    echo "$host:$port:$username:$password:$endpoint"
}

# 获取输出目录
get_output_dir() {
    if ! check_jq; then
        echo "错误：需要jq工具来获取输出配置"
        exit 1
    fi
    jq -r '.output.directory' "$CONFIG_FILE"
}

# 获取format类型
get_format_type() {
    local endpoint=$(jq -r '.elasticsearch.api_endpoint' "$CONFIG_FILE")
    local format="json"
    if [[ "$endpoint" == *"format="* ]]; then
        format=$(echo "$endpoint" | sed -n 's/.*format=\([^&]*\).*/\1/p' | tr 'A-Z' 'a-z')
    fi
    echo "$format"
}

# 调试开关
DEBUG=false
VERBOSE=false
# 过滤条件类型
QUERY_TYPE=0
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
        -c|--config)
            if [[ -n "$2" ]]; then
                CONFIG_FILE=$2
                shift
            else
                echo "错误：配置文件路径不能为空"
                exit 1
            fi
            ;;
        -l|--list)
            list_queries
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            DEBUG=true
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

# 加载配置文件
load_queries

# 确保输出目录存在
OUTPUT_DIR=$(get_output_dir)
mkdir -p "$OUTPUT_DIR"

# 获取format类型
FORMAT_TYPE=$(get_format_type)

# 将日期转换为YYYYMMDD格式用于索引名
DATE_INDEX=$(date -d "$DATE" +%Y%m%d)

# 获取查询SQL（用于获取总记录数）
SELECTED_QUERY=$(get_query_sql "$QUERY_TYPE" "$DATE_INDEX")

# 获取游标查询SQL（移除LIMIT和OFFSET）
CURSOR_QUERY=$(get_cursor_query_sql "$QUERY_TYPE" "$DATE_INDEX")

# 检查SQL是否适合游标分页
if [[ "$CURSOR_QUERY" =~ ORDER\ BY ]]; then
    echo "SQL查询包含ORDER BY子句，适合游标分页"
else
    echo "警告：SQL查询不包含ORDER BY子句，游标分页可能不稳定"
    echo "建议添加ORDER BY子句以确保结果一致性"
    echo "当前SQL: $CURSOR_QUERY"
fi

# 获取查询条件信息（name和description）
get_query_info() {
    local query_type=$1
    local name=$(jq -r --arg type "$query_type" '.queries[$type].name' "$CONFIG_FILE")
    local desc=$(jq -r --arg type "$query_type" '.queries[$type].description' "$CONFIG_FILE")
    echo "$name:$desc"
}

QUERY_INFO=$(get_query_info "$QUERY_TYPE")
QUERY_NAME=$(echo "$QUERY_INFO" | cut -d: -f1)
QUERY_DESC=$(echo "$QUERY_INFO" | cut -d: -f2)

echo "选中的查询条件：$QUERY_NAME"
echo "查询条件描述：$QUERY_DESC"

# 获取Elasticsearch配置
ES_CONFIG=$(get_es_config)
ES_HOST=$(echo "$ES_CONFIG" | cut -d: -f1)
ES_PORT=$(echo "$ES_CONFIG" | cut -d: -f2)
ES_USERNAME=$(echo "$ES_CONFIG" | cut -d: -f3)
ES_PASSWORD=$(echo "$ES_CONFIG" | cut -d: -f4)
ES_ENDPOINT=$(echo "$ES_CONFIG" | cut -d: -f5)

# 输出文件名后缀
if [ "$FORMAT_TYPE" = "csv" ]; then
    OUT_SUFFIX=".csv"
elif [ "$FORMAT_TYPE" = "json" ]; then
    OUT_SUFFIX=".json"
elif [ "$FORMAT_TYPE" = "txt" ]; then
    OUT_SUFFIX=".txt"
else
    OUT_SUFFIX=".$FORMAT_TYPE"
fi

OUT_FILE="$OUTPUT_DIR/ids-log-$DATE$OUT_SUFFIX"

# 调试信息
if [ "$DEBUG" = "true" ]; then
    echo "DEBUG: 配置文件 = $CONFIG_FILE"
    echo "DEBUG: 查询类型 = $QUERY_TYPE"
    echo "DEBUG: 日期 = $DATE"
    echo "DEBUG: 索引日期 = $DATE_INDEX"
    echo "DEBUG: 查询SQL = $SELECTED_QUERY"
    echo "DEBUG: ES主机 = $ES_HOST:$ES_PORT"
    echo "DEBUG: 输出目录 = $OUTPUT_DIR"
fi

PAGE_SIZE=1000
ALL_DONE=false
TMP_DIR=$(mktemp -d)
PAGE=1
CURSOR=""

echo "开始游标分页查询 $DATE 的IDS日志，每页 $PAGE_SIZE 条记录..."

# 首先获取总记录数
echo "正在获取总记录数..."
COUNT_QUERY=$(echo "$CURSOR_QUERY" \
  | sed -E 's/ORDER BY[[:space:]].*$//' \
  | sed -E 's/LIMIT[[:space:]].*$//' \
  | sed -E 's/OFFSET[[:space:]].*$//' \
  | sed -E 's/SELECT[[:space:]].*FROM/SELECT COUNT(*) FROM/I')
# echo "COUNT SQL: $COUNT_QUERY"  # 可选调试
COUNT_JSON="{\"query\": \"$COUNT_QUERY\"}"
COUNT_FILE="$TMP_DIR/total_count.$FORMAT_TYPE"

curl -X GET "http://$ES_HOST:$ES_PORT$ES_ENDPOINT" \
  -H "Content-Type: application/json" \
  -u "$ES_USERNAME:$ES_PASSWORD" \
  -d "$COUNT_JSON" \
  -o "$COUNT_FILE" \
  -s > /dev/null 2>&1

TOTAL_RECORDS=0
if [ "$FORMAT_TYPE" = "json" ]; then
    TOTAL_RECORDS=$(jq -r '.rows[0][0]' "$COUNT_FILE" 2>/dev/null)
elif [ "$FORMAT_TYPE" = "csv" ]; then
    TOTAL_RECORDS=$(tail -n 1 "$COUNT_FILE" | cut -d',' -f1)
fi

if [ -n "$TOTAL_RECORDS" ] && [ "$TOTAL_RECORDS" -gt 0 ]; then
    echo "总记录数：$TOTAL_RECORDS"
    EXPECTED_PAGES=$(( (TOTAL_RECORDS + PAGE_SIZE - 1) / PAGE_SIZE ))
    echo "预计页数：$EXPECTED_PAGES"
else
    echo "无法获取总记录数，将使用默认分页逻辑"
    TOTAL_RECORDS=0
fi

rm -f "$COUNT_FILE"

while [ "$ALL_DONE" = false ]; do
    # 构建游标查询JSON
    if [ -z "$CURSOR" ]; then
        # 第一页查询
        JSON_DATA=$(cat << EOF
{
  "query": "$CURSOR_QUERY",
  "fetch_size": $PAGE_SIZE
}
EOF
)
    else
        # 后续页面使用游标
        JSON_DATA=$(cat << EOF
{
  "cursor": "$CURSOR"
}
EOF
)
    fi
    
    PAGE_FILE="$TMP_DIR/page_$PAGE.$FORMAT_TYPE"

    if [ "$VERBOSE" = "true" ]; then
        if [ -z "$CURSOR" ]; then
            echo "正在查询第 $PAGE 页（初始查询）..."
        else
            echo "正在查询第 $PAGE 页（使用游标）..."
        fi
    fi

    curl -X GET "http://$ES_HOST:$ES_PORT$ES_ENDPOINT" \
      -H "Content-Type: application/json" \
      -u "$ES_USERNAME:$ES_PASSWORD" \
      -d "$JSON_DATA" \
      -o "$PAGE_FILE" \
      -s \
      -w "HTTP状态码: %{http_code}\n"

    # 检查curl是否成功
    if [ $? -ne 0 ]; then
        echo "错误：第 $PAGE 页查询失败"
        rm -rf "$TMP_DIR"
        exit 1
    fi

    # 检查文件是否为空或无效
    if [ ! -f "$PAGE_FILE" ] || [ ! -s "$PAGE_FILE" ]; then
        echo "警告：第 $PAGE 页返回空数据，停止查询"
        ALL_DONE=true
        break
    fi

    # 获取下一页游标
    if [ "$FORMAT_TYPE" = "json" ]; then
        CURSOR=$(jq -r '.cursor' "$PAGE_FILE" 2>/dev/null)
        COUNT=$(jq '.rows | length' "$PAGE_FILE" 2>/dev/null)
        
        if [ -z "$COUNT" ] || [ "$COUNT" -eq 0 ]; then
            echo "第 $PAGE 页无数据，停止查询"
            ALL_DONE=true
        elif [ "$COUNT" -lt "$PAGE_SIZE" ]; then
            echo "第 $PAGE 页返回 $COUNT 条数据（少于 $PAGE_SIZE），查询完成"
            ALL_DONE=true
        elif [ "$CURSOR" = "null" ] || [ -z "$CURSOR" ]; then
            echo "第 $PAGE 页返回 $COUNT 条数据，但无下一页游标，查询完成"
            ALL_DONE=true
        else
            echo "第 $PAGE 页返回 $COUNT 条数据，继续查询下一页"
        fi
    elif [ "$FORMAT_TYPE" = "csv" ]; then
        COUNT=$(($(wc -l < "$PAGE_FILE") - 1))
        if [ "$COUNT" -le 0 ]; then
            echo "第 $PAGE 页无数据，停止查询"
            ALL_DONE=true
        elif [ "$COUNT" -lt "$PAGE_SIZE" ]; then
            echo "第 $PAGE 页返回 $COUNT 条数据（少于 $PAGE_SIZE），查询完成"
            ALL_DONE=true
        else
            echo "第 $PAGE 页返回 $COUNT 条数据，继续查询下一页"
        fi
    fi

    # 使用总记录数判断是否完成
    if [ "$TOTAL_RECORDS" -gt 0 ]; then
        CURRENT_RECORDS=$(( (PAGE - 1) * PAGE_SIZE ))
        if [ "$CURRENT_RECORDS" -ge "$TOTAL_RECORDS" ]; then
            echo "已获取所有记录（$TOTAL_RECORDS），查询完成"
            ALL_DONE=true
        fi
    fi

    # 添加安全检查：防止无限循环
    if [ "$PAGE" -gt 50 ]; then
        echo "警告：查询页数超过50页，可能存在无限循环，强制停止"
        ALL_DONE=true
    fi

    PAGE=$((PAGE + 1))
done

# 合并所有分页文件为最终结果
echo "正在合并分页数据..."

if [ "$FORMAT_TYPE" = "json" ]; then
    # 合并JSON格式：合并所有rows数组
    FIRST_FILE="$TMP_DIR/page_1.json"
    if [ -f "$FIRST_FILE" ]; then
        # 创建完整的JSON结构
        echo '{' > "$OUT_FILE"
        # 获取第一个文件的列信息
        jq -r '.columns' "$FIRST_FILE" >> "$OUT_FILE"
        # 合并所有rows
        echo ',"rows":[' >> "$OUT_FILE"
        FIRST=true
        for page_file in "$TMP_DIR"/page_*.json; do
            if [ -f "$page_file" ]; then
                if [ "$FIRST" = true ]; then
                    jq -r '.rows[] | tojson' "$page_file" | paste -sd ',' - >> "$OUT_FILE"
                    FIRST=false
                else
                    echo ',' >> "$OUT_FILE"
                    jq -r '.rows[] | tojson' "$page_file" | paste -sd ',' - >> "$OUT_FILE"
                fi
            fi
        done
        echo ']}' >> "$OUT_FILE"
    fi
elif [ "$FORMAT_TYPE" = "csv" ]; then
    # 合并CSV格式：保留第一行的表头，拼接所有数据行
    FIRST_FILE="$TMP_DIR/page_1.csv"
    if [ -f "$FIRST_FILE" ]; then
        # 复制第一个文件的表头
        head -n 1 "$FIRST_FILE" > "$OUT_FILE"
        # 拼接所有数据行（跳过表头）
        for page_file in "$TMP_DIR"/page_*.csv; do
            if [ -f "$page_file" ]; then
                tail -n +2 "$page_file" >> "$OUT_FILE"
            fi
        done
    fi
else
    # 其他格式：直接拼接
    for page_file in "$TMP_DIR"/page_*."$FORMAT_TYPE"; do
        if [ -f "$page_file" ]; then
            cat "$page_file" >> "$OUT_FILE"
        fi
    done
fi

# 清理临时文件
rm -rf "$TMP_DIR"

# 清理游标（如果还有的话）
if [ -n "$CURSOR" ] && [ "$CURSOR" != "null" ]; then
    echo "正在清理游标..."
    CLEANUP_JSON="{\"cursor\": \"$CURSOR\"}"
    curl -X POST "http://$ES_HOST:$ES_PORT$ES_ENDPOINT/close" \
      -H "Content-Type: application/json" \
      -u "$ES_USERNAME:$ES_PASSWORD" \
      -d "$CLEANUP_JSON" \
      -s > /dev/null 2>&1
fi

echo "游标分页查询完成，共查询 $((PAGE - 1)) 页数据"

# 检查curl命令是否成功
if [ $? -ne 0 ]; then
    echo "错误：获取日志失败"
    exit 1
fi

# 检查输出文件是否生成
if [ ! -f "$OUT_FILE" ]; then
    echo "错误：日志文件未生成"
    exit 1
fi

# 检查文件大小
FILE_SIZE=$(stat -c%s "$OUT_FILE" 2>/dev/null || stat -f%z "$OUT_FILE" 2>/dev/null)
if [ "$FILE_SIZE" -eq 0 ]; then
    echo "警告：生成的日志文件为空"
else
    echo "成功获取 $DATE 的IDS日志，文件大小：${FILE_SIZE} 字节"
fi

# 输出查询到的条目数量
if check_jq; then
    if [ "$FORMAT_TYPE" = "json" ]; then
        COUNT=$(jq '.rows | length' "$OUT_FILE" 2>/dev/null)
        if [ -n "$COUNT" ]; then
            echo "查询到的条目数量：$COUNT"
        fi
    elif [ "$FORMAT_TYPE" = "csv" ]; then
        COUNT=$(($(wc -l < "$OUT_FILE") - 1))
        if [ "$COUNT" -ge 0 ]; then
            echo "查询到的条目数量：$COUNT"
        fi
    fi
fi

echo "查询完成！结果已保存到: $OUT_FILE" 