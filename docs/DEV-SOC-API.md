
## 安全运营Elastic大数据库

- ES存储：203.0.113.10:9200,203.0.113.11:9200,203.0.113.12:9200
	- sec_read，changeme
- ES 索引： http://203.0.113.10:5601/app/management/data/index_management/indices
- Kibana Console 开发工具： http://203.0.113.10:5601/app/dev_tools#/console 
	- elastic，changeme

```sh
user@host:~$ nc -zv 203.0.113.10 9200
Connection to 203.0.113.10 9200 port [tcp/*] succeeded!
```

### ES|QL 查询语句示例

```sql
GET /_search
{
  "query": {
    "match_all": {}
  }
}
```
等效 shell 命令：
```sh
curl -XGET "http://203.0.113.10:9200/_search" -H "Content-Type: application/json" -u sec_read:changeme -d'
{
  "query": {
    "match_all": {}
  }
}'
```

### 安全事件运营数据查询（siem-ops）--IDS告警数据
- 数据源： logfmt_746_YYYYMMDD

#### ES|QL API，DSL语法版本
- 日期2025年7月11日，攻击维度='外部攻击'（源IP），攻击结果='攻击成功'或'失陷'

```sql
GET /_sql
{
  "query": """
  SELECT field_values.* FROM logfmt_746_20250711 LIMIT 3
  """
}
# 等效：
GET /_sql
{
  "query": "SELECT field_values.* FROM logfmt_746_20250711 LIMIT 3"
}
```
####  Shell 命令行版本：
```sh
curl -X GET "http://203.0.113.10:9200/_sql?format=txt" -H "Content-Type: application/json" -u sec_read:changeme -d'
{
  "query": "SELECT field_values.* FROM logfmt_746_20250711 LIMIT 3"
}
'
```

```sql
GET /_sql
{
  "query": "SELECT field_values.* FROM logfmt_746_20250711 WHERE field_values.sip_addr != '局域网'"
}
```

```sql
GET /_sql?format=txt
{
  "query": "SELECT field_values.sip FROM logfmt_746_20250711 WHERE field_values.sip_addr != '局域网' ORDER BY timestamp DESC LIMIT 100"
}
```

```sql
GET _sql?format=csv
{
  "query": "SELECT field_values.sip, field_values.sip_addr, field_values.host_state FROM logfmt_746_20250711 WHERE field_values.sip_addr != '局域网' and (field_values.host_state='攻击成功' or field_values.host_state='失陷')"
}
```

#### Shell 命令行版本（用文件方式保存查询JSON）：
```sh
curl -X GET "http://203.0.113.10:9200/_sql?format=txt" -H "Content-Type: application/json" -u sec_read:changeme -d @config.json > ids-log-$(date -I).json
```

#### JavaScript版本：
```js
const axios = require('axios');

// 查询参数
const query = {
    "query": "SELECT field_values.sip, field_values.sip_addr, field_values.host_state FROM logfmt_746_20250711 WHERE field_values.sip_addr != '局域网' and (field_values.host_state='攻击成功' or field_values.host_state='失陷')"
};

// 发送请求
axios.get("http://203.0.113.10:9200/_sql?format=txt", {
    headers: {
        "Content-Type": "application/json"
    },
    auth: {
        username: "elastic",
        password: "changeme"
    },
    data: query
}).then(response => {
    console.log(response.data);
}).catch(error => {
    console.error('Error:', error.response?.data || error.message);
});
```
#### Python版本：
```python
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
```

