---
title: 'Cấu Hình Mạng Trong OpenWrt'
description: 'Cấu Hình Mạng Trong OpenWrt'
pubDate: 'Jun 30 2026'
heroImage: '../../assets/AP_Sys.png'
---

OpenWrt sử dụng hệ thống cấu hình **UCI (Unified Configuration Interface)** — toàn bộ cấu hình hệ thống được lưu dưới dạng các file text đơn giản trong `/etc/config/`. Đây là điểm khác biệt lớn so với firmware router thông thường (vốn cấu hình ẩn trong NVRAM hoặc binary).

Các file cấu hình liên quan trực tiếp đến mạng:

| File | Vai trò |
|---|---|
| `/etc/config/network` | Định nghĩa interface, device, bridge, VLAN, routing cơ bản |
| `/etc/config/wireless` | Cấu hình radio, SSID, bảo mật wifi |
| `/etc/config/firewall` | Zone, rule, NAT, port forwarding |
| `/etc/config/dhcp` | DHCP server/client, DNS (dnsmasq), IPv6 RA (odhcpd) |

Mỗi thay đổi trong các file này cần `/etc/init.d/<service> reload` hoặc `reload_config` để áp dụng (hoặc dùng lệnh `uci commit` + `uci` CLI thay vì sửa file trực tiếp).

---

### File `/etc/config/network`

#### Khái niệm cốt lõi: Device vs Interface

OpenWrt (từ bản 21.02 trở đi) tách biệt rõ hai khái niệm:

- **`config device`**: đại diện cho lớp 2 (Layer 2) — cổng vật lý, bridge, VLAN sub-interface. Đây là "phần cứng logic".
- **`config interface`**: đại diện cho lớp 3 (Layer 3) — gán giao thức (static/dhcp/pppoe...), địa chỉ IP lên trên một device.

Một device có thể không có interface nào gán lên nó (ví dụ cổng LAN cắm switch không cần IP riêng), và một interface luôn phải trỏ tới một device.

#### Các loại `proto` (giao thức) phổ biến cho interface

- `static`: IP cố định, khai báo `ipaddr`, `netmask`, `gateway` thủ công. Thường dùng cho LAN hoặc AP nối router chính.
- `dhcp`: tự động xin IPv4 từ DHCP server upstream. Thường dùng cho WAN.
- `dhcpv6`: xin IPv6 từ upstream (đi kèm dhcp cho dual-stack).
- `pppoe`: quay số PPPoE — phổ biến với hạ tầng FTTH Việt Nam (cần username/password do ISP cấp).
- `relay`: dùng cho mô hình relay (relayd) — bắc cầu giữa 2 mạng layer-2 không thể bridge trực tiếp (ví dụ một bên là wifi client, một bên là LAN có dây).
- `none`: device không gán IP, chỉ tồn tại ở layer 2 (dùng cho cổng switch thuần).

#### Bridge

```
config device
    option name 'br-lan'
    option type 'bridge'
    list ports 'eth0'
    list ports 'eth1'
```

Bridge gộp nhiều cổng vật lý (và/hoặc wifi interface) thành một broadcast domain layer-2 duy nhất — về bản chất hoạt động như một switch ảo. Đây là cơ chế đứng sau hầu hết các thiết lập LAN trên OpenWrt: nhiều cổng dây + nhiều SSID wifi cùng đổ vào một bridge sẽ nằm chung một dải IP.

Các tham số STP (`stp`, `forward_delay`, `hello_time`, `ageing_time`, `max_age`, `priority`) dùng để chống loop mạng khi có nhiều đường nối vòng giữa các switch/AP.

#### VLAN

OpenWrt hỗ trợ 2 cách khai báo VLAN:

**a) VLAN trên switch chip cũ (DSA legacy / swconfig)** — ít gặp ở thiết bị mới.

**b) VLAN theo kiểu DSA hiện đại** (phổ biến trên thiết bị mới), có 2 dạng:

- *Tagged sub-interface trên 1 cổng*: `eth1.2` nghĩa là VLAN ID 2 trên cổng `eth1`. Thường dùng khi ISP yêu cầu gắn tag VLAN cho dịch vụ Internet (ví dụ VLAN 2 cho Internet, VLAN 35 cho IPTV — phổ biến ở các nhà mạng Việt Nam).
- *Bridge VLAN filtering* (`config bridge-vlan`): khai báo VLAN ngay trên bridge, chỉ định cổng nào tagged (`t`), untagged (`u`), hoặc primary untagged (`u*`):

```
config bridge-vlan
    option device 'br-wan'
    option vlan '2'
    list ports 'eth1:u*'
```

Cách này cho phép một bridge phục vụ nhiều VLAN cùng lúc, mỗi VLAN tách thành một interface logic riêng (`br-wan.2`) để gán IP/giao thức.

#### Routing & Globals

```
config globals 'globals'
    option ula_prefix 'fdxx:xxxx:xxxx::/48'
    option _wan_defroute 'wan'
```

- `ula_prefix`: dải địa chỉ IPv6 nội bộ (Unique Local Address) tự sinh, dùng khi không có IPv6 từ ISP hoặc cho định tuyến nội bộ.
- Default route được xác định bởi interface nào có `option defaultroute '1'` và metric thấp nhất khi có nhiều interface đều có khả năng ra Internet.

---

### File `/etc/config/wireless`

#### `wifi-device`: cấu hình radio vật lý

Mỗi radio (chip wifi) là một `wifi-device`, chứa các tham số tần số, kênh, công suất:

- `band`: `2.4G` hoặc `5G` (thiết bị Wi-Fi 6E/7 có thể thêm `6G`).
- `channel`: cố định hoặc `auto` (kích hoạt ACS – Auto Channel Selection).
- `htmode`: độ rộng kênh và chuẩn — ví dụ `HT20/40` (Wi-Fi 4), `VHT80` (Wi-Fi 5), `HE80` (Wi-Fi 6), `EHT160` (Wi-Fi 7).
- `country`: mã quốc gia, quyết định danh sách kênh và công suất phát hợp lệ theo luật sở tại.
- `txpower`: công suất phát (đơn vị dBm hoặc %, tùy driver).

#### `wifi-iface`: SSID ảo trên radio

Một radio có thể phát nhiều SSID cùng lúc (multi-SSID/multi-BSSID):

- `mode`: `ap` (phát sóng), `sta` (đóng vai client, dùng cho repeater/mesh backhaul), `mesh` (802.11s), `monitor`.
- `network`: SSID này gán vào interface mạng (layer-3) nào đã khai báo ở `/etc/config/network` — quyết định client của SSID đó rơi vào dải IP/VLAN nào.
- `encryption`: kiểu bảo mật — `none`, `psk2` (WPA2-PSK), `psk2+ccmp`, `sae` (WPA3), `sae-mixed` (WPA2/WPA3 hỗn hợp để tương thích ngược).
- `ieee80211r`: Fast BSS Transition (roaming nhanh giữa các AP cùng hệ thống).
- `ieee80211k`/`ieee80211v`: hỗ trợ client đo đạc và được "gợi ý" chuyển AP tốt hơn (band steering, roaming thông minh).
- `isolate`: bật AP isolation — chặn các client trong cùng SSID giao tiếp trực tiếp với nhau (thường dùng cho mạng khách).
- `hidden`: ẩn SSID khỏi danh sách quét.

#### Các khái niệm nâng cao (Wi-Fi 6/7, Mesh)

- **MLO (Multi-Link Operation)** — khai báo qua `config wifi-mld`: gộp nhiều radio (2.4G + 5G, hoặc + 6G) thành một liên kết logic duy nhất tới client hỗ trợ Wi-Fi 7, tăng băng thông/độ ổn định.
- **EasyMesh / Multi-AP** (`multi_ap`, `multi_ap_backhaul_ssid`): chuẩn IEEE 1905.1, cho phép nhiều AP cùng hãng/cùng hệ sinh thái tự phát hiện và phối hợp với nhau (cấu hình tập trung, roaming liền mạch) mà không cần người dùng tự cấu hình từng AP.
- **Wireless backhaul** (`config wifi-backhaul`, hoặc interface mode `sta` như `apcli0`): cho phép một AP tự kết nối không dây lên AP gốc để lấy đường truyền, dùng trong mô hình mesh không cần dây LAN nối giữa các node.
- **WDS (Wireless Distribution System)**: cách cũ hơn để nối nhiều AP qua sóng, không cần đến chuẩn 1905.1, nhưng cũng không cần đặt mode sta.

---

### File `/etc/config/firewall`

#### Zone

Mỗi `config zone` đại diện cho một vùng tin cậy, liên kết với một hoặc nhiều interface (`list network`):

```
config zone
    option name 'lan'
    list network 'lan'
    option input 'ACCEPT'
    option output 'ACCEPT'
    option forward 'ACCEPT'
```

Chính sách mặc định của zone WAN thường là `input DROP`, `forward REJECT` (chặn mọi kết nối từ ngoài vào trừ khi có rule cho phép tường minh), trong khi LAN thường `ACCEPT` toàn bộ vì được xem là vùng tin cậy.

#### Forwarding & NAT

```
config forwarding
    option src 'lan'
    option dest 'wan'
```

Khai báo hướng cho phép forward traffic giữa 2 zone. Kết hợp với `option masq '1'` trên zone wan để bật NAT (masquerade) — biến nhiều IP nội bộ thành 1 IP public khi ra Internet. Đây là cơ chế lõi biến OpenWrt thành router NAT thay vì chỉ là switch/AP.

#### Rule

Các `config rule` xử lý từng trường hợp cụ thể, ví dụ:
- Mở các cổng cần thiết cho DHCP renew, ICMPv6, IGMP (multicast — quan trọng với dịch vụ IPTV).
- Chặn truy cập trang quản trị (port 80/443) từ WAN để tăng bảo mật.
- Cho phép VPN pass-through (ESP, ISAKMP cho IPSec).

#### Redirect (Port Forward / DMZ)

```
config redirect
    option src 'wan'
    option dest 'lan'
    option proto 'tcp'
    option dest_port '8080'
    option target 'DNAT'
```

Dùng để mở cổng từ ngoài vào một thiết bị cụ thể trong LAN (ví dụ NVR camera, game server). DMZ là dạng đặc biệt forward toàn bộ traffic đến một IP LAN duy nhất.

---

### File `/etc/config/dhcp`

Quản lý bởi **dnsmasq** (DHCPv4 + DNS) và **odhcpd** (DHCPv6/RA):

```
config dhcp 'lan'
    option interface 'lan'
    option start '100'
    option limit '150'
    option leasetime '12h'
    option dhcpv6 'server'
    option ra 'server'
```

- `start`/`limit`: dải IP cấp động (ví dụ start 100, limit 150 → cấp từ .100 đến .249).
- `dhcpv6`/`ra`: bật DHCPv6 server và Router Advertisement cho IPv6.
- `option ignore '1'` trên một interface: tắt hẳn việc cấp DHCP trên interface đó — thường thấy ở mô hình **Dumb AP** (vì để router chính lo việc cấp phát, tránh xung đột 2 DHCP server trong cùng mạng).
- `list dhcp_option '6,<dns1>,<dns2>'`: chỉ định DNS server đẩy cho client qua DHCP option 6.

---

### Tổng Hợp: Cách Đọc Nhanh Một Cấu Hình OpenWrt Bất Kỳ

Khi nhận một bộ cấu hình OpenWrt chưa rõ mục đích, nên đọc theo trình tự sau để dựng lại kiến trúc mạng:

1. **`/etc/config/network`** → xác định có bao nhiêu zone vật lý (bao nhiêu bridge, VLAN), interface nào là WAN (có defaultroute), interface nào là LAN.
2. **`/etc/config/wireless`** → xem mỗi SSID gán vào `network` nào — từ đó biết wifi rơi vào LAN chung hay tách VLAN riêng (guest, IoT).
3. **`/etc/config/firewall`** → xem zone nào bật `masq` (NAT) — nếu có, thiết bị đang đóng vai trò router/gateway thực sự, không phải AP thuần. Nếu hai zone wan/lan forward bị REJECT cả hai chiều và không có masq, khả năng cao đây là Dumb AP.
4. **`/etc/config/dhcp`** → nếu DHCP trên lan bị `ignore '1'`, thiết bị không tự cấp IP — xác nhận đây là AP phụ ăn theo DHCP của router chính.

Bốn bước trên là đủ để phân loại một thiết bị OpenWrt vào một trong các mô hình triển khai: **Dumb AP, Router (NAT), Relay/Repeater, Mesh (EasyMesh/802.11s), hoặc VLAN multi-SSID** như đã trình bày ở phần trước.