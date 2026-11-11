---
title: 'Logging and Log Management'
description: 'What a good log message looks like, how to choose log levels, how syslog, journald and logread move logs on Linux and embedded devices, and how to decide what to collect, keep and alert on.'
pubDate: 'July 24 2025'
heroImage: '../../assets/logging.jpg'
category: 'Programming & Tools'
---

### Overview

---

A log is a time-ordered record of what a system did. When something breaks in the field, the log is often the only evidence you have, because you cannot attach a debugger to a device that is already in a customer's home or a data center.

Logging is easy to start and hard to do well. Too little, and a failure leaves no trace. Too much, and the useful lines drown in noise, fill the flash, and cost CPU. This post covers three questions:

1. **What** should a log message contain, and at which level?
2. **How** do logs travel from a process to a place where someone can read them?
3. **How long** should they be kept, and what should raise an alert?

---

### What Is Log Data?

---

A log message is the raw text. **Log data** is the information you extract from it: the *why* behind its creation. A web server that logs an authenticated page access can record the user name, which lets you trace who opened a given resource. A Wi-Fi AP that logs a station association can record the station MAC address, the band and the negotiated standard, which lets you trace why that client got a slow link.

A message is only useful if you can answer **who, what, when and where** from it:

| Question | Typical field |
|----------|---------------|
| When | Timestamp |
| Where | Host, process, function, line |
| What | Event description and its severity |
| Who / which object | User, MAC address, interface, session ID |

---

### Log Levels

---

Each level signals a different severity and serves a different purpose. Using them consistently is what makes logs actionable.

| Level | Purpose | Examples |
|---|---|---|
| **Debug** | Troubleshooting during development | Variable values, pointer addresses, execution flow |
| **Info** | Confirms normal system events | A STA connects, with its MAC address and supported standards |
| **Warning** | Abnormal but non-breaking conditions | Port disconnects, packet loss, a mesh device leaving the network |
| **Error** | A failure at some layer of the system | Null pointers, buffer sync failures, corrupted data |
| **Alert / Critical** | Threatens the continuity of the system | The core daemon fails to load its initial configuration |

---

**Syslog severities.** The standard syslog scale (RFC 5424) has eight levels. Most application code only uses the middle ones:

| Value | Name | Typical use |
|:-----:|------|-------------|
| 0 | Emergency | System is unusable |
| 1 | Alert | Act immediately |
| 2 | Critical | Critical condition, such as a hardware failure |
| 3 | Error | Operation failed |
| 4 | Warning | Something unexpected, but the system continues |
| 5 | Notice | Normal but significant event |
| 6 | Informational | Routine information |
| 7 | Debug | Developer detail |

---

A lower number is more severe. A threshold such as "log level 4" means "keep severities 0 to 4 and drop the rest".

**Choosing between Warning and Error.** The decision needs a good understanding of the full operational flow of your system. A useful rule: if the *current operation* failed, it is an error. If the operation succeeded but something looked wrong, it is a warning. Warnings often show the early signs of a larger problem, so do not dismiss them.

**Errors are a starting point, not a diagnosis.** An error line tells you *where* to start looking. Finding the root cause almost always needs more information: the lines before it, the state of the system, and sometimes a packet capture.

---

### Log Message Structure

---

Every log message carries three parts:

```
[TIMESTAMP]  [SOURCE]  [DATA]
```

A typical line from an embedded Linux access point looks like this:

```
Jul 24 10:15:32 ap1 hostapd: wlan0: STA aa:bb:cc:dd:ee:ff IEEE 802.11: associated (aid 1)
|<-- timestamp -->|host|<source>|<-------------------- data ------------------------>|
```

**Timestamp.** The exact moment the event was detected. If the clock is not synchronized at boot (for example, there is no internet access yet), timestamps are wrong, and the timeline you reconstruct during an incident is misleading. Two habits help:

* Synchronize time early (NTP), and log in **UTC** so that devices in different time zones line up.
* Use a monotonic clock, such as `CLOCK_MONOTONIC` or the kernel's `[ 12.345678]` timestamp, to order events inside one boot even when the wall clock jumps.

**Source.** The process name and the log level, and optionally the function name and line number. Function and line are valuable in development. In production, remove them to reduce noise and to avoid exposing details of the source code.

**Data.** The message itself. Too terse and it is useless (`failed`). Too verbose and it becomes noise. Each level calls for different content, and logging everything at the error level defeats the purpose of error monitoring.

---

### Writing Good Log Messages

---

| Do | Avoid |
|----|-------|
| State the event and the object: `assoc failed, sta=aa:bb:.., status=17` | Vague text: `something went wrong` |
| Include the **error code** and the reason | Only the word `error` |
| Use stable, greppable key=value pairs | Free-form sentences that change between releases |
| Log state **changes** (`link up`, `link down`) | Logging the same state every second |
| Rate-limit messages that can repeat in a loop | One line per packet at `info` level |
| Keep secrets out: no passwords, PSKs or session tokens | Dumping a whole structure that holds keys |

---

Two rules deserve more attention:

* **Never log secrets.** A debug log that prints a WPA passphrase or an EAPOL key is a vulnerability, because logs are copied to support tickets and forums.
* **Rate-limit.** A failure inside a loop can write thousands of lines per second, hide the first useful line, and wear out flash storage. Log the first occurrence, then a counter (`last message repeated 500 times`).

---

### How Log Data Is Collected

---

Devices emit a message whenever a defined condition is met. On Linux the path from a process to a reader has a few standard pieces:

| Component | Role |
|-----------|------|
| `printf`, `fprintf(stderr)` | Output to the console or to a file that the service manager captures |
| `syslog()` (libc) | Sends a message to the local syslog socket `/dev/log` |
| `rsyslog`, `syslog-ng` | Syslog daemons that filter, store and forward messages |
| `journald` | The systemd journal. A structured, indexed binary log, read with `journalctl` |
| `logd` / `logread` | The OpenWrt ring-buffer logger kept in RAM, read with `logread` |
| Kernel ring buffer | Kernel messages (`printk`), read with `dmesg` |

---

On an embedded device the log often goes to a **RAM ring buffer** first, because writing every line to flash would wear it out. The trade-off is that the buffer is lost at reboot. This matters most for crashes, which is why many products also keep a small persistent log, or save the last logs at panic time.

Useful commands:

```
dmesg -w                         # follow kernel messages
journalctl -u hostapd -f         # follow one systemd service
journalctl -p warning -b         # warnings and worse since boot
logread -f                       # follow the OpenWrt log
logger -p user.warning "test"    # write a message from a shell
```

---

#### Central logging

---

Devices forward their messages to a **loghost**, a central system (Unix or Windows) that aggregates logs from many sources. The classic protocol is syslog over UDP port 514. Plain UDP can lose messages, so use TCP or TLS (RFC 5425) when you need reliability and privacy.

Centralized logging gives you:

* A single place to search logs across the whole infrastructure.
* Reliable backup storage that survives the loss or compromise of one device. An attacker who gains root on a device can erase its local logs, but not the copy that was already forwarded.
* One consistent environment for analysis and alerting.

---

### Log Retention Policy

---

The retention policy decides the type, size, cost and access speed of the storage, and when logs are deleted. Look at four dimensions.

---

#### Compliance Requirements

---

Many industries set a minimum retention period. This is your floor.

* **PCI DSS** (requirement 10): keep audit logs for **12 months**, with at least **3 months** immediately available for analysis.
* **NERC CIP**: security event logs are kept for a minimum period, and the details depend on the log type.
* Other regulations say *what* to keep without saying *for how long*.

Check the current version of the standard that applies to you, because these periods change.

---

#### Organizational Risk

---

Insider threats and slow, careful intrusions often go unnoticed for months or years. If logs are part of your security posture, the retention window should match how long an investigation can take.

---

#### Log Source and Volume

---

Different sources produce very different volumes. A core firewall may generate so much data that 30 days is the practical limit unless a regulation forces more. Consider:

* Firewalls, servers, databases and web proxies.
* Custom applications, or unsupported operating systems with limited tooling.

---

#### Storage Options

---

| Medium | Cost | Speed | Caveats |
|---|---|---|---|
| Disk / SSD | High | Fast | Best for hot, active logs |
| Cloud storage | Variable | Fast | Scales easily, but access and egress cost money |
| RDBMS / log archive | Medium | Medium | Good for structured queries |
| WORM | Medium | Medium | Write once, so tamper-resistant |
| Tape | Low | Slow | Needs manual handling, poor for search |
| Optical (CD/DVD) | Very low | Slow | Degrades over many years, and formats become obsolete |

---

A common design is **tiered storage**: recent logs on fast storage for searching (hot), older logs on cheaper storage (warm), and the oldest compressed in an archive (cold).

---

#### Rotation on the device

---

Local logs also need a size limit, or they will fill the file system:

```
# /etc/logrotate.d/myapp
/var/log/myapp.log {
    size 1M        # rotate when the file reaches 1 MB
    rotate 4       # keep four old files
    compress
    missingok
    notifempty
}
```

On `journald`, set `SystemMaxUse=` in `journald.conf`. On OpenWrt, set the RAM buffer size with `log_size` in `/etc/config/system`.

---

### Log Management Principles

---

#### Collect Only What You Will Use

---

Give every log type a clear purpose: security analysis, troubleshooting or audit. Avoid the "collect it just in case" mindset. The same applies on the generating side: do not emit logs that nobody reads.

---

#### Retain Only as Long as Needed

---

Keep logs as long as they are operationally useful or legally required. Do not archive everything forever by default.

---

#### Log Liberally, Alert Selectively

---

Log volume can reach petabytes, but human attention does not scale. Alert only on conditions that need someone to act. Alerts that fire all the time teach people to ignore them.

> **Guiding philosophy:** *Log everything useful → store the significant errors → alert on actionable problems only.*

A practical alert has an owner, a threshold and a next step. "More than 5 failed logins in 1 minute from one source" is actionable. "An error occurred" is not.

---

#### Protect Logs Proportionally

---

Do not protect log data more heavily than your core business data. Reasonable measures are:

* Hash or sign logs (or chain the hashes) to detect tampering.
* Apply access controls that match the sensitivity of the content.
* Encrypt in transit when logs cross untrusted networks. Encryption at rest is often unnecessary unless the logs contain personal data.

---

#### Treat Logging as a Living System

---

Log sources, formats and content change as your stack changes. Build this into your process:

* Review retention policies and collection rules on a schedule.
* Update parsers and pipelines when a log format changes.
* Keep documentation of what is logged and why.

---

### Summary

---

1. A log message should answer who, what, when and where. It has a timestamp, a source and data.
2. Use levels consistently: debug for development, info for normal events, warning for odd but harmless conditions, error for failures, and alert for what threatens the system.
3. Keep clocks synchronized, never log secrets, and rate-limit anything that can repeat.
4. On Linux, messages flow through `syslog()` or `journald` and, on OpenWrt, through `logd` and `logread`. Forward them to a central loghost, and size the local buffers so that they do not wear out flash.
5. Choose retention from compliance, risk, volume and storage cost. Collect and keep only what you will use.
6. Log liberally, but alert only on problems that someone can act on.
