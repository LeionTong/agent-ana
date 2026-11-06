// ==================== ES整月数据查询方案 ====================
// 推荐使用方法1：索引通配符方案（性能最佳，语法简洁）

// ======= 方法1：索引通配符查询整月数据（推荐方案） =======

// 基本查询 - 查询2025年11月整月的风险应用运营数据数据
GET /logfmt_761_202511*/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "terms": {
            "field_values.risk_app_name": ["TeamViewer", "ToDesk", "向日葵"]
          }
        },
        {
          "range": {
            "timestamp": {
              "gte": "2025-11-01T00:00:00",
              "lte": "2025-11-30T23:59:59"
            }
          }
        }
      ]
    }
  },
  "sort": [
    {
      "timestamp": {
        "order": "desc"
      }
    }
  ],
  "size": 100
}

// 大数据量查询 - 使用scroll分页
// 第一次查询获取scroll_id
GET /logfmt_761_202511*/_search?scroll=1m
{
  "query": {
    "bool": {
      "must": [
        {
          "terms": {
            "field_values.risk_app_name": ["TeamViewer", "ToDesk", "向日葵"]
          }
        },
        {
          "range": {
            "timestamp": {
              "gte": "2025-11-01T00:00:00",
              "lte": "2025-11-30T23:59:59"
            }
          }
        }
      ]
    }
  },
  "sort": [
    {
      "timestamp": {
        "order": "desc"
      }
    }
  ],
  "size": 1000
}

// 后续查询使用scroll_id
// GET /_search/scroll
// {
//   "scroll": "1m",
//   "scroll_id": "从上一次查询获取的scroll_id"
// }

// 聚合查询统计 - 获取风险应用分布和每日趋势
GET /logfmt_761_202511*/_search
{
  "query": {
    "bool": {
      "filter": [
        {
          "range": {
            "timestamp": {
              "gte": "2025-11-01T00:00:00",
              "lte": "2025-11-30T23:59:59"
            }
          }
        }
      ]
    }
  },
  "aggs": {
    "risk_apps": {
      "terms": {
        "field": "field_values.risk_app_name",
        "size": 50
      }
    },
    "daily_counts": {
      "date_histogram": {
        "field": "timestamp",
        "calendar_interval": "1d",
        "format": "yyyy-MM-dd"
      }
    },
    "hourly_counts": {
      "date_histogram": {
        "field": "timestamp",
        "calendar_interval": "1h",
        "format": "yyyy-MM-dd HH:mm"
      }
    }
  },
  "size": 0
}

// ======= 快速查询其他月份 =======

// 查询2025年10月数据
// GET /logfmt_761_202510*/_search
// {
//   "query": {
//     "bool": {
//       "must": [
//         {
//           "terms": {
//             "field_values.risk_app_name": ["TeamViewer", "ToDesk", "向日葵"]
//           }
//         },
//         {
//           "range": {
//             "timestamp": {
//               "gte": "2025-10-01T00:00:00",
//               "lte": "2025-10-31T23:59:59"
//             }
//           }
//         }
//       ]
//     }
//   },
//   "size": 100
// }

// 查询2025年12月数据
// GET /logfmt_761_202512*/_search
// {
//   "query": {
//     "bool": {
//       "must": [
//         {
//           "terms": {
//             "field_values.risk_app_name": ["TeamViewer", "ToDesk", "向日葵"]
//           }
//         },
//         {
//           "range": {
//             "timestamp": {
//               "gte": "2025-12-01T00:00:00",
//               "lte": "2025-12-31T23:59:59"
//             }
//           }
//         }
//       ]
//     }
//   },
//   "size": 100
// }

// ======= JavaScript自动化查询工具 =======
// 位置：/opt/risk-app-ops/risk-app-ops_js-version/es-monthly-query.js
//
// 使用方法：
// 1. 进入项目目录
//    cd /opt/risk-app-ops/risk-app-ops_js-version
//
// 2. 查看帮助信息
//    node es-monthly-query.js --help
//
// 3. 基本查询（默认查询当前月份）
//    node es-monthly-query.js
//
// 4. 查询指定月份
//    node es-monthly-query.js 2025-11
//
// 5. 聚合查询
//    node es-monthly-query.js --type agg 2025-11
//
// 6. 自定义结果大小
//    node es-monthly-query.js --type basic --size 500 2025-10
//
// 7. 指定输出目录
//    node es-monthly-query.js --output ./reports --type agg 2025-11
//
// 查询结果将保存到 ./output/ 目录下，文件名为：
// es-[query-type]-query-[YYYY-MM]-[timestamp].json
//
// 示例输出：
// es-basic-query-2025-11-2025-01-04T10-30-15.json
// es-agg-query-2025-11-2025-01-04T10-30-20.json

