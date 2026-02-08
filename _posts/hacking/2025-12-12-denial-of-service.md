---
Layout: post
Title: "Denial of Service (DoS) Lab Guide"
Date: 2025-12-12 10:00:00 +0700
Categories: [Hacking]

---
# Understanding Denial of Service (DoS) Attacks

## 1. Overview of DoS Attacks

Denial of Service (DoS) is a type of attack on a computer system or network aimed at reducing, restricting, or preventing legitimate users from accessing system resources.

* **Mechanism:** The attacker floods the victim's system with invalid service requests or virtual traffic to overload resources.

* **Impact:** Includes reputational damage, network downtime, financial losses, and business operational disruption.

---

## 2. Lab Procedures

### A. TCP SYN Flood
This attack exploits the TCP 3-way handshake to exhaust the target's connection resources.

#### Method 1: Using Metasploit
* **Step 1:** Scan open ports using **Nmap**.

* **Step 2:** Use the `auxiliary/dos/tcp/synflood` module.

* **Features:** Supports random source IP spoofing.

* **Note:** Start Wireshark or tcpdump before the attack to observe packets.

#### Method 2: Using hping3
Execution command syntax:
`hping3 -S -p 3389 --rand-source --flood 192.168.111.112`

**Explanation of Options:**

| Parameters | Meaning |

| :--- | :--- |

| `-S` | Synchronous scan (SYN scan) |

| `-a` | Spoofing with a fixed source address |

| `--rand-source` | Spoofing with multiple random source IP addresses |

| `-p` | Target port (Example: 22 for SSH, 3389 for RDP) |

| `--flood` | Sending packets continuously at maximum speed (flood) |

---

### B. SMB Service DoS - Memory DoS (Metasploit)
Attacks the shared file service (SMB) to exhaust the target system's memory.

1. **On the Kali machine:** Increase the limit on the number of files opened simultaneously:

`ulimit -n 65535` or `ulimit -n unlimited`.

2. **Using Metasploit:**

- `use auxiliary/dos/smb/smb_loris`

- `set RHOST 192.168.111.112`

- `run`
3. **Verification:** On a Windows 7 machine, open **Task Manager > Performance** to observe resources.

---

### C. DoS Attack on RDP service (Windows 7)
Exploits the MS12-020 vulnerability to cause system errors (Blue Screen of Death - BSOD).

* **Module:** `auxiliary/dos/windows/rdp/ms12_020_maxchannelids`.

* **Requirements:** The target machine is unpatched and Remote Desktop (RDP) is enabled.

* **Result:** The system will crash (BSOD) if the vulnerability is present.

---

### D. HTTP Slowloris - Application Layer Attack (L7)
This technique keeps HTTP connections open by sending incomplete requests, exhausting the Web Server's connection pool.

#### Execution via Metasploit
* **Module:** `auxiliary/dos/http/slowloris`.

* **Mechanism:** Monopolizes all available connections, causing the Web Server to reject new connections.

* **Testing:** Tested on **IIS (Win7)** and **Apache (Metasploitable2)**. Check website accessibility after 15-30 seconds.

#### Performed via OWASP DoS Tool
1. **Monitoring:** Access `http://[IP_M2]/server-status` on machine M2 to see empty slots (the dot `.`).

2. **Supervising:** Use the `top` command on machine M2 to monitor CPU Idle.

3. **Execution:** Run **HTTP Dos Tool 4.0** on a Windows 7 machine.

4. **Result:** When the connection pool is full (displays the letter `R`), the website will be inaccessible.

---

## 3. Other Popular DoS Tools

| Tool Name | Characteristics | References |

| :--- | :--- | :--- |

| **Impulse** | Combines multiple DoS attack techniques | [GitHub](https://github.com/LimerBoy/Impulse) |

| **Xerxes** | Powerful HTTP Attack Tool | [GitHub](https://github.com/zanyarjamal/xerxes) |

| **HULK** | HTTP Attack on Unbearable Load King | [Packet Storm](https://packetstormsecurity.com/files/112856/HULK-Http-Unbearable-Load-King.html) |

---
*Note: This document is for educational and testing purposes only in a safe simulated environment.*