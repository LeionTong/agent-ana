#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
增强版IDS日志获取脚本（Python版）
主要功能：
- 支持与ids_log_get.sh一致的命令行参数（--help, --list, --QUERY, --config, --verbose, 日期）
- 查询Elasticsearch SQL API，保存结果为json格式
- 输出选中查询条件、条目数量
- 文件名后缀自动为.json
- 可选：将json结果转换为xlsx格式（--to-xlsx）
- 新增：提取攻击源IP并与白名单比较，生成可封禁IP列表
"""
import argparse
import json
import os
import sys
import requests
from datetime import datetime
import re
import ipaddress

try:
    import pandas as pd
except ImportError:
    pd = None
    print("提示：未检测到pandas库。如需使用xlsx导出功能，请运行: pip install pandas openpyxl")

# 默认配置文件
DEFAULT_CONFIG = "ids.json"
# 默认白名单文件
DEFAULT_WHITELIST = "rule_files/ipWhite.txt"

# 帮助信息
HELP_TEXT = """
用法: ids_log_get.py [选项] [日期]

功能描述:
  从Elasticsearch查询指定日期的IDS日志数据。
  支持从配置文件读取查询模板，提供灵活的查询选项。
  查询结果将保存为.json文件，由配置文件elasticsearch.api_endpoint中的format参数决定（必须为json）。
  文件名后缀自动为.json。
  仅支持json格式，自动启用游标分页导出，支持大批量数据完整导出。
  可选：使用 --to-xlsx 参数可将json结果转换为xlsx表格文件，保留字段标题（需安装pandas）。
  新增：使用 --extract-attack-ips 参数可提取攻击源IP并与白名单比较，生成可封禁IP列表。

选项:
  -h, --help                   显示此帮助信息
  -v, --verbose                显示详细输出
  -c, --config                 指定配置文件路径 (可选，默认: ids.json)
  -l, --list                   列出所有可用的查询条件
  -f, --QUERY                  选择查询条件 (可选，默认: 0)
  --dedup                      根据id字段去重（可选，默认不开启）
  --id-column                  指定id字段的列索引（可选，默认不开启，列序号的值从0开始）
  --to-xlsx                    将查询结果从json文件转换为xlsx文件，保留字段标题（可选，需安装pandas）
  --extract-attack-ips         提取攻击源IP并与白名单比较，生成可封禁IP列表（可选，默认不开启）
  --attack-ip-column           指定攻击源IP字段名 (可选，默认: field_values.attack_sip)
  --whitelist                  指定IP白名单文件路径 (可选，默认: rule_files/ipWhite.txt)

参数:
  日期                        可选，格式为 YYYY-MM-DD，如果不指定，默认使用当前日期

示例:
  python ids_log_get.py --help
  python ids_log_get.py --list
  python ids_log_get.py
  python ids_log_get.py 2025-07-11
  python ids_log_get.py -f 1 2025-07-11
  python ids_log_get.py --to-xlsx 2025-07-11
  python ids_log_get.py --extract-attack-ips 2025-07-11
  python ids_log_get.py --verbose -f 0 --dedup --to-xlsx --extract-attack-ips 2025-07-17
"""

def load_config(config_file):
    if not os.path.isfile(config_file):
        print(f"错误：配置文件 {config_file} 不存在")
        sys.exit(1)
    with open(config_file, encoding="utf-8") as f:
        try:
            config = json.load(f)
        except Exception as e:
            print(f"错误：配置文件格式不正确: {e}")
            sys.exit(1)
    return config

def list_queries(config):
    print("可用的查询类型：\n==================")
    for k, v in config["queries"].items():
        print(f"  {k}: {v['name']} - {v['description']}")
    print()

def get_query_info(config, query_type):
    q = config["queries"].get(str(query_type))
    if not q:
        print(f"错误：查询类型 {query_type} 不存在")
        sys.exit(1)
    return q["name"], q["description"], q["sql"]

def get_es_config(config):
    es = config["elasticsearch"]
    endpoint = es["api_endpoint"]
    # 强制要求format为json
    if "?" in endpoint:
        parts = endpoint.split("?")
        base = parts[0]
        params = parts[1].split("&")
        params = [p for p in params if not p.startswith("format=")]
        params.append("format=json")
        endpoint = base + "?" + "&".join(params)
    else:
        endpoint = endpoint + "?format=json"
    return es["host"], es["port"], es["username"], es["password"], endpoint

def build_sql(sql_template, date_index):
    return sql_template.replace("{date_index}", date_index)

def request_es_sql(es_host, es_port, es_user, es_pass, es_endpoint, sql, verbose=False):
    url = f"http://{es_host}:{es_port}{es_endpoint}"
    headers = {"Content-Type": "application/json"}
    data = {"query": sql}
    if verbose:
        print(f"请求URL: {url}")
        print(f"请求数据: {json.dumps(data, ensure_ascii=False)}")
    try:
        resp = requests.get(url, headers=headers, auth=(es_user, es_pass), json=data, timeout=30)
        if verbose:
            print(f"HTTP状态码: {resp.status_code}")
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"错误：获取日志失败: {e}")
        sys.exit(1)

def save_json(data, path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def json_to_xlsx(result, xlsx_path):
    if pd is None:
        print("错误：未安装pandas库，无法导出xlsx。请先运行 pip install pandas openpyxl")
        sys.exit(1)
    
    # 获取字段标题
    columns = []
    if "columns" in result and result["columns"]:
        columns = [col.get("name", f"Column_{i}") for i, col in enumerate(result["columns"])]
    
    # 获取数据行
    rows = result.get("rows", [])
    if not rows:
        print("警告：无数据可导出为xlsx")
        return
    
    # 创建DataFrame，使用字段标题作为列名
    if columns:
        df = pd.DataFrame(rows, columns=columns)
    else:
        df = pd.DataFrame(rows)
    
    df.to_excel(xlsx_path, index=False)
    print(f"已生成xlsx: {xlsx_path}")

def deduplicate_by_id(data, id_column_index=None):
    """
    根据id字段进行去重。
    支持自动识别id字段或手动指定列索引。
    """
    if not data or not data["rows"]:
        print("警告：无数据可进行去重")
        return data, 0, 0, 0

    original_count = len(data["rows"])
    seen_ids = set()
    deduplicated_rows = []

    for row in data["rows"]:
        # 自动识别id字段
        if id_column_index is None:
            id_value = None
            for i, col in enumerate(data["columns"]):
                if col.get("name") and col["name"].lower() == "id":
                    id_value = row[i]
                    break
        else:
            # 手动指定列索引
            if id_column_index < len(row):
                id_value = row[id_column_index]
            else:
                print(f"错误：指定的id字段列索引 {id_column_index} 超出数据范围")
                return data, original_count, 0, 0

        if id_value is not None and id_value not in seen_ids:
            seen_ids.add(id_value)
            deduplicated_rows.append(row)
        elif id_value is None:
            # 如果id为None，则保留原始行
            deduplicated_rows.append(row)

    deduplicated_data = {"columns": data["columns"], "rows": deduplicated_rows}
    return deduplicated_data, original_count, len(deduplicated_rows), original_count - len(deduplicated_rows)

def load_whitelist(whitelist_file):
    """
    加载IP白名单文件，支持CIDR、IP范围、单个IP格式
    """
    if not os.path.isfile(whitelist_file):
        print(f"警告：白名单文件 {whitelist_file} 不存在，将使用空白名单")
        return set()
    
    whitelist_ips = set()
    try:
        with open(whitelist_file, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                
                try:
                    # 处理CIDR格式 (如 192.168.1.0/24)
                    if '/' in line:
                        network = ipaddress.ip_network(line, strict=False)
                        for ip in network:
                            whitelist_ips.add(str(ip))
                    # 处理IP范围格式 (如 192.168.1.1-192.168.1.10 或 192.168.1.1-10)
                    elif '-' in line:
                        parts = line.split('-', 1)
                        start_ip_str = parts[0].strip()
                        end_part = parts[1].strip()
                        
                        # 检查是否是完整IP范围 (如 192.168.1.1-192.168.1.10)
                        if '.' in end_part:
                            end_ip_str = end_part
                        else:
                            # 部分IP范围 (如 192.168.1.1-10)
                            start_parts = start_ip_str.split('.')
                            if len(start_parts) == 4:
                                start_parts[3] = end_part
                                end_ip_str = '.'.join(start_parts)
                            else:
                                print(f"警告：第{line_num}行IP范围格式错误 '{line}': 无法解析部分IP范围")
                                continue
                        
                        try:
                            start_ip = ipaddress.ip_address(start_ip_str)
                            end_ip = ipaddress.ip_address(end_ip_str)
                            current_ip = start_ip
                            while current_ip <= end_ip:
                                whitelist_ips.add(str(current_ip))
                                current_ip += 1
                        except ValueError as e:
                            print(f"警告：第{line_num}行IP范围格式错误 '{line}': {e}")
                            continue
                    # 处理单个IP
                    else:
                        ip = ipaddress.ip_address(line)
                        whitelist_ips.add(str(ip))
                except Exception as e:
                    print(f"警告：第{line_num}行IP格式错误 '{line}': {e}")
                    continue
        
        print(f"已加载白名单IP数量: {len(whitelist_ips)}")
        return whitelist_ips
    except Exception as e:
        print(f"错误：读取白名单文件失败: {e}")
        return set()

def extract_attack_ips(data, attack_ip_column="field_values.attack_sip"):
    """
    从查询结果中提取攻击源IP地址
    """
    if not data or not data.get("rows"):
        print("警告：无数据可提取攻击IP")
        return set()
    
    attack_ips = set()
    columns = data.get("columns", [])
    
    # 查找攻击源IP列的索引
    attack_ip_index = None
    for i, col in enumerate(columns):
        if col.get("name") == attack_ip_column:
            attack_ip_index = i
            break
    
    if attack_ip_index is None:
        print(f"警告：未找到攻击源IP列 '{attack_ip_column}'")
        print(f"可用列: {[col.get('name', 'unknown') for col in columns]}")
        return set()
    
    # 提取所有非空的攻击源IP
    for row in data["rows"]:
        if attack_ip_index < len(row) and row[attack_ip_index]:
            ip_str = str(row[attack_ip_index]).strip()
            if ip_str and ip_str.lower() != 'null' and ip_str.lower() != 'none':
                # 验证IP地址格式
                try:
                    ipaddress.ip_address(ip_str)
                    attack_ips.add(ip_str)
                except ValueError:
                    print(f"警告：无效的IP地址格式: {ip_str}")
                    continue
    
    print(f"提取到攻击源IP数量: {len(attack_ips)}")
    return attack_ips

def filter_attack_ips(attack_ips, whitelist_ips):
    """
    过滤攻击源IP，去除白名单中的IP
    """
    if not attack_ips:
        return set()
    
    filtered_ips = attack_ips - whitelist_ips
    print(f"过滤后可用于封禁的IP数量: {len(filtered_ips)}")
    print(f"被白名单过滤的IP数量: {len(attack_ips) - len(filtered_ips)}")
    
    return filtered_ips

def save_ban_ips(ban_ips, output_dir, date_str):
    """
    保存可封禁的IP列表到文件
    """
    if not ban_ips:
        print("警告：无IP需要封禁")
        return None
    
    # 按IP地址排序
    sorted_ips = sorted(ban_ips, key=lambda ip: ipaddress.ip_address(ip))
    
    # 保存为文本文件
    ban_file = os.path.join(output_dir, f"ids-log-{date_str}_ban_ips.txt")
    with open(ban_file, 'w', encoding='utf-8') as f:
        f.write(f"# 可封禁IP列表 - 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"# 总数量: {len(sorted_ips)}\n")
        f.write("# 格式：每行一个IP地址\n\n")
        for ip in sorted_ips:
            f.write(f"{ip}\n")
    
    print(f"已生成封禁IP列表: {ban_file}")
    return ban_file

def main():
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("-h", "--help", action="store_true")
    parser.add_argument("-f", "--QUERY", type=int, default=0)
    parser.add_argument("-c", "--config", type=str, default=DEFAULT_CONFIG)
    parser.add_argument("-l", "--list", action="store_true")
    parser.add_argument("-v", "--verbose", action="store_true")
    parser.add_argument("--to-xlsx", action="store_true", help="将json结果转换为xlsx表格文件")
    parser.add_argument("--dedup", action="store_true", help="启用去重功能")
    parser.add_argument("--id-column", type=int, default=None, help="指定id字段的列索引（从0开始）")
    parser.add_argument("--extract-attack-ips", action="store_true", help="提取攻击源IP并与白名单比较，生成可封禁IP列表")
    parser.add_argument("--whitelist", type=str, default=DEFAULT_WHITELIST, help="指定IP白名单文件路径")
    parser.add_argument("--attack-ip-column", type=str, default="field_values.attack_sip", help="指定攻击源IP字段名")
    parser.add_argument("date", nargs="?", type=str)
    args = parser.parse_args()

    if args.help:
        print(HELP_TEXT)
        sys.exit(0)

    config = load_config(args.config)

    if args.list:
        list_queries(config)
        sys.exit(0)

    # 日期处理
    if args.date:
        try:
            date_obj = datetime.strptime(args.date, "%Y-%m-%d")
        except Exception:
            print("错误：日期格式不正确，请使用 YYYY-MM-DD 格式")
            sys.exit(1)
    else:
        date_obj = datetime.now()
    date_str = date_obj.strftime("%Y-%m-%d")
    date_index = date_obj.strftime("%Y%m%d")

    # 查询条件
    query_type = args.QUERY
    name, desc, sql_template = get_query_info(config, query_type)
    sql = build_sql(sql_template, date_index)

    print(f"选中的查询条件：{name}")
    print(f"查询条件描述：{desc}")
    print(f"查询日期：{date_str}")

    # 输出目录
    out_dir = config["output"]["directory"]
    os.makedirs(out_dir, exist_ok=True)
    # ES配置
    es_host, es_port, es_user, es_pass, es_endpoint = get_es_config(config)

    # 文件名后缀固定为.json
    out_path = os.path.join(out_dir, f"ids-log-{date_str}.json")
    xlsx_path = os.path.join(out_dir, f"ids-log-{date_str}.xlsx") if args.to_xlsx else None

    # 首先获取总记录数
    print("正在获取总记录数...")
    count_sql = sql
    # 去掉ORDER BY、LIMIT、OFFSET
    count_sql = re.sub(r'ORDER BY[\s\S]*$', '', count_sql, flags=re.IGNORECASE)
    count_sql = re.sub(r'LIMIT[\s\S]*$', '', count_sql, flags=re.IGNORECASE)
    count_sql = re.sub(r'OFFSET[\s\S]*$', '', count_sql, flags=re.IGNORECASE)
    # 替换SELECT ... FROM为SELECT COUNT(*) FROM
    count_sql = re.sub(r'(?is)^select.+?from', 'SELECT COUNT(*) FROM', count_sql)
    # print(f"COUNT SQL: {count_sql}")  # 可选调试
    count_result = request_es_sql(es_host, es_port, es_user, es_pass, es_endpoint, count_sql, verbose=args.verbose)
    total_records = 0
    if "rows" in count_result and count_result["rows"]:
        total_records = count_result["rows"][0][0]
    print(f"总记录数：{total_records}")

    # 查询
    print(f"正在查询 {date_str} 的IDS日志 ...")
    result = request_es_sql(es_host, es_port, es_user, es_pass, es_endpoint, sql, verbose=args.verbose)
    # 游标分页导出全部数据
    all_rows = []
    if "rows" in result:
        all_rows.extend(result["rows"])
    cursor = result.get("cursor")
    # 分页拉取
    while cursor:
        next_data = {"cursor": cursor}
        resp = requests.get(f"http://{es_host}:{es_port}{es_endpoint}",
                           headers={"Content-Type": "application/json"},
                           auth=(es_user, es_pass),
                           json=next_data,
                           timeout=30)
        resp.raise_for_status()
        next_result = resp.json()
        all_rows.extend(next_result.get("rows", []))
        cursor = next_result.get("cursor")
    # 保存合并后的全部rows
    result["rows"] = all_rows
    if "cursor" in result:
        del result["cursor"]

    # 去重处理
    if args.dedup:
        print("正在去重...")
        result, original_count, deduplicated_count, duplicate_count = deduplicate_by_id(result, args.id_column)
        print(f"去重完成。原始记录数: {original_count}, 去重后记录数: {deduplicated_count}, 重复记录数: {duplicate_count}")

    save_json(result, out_path)
    
    # 获取文件大小
    file_size = os.path.getsize(out_path)
    print(f"成功获取 {date_str} 的IDS日志，文件大小：{file_size} 字节\n查询完成！结果已保存到: {out_path}")

    # 可选：导出为xlsx
    if args.to_xlsx:
        json_to_xlsx(result, xlsx_path)

    # 提取攻击源IP并过滤
    if args.extract_attack_ips:
        print("正在提取攻击源IP并过滤...")
        attack_ips = extract_attack_ips(result, args.attack_ip_column)
        whitelist_ips = load_whitelist(args.whitelist)
        ban_ips = filter_attack_ips(attack_ips, whitelist_ips)
        ban_file = save_ban_ips(ban_ips, out_dir, date_str)
        if ban_file:
            print(f"攻击源IP提取和过滤完成。可封禁IP列表已保存到: {ban_file}")

if __name__ == "__main__":
    main()
