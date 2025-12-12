---
layout: post
title: "Denial of Service"
date: 2025-12-12 10:00:00 +0700
categories: [Hacking]
---

## What is a DoS Attack?

Denial of Service (DoS) is an attack on a computer or network that reduces, restricts, or prevents accessibility of system resources to its legitimate users

In a DoS attack, attackers flood the victim system with non-legitimate service requests or traffic to overload its resources

The impact of DoS attacks include loss of goodwill, network outages, financial losses, and operational disruptions

## LAB

# Synflood with metasploit

Thực hiện theo hướng dẫn trong lab guide

Các steps được tóm tắt như sau:

- Xác định cổng mở với nmap

- Sau đó dùng module **auxiliary/dos/tcp/synflood**

- Chu y co the spoofed source ip (random source IP)

- Truoc khi attack thi bat wireshark/tcpdump de xem goi tin

# Synflood with hping3

Thực hiện theo hướng dẫn trong lab guide

Câu lệnh hping3:

hping3 -S -p 3389 \--rand-source \--flood 192.168.111.112

Giải thích một số options của hping3:

-S :syn scan

-a: spoof với 1 source adress cố định

\--rand-source: spoof với nhiều random ip addres

-p 22 : port 22

\--flood

VD output:

Synflood vào port 80 của máy win7 32bit:

Synflood vào port 3389 máy Win7 32 bit

Synflood vào port 3389 máy Win7 64 bit (SP1)

So sánh version windows:

Win7 32b: (bản thấp hơn)

Win7 64b: =\> SP1

\- Có thể mở thêm các terminal khác để tiếp tục sử dụng kỹ thuật DoS này
để tấn công Victim hoặc sử dụng các máy khác để tấn công Victim

# Tấn công DOS dịch vụ SMB - Memory DoS (metasploit)

Trong Kali, mở Terminal, gõ lệnh sau để tăng số lượng concurrent opened
files của terminal đang mở:

root@kali:\~# **ulimit -n 65535**

hoặc

**ulimit -n unlimited**

Sau đó mở msfconsole, sử dụng module auxiliary/dos/smb/smb_loris:

root@kali:\~# **msfconsole -q**

msf \> **use auxiliary/dos/smb/smb_loris**

msf auxiliary(smb_loris) \> **set RHOST 192.168.111.112**

RHOST =\> **192.168.111.112**

msf auxiliary(smb_loris) \> **run**

- trong máy Win7, mở Task Manager, chuyển sang tab performance:

- Tắt tấn công:

\- Có thể mở thêm các terminal khác để tiếp tục sử dụng kỹ thuật DoS này
để tấn công Victim hoặc sử dụng các máy khác để tấn công Victim

# Tấn công DOS vào dịch vụ RDP của Windows 7

Trong Kali, bật msfconsole

Sử dụng Module sau trong metasploit:
**auxiliary/dos/windows/rdp/ms12_020_maxchannelids**

Set thông số RHOST, sau đó run máy Windows nếu có lỗ hổng này và RDP bật
thì sẽ bị crash (BSOD)

# Module HTTP Slowloris của metasploit

Sử dụng Msfconsole module auxiliary/dos/http/slowloris:

**use auxiliary/dos/http/slowloris**

**show info**

Hoạt động: chiếm dụng hết các connection của server, làm hết concurrent
connection pool =\> Webserver sẽ deny new connection

So sánh:

1.  set rhost là Win7 32bit (cài IIS) và chạy module, kiểm tra sau
    khoảng 15-30s, mở browser kiểm tra xem Webserver còn truy cập được
    không?

2.  Tương tự: set rhost là Metasploitable2 (cài Apache) và chạy module,
    kiểm tra sau khoảng 15-30s, mở browser kiểm tra xem Webserver còn
    truy cập được không?

# Tấn công DOS L7 - Slowloris với OWASP DOS Tool và metasploit

## Mục tiêu:  {#mục-tiêu}

\- Tấn công DOS vào dịch vụ HTTP (tấn công DOS dạng Application) bằng
cách khai thác lỗ hổng Slowloris.

\- Hacker khai thác lỗ hổng Slowloris bằng cách gửi các request không
hoàn chỉnh đến Webserver =\> Webserver phải dành ra nhiều slot trong
connection pool để đợi =\> Connection Pool của webserver sẽ bị Hacker
chiếm dụng hết =\> các user khác không truy cập được dịch vụ dù CPU hay
Bandwidth của máy chủ vẫn bình thường.

\- Link download tool HTTP Dos Tool cho windows:
<https://samsclass.info/123/proj14/HttpDosTool4.0.zip>

\- Trong Kali thì sử dụng module auxiliary/dos/http/slowloris

## Yêu cầu:

2 Máy ảo:

- Kali: sử dụng module auxiliary/dos/http/slowloris để tấn công DOS

- Win7: để chạy tool Owasp HTTP Dos Tool 4.0 để tấn công DOS

- Metasploitable2: Webserver

## Thực hiện:

1.  Mở Firefox, vào link sau để theo dõi status của apache service trên
    máy Metasploitable2 (máy M2):

http://10.1.1.49/server-status

Chú ý phần ...... là các free pool còn lại trong connection pool của
apache:

2.  SSH vào máy M2 (hoặc truy cập console), gõ lệnh "**top**" để theo
    dõi performance CPU, Memory của máy M2 (chú ý thông số idle CPU, vd
    98.4 id \~ CPU free 98.4%):

3.  Trong Win7 hoặc máy thật, mở browser, truy cập vào trang status ở
    máy M2 để xem tình trạng của Apache2. Vào các trang khác của M2 để
    test kết nối

4.  Trong máy Win7 VM, cài đặt tool Owasp HTTP Dos Tool 4.0 (trong thư
    mục addional tool)

Hoặc vào msfconsole trong kali và sử dụng module
auxiliary/dos/http/slowloris để tấn công DoS

5.  Thực hiện tấn công:

    a.  Trong máy Win7:

> Chạy HTTP Dos Tool 4.0. Cấu hình các tham số Connection, Connection
> Rate (có thể tùy biến để tìm ra max connection pool của webserver) -
> Sau đó bấm Attack để tấn công, đợi khoảng 30s =\> tiếp theo, ở các máy
> khác kiểm tra nếu kết nối đến web của M2 sẽ thấy không truy cập được
> do connection pool của Apache đã bị đầy

b.  Trong Kali:

> Vào msfconsole trong kali và sử dụng module
> auxiliary/dos/http/slowloris, cấu hình như sau rồi gõ lệnh run -j -z
> để thực hiện tấn công DoS:

6.  Theo dõi trang status (refresh trang status), chú ý phần ..... sẽ bị
    thay bằng RRRRRR do lúc nào connection pool đã bị đầy:

# Một số tool DOS khác:

## Impulse:

Tool tổng hợp một số kỹ thuật tấn công DOS:

<https://github.com/LimerBoy/Impulse/blob/master/README.md>

## Xerxes

<https://github.com/zanyarjamal/xerxes>

## hulk

download từ trang:

<https://packetstormsecurity.com/files/112856/HULK-Http-Unbearable-Load-King.html>

Cach su dung: python3 hulk.py http://urlsample.com
