---
Layout: post
Title: "Footprinting and Reconnaissance Lab Guide"
Date: 2025-11-16 10:00:00 +0700
Categories: [Hacking]

---

## 1. Overview

**Footprinting and Reconnaissance** is the first stage in the pentest process, focusing on **collecting publicly available information (OSINT)** about the target that **has little or no direct interaction** with the system.

The goal is to build a **overall picture** of the organization/individual/website before moving on to scanning and enumeration.

---

## 2. Lab Objectives

After completing this lab, you will be able to:
- Gather information from common OSINT sources
- Identify domains, IP addresses, and technologies used

- Trace the history of a website

- Link data from various sources

---

## 3. Lab Scope & Rules

⚠️ Only perform this on authorized targets (lab, virtual machine, test website).

⚠️ Do not perform brute-force or intrusion attacks.

---

## 4. Reconnaissance Techniques

### 4.1 Shodan – Internet-Wide Search Engine

![Shodan](/assets/img/networking/footprinting.png)

Shodan allows searching for:
- Devices publicly accessible on the Internet
- Open ports, services
- Service banners

Example query:
```
apache country:VN
port:22 product:OpenSSH
```

---
### 4.2 Google Dorking & Gemini CLI

Example Google Dorking:
```
site:example.com filetype:pdf
intitle:"index of"

```

Gemini CLI can support summarizing and analyzing OSINT data.

---

### 4.3 DNS Enumeration – dnsdumpster

Dnsdumpster helps list subdomains, IPs, and DNS schemes.

---

### 4.4 Netcraft – Fingerprinting Technology

Netcraft is used to identify web servers, operating systems, and hosting providers.

---

### 4.5 Wayback Machine – Website History

Wayback Machine helps view older versions of websites and find deleted endpoints.

---

### 4.6 Username Enumeration – PeekYou

PeekYou helps find traces of usernames and social media links.

---

### 4.7 Intelligence Search – IntelX

IntelX is used to find leaked data, emails, domains, and hashes.

---

### 4.8 OSINT Framework

![Google Search](/assets/img/hacking/search-google.png)

OSINT Framework is a comprehensive map of OSINT tools.

---

## 5. Information Correlation

Compares and verifies information from multiple sources to reduce data noise.

---

## 6. Lab Questions

1. How is Footprinting different from Scanning?

2. What are the limitations of OSINT?

3. What tools are suitable for finding subdomains?

4. How is Wayback Machine useful?

---

## 7. Conclusion

Footprinting and Reconnaissance are the foundation of all pentest attacks.