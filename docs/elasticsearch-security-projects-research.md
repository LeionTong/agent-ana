# Elasticsearch 安全运营开源项目调研报告

**生成日期:** 2026-01-09
**调研范围:** 基于 Elasticsearch 的安全事件运营（Security Operations/SOC）开源项目
**项目数:** 12 个符合条件的开源项目

---

## 📋 调研背景

当前项目是一个纯 JavaScript Node.js 项目，用于风险应用运营数据分析。项目从 Elasticsearch 获取数据，进行数据转换、分析和报告生成，主要聚焦用户行为分析和应用使用统计。

本报告旨在寻找类似功能的开源项目，参考其技术架构、功能设计和最佳实践，为项目迭代提供参考。

---

## 🔥 强烈推荐（与当前项目最相似）

### 1. Wazuh ⭐ **14.4k**

**GitHub:** https://github.com/wazuh/wazuh

**项目简介:**
基于 ELK Stack（Elasticsearch, Logstash, Kibana）的开源统一 XDR 和 SIEM 平台。结合主机入侵检测、漏洞检测、文件完整性监控（FIM）和合规审计。

**技术栈:**
- **语言:** Python, C, Shell, JavaScript
- **框架:** Elasticsearch, Logstash, Kibana, Filebeat
- **数据库:** Elasticsearch/Opensearch

**与当前项目相似点:**
- ✅ 都从 Elasticsearch 获取日志数据
- ✅ 都使用 Elasticsearch 作为数据存储和索引引擎
- ✅ 都包含数据分析、报告生成功能
- ✅ 都面向安全运营场景

**特色功能:**
- 🛡️ 内置 2200+ 检测规则
- 🤖️ 文件完整性监控（FIM）
- 🌐 漏洞检测和评估
- 📊 合规审计（PCI-DSS, CIS benchmarks）
- 🚨 实时告警和自动化响应
- 📈 丰富的预置仪表板

**最后更新:** 2025 年活跃（频繁更新）

**值得参考的设计:**
- CLI 工具链的模块化设计
- 报告模板系统
- 规则引擎架构

---

### 2. OpenSearch Security Analytics ⭐ **91**

**GitHub:** https://github.com/opensearch-project/security-analytics

**项目简介:**
OpenSearch 内置的安全分析包，提供完整的开源 SIEM 解决方案。包含探测器、检测规则（基于 Sigma）、发现、告警和关联引擎。

**技术栈:**
- **语言:** Java, TypeScript, Python
- **框架:** OpenSearch, OpenSearch Dashboards
- **许可证:** Apache 2.0

**与当前项目相似点:**
- ✅ 使用 Elasticsearch/OpenSearch 作为数据源
- ✅ 提供安全分析和报告生成
- ✅ 支持 Markdown 报告导出
- ✅ 用户行为分析功能（通过检测规则）

**特色功能:**
- 📋 2,200+ 预置 Sigma 检测规则
- 🔗 事件关联引擎（跨数据源链接发现）
- 🤖️ 实时异常检测（机器学习）
- 🎯 威胁情报集成（STIX2 IoCs）
- 🤖️ 支持自定义检测规则

**最后更新:** 2025-10-09（活跃维护）

**值得参考的设计:**
- Sigma 规则集成方式
- 事件关联引擎设计
- 实时异常检测实现

---

### 3. ElastAlert2 ⭐ **844**

**GitHub:** https://github.com/jertel/elastalert2

**项目简介:**
Elasticsearch 和 OpenSearch 的自动化规则告警框架。从数据中检测异常、峰值或感兴趣的模式，并触发多种告警动作。

**技术栈:**
- **语言:** Python 100%
- **部署:** Docker, Kubernetes, Helm
- **许可证:** Apache 2.0

**与当前项目相似点:**
- ✅ 从 Elasticsearch 查询数据
- ✅ 基于规则的检测和告警
- ✅ 纯 Python 实现（与当前项目类似）
- ✅ CLI 工具，适合自动化

**特色功能:**
- 🚨 多种规则类型（frequency, spike, flatline, blacklist 等）
- 📧 多种告警目标（Email, Slack, JIRA, Telegram 等）
- 🔄 支持模板和规则管理
- 📊 兼容 Sigma 规则转换
- 🐳 Docker 和 Kubernetes 部署

**最后更新:** 2025-04-05（版本 2.24.0）

**值得参考的设计:**
- 规则引擎设计模式
- YAML 规则配置格式
- 告警通知系统架构

---

### 4. Elastic Security (Elastic SIEM) ⭐ **14.4k+** (Elastic 官方)

**GitHub:** https://github.com/elastic/detection-rules

**项目简介:**
Elastic 官方的开源 SIEM/XDR 解决方案，集成 SIEM、端点安全和云安全。基于 Elasticsearch 和 Kibana 构建。

**技术栈:**
- **语言:** JavaScript, TypeScript, Python
- **框架:** Elasticsearch, Kibana, Elastic Agent
- **数据模型:** Elastic Common Schema (ECS)

**与当前项目相似点:**
- ✅ 从 Elasticsearch 获取数据
- ✅ 数据分析和报告生成
- ✅ 用户行为监控（Behavioral Analytics）
- ✅ CLI 工具 + Web UI

**特色功能:**
- 🤖️ AI 驱动的威胁检测（Elastic AI SOC Engine - EASE）
- 📊 丰富的预置仪表板和可视化
- 🎯 开放检测规则（GitHub 开源）
- 🔍 威胁狩猎工具包（ES|QL）
- 🤖️ 行为分析（异常检测）

**最后更新:** 2025 年持续更新（Elastic 8.x）

**值得参考的设计:**
- Elastic Common Schema (ECS) 数据模型
- 检测规则的组织和测试
- CLI 与 Web UI 的协同设计

---

## 📊 其他值得参考的项目

### 5. Graylog Security ⭐ **~8.5k**

**GitHub:** https://github.com/Graylog2/graylog2-server

**项目简介:**
集中式日志管理和 SIEM 平台，支持 Elasticsearch/OpenSearch 后端。提供强大的搜索、聚合、告警和安全分析功能。

**技术栈:**
- **语言:** Java, JavaScript
- **框架:** Elasticsearch/OpenSearch, MongoDB
- **Web:** Graylog Web UI

**与当前项目相似点:**
- ✅ 支持 Elasticsearch 作为后端存储
- ✅ 日志分析和可视化
- ✅ 告警和通知系统
- ✅ 报告生成

**特色功能:**
- 📊 预置安全仪表板（用户活动、主机活动、网络活动）
- 🎯 Sigma 规则支持
- 🤖️ 异常检测（AI/ML）
- 🚨 实时告警和事件处理
- 📈 日志流管理

**最后更新:** 2025-04-28（Graylog 6.2 发布）

---

### 6. HELK (Hunting ELK) ⭐ **~2.5k**

**GitHub:** https://github.com/Cyb3rWard0g/HELK

**项目简介:**
基于 ELK Stack 的开源威胁狩猎平台，增强高级分析能力（SQL 查询、图分析、机器学习）。

**技术栈:**
- **语言:** Python, Bash
- **框架:** Elasticsearch, Logstash, Kibana, Apache Spark, Jupyter Notebook
- **数据流:** Kafka

**与当前项目相似点:**
- ✅ 基于 ELK Stack
- ✅ 数据分析和报告
- ✅ 聚焦用户行为和威胁狩猎
- ✅ CLI 部署和脚本化

**特色功能:**
- 🧪 Apache Spark 大数据处理
- 📊 Jupyter Notebook 集成（数据科学能力）
- 🔍 SQL 声明式查询语言
- 🌐 图关系分析（GraphFrames）
- 📈 结构化流处理

**最后更新:** 项目已归档（最后更新约 2020 年），但仍有学习价值

---

### 7. Security Onion ⭐ **~4k**

**GitHub:** https://github.com/Security-Onion-Solutions/securityonion

**项目简介:**
专为威胁狩猎和企业安全监控设计的开源 Linux 发行版，集成 Elastic Stack、Suricata、Zeek 等工具。

**技术栈:**
- **语言:** Python, Bash, Go
- **框架:** Elasticsearch, Logstash, Kibana, Suricata, Zeek
- **平台:** Linux 发行版

**与当前项目相似点:**
- ✅ 深度集成 Elastic Stack
- ✅ 日志管理和分析
- ✅ 威胁检测和响应
- ✅ 报告和可视化

**特色功能:**
- 🎯 分布式节点架构（Forward, Search, Manager, Receiver）
- 📊 统一的 SOC 控制台
- 🚨 自动化 ElastAlert2 规则生成（基于 Sigma）
- 🕵️ 网络入侵检测（Suricata, Zeek）
- 🤖️ AI 辅助分析（支持 MCP 集成）

**最后更新:** 2025 年活跃（2.4.x 版本）

---

### 8. TheHive + Cortex ⭐ **3.9k + 1.5k**

**GitHub:**
- TheHive: https://github.com/TheHive-Project/TheHive
- Cortex: https://github.com/TheHive-Project/Cortex

**项目简介:**
TheHive 是协作式事件管理平台（SIRP），Cortex 是强大的可观测分析和主动响应引擎。两者都可与 Elasticsearch 集成。

**技术栈:**
- **语言:** Scala, Python
- **数据库:** Elasticsearch, Cassandra
- **部署:** Docker

**与当前项目相似点:**
- ✅ 支持 Elasticsearch 作为后端
- ✅ 数据查询和分析
- ✅ 报告生成（事件报告）
- ✅ 可扩展的分析器生态

**特色功能:**
- 🎯 事件案例管理
- 🔬 可观测分析器（IP, Hash, URL, Domain 等）
- 📧 多种响应动作（通过 Cortex）
- 🤖️ Elasticsearch 集成分析器
- 🚨 自动化工作流

**最后更新:** Cortex 4.0（2025-11-25，支持 Elasticsearch 8）

---

### 9. Sigma ⭐ **10k+**

**GitHub:** https://github.com/SigmaHQ/sigma

**项目简介:**
通用的日志分析签名格式，用于 SIEM 系统。Sigma 规则可转换为多种后端查询（Elasticsearch, Splunk, KQL 等）。

**技术栈:**
- **语言:** Python, YAML
- **工具:** sigmac（转换器）, pySigma（Python 库）
- **目标:** 多 SIEM 平台

**与当前项目相似点:**
- ✅ 支持转换为 Elasticsearch 查询
- ✅ 面向安全检测和告警
- ✅ YAML 规则格式（易于编写）
- ✅ 社区驱动的规则共享

**特色功能:**
- 📋 2000+ 社区检测规则
- 🔄 多种目标后端（Elasticsearch, Kibana KQL, Splunk 等）
- 🎯 基于 MITRE ATT&CK 的规则
- 🤖️ 开源的 sigmac 转换工具
- 📊 丰富的规则类别（Windows, Linux, Network, Web 等）

**最后更新:** 2025 年活跃维护

---

### 10. Elastic Detection Rules ⭐ **N/A** (Elastic 官方仓库)

**GitHub:** https://github.com/elastic/detection-rules

**项目简介:**
Elastic Security 检测引擎使用的官方规则仓库，包含开发、维护、测试和发布规则的完整工具链。

**技术栈:**
- **语言:** Python 3.12+
- **框架:** Elastic Security, Kibana
- **构建工具:** make, pip, pytest

**与当前项目相似点:**
- ✅ 基于 Elasticsearch 的安全检测
- ✅ 规则驱动的数据分析
- ✅ 预置规则和检测模板
- ✅ Python 工具链

**特色功能:**
- 📋 1000+ 预置检测规则
- 🤖️ MITRE ATT&CK 对齐
- 🔄 规则验证和测试工具
- 📊 自动规则打包和发布
- 🎯 支持自定义规则开发

**最后更新:** 2025 年活跃更新

---

### 11. OpenUBA ⭐ **~500**

**GitHub:** https://github.com/GACWR/OpenUBA

**项目简介:**
开源用户和实体行为分析（UEBA）框架，使用科学计算生态系统（Spark, Scikit-learn 等）进行行为分析。

**技术栈:**
- **语言:** Python
- **计算引擎:** Elasticsearch, Spark
- **ML:** Scikit-learn, PyTorch
- **许可证:** GPL-3.0

**与当前项目相似点:**
- ✅ 使用 Elasticsearch 作为计算引擎
- ✅ 用户行为分析（UBA）
- ✅ 异常检测和威胁狩猎
- ✅ 数据驱动的安全分析

**特色功能:**
- 🧠 机器学习异常检测
- 📊 用户行为画像
- 🎯 威胁狩猎支持
- 🔍 实时行为评分
- 🤖️ 支持多种数据源

**最后更新:** 项目较旧（最后更新约 2020 年），但功能独特

---

### 12. Fleet + osquery ⭐ **~12k** (Fleet 项目)

**GitHub:** https://github.com/fleetdm/fleet

**项目简介:**
Fleet 是开源的 osquery 管理平台，可配合 Elastic Stack 实现端点检测和响应（EDR）。

**技术栈:**
- **语言:** Go, JavaScript
- **框架:** osquery, Fleet server, Elastic Stack
- **部署:** Docker, Kubernetes

**与当前项目相似点:**
- ✅ 支持 Elasticsearch 作为日志目标
- ✅ 端点日志收集和分析
- ✅ 用户行为监控
- ✅ CLI 工具 + Web UI

**特色功能:**
- 🖥️ osquery 实时系统查询
- 📊 集中式设备管理
- 🚨 自动化查询包
- 🔄 支持 Elastic Stack 集成
- 📈 审计日志

**最后更新:** 2025-06-01（Fleet 4.26.0）

---

## 📈 对比总结表

| 项目 | Stars | 更新状态 | 与当前项目相似度 | 主要特色 |
|------|--------|----------|------------------|---------|
| **Wazuh** | 14.4k | ✅ 活跃 (2025) | ⭐⭐⭐ | 完整 SIEM/XDR, 2200+ 规则 |
| **OpenSearch Security Analytics** | 91 | ✅ 活跃 (2025-10) | ⭐⭐⭐⭐ | 2200+ Sigma 规则, 关联引擎 |
| **Elastic Security** | 14.4k+ | ✅ 活跃 (2025) | ⭐⭐⭐⭐⭐ | AI 驱动, 开放规则, ES|QL |
| **Graylog** | ~8.5k | ✅ 活跃 (2025-04) | ⭐⭐ | SIEM 功能, 支持 ES/OpenSearch |
| **ElastAlert2** | 844 | ✅ 活跃 (2025-04) | ⭐⭐⭐ | Python, 多种告警类型, Docker/K8s |
| **Security Onion** | ~4k | ✅ 活跃 (2025) | ⭐⭐⭐ | 完整 SOC 发行版, AI 集成 |
| **TheHive + Cortex** | 3.9k+1.5k | ✅ 活跃 (2025-11) | ⭐⭐⭐ | 事件响应, 100+ 分析器 |
| **Sigma** | 10k+ | ✅ 活跃 (2025) | ⭐⭐ | 通用规则格式, 2000+ 规则 |
| **Fleet** | ~12k | ✅ 活跃 (2025-06) | ⭐⭐⭐ | 端点检测, osquery 管理 |
| **HELK** | ~2.5k | ⚠️ 已归档 | ⭐⭐⭐⭐ | 威胁狩猎, Spark, Jupyter |
| **OpenUBA** | ~500 | ⚠️ 较旧 | ⭐⭐⭐ | 用户行为分析, ML 异常检测 |

---

## 🎯 推荐选择（基于当前项目特征）

### 与当前项目最相似的项目（按相似度排序）

1. **Wazuh** - 完整的 ELK Stack SIEM，与当前项目架构最接近
2. **ElastAlert2** - 纯 Python 告警工具，与当前项目的 CLI 工具模式类似
3. **OpenSearch Security Analytics** - 开源 SIEM，支持 Elasticsearch，功能全面
4. **Elastic Detection Rules** - Elastic 官方规则库，可集成到当前项目
5. **Graylog** - 支持 Elasticsearch，具有日志分析和报告功能

### 特色功能推荐（值得学习）

- **Sigma 规则体系** - 标准化检测规则，易于共享
- **事件关联引擎** - OpenSearch Security Analytics 的关联功能
- **AI 辅助分析** - Elastic Security 的 EASE 和 Security Onion 的 MCP 集成
- **行为分析** - OpenUBA 和 Elastic Behavioral Analytics

---

## 🚀 针对当前项目的具体建议

### 最值得集成的功能（按优先级）

#### 1. Sigma 规则体系 ⭐⭐⭐⭐⭐
- **优先级:** 最高
- **参考项目:** Sigma, ElastAlert2, OpenSearch Security Analytics
- **实施难度:** 中等
- **收益:**
  - 可直接使用 2000+ 社区检测规则
  - 标准化规则格式，易于维护和共享
  - 支持多平台转换（虽然只用于 ES）

#### 2. 实时告警系统 ⭐⭐⭐⭐
- **优先级:** 高
- **参考项目:** ElastAlert2, Wazuh, Graylog
- **实施难度:** 中等
- **收益:**
  - 自动化检测和通知
  - 多种告警渠道（Email, Slack, JIRA 等）
  - 规则驱动的告警逻辑

#### 3. 事件关联引擎 ⭐⭐⭐⭐
- **优先级:** 中高
- **参考项目:** OpenSearch Security Analytics, HELK
- **实施难度:** 较高
- **收益:**
  - 跨数据源链接发现
  - 复杂攻击场景检测
  - 提升检测准确率

#### 4. 用户行为分析（UBA）⭐⭐⭐
- **优先级:** 中
- **参考项目:** OpenUBA, Elastic Behavioral Analytics
- **实施难度:** 高
- **收益:**
  - 异常行为检测
  - 用户行为画像
  - 实时行为评分

#### 5. AI/ML 辅助分析 ⭐⭐⭐
- **优先级:** 中
- **参考项目:** Elastic Security (EASE), Security Onion
- **实施难度:** 高
- **收益:**
  - 智能威胁检测
  - 减少误报
  - 自动化分析

### 可直接复用的设计模式

#### 从 Wazuh 学习
- CLI 工具链的模块化设计
- 报告模板系统
- 配置管理模式

#### 从 ElastAlert2 学习
- YAML 规则配置格式
- 规则引擎架构
- 告警通知系统设计

#### 从 Elastic Detection Rules 学习
- 规则组织和版本管理
- 规则测试框架
- MITRE ATT&CK 对齐方式

#### 从 Graylog 学习
- 仪表板设计模式
- 日志流管理
- 查询构建器

---

## 📚 进一步研究方向

如需深入了解某个项目，可以：

1. **克隆项目仓库并分析源代码**
   - 查看具体实现细节（数据模型、API 设计）
   - 提取可复用的代码模式和最佳实践
   - 对比性能和可扩展性

2. **本地部署测试**
   - 体验功能特性和用户交互
   - 评估集成难度
   - 测试性能和资源消耗

3. **社区和文档**
   - 阅读官方文档和博客
   - 参与社区讨论
   - 了解最佳实践和常见问题

---

## 📝 附录

### 项目分类

**按功能分类:**
- **完整 SIEM 平台:** Wazuh, Elastic Security, Graylog, Security Onion
- **威胁狩猎平台:** HELK, Security Onion
- **规则引擎:** ElastAlert2, Sigma, Elastic Detection Rules
- **事件响应:** TheHive + Cortex
- **端点检测:** Fleet + osquery
- **行为分析:** OpenUBA, Elastic Behavioral Analytics

**按技术栈分类:**
- **纯 Python:** ElastAlert2, OpenUBA
- **多语言:** Wazuh, Elastic Security, Security Onion
- **Java:** Graylog, OpenSearch Security Analytics
- **Go:** Fleet

**按活跃度分类:**
- **活跃维护:** Wazuh, Elastic Security, Graylog, ElastAlert2, Security Onion, TheHive, Cortex, Sigma, Fleet
- **归档/较旧:** HELK, OpenUBA

---

**报告结束**

如需对某个项目进行深入分析或具体实施指导，请提出具体需求。
