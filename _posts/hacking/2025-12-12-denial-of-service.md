---
layout: post
title: "Denial of Service (DoS) Lab Guide"
date: 2025-12-12 10:00:00 +0700
categories: [Hacking]
---

# Tìm hiểu về Tấn công Denial of Service (DoS)

## 1. Tổng quan về DoS Attack
Denial of Service (DoS) là hình thức tấn công vào hệ thống máy tính hoặc mạng nhằm làm giảm, hạn chế hoặc ngăn cản người dùng hợp lệ truy cập vào các tài nguyên hệ thống.

* **Cơ chế:** Kẻ tấn công làm tràn ngập hệ thống nạn nhân bằng các yêu cầu dịch vụ không hợp lệ hoặc lưu lượng truy cập ảo để gây quá tải tài nguyên.
* **Tác động:** Bao gồm mất uy tín, ngừng trệ mạng lưới, tổn thất tài chính và gián đoạn vận hành doanh nghiệp.



---

## 2. Thực hành Lab (LAB Procedures)

### A. TCP SYN Flood
Cuộc tấn công này khai thác quá trình bắt tay 3 bước của TCP để làm cạn kiệt tài nguyên kết nối của mục tiêu.



#### Cách 1: Sử dụng Metasploit
* **Bước 1:** Quét các cổng đang mở bằng **Nmap**.
* **Bước 2:** Sử dụng module `auxiliary/dos/tcp/synflood`.
* **Đặc điểm:** Hỗ trợ giả mạo IP nguồn (random source IP).
* **Lưu ý:** Khởi động Wireshark hoặc tcpdump trước khi tấn công để quan sát gói tin.

#### Cách 2: Sử dụng hping3
Cú pháp lệnh thực thi:
`hping3 -S -p 3389 --rand-source --flood 192.168.111.112`

**Giải thích các tùy chọn (Options):**
| Tham số | Ý nghĩa |
| :--- | :--- |
| `-S` | Quét kiểu đồng bộ (SYN scan) |
| `-a` | Giả mạo với một địa chỉ nguồn cố định |
| `--rand-source` | Giả mạo bằng nhiều địa chỉ IP nguồn ngẫu nhiên |
| `-p` | Cổng mục tiêu (Ví dụ: 22 cho SSH, 3389 cho RDP) |
| `--flood` | Gửi gói tin liên tục với tốc độ cao nhất (flood) |

---

### B. SMB Service DoS - Memory DoS (Metasploit)
Tấn công vào dịch vụ chia sẻ file (SMB) để gây cạn kiệt bộ nhớ của hệ thống mục tiêu.

1. **Tại máy Kali:** Tăng giới hạn số lượng file mở đồng thời:
   `ulimit -n 65535` hoặc `ulimit -n unlimited`.
2. **Sử dụng Metasploit:**
   - `use auxiliary/dos/smb/smb_loris`
   - `set RHOST 192.168.111.112`
   - `run`
3. **Kiểm chứng:** Trên máy Windows 7, mở **Task Manager > Performance** để quan sát tài nguyên.

---

### C. DoS Attack trên dịch vụ RDP (Windows 7)
Khai thác lỗ hổng MS12-020 để gây lỗi hệ thống (màn hình xanh - BSOD).

* **Module:** `auxiliary/dos/windows/rdp/ms12_020_maxchannelids`.
* **Yêu cầu:** Máy mục tiêu chưa vá lỗi và đã bật dịch vụ Remote Desktop (RDP).
* **Kết quả:** Hệ thống sẽ bị crash (BSOD) nếu có lỗ hổng.

---

### D. HTTP Slowloris - Tấn công tầng ứng dụng (L7)
Kỹ thuật này giữ các kết nối HTTP ở trạng thái mở bằng cách gửi các yêu cầu không hoàn chỉnh, làm cạn kiệt connection pool của Web Server.



#### Thực hiện qua Metasploit
* **Module:** `auxiliary/dos/http/slowloris`.
* **Cơ chế:** Độc chiếm mọi kết nối khả dụng, khiến Web Server từ chối các kết nối mới.
* **Kiểm tra:** Thử nghiệm trên **IIS (Win7)** và **Apache (Metasploitable2)**. Kiểm tra khả năng truy cập website sau 15-30 giây.

#### Thực hiện qua OWASP DoS Tool
1. **Theo dõi:** Truy cập `http://[IP_M2]/server-status` trên máy M2 để xem các slot trống (dấu `.`).
2. **Giám sát:** Sử dụng lệnh `top` trên máy M2 để theo dõi CPU Idle.
3. **Thực hiện:** Chạy **HTTP Dos Tool 4.0** trên máy Windows 7.
4. **Kết quả:** Khi connection pool đầy (hiển thị chữ `R`), website sẽ không thể truy cập.

---

## 3. Các công cụ DoS phổ biến khác

| Tên công cụ | Đặc điểm | Nguồn tham khảo |
| :--- | :--- | :--- |
| **Impulse** | Kết hợp nhiều kỹ thuật tấn công DoS | [GitHub](https://github.com/LimerBoy/Impulse) |
| **Xerxes** | Công cụ tấn công HTTP mạnh mẽ | [GitHub](https://github.com/zanyarjamal/xerxes) |
| **HULK** | Tấn công HTTP Unbearable Load King | [Packet Storm](https://packetstormsecurity.com/files/112856/HULK-Http-Unbearable-Load-King.html) |

---
*Lưu ý: Tài liệu này chỉ phục vụ mục đích học tập và thử nghiệm trong môi trường giả lập an toàn.*