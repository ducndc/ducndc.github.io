---
layout: post
title: "Social Engineering Attacks"
date: 2025-12-12 10:00:00 +0700
categories: [Hacking]
tags: [social-engineering, phishing, psychology, awareness]
toc: true
pin: true
excerpt: "Overview of human‑centric attacks and tools such as SET that simulate them."
---

# Understanding Social Engineering Attacks
{: #overview}

Social engineering is the art of manipulating people's psychology to reveal confidential information or perform actions that benefit the attacker.

---

## 1. Common Types of Social Engineering

### A. Impersonation
Attackers take on a false identity (e.g. IT helpdesk, delivery driver) to gain trust.

- **Channels:** In person, telephone, or online chat.
- **Goal:** Obtain credentials, access badges, or confidential documents.

Typical examples include calling an employee and asking them to reset their password.

### B. Phishing
Using fraudulent emails or websites to trick victims into revealing credentials or clicking malware links.

#### Common varieties
- **Spear phishing:** Customized messages targeting specific individuals.
- **Whaling:** Attacks aimed at high‑value targets such as executives.
- **Pharming:** DNS/system compromise redirects traffic to fake sites.
- **Smishing/Spim:** SMS or instant‑message based phishing.

#### Supporting tools
- **Social-Engineer Toolkit (SET):** Generates email templates, site clones, and payloads.
- **ShellPhish:** Automates creation of phishing web pages.

```bash
# example SET command to clone a site
setoolkit
# choose Social‑Engineering Attacks → Website Attack Vectors → Credential Harvester
```

---

## 2. Computer‑Based Variations
These methods leverage technical interfaces to manipulate victims:

- **Fake pop‑ups** claiming viruses or required updates.
- **Hoax/chain emails** with sensational content or false promises.
- **Malicious instant messages** with click‑bait links.
- **Spam** containing attachments or links to malware.
- **Scareware:** alarming alerts that coerce installation of rogue software.

The goal is the same: bypass rational analysis by exploiting emotion or urgency.

---

## 3. Hands‑On with the Social‑Engineer Toolkit (SET)
SET (included in Kali) can simulate a variety of social engineering attacks.

- **Web clone (credential harvester):** copies a legitimate login page and logs submitted credentials.
- **Mass mailer:** sends phishing emails using a template.
- **SMS spoofing (smishing).**

Example flow:
```bash
sudo setoolkit
# [1] Social‑Engineering Attacks → [2] Website Attack Vectors
# [3] Credential Harvester → [4] HTTP Server
```

Be careful: the cloned site will prompt for login details and store them in `/var/www/html/`.

---

## 4. Mobile Application Attacks
Users often trust official app stores; attackers can abuse this trust by:

- **Publishing malicious apps** that request excessive permissions or contain spyware.
- **Repackaging legitimate apps** with hidden backdoors and redistributing them via third‑party markets.

![Malicious App](/assets/img/hacking/publishing_malicious.png)

> Always verify app signatures and use official stores when possible.

---

## 5. Lab Questions

1. How does spear phishing differ from generic phishing?
2. What psychological principles are often exploited in social engineering?
3. Why is SET useful for defenders as well as attackers?

---

> **Disclaimer:** Use this information to recognise and defend against attacks. Unauthorized social engineering is illegal and unethical.

---*Note: This document is for educational purposes and to raise awareness about information security.*