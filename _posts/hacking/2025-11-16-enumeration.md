---
layout: post
title: "Enumeration Lab Guide"
date: 2025-11-16 10:00:00 +0700
categories: [Hacking]
---

## 1. Overview

Enumeration là giai đoạn **sau Scanning**, tập trung vào việc **trích xuất thông tin chi tiết** từ các dịch vụ đang chạy trên hệ thống mục tiêu.  
Mục tiêu của lab này là thực hành enumeration với **SNMP** và **Metasploit**.

---

## 2. Lab Objectives

Sau khi hoàn thành lab, bạn sẽ có thể:
- Xác định dịch vụ SNMP đang hoạt động
- Thu thập thông tin hệ thống qua SNMP
- Enumeration process bằng Nmap
- Sử dụng Metasploit để hỗ trợ enumeration

---

## 3. Lab Environment

| Thành phần | Mô tả |
|----------|------|
| Attacker | Kali Linux |
| Target | Máy ảo Linux / Windows có bật SNMP |
| Network | NAT / Host-only |

---

## 4. Enumeration với SNMP

### 4.1 Kiểm tra SNMP port

SNMP thường chạy trên cổng **UDP 161**.

```bash
nmap -sU -p 161 <target-ip>
```

Nếu port mở, tiếp tục enumeration.

---

### 4.2 SNMP Enumeration bằng `snmp-check`

```bash
snmp-check <target-ip>
```

Thông tin có thể thu được:
- System name & description
- User account
- Network interface
- Process đang chạy
- Routing table

---

### 4.3 Enumeration process bằng Nmap

```bash
nmap -sV --script snmp-processes <target-ip>
```

---

## 5. Enumeration bằng Metasploit

### 5.1 Khởi động Metasploit

```bash
msfconsole
```

---

### 5.2 Tìm module SNMP

```bash
search snmp
```

---

### 5.3 Chạy module enumeration

```bash
use auxiliary/scanner/snmp/snmp_enum
set RHOSTS <target-ip>
run
```

---

## 6. Post-Enumeration Analysis

Sau khi enumeration, cần:
- Ghi chú lại service và version
- Xác định thông tin nhạy cảm
- Đánh giá khả năng khai thác tiếp theo

---

## 7. Lab Questions

1. SNMP community string mặc định là gì?
2. Những thông tin nào có thể bị lộ qua SNMP?
3. Enumeration khác gì scanning?
4. Kết quả enumeration giúp ích gì cho exploitation?

---

## 8. Conclusion

Enumeration là bước **cầu nối quan trọng** giữa scanning và exploitation.  
SNMP là dịch vụ thường bị bỏ qua nhưng lại mang giá trị thông tin rất cao nếu cấu hình yếu.