#! /usr/bin/env python3
import requests
import json

# 查询参数
query = {
    "query": "SELECT field_values.sip, field_values.sip_addr, field_values.host_state FROM logfmt_746_20250711 WHERE field_values.sip_addr != '局域网' and (field_values.host_state='攻击成功' or field_values.host_state='失陷')"
}

# 发送请求
response = requests.get(
    "http://203.0.113.10:9200/_sql?format=txt",
    headers={"Content-Type": "application/json"},
    auth=("elastic", "changeme"),
    json=query
)

print(response.text)
