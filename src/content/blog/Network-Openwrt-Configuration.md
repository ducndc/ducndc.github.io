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

### Công Cụ Debug Network Trên OpenWrt
 
Sau khi đã hiểu cấu hình tĩnh (các file UCI), bước tiếp theo khi xử lý sự cố là kiểm tra trạng thái runtime thực tế bằng các công cụ dòng lệnh. Phần này chia theo từng lớp mạng (OSI) để dễ tra cứu khi gặp sự cố.
 
#### Lớp 1-2: Kiểm tra Interface, Link, Bridge
 
```
ip link show
```
Xem trạng thái UP/DOWN, MTU, MAC của từng interface vật lý/ảo. Interface `DOWN` hoặc `NO-CARRIER` thường là dấu hiệu cáp lỗi, cổng hỏng, hoặc cấu hình chưa apply.
 
```
ip a
```
Xem toàn bộ IP (cả IPv4/IPv6) đã gán trên từng interface — đối chiếu với những gì khai báo trong `/etc/config/network` để biết cấu hình đã thực sự apply hay chưa.
 
```
bridge link show
bridge fdb show
```
`bridge link` cho biết cổng nào đang nằm trong bridge nào, trạng thái forwarding. `bridge fdb` (forwarding database) cho biết bridge đã học được MAC address nào qua cổng nào — hữu ích khi nghi ngờ traffic bị forward sai cổng hoặc có loop.
 
```
swconfig list
swconfig dev switch0 show
```
Dùng trên thiết bị còn switch chip kiểu cũ (không phải DSA) để xem cấu hình VLAN tại tầng switch phần cứng.
 
#### Lớp 3: IP, Routing, ARP/Neighbor
 
```
ip route show
ip route show table all
```
Xem bảng định tuyến hiện tại — đặc biệt quan trọng khi có nhiều WAN/multi-route, để biết default route nào đang thực sự được dùng.
 
```
ip neigh show
arp -a
```
Xem bảng ARP (IPv4) / Neighbor Discovery (IPv6) — xác nhận thiết bị có "nhìn thấy" được MAC của gateway hoặc client hay không. Nếu route đúng nhưng không có ARP entry, khả năng cao là vấn đề ở layer 2 (VLAN sai, cáp, hoặc firewall chặn ARP).
 
```
ping -c 4 <ip>
ping6 -c 4 <ipv6>
traceroute <ip>
mtr <ip>
```
`ping`/`ping6` kiểm tra kết nối cơ bản. `traceroute`/`mtr` xác định traffic bị nghẽn hoặc mất gói ở chặng (hop) nào — `mtr` ưu việt hơn vì chạy liên tục và thống kê tỉ lệ mất gói theo từng hop.
 
#### Lớp ứng dụng / DNS / DHCP
 
```
nslookup google.com
nslookup google.com 8.8.8.8
```
Truy vấn đầu tiên kiểm tra DNS resolver mặc định (thường là dnsmasq local), truy vấn thứ hai chỉ định thẳng DNS ngoài để phân biệt lỗi do DNS local hay do upstream.
 
```
cat /tmp/resolv.conf.auto
uci show dhcp
```
Xem DNS server thực tế đang được dùng (do ISP cấp qua DHCP) và toàn bộ cấu hình DHCP runtime.
 
```
cat /tmp/dhcp.leases
```
Danh sách client đã được cấp IP qua DHCP server nội bộ — gồm MAC, IP, hostname, thời gian hết hạn lease. Rất hữu ích để kiểm tra nhanh thiết bị nào đang có mặt trong mạng.
 
```
logread | grep dnsmasq
logread -f
```
`logread` đọc log hệ thống (syslog) của OpenWrt; thêm `-f` để theo dõi log realtime (tương tự `tail -f`) — cách nhanh nhất để bắt lỗi DHCP/DNS/wifi association ngay lúc nó xảy ra.
 
#### WiFi cụ thể
 
```
iwinfo
iwinfo wlan0 info
iwinfo wlan0 assoclist
```
`iwinfo` (không tham số) liệt kê toàn bộ radio. `info` xem kênh, công suất, chế độ hiện tại. `assoclist` xem danh sách client đang kết nối kèm RSSI (cường độ tín hiệu), tốc độ TX/RX — rất hữu ích khi nghi ngờ client yếu sóng hoặc rớt kết nối.
 
```
iwinfo wlan0 scan
```
Quét các SSID lân cận — dùng để kiểm tra nhiễu kênh (channel interference) từ AP hàng xóm.
 
```
iw dev
iw dev wlan0 station dump
```
Bộ công cụ `iw` (thay thế dần `iwinfo` ở một số driver) cho thông tin chi tiết hơn về từng station đang kết nối (signal, bitrate, retries).
 
Với chip MediaTek (như trong cấu hình ở phần trước), có thể có thêm công cụ debug riêng của vendor (ví dụ `iwpriv`, hoặc file trạng thái trong `/proc/`), tùy theo driver cụ thể của firmware.
 
#### Firewall / NAT / Kết nối
 
```
iptables -t nat -L -n -v
iptables -L -n -v
```
Xem rule NAT và filter thực tế đã được nftables/iptables-nft sinh ra từ `/etc/config/firewall` — hữu ích để xác nhận rule mong muốn có thực sự được áp dụng đúng thứ tự hay không (OpenWrt mới dùng nftables, lệnh tương đương là `nft list ruleset`).
 
```
nft list ruleset
```
Xem toàn bộ ruleset nftables (chuẩn mới thay iptables từ OpenWrt 21.02+).
 
```
conntrack -L
```
Xem bảng theo dõi kết nối (connection tracking) — hữu ích khi debug NAT, port forward không hoạt động, hoặc nghi ngờ bảng conntrack bị đầy (gây rớt kết nối hàng loạt khi có nhiều client).
 
#### Trạng thái logic UCI (qua ubus)
 
```
ubus call network.interface dump
ubus call network.device status '{"name":"br-lan"}'
ubus call network.wireless status
```
Khác với việc đọc file cấu hình tĩnh, `ubus` cho biết trạng thái **runtime thực tế** mà OpenWrt đang áp dụng — bao gồm interface nào up/down, IP đã nhận (với DHCP/PPPoE), lỗi cấu hình nếu có. Đây là cách đáng tin cậy nhất để biết "hệ thống đang nghĩ gì" thay vì chỉ đọc file cấu hình (vì file có thể đã sửa nhưng chưa reload).
 
#### Băng thông / Hiệu năng
 
```
iperf3 -s          # chạy ở 1 đầu làm server
iperf3 -c <ip>      # chạy ở đầu kia làm client
```
Đo băng thông thực tế giữa 2 điểm trong mạng (cần cài package `iperf3` qua `opkg install iperf3`) — dùng để phân biệt vấn đề là do giới hạn băng thông wifi/dây hay do cấu hình/phần mềm.
 
```
top
htop
```
Theo dõi CPU/RAM của thiết bị — nhiều sự cố mạng (rớt kết nối, độ trễ cao) trên router yếu thực chất do CPU quá tải (ví dụ bật quá nhiều tính năng QoS, SQM, hoặc VPN).
 
#### Quy trình debug gợi ý khi gặp sự cố mạng
 
1. Xác định sự cố ở lớp nào: không lên mạng hoàn toàn (kiểm tra `ip a`, `ip route`) hay chỉ chậm/rớt (kiểm tra `mtr`, `iwinfo assoclist`).
2. Kiểm tra layer 2 trước (`ip link`, `bridge link`) — vì nếu cáp/bridge sai thì mọi lớp trên đều vô nghĩa.
3. Kiểm tra layer 3 (`ip route`, `ping` từng chặng bằng `mtr`) để khoanh vùng đứt mạng ở đâu: trong LAN, tại gateway, hay ngoài Internet.
4. Nếu nghi ngờ DNS, tách riêng test bằng `nslookup <domain> 8.8.8.8` để loại trừ.
5. Đối chiếu với log thời gian thực (`logread -f`) trong lúc tái hiện sự cố — đặc biệt hiệu quả với lỗi wifi rớt kết nối hoặc DHCP không cấp IP.
6. Dùng `ubus call network.interface dump` để xác nhận cấu hình UCI đã thực sự được áp dụng đúng như file, tránh trường hợp debug nhầm do quên reload service.