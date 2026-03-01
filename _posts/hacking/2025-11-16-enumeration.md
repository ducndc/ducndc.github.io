---
layout: post
title: "Service Enumeration Techniques"
subtitle: "Using SNMP and Metasploit to extract detailed service information"
date: 2025-11-16 10:00:00 +0700
categories: [Hacking]
tags: [enumeration, snmp, metasploit, pentest]
author: Chung Duc Nguyen Dang
description: >
  Detailed lab guide on enumeration using SNMP tools and Metasploit modules to gather sensitive
  information from services after scanning.
toc: true
pin: true
---

## 1. Overview
{: #overview }

Enumeration is the post-scanning phase, focusing on extracting detailed information from services
running on a target system. This lab emphasizes SNMP enumeration and basic Metasploit usage.

---

## 2. Lab Objectives
{: #lab-objectives }

After completing this lab you will be able to:

- Identify active SNMP services and community strings
- Retrieve system information via SNMP
- Enumerate processes and configuration using NSE
- Use Metasploit auxiliary modules for enumeration

---

## 3. Lab Environment
{: #lab-environment }

| Component | Description |
|-----------|-------------|
| Attacker  | Kali Linux |
| Target    | Linux/Windows VM with SNMP enabled |
| Network   | NAT/Host-only virtual network |

---



## 4. Enumeration with SNMP

### 4.1 Checking SNMP Port

SNMP usually runs on **UDP port 161**.

```bash
nmap -sU -p 161 <target-ip>
```

If the port is open, continue enumeration.

---

### 4.2 SNMP Enumeration with `snmp-check`

```bash
snmp-check <target-ip>
```

Information that can be obtained:
- System name & description
- User accounts
- Network interface
- Process is running
- Routing table

---

### 4.3 Enumeration process using Nmap

```bash
nmap -sV --script snmp-processes <target-ip>
```

---

## 5. Enumeration using Metasploit

### 5.1 Start Metasploit

```bash
msfconsole
```

---

### 5.2 Find the SNMP module

```bash
search snmp
```

---

### 5.3 Run the enumeration module

```bash
use auxiliary/scanner/snmp/snmp_enum
set RHOSTS <target-ip>
run
```

---
## 6. Post-Enumeration Analysis

After enumeration, you need to:

- Note the service and version

- Identify sensitive information

- Evaluate the potential for further exploitation

---

## 7. Lab Questions

1. What is the default SNMP community string?

2. What information can be leaked through SNMP?

3. How is enumeration different from scanning?

4. How do enumeration results help in exploitation?

---
## 8. Conclusion

Enumeration is a **crucial bridge** between scanning and exploitation.

SNMP is a service that is often overlooked but carries very high informational value if configured poorly.