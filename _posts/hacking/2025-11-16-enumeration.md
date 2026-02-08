---
Layout: post
Title: "Enumeration Lab Guide"
Date: 2025-11-16 10:00:00 +0700
Categories: [Hacking]
---

## 1. Overview

Enumeration is the **post-scanning** phase, focusing on **extracting detailed information** from services running on the target system.

The goal of this lab is to practice enumeration with **SNMP** and **Metasploit**.

---

## 2. Lab Objectives

After completing this lab, you will be able to:
- Identify active SNMP services
- Gather system information via SNMP
- Enumerate processes using Nmap
- Use Metasploit to support enumeration

---

## 3. Lab Environment

| Components | Description |

| Attacker | Kali Linux |

| Target | Linux/Windows Virtual Machine with SNMP Enabled |

| Network | NAT/Host-only |

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