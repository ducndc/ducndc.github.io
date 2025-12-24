---
layout: post
title: "Footprinting and Reconnaissance Lab Guide"
date: 2025-11-16 10:00:00 +0700
categories: [Hacking]
---

## 1. Overview

**Footprinting and Reconnaissance** là giai đoạn đầu tiên trong quá trình pentest, tập trung vào việc **thu thập thông tin công khai (OSINT)** về mục tiêu mà **không hoặc rất ít tương tác trực tiếp** với hệ thống.

Mục tiêu là xây dựng **bức tranh tổng thể** về tổ chức / cá nhân / website trước khi bước sang scanning và enumeration.

---

## 2. Lab Objectives

Sau khi hoàn thành lab này, bạn sẽ có thể:
- Thu thập thông tin từ các nguồn OSINT phổ biến
- Xác định domain, IP, công nghệ sử dụng
- Tìm dấu vết lịch sử của website
- Liên kết dữ liệu từ nhiều nguồn khác nhau

---

## 3. Lab Scope & Rules

⚠️ Chỉ thực hiện trên mục tiêu được phép (lab, máy ảo, website test).  
⚠️ Không thực hiện brute-force hay tấn công xâm nhập.

---

## 4. Reconnaissance Techniques

### 4.1 Shodan – Internet-wide Search Engine

![Shodan](/assets/img/networking/footprinting.png)

Shodan cho phép tìm kiếm:
- Thiết bị đang public trên Internet
- Open ports, services
- Banner dịch vụ

Ví dụ truy vấn:
```
apache country:VN
port:22 product:OpenSSH
```

---

### 4.2 Google Dorking & Gemini CLI

Ví dụ Google Dork:
```
site:example.com filetype:pdf
intitle:"index of"
```

Gemini CLI có thể hỗ trợ tóm tắt và phân tích dữ liệu OSINT.

---

### 4.3 DNS Enumeration – dnsdumpster

Dnsdumpster giúp liệt kê subdomain, IP và sơ đồ DNS.

---

### 4.4 Netcraft – Technology Fingerprinting

Netcraft dùng để xác định web server, OS, hosting provider.

---

### 4.5 Wayback Machine – Website History

Wayback Machine giúp xem phiên bản cũ của website, tìm endpoint đã bị xóa.

---

### 4.6 Username Enumeration – PeekYou

PeekYou hỗ trợ tìm dấu vết username và liên kết mạng xã hội.

---

### 4.7 Intelligence Search – IntelX

IntelX dùng để tìm dữ liệu bị leak, email, domain, hash.

---

### 4.8 OSINT Framework

![Google Search](/assets/img/hacking/search-google.png)

OSINT Framework là bản đồ tổng hợp các công cụ OSINT.

---

## 5. Information Correlation

Đối chiếu và xác thực thông tin từ nhiều nguồn để giảm dữ liệu nhiễu.

---

## 6. Lab Questions

1. Footprinting khác gì Scanning?
2. OSINT có giới hạn ở đâu?
3. Công cụ nào phù hợp để tìm subdomain?
4. Wayback Machine giúp ích gì?

---

## 7. Conclusion

Footprinting và Reconnaissance là nền tảng của mọi cuộc tấn công pentest.