# risk-app-ops-analysis

从 Elasticsearch 的 `logfmt_746_*` 索引里取风险应用的运营与告警日志，做格式转换、聚合分析、月度报告。两套实现并存：Node 版是完整流水线，Python 版是临时查询脚本。

## 结构

```text
docs/                              接口说明与调研笔记
examples/                          示例 ES 查询语句
prompt/                            报告模板
risk-app-ops_js-version/           Node 实现（完整流水线）
├── risk-app-data-fetcher.js       取数
├── risk-app-format-converter.js   JSON 转 Markdown
├── risk-app-operation-analyzer.js 一体化入口
├── risk-app-report-generator.js   报告生成
└── risk-app-workflow-orchestrator.js 全流程编排
siem-ops_py-version/               Python 实现（单次查询）
├── config.json                    连接参数与预置 SQL
└── ids_log_*.py / .sh             查询脚本
```

## Node 版

```bash
cd risk-app-ops_js-version
npm install
npm start                    # 上个月全流程
node risk-app-operation-analyzer.js --all 2025-11
```

`-f` 只取数、`-c` 只转换、`-r` 只出报告。连库参数是构造函数 `esHost`、`username`、`password` 的默认值（`risk-app-operation-analyzer.js` 第 16–18 行），ES SQL 走 `_sql` 接口。输出落在 `output/` 下的 `raw-data`、`formatted-data`、`analysis-reports` 三个目录。

完整参数见 `risk-app-ops_js-version/README.md`。

## Python 版

```bash
cd siem-ops_py-version
pip install requests
python ids_log_analyze.py
```

连接参数与预置查询在 `config.json`，脚本内的地址与口令需要同步改。

## 数据来源

索引用 `logfmt_746_` 加日期拼成，单条记录含 `field_values.sip`、`sip_addr`、`vuln_type`、`attack_type`、`hazard_level`、`host_state`。`sip_addr` 为「局域网」或「未知」的记录通常先滤掉。

## 许可

MIT，见 `LICENSE`。
