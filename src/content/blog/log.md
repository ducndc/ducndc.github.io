---
title: 'Logging and Log Management'
description: 'Logging and Log Management'
pubDate: 'July 24 2025'
heroImage: '../../assets/logging.jpg'
---

# Log Management Guide

## What Is Log Data?

Log data is the meaningful information extracted from a log message — the *why* behind its generation. A web server logging authenticated page access might record a username, letting you trace who accessed a given resource.

## Log Levels

Each level signals a different severity and serves a distinct purpose. Using them correctly is what makes logs actionable.

| Level | Purpose | Examples |
|---|---|---|
| **Debug** | Troubleshooting during development | Variable values, pointer addresses, execution flow |
| **Info** | Confirms normal system events | STA connection with MAC address and supported standards |
| **Warning** | Abnormal but non-breaking conditions | Port disconnects, packet loss, mesh device leaving network |
| **Error** | Failure at some system layer | Null pointers, buffer sync failures, corrupted data |
| **Alert** | Critical — threatens system continuity | Core daemon failing to load initial config |

> **Note on Warnings vs. Errors:** Knowing which to use requires understanding your system's full operational flow. Warnings often surface early signs of larger issues — don't dismiss them.

> **Note on Errors:** Error logs are a starting point, not a diagnosis. Root-cause analysis almost always requires further investigation.

## Log Message Structure

Every log message contains three fields:

```
[TIMESTAMP]  [SOURCE]  [DATA]
```

**Timestamp**
The exact moment the event was detected. If the system clock isn't synchronized at boot (e.g., no internet access), timestamps may be inaccurate — leading to misleading timeline reconstructions during incident analysis.

**Source**
The process name and log level. May also include function name and line number. These are useful during development but should be stripped in production to reduce noise and avoid leaking source-code internals.

**Data**
The message content itself. Too terse and it's useless; too verbose and it becomes noise. Each log level calls for different content — logging everything at the error level, for instance, defeats the purpose of error monitoring.

## How Log Data Is Collected

Devices emit log messages whenever defined conditions are met. These are forwarded to a **loghost** — a centralized system (Unix or Windows) that aggregates logs from multiple sources.

Centralized logging gives you:
- A single location for logs across your entire infrastructure
- Reliable backup storage
- A consistent environment for analysis and alerting

## Log Retention Policy

Retention policy decisions drive storage type, size, cost, access speed, and deletion schedules. Evaluate these four dimensions:

#### 1. Compliance Requirements

Many industries mandate minimum retention windows. These set your floor — don't go below them.

- **PCI DSS** (section 10.7): 1 year
- **NERC**: Varies by log type
- Other regulations may specify *what* to keep without specifying *how long*

#### 2. Organizational Risk

Insider threats often go undetected for years. If logs are part of your security posture, retention windows need to reflect that investigation timelines can be long.

#### 3. Log Source and Volume

Different sources produce vastly different volumes. A core firewall may generate logs large enough that 30 days is the practical ceiling without compliance forcing otherwise. Factor in:

- Firewalls, servers, databases, web proxies
- Custom applications or unsupported OSes with limited tooling

#### 4. Storage Options

| Medium | Cost | Speed | Caveats |
|---|---|---|---|
| Disk / SSD | High | Fast | Best for hot/active logs |
| Cloud storage | Variable | Fast | Scalable, access-cost dependent |
| RDBMS / log archive | Medium | Medium | Good for structured querying |
| WORM | Medium | Medium | Tamper-resistant |
| Tape | Low | Slow | Requires manual handling; poor for search |
| Optical (CD/DVD) | Very low | Slow | Degrades over multi-year windows; formats go obsolete |

---

## Log Management Principles

#### Collect Only What You'll Use

Define a clear purpose for every log type — security analysis, troubleshooting, auditing. Avoid "collect it just in case" thinking. The same applies to generation: don't emit logs that no one reads.

#### Retain Only as Long as Needed

Keep logs for as long as they're operationally useful or legally required. Don't archive everything indefinitely by default.

#### Log Liberally, Alert Selectively

Log volume can reach petabytes; human attention can't scale to match it. Alert only on conditions that require action.

> **Guiding philosophy:** *Log everything → store significant errors → alert on actionable problems only.*

#### Protect Logs Proportionally

Don't secure log data more heavily than your core business data. Reasonable practices:

- Hash logs to detect tampering
- Apply access controls appropriate to sensitivity
- Encryption is rarely necessary

#### Treat Logging as a Living System

Log sources, formats, and content evolve as your stack changes. Build this into your process:

- Periodically review retention policies and collection rules
- Update pipelines when log formats change
- Keep documentation on what's being logged and why