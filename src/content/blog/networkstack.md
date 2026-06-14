---
title: 'Linux Network Stack'
description: 'Linux Network Stack'
pubDate: 'Jun 14 2026'
heroImage: '../../assets/networkstack.png'
---

## Mục Lục

1. [Tổng Quan Kiến Trúc](#1-tổng-quan-kiến-trúc)
2. [Các Tầng của Network Stack](#2-các-tầng-của-network-stack)
3. [Socket Layer](#3-socket-layer)
4. [Transport Layer — TCP & UDP](#4-transport-layer--tcp--udp)
5. [Network Layer — IP](#5-network-layer--ip)
6. [Link Layer & Network Device](#6-link-layer--network-device)
7. [Netfilter & iptables](#7-netfilter--iptables)
8. [Routing Subsystem](#8-routing-subsystem)
9. [Traffic Control (tc/qdisc)](#9-traffic-control-tcqdisc)
10. [Network Namespaces](#10-network-namespaces)
11. [Các Cơ Chế Tối Ưu Hiệu Năng](#11-các-cơ-chế-tối-ưu-hiệu-năng)
12. [Công Cụ Giám Sát & Debug](#12-công-cụ-giám-sát--debug)
13. [Tham Số Kernel Quan Trọng (sysctl)](#13-tham-số-kernel-quan-trọng-sysctl)

---

## Tổng Quan Kiến Trúc

Linux Network Stack là hệ thống con (subsystem) phức tạp nhất trong kernel Linux, chịu trách nhiệm toàn bộ quá trình xử lý gói tin — từ khi NIC nhận dữ liệu đến khi ứng dụng đọc được.

### Mô Hình Phân Tầng

```
┌─────────────────────────────────────────────────────────┐
│                   User Space                            │
│   Application (nginx, curl, python…)                    │
├─────────────────────────────────────────────────────────┤
│                   System Call Interface                 │
│   socket(), bind(), connect(), send(), recv()…          │
├─────────────────────────────────────────────────────────┤
│              Kernel Space — Network Stack               │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Socket Layer (BSD Socket / POSIX API)            │  │
│  ├───────────────────────────────────────────────────┤  │
│  │  Transport Layer      TCP │ UDP │ SCTP │ DCCP     │  │
│  ├───────────────────────────────────────────────────┤  │
│  │  Network Layer        IPv4 │ IPv6 │ ICMP          │  │
│  ├───────────────────────────────────────────────────┤  │
│  │  Netfilter / iptables / nftables                  │  │
│  ├───────────────────────────────────────────────────┤  │
│  │  Routing Subsystem    FIB │ Neighbour Cache       │  │
│  ├───────────────────────────────────────────────────┤  │
│  │  Traffic Control      qdisc │ class │ filter      │  │
│  ├───────────────────────────────────────────────────┤  │
│  │  Link Layer           Ethernet │ VLAN │ Bridge    │  │
│  ├───────────────────────────────────────────────────┤  │
│  │  Network Device Layer (netdev / NAPI)             │  │
│  └───────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│              Hardware / Driver                          │
│   NIC Driver (e1000, ixgbe, mlx5…)                      │
│   Physical Network Interface Card                       │
└─────────────────────────────────────────────────────────┘
```

### Đường Đi Của Gói Tin

**Chiều nhận (RX — Ingress):**

```
NIC phần cứng
  → Interrupt / NAPI poll
  → sk_buff phân bổ
  → Ethernet frame xử lý
  → IP routing lookup
  → Netfilter hooks (PREROUTING, INPUT)
  → Transport layer (TCP/UDP)
  → Socket receive buffer
  → Application read()
```

**Chiều gửi (TX — Egress):**

```
Application write() / send()
  → Socket send buffer
  → Transport layer (TCP segmentation, UDP encap)
  → IP header gắn vào
  → Netfilter hooks (OUTPUT, POSTROUTING)
  → Routing decision
  → Traffic Control (qdisc)
  → NIC driver TX queue
  → DMA → NIC phần cứng → Wire
```

---

## Các Tầng của Network Stack

### Cấu Trúc sk_buff (Socket Buffer)

`sk_buff` (viết tắt: **skb**) là cấu trúc dữ liệu trung tâm của Linux network stack. Mọi gói tin đều được biểu diễn dưới dạng `sk_buff`.

```c
struct sk_buff {
    /* Danh sách liên kết */
    struct sk_buff      *next;
    struct sk_buff      *prev;

    /* Timestamps */
    ktime_t             tstamp;

    /* Network device */
    struct net_device   *dev;

    /* Con trỏ dữ liệu */
    unsigned char       *head;   /* Đầu vùng nhớ đã cấp phát    */
    unsigned char       *data;   /* Đầu dữ liệu thực tế          */
    unsigned char       *tail;   /* Cuối dữ liệu thực tế         */
    unsigned char       *end;    /* Cuối vùng nhớ đã cấp phát   */

    /* Độ dài */
    unsigned int        len;     /* Tổng độ dài (head + frags)   */
    unsigned int        data_len;/* Độ dài phần fragment         */
    __u16               mac_len; /* Độ dài MAC header            */
    __u16               hdr_len; /* Header length (clone)        */

    /* Checksums */
    __wsum              csum;
    __u8                ip_summed;

    /* Routing */
    struct dst_entry    *dst;

    /* Netfilter */
    __u32               nfmark;

    /* Protocol */
    __be16              protocol;

    /* ... nhiều trường khác ... */
};
```

**Các thao tác quan trọng trên skb:**

| Hàm | Ý nghĩa |
|-----|---------|
| `alloc_skb(size, gfp)` | Cấp phát skb mới |
| `kfree_skb(skb)` | Giải phóng skb |
| `skb_put(skb, len)` | Mở rộng vùng tail (thêm dữ liệu) |
| `skb_push(skb, len)` | Mở rộng vùng head (thêm header) |
| `skb_pull(skb, len)` | Thu hẹp vùng head (bỏ header) |
| `skb_trim(skb, len)` | Thu hẹp vùng tail |
| `skb_clone(skb, gfp)` | Clone skb (chia sẻ dữ liệu) |
| `skb_copy(skb, gfp)` | Copy toàn bộ skb |
| `skb_linearize(skb)` | Làm phẳng frags thành contiguous |

---

## Socket Layer

### BSD Socket Interface

Kernel cung cấp BSD socket API thông qua `struct proto_ops` và `struct proto`:

```c
/* net/socket.c */
struct socket {
    socket_state        state;     /* SS_FREE, SS_UNCONNECTED, SS_CONNECTED… */
    short               type;      /* SOCK_STREAM, SOCK_DGRAM, SOCK_RAW…     */
    unsigned long       flags;
    struct file         *file;
    struct sock         *sk;       /* Con trỏ tới inet_sock / tcp_sock… */
    const struct proto_ops *ops;   /* Bảng hàm virtual: connect, bind…  */
};
```

### Vòng Đời Socket TCP

```
CLOSED
  │  socket()
  ▼
LISTEN ──────────── bind() + listen()
  │  accept()
  ▼
SYN_RCVD ◄──────── SYN nhận được (server)
  │  SYN+ACK gửi đi
  ▼
ESTABLISHED ◄────── ACK nhận được
  │  send() / recv() data exchange
  ▼
FIN_WAIT_1 ──────── close() (chủ động đóng)
  │  FIN gửi đi
  ▼
FIN_WAIT_2 ──────── ACK nhận được
  │  FIN nhận được từ peer
  ▼
TIME_WAIT ──────────── 2*MSL chờ
  │
  ▼
CLOSED
```

### Socket Buffer Management

```
Receive Buffer (sk_rcvbuf):
┌────────────────────────────────────┐
│  sk_receive_queue (skb queue)      │
│  [skb1][skb2][skb3]…               │
│                                    │
│  sk_rmem_alloc ≤ sk_rcvbuf         │
└────────────────────────────────────┘

Send Buffer (sk_sndbuf):
┌────────────────────────────────────┐
│  sk_write_queue (skb queue)        │
│  [skb1][skb2][skb3]…               │
│                                    │
│  sk_wmem_queued ≤ sk_sndbuf        │
└────────────────────────────────────┘
```

---

## Transport Layer — TCP & UDP

### TCP Control Block

```c
struct tcp_sock {
    struct inet_connection_sock inet_conn; /* phải là thành viên đầu tiên */

    /* Sequence numbers */
    u32     rcv_nxt;    /* Sequence number kế tiếp mong đợi nhận */
    u32     snd_nxt;    /* Sequence number kế tiếp sẽ gửi        */
    u32     snd_una;    /* Sequence number chưa được ACK          */
    u32     snd_wnd;    /* Cửa sổ gửi từ peer                     */
    u32     rcv_wnd;    /* Cửa sổ nhận hiện tại                   */

    /* Congestion Control */
    u32     snd_cwnd;   /* Congestion window                      */
    u32     ssthresh;   /* Slow-start threshold                   */
    u32     snd_ssthresh;

    /* RTT estimation */
    u32     srtt_us;    /* Smoothed RTT (microseconds, scaled)    */
    u32     mdev_us;    /* Mean deviation của RTT                 */
    u32     rto;        /* Retransmission timeout                 */

    /* Timestamps */
    u32     rcv_tsval;  /* Timestamp value từ peer                */
    u32     rcv_tsecr;  /* Timestamp echo reply từ peer           */

    /* ... */
};
```

### TCP Congestion Control

Linux hỗ trợ nhiều thuật toán congestion control qua framework pluggable:

```bash
# Xem thuật toán đang dùng
sysctl net.ipv4.tcp_congestion_control

# Liệt kê tất cả thuật toán có sẵn
sysctl net.ipv4.tcp_available_congestion_control

# Đổi thuật toán
sysctl -w net.ipv4.tcp_congestion_control=bbr
```

| Thuật toán | Mô tả |
|-----------|-------|
| `cubic` | Mặc định. Cubic function của cwnd. Phù hợp đường truyền có bandwidth cao, latency cao. |
| `bbr` | Bottleneck Bandwidth and RTT — Google phát triển. Tối ưu thông lượng, tốt hơn trong môi trường có buffer bloat. |
| `reno` | Classic TCP Reno — đơn giản, loss-based. |
| `htcp` | Hamilton TCP — phù hợp mạng high-speed. |
| `vegas` | Delay-based congestion control. |
| `dctcp` | Data Center TCP — cho môi trường datacenter. |

### TCP Fast Path vs Slow Path

```
Gói TCP đến
    │
    ▼
tcp_v4_rcv()
    │
    ├─► [SYN] → tcp_conn_request()          (thiết lập kết nối)
    │
    ├─► [Fast Path] tcp_rcv_established()
    │       Điều kiện:
    │       - Kết nối ESTABLISHED
    │       - Không có out-of-order
    │       - Không window probe
    │       - Sequence number hợp lệ
    │       └─► Xử lý nhanh: cập nhật rcv_nxt, gửi ACK
    │
    └─► [Slow Path] tcp_data_queue()
            Xử lý: reordering, SACK, urgent data…
```

### UDP Processing

UDP đơn giản hơn nhiều — không có kết nối, không đảm bảo thứ tự:

```c
/* Đường đi RX */
udp_rcv()
  → __udp4_lib_rcv()
    → udp4_lib_lookup()    /* Tìm socket */
    → udp_queue_rcv_one_skb()
      → __udp_queue_rcv_skb()
        → sock_queue_rcv_skb()   /* Thêm vào receive queue */
```

---

## Network Layer — IP

### IPv4 Header

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐
│ Version │  IHL  │   DSCP    │ECN│           Total Length      │
├─────────────────┼───────────────────────┼─┬─┬─────────────────┤
│         Identification                  │R│D│F│Fragment Offset│
├─────────────────┴───────────────────────┴─┴─┴─────────────────┤
│      TTL        │    Protocol           │ Header Checksum     │
├───────────────────────────────────────────────────────────────┤
│                        Source IP Address                      │
├───────────────────────────────────────────────────────────────┤
│                     Destination IP Address                    │
├───────────────────────────────────────────────────────────────┤
│                      Options (nếu IHL > 5)                    │
└───────────────────────────────────────────────────────────────┘
```

### IP Receive Path

```c
ip_rcv()                    /* Entry point từ L2 */
  → ip_rcv_core()           /* Kiểm tra header, checksum */
  → NF_HOOK(PREROUTING)     /* Netfilter hook */
  → ip_rcv_finish()
    → ip_route_input_noref() /* Routing lookup */
    │
    ├─► ip_local_deliver()   /* Gói tin dành cho local */
    │     → NF_HOOK(INPUT)
    │     → ip_local_deliver_finish()
    │       → tcp_v4_rcv() / udp_rcv() / ...
    │
    └─► ip_forward()         /* Forwarding */
          → NF_HOOK(FORWARD)
          → ip_output()
```

### IP Fragmentation & Reassembly

```
Fragmentation (khi packet > MTU):
┌─────────────────────────┐
│   Original IP Packet    │  > MTU (e.g. 1500 bytes)
│   [IP Header][Payload]  │
└─────────────────────────┘
         │ ip_fragment()
         ▼
┌────────────┐ ┌────────────┐ ┌────────────┐
│ [IPH][Frag1│ │ [IPH][Frag2│ │ [IPH][Frag3│
│  MF=1 O=0  │ │  MF=1 O=185│ │  MF=0 O=370│
└────────────┘ └────────────┘ └────────────┘
  (More Frag)   (More Frag)   (Last Frag)

Reassembly:
ip_defrag() sử dụng ipq (ip_defrag_queue) để ghép lại
Timeout: net.ipv4.ipfrag_time (mặc định: 30 giây)
```

---

## Link Layer & Network Device

### NAPI (New API)

NAPI là cơ chế kết hợp interrupt-driven và polling để xử lý gói tin hiệu quả tại tốc độ cao:

```
Gói tin đến NIC
    │
    ├─► [Tốc độ thấp] Hard IRQ → netif_rx() → Xử lý ngay
    │
    └─► [Tốc độ cao] Hard IRQ → tắt interrupt → schedule NAPI poll
                                    │
                                    ▼
                            NET_RX_SOFTIRQ
                                    │
                                    ▼
                            napi_poll() / driver->poll()
                            (xử lý nhiều gói/lần — budget)
                                    │
                            Hết budget hoặc queue rỗng
                                    │
                                    ▼
                            Bật lại interrupt
```

**Cấu trúc NAPI:**

```c
struct napi_struct {
    struct list_head    poll_list;   /* Danh sách NAPI cần poll    */
    unsigned long       state;       /* NAPI_STATE_SCHED, …        */
    int                 weight;      /* Budget mặc định = 64       */
    int                 (*poll)(struct napi_struct *, int); /* Driver poll function */
    struct net_device   *dev;
    /* … */
};
```

### Ring Buffer

```
TX Ring Buffer:
   Head (driver ghi)
    │
    ▼
┌──────┬──────┬──────┬──────┬──────┐
│ Desc │ Desc │ Desc │ Desc │ Desc │  ← Ring (circular)
│  0   │  1   │  2   │  3   │  4   │
└──────┴──────┴──────┴──────┴──────┘
                              ▲
                              │
                           Tail (NIC đọc)

RX Ring Buffer:
   Head (NIC ghi)
    │
    ▼
┌──────┬──────┬──────┬──────┬──────┐
│ Desc │ Desc │ Desc │ Desc │ Desc │
│  0   │  1   │  2   │  3   │  4   │
└──────┴──────┴──────┴──────┴──────┘
                              ▲
                              │
                           Tail (driver đọc)
```

### Virtual Network Devices

| Loại | Mô tả | Lệnh tạo |
|------|-------|----------|
| `veth` | Virtual Ethernet pair (pipe giữa namespaces) | `ip link add veth0 type veth peer name veth1` |
| `bridge` | L2 bridge | `ip link add br0 type bridge` |
| `vlan` | 802.1Q VLAN tagging | `ip link add eth0.100 link eth0 type vlan id 100` |
| `macvlan` | Multiple MAC trên 1 NIC | `ip link add mv0 link eth0 type macvlan mode bridge` |
| `ipvlan` | Multiple IP, cùng MAC | `ip link add iv0 link eth0 type ipvlan mode l3` |
| `tun` | L3 tunnel (IP packets) | `ip tuntap add tun0 mode tun` |
| `tap` | L2 tunnel (Ethernet frames) | `ip tuntap add tap0 mode tap` |
| `dummy` | Loopback giả | `ip link add dummy0 type dummy` |
| `bonding` | Link aggregation | `ip link add bond0 type bond` |

---

## Netfilter & iptables

### Netfilter Hooks

Netfilter định nghĩa 5 hook points trong đường đi của gói tin:

```
                         ROUTING
                        DECISION
                            │
Packet IN                   │                    Packet OUT
──────────►  PREROUTING ────┤──── FORWARD ────►  POSTROUTING ──────►
                            │
                            │
                          INPUT                    OUTPUT
                            │                       ▲
                            ▼                       │
                      LOCAL PROCESS ────────────────┘
```

| Hook | Vị trí | Ứng dụng |
|------|--------|----------|
| `PREROUTING` | Trước routing | DNAT, connection tracking |
| `INPUT` | Gói tin đến local | Firewall inbound |
| `FORWARD` | Gói tin forward | Firewall forwarding |
| `OUTPUT` | Gói tin từ local | Firewall outbound, SNAT |
| `POSTROUTING` | Sau routing | SNAT, Masquerade |

### iptables Tables

```
Table: filter (mặc định)
  Chains: INPUT, FORWARD, OUTPUT
  Dùng cho: Firewall, packet filtering

Table: nat
  Chains: PREROUTING, INPUT, OUTPUT, POSTROUTING
  Dùng cho: NAT, port forwarding, masquerade

Table: mangle
  Chains: PREROUTING, INPUT, FORWARD, OUTPUT, POSTROUTING
  Dùng cho: Sửa đổi header (TTL, TOS, MARK)

Table: raw
  Chains: PREROUTING, OUTPUT
  Dùng cho: Bypass connection tracking (NOTRACK)

Table: security
  Chains: INPUT, FORWARD, OUTPUT
  Dùng cho: SELinux/AppArmor marking
```

**Thứ tự xử lý tables tại mỗi hook:**

```
PREROUTING:   raw → mangle → nat
INPUT:        mangle → filter → security → nat
FORWARD:      mangle → filter → security
OUTPUT:       raw → mangle → nat → filter → security
POSTROUTING:  mangle → nat
```

### Ví Dụ iptables

```bash
# Cho phép traffic established/related
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Cho phép SSH từ mạng cụ thể
iptables -A INPUT -s 192.168.1.0/24 -p tcp --dport 22 -j ACCEPT

# DNAT: Forward port 8080 → 80 trên máy nội bộ
iptables -t nat -A PREROUTING -p tcp --dport 8080 \
  -j DNAT --to-destination 10.0.0.5:80

# Masquerade (SNAT động cho traffic ra ngoài)
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE

# Rate limiting (chống DDoS đơn giản)
iptables -A INPUT -p tcp --dport 80 \
  -m limit --limit 100/min --limit-burst 200 -j ACCEPT

# Ghi log và drop
iptables -A INPUT -j LOG --log-prefix "IPTables-DROP: " --log-level 4
iptables -A INPUT -j DROP
```

### nftables (Thế hệ tiếp theo)

```bash
# Tạo table và chain
nft add table inet myfilter
nft add chain inet myfilter input { type filter hook input priority 0 \; }

# Thêm rules
nft add rule inet myfilter input ct state established,related accept
nft add rule inet myfilter input tcp dport 22 accept
nft add rule inet myfilter input drop

# Xem ruleset
nft list ruleset
```

---

## Routing Subsystem

### FIB (Forwarding Information Base)

Linux dùng **FIB Trie** (LC-Trie) để tra cứu route hiệu quả:

```bash
# Xem routing table
ip route show
ip route show table all

# Xem FIB trie statistics
cat /proc/net/fib_triestat

# Trace route lookup
ip route get 8.8.8.8
# output: 8.8.8.8 via 192.168.1.1 dev eth0 src 192.168.1.100
```

### Policy Routing (Multiple Tables)

```bash
# Các bảng routing mặc định
# 0   = UNSPEC
# 253 = default
# 254 = main  ← ip route show hiển thị bảng này
# 255 = local (loopback, broadcast)

# Tạo bảng routing tùy chỉnh (/etc/iproute2/rt_tables)
echo "100 custom_table" >> /etc/iproute2/rt_tables

# Thêm route vào bảng custom
ip route add default via 10.0.0.1 table custom_table

# Thêm policy rule: traffic từ 10.0.0.0/24 dùng bảng custom
ip rule add from 10.0.0.0/24 table custom_table priority 100

# Xem tất cả policy rules
ip rule list
```

### Neighbour Subsystem (ARP/NDP)

```
IP destination found in routing table
    │
    ▼
Cần MAC address của next-hop
    │
    ├─► [Cache hit] neigh_lookup() → MAC có sẵn → gửi gói
    │
    └─► [Cache miss] ARP request broadcast
             │
             ▼
         Chờ ARP reply (neigh state: INCOMPLETE)
             │
             ▼
         neigh state: REACHABLE (timeout: 30s mặc định)
             │
             ▼
         Quá hạn → STALE → DELAY → PROBE → FAILED
```

```bash
# Xem ARP cache
ip neigh show
arp -n

# Thêm ARP entry tĩnh
ip neigh add 192.168.1.1 lladdr aa:bb:cc:dd:ee:ff dev eth0

# Flush ARP cache
ip neigh flush dev eth0
```

---

## Traffic Control (tc/qdisc)

### Kiến Trúc TC

```
Egress (Outbound):
                   ┌──────────────────┐
skb từ network     │   Root qdisc     │
layer ─────────►   │  (e.g. HTB/HFSC) │
                   │                  │
                   │  ┌───┐  ┌───┐    │
                   │  │cls│  │cls│    │  ← Classifiers
                   │  └───┘  └───┘    │
                   │    │       │     │
                   │  ┌───┐  ┌───┐    │
                   │  │cls│  │cls│    │  ← Leaf qdiscs (pfifo, tbf…)
                   └──────────────────┘
                           │
                           ▼ → NIC TX queue
```

### Các qdisc Phổ Biến

| qdisc | Loại | Mô tả |
|-------|------|-------|
| `pfifo_fast` | Classless | Mặc định trước Linux 5.15. 3 priority bands. |
| `fq_codel` | Classless | Fair Queueing + CoDel AQM. Giảm buffer bloat tốt. |
| `fq` | Classless | Fair Queue — dùng trong TCP BBR. |
| `tbf` | Classless | Token Bucket Filter — giới hạn rate. |
| `htb` | Classful | Hierarchical Token Bucket — chia sẻ bandwidth có hierarchy. |
| `hfsc` | Classful | Hierarchical Fair Service Curve — đảm bảo latency + bandwidth. |
| `cake` | Classless | CAKE (Common Applications Kept Enhanced) — thế hệ mới của fq_codel. |
| `netem` | Classless | Network Emulator — giả lập delay, loss, jitter (dùng để test). |

### Ví Dụ tc

```bash
# Giới hạn bandwidth với TBF (10 Mbit/s)
tc qdisc add dev eth0 root tbf rate 10mbit burst 32kbit latency 400ms

# HTB với 2 class
tc qdisc add dev eth0 root handle 1: htb default 20

# Root class (100 Mbit)
tc class add dev eth0 parent 1: classid 1:1 htb rate 100mbit

# High priority: guaranteed 50 Mbit (web traffic)
tc class add dev eth0 parent 1:1 classid 1:10 htb rate 50mbit ceil 100mbit prio 1

# Low priority: guaranteed 10 Mbit (bulk traffic)
tc class add dev eth0 parent 1:1 classid 1:20 htb rate 10mbit ceil 100mbit prio 2

# Classifier: DSCP CS3 → class 1:10
tc filter add dev eth0 protocol ip parent 1:0 prio 1 \
  u32 match ip tos 0x60 0xff flowid 1:10

# Giả lập mạng kém (100ms delay, 1% loss) với netem
tc qdisc add dev eth0 root netem delay 100ms loss 1%
```

---

## Network Namespaces

Network namespace cho phép tạo môi trường mạng cô lập hoàn toàn — dùng trong containers (Docker, Kubernetes).

### Các Tài Nguyên Được Cô Lập

Mỗi network namespace có riêng: network interfaces, routing tables, iptables rules, ARP cache, netfilter state, sockets.

### Thao Tác Với Network Namespaces

```bash
# Tạo namespace
ip netns add ns1

# Liệt kê namespaces
ip netns list

# Thực thi lệnh trong namespace
ip netns exec ns1 ip link show
ip netns exec ns1 bash   # Mở shell trong namespace

# Tạo veth pair và kết nối namespace
ip link add veth0 type veth peer name veth1

# Di chuyển veth1 vào ns1
ip link set veth1 netns ns1

# Cấu hình phía host
ip addr add 10.10.0.1/24 dev veth0
ip link set veth0 up

# Cấu hình phía namespace
ip netns exec ns1 ip addr add 10.10.0.2/24 dev veth1
ip netns exec ns1 ip link set veth1 up
ip netns exec ns1 ip link set lo up

# Test kết nối
ip netns exec ns1 ping 10.10.0.1

# Xóa namespace
ip netns del ns1
```

### Sơ Đồ Container Networking (Docker Bridge Mode)

```
Host Network Namespace
┌─────────────────────────────────────────────────────┐
│                                                     │
│  eth0 (physical)   docker0 (bridge, 172.17.0.1)     │
│  192.168.1.100      │                               │
│       │             │──────────────────────┐        │
│       │             │                      │        │
│    [NAT/MASQ]    veth_A                 veth_B      │
│                    │                      │         │
└────────────────────┼──────────────────────┼─────────┘
                     │                      │
Container A NS       │              Container B NS
┌────────────────┐   │         ┌────────────────┐
│  eth0          │◄──┘         │  eth0          │◄──┘
│ 172.17.0.2/16  │             │ 172.17.0.3/16  │
└────────────────┘             └────────────────┘
```

---

## Các Cơ Chế Tối Ưu Hiệu Năng

### TCP Offloading

| Tính năng | Mô tả | Kiểm tra |
|-----------|-------|---------|
| **TSO** (TCP Segmentation Offload) | NIC tự chia TCP segment | `ethtool -k eth0 \| grep tx-tcp-segmentation` |
| **GRO** (Generic Receive Offload) | Gộp nhiều gói nhỏ thành lớn khi nhận | `ethtool -k eth0 \| grep generic-receive-offload` |
| **GSO** (Generic Segmentation Offload) | Software TSO cho driver không hỗ trợ | `ethtool -k eth0 \| grep generic-segmentation-offload` |
| **LRO** (Large Receive Offload) | Gộp gói ở hardware | `ethtool -k eth0 \| grep large-receive-offload` |
| **TX Checksum** | NIC tính checksum khi gửi | `ethtool -k eth0 \| grep tx-checksumming` |
| **RX Checksum** | NIC verify checksum khi nhận | `ethtool -k eth0 \| grep rx-checksumming` |

```bash
# Bật/tắt offload
ethtool -K eth0 tso on
ethtool -K eth0 gro on
ethtool -K eth0 gso on
```

### Multi-Queue & RSS

**RSS (Receive Side Scaling):** Phân phối RX interrupt đến nhiều CPU core.

```bash
# Xem số RX/TX queue
ethtool -l eth0

# Thay đổi số queue
ethtool -L eth0 combined 8

# Xem IRQ affinity của NIC
cat /proc/interrupts | grep eth0

# Set IRQ affinity (ví dụ: eth0-rx-0 → CPU 0)
echo 1 > /proc/irq/IRQNUM/smp_affinity
```

**RPS (Receive Packet Steering):** Phần mềm thay thế RSS cho NIC không hỗ trợ:

```bash
# Cho phép tất cả CPU xử lý RX của eth0
echo ff > /sys/class/net/eth0/queues/rx-0/rps_cpus
```

### Zero-Copy

```
Truyền thống:
App buffer → Kernel buffer → Socket buffer → NIC

sendfile() — Zero-copy:
File cache (page cache) ──────────────────► NIC
             (DMA trực tiếp, không copy qua userspace)
```

```c
// Sử dụng sendfile()
int fd_in  = open("file.dat", O_RDONLY);
int fd_out = socket(...);
sendfile(fd_out, fd_in, NULL, file_size);

// MSG_ZEROCOPY với send() (kernel 4.14+)
setsockopt(fd, SOL_SOCKET, SO_ZEROCOPY, &one, sizeof(one));
send(fd, buf, len, MSG_ZEROCOPY);
```

### XDP (eXpress Data Path)

XDP cho phép xử lý gói tin ngay tại driver level — trước khi `sk_buff` được cấp phát:

```
NIC nhận gói
    │
    ▼ (Trước sk_buff allocation)
┌──────────────────────┐
│   XDP Program (BPF)  │  ← Chạy ở đây, cực kỳ nhanh
└──────────────────────┘
    │
    ├─► XDP_DROP    → Huỷ gói ngay (DDoS mitigation)
    ├─► XDP_PASS    → Tiếp tục lên network stack thường
    ├─► XDP_TX      → Gửi lại qua cùng interface
    ├─► XDP_REDIRECT → Redirect đến interface/CPU/socket khác
    └─► XDP_ABORTED → Lỗi, drop gói
```

```bash
# Gắn XDP program (với ip link)
ip link set dev eth0 xdp obj xdp_prog.o sec xdp

# Gắn XDP program native mode
ip link set dev eth0 xdpdrv obj xdp_prog.o

# Gỡ XDP
ip link set dev eth0 xdp off
```

---

## Công Cụ Giám Sát & Debug

### ss — Socket Statistics

```bash
# Tất cả socket đang listen
ss -tlnp

# TCP established với process info
ss -tnp state established

# UDP sockets
ss -unlp

# Thống kê chi tiết một connection
ss -ti dst 8.8.8.8

# Lọc theo port
ss -tnp '( dport = :443 or sport = :443 )'

# Xem TCP internals (send/recv buffer, RTT, cwnd...)
ss -tini
```

### ip — Công Cụ Quản Lý Mạng

```bash
# Network interfaces
ip link show
ip -s link show eth0          # Thống kê RX/TX
ip link set eth0 mtu 9000     # Jumbo frames

# Địa chỉ IP
ip addr show
ip addr add 10.0.0.1/24 dev eth0
ip addr del 10.0.0.1/24 dev eth0

# Routes
ip route show
ip route add 10.10.0.0/16 via 192.168.1.1
ip route del 10.10.0.0/16

# Neighbor/ARP
ip neigh show
ip neigh flush dev eth0

# Monitor events thời gian thực
ip monitor all
```

### ethtool — NIC Diagnostics

```bash
# Thông tin cơ bản
ethtool eth0

# Xem thống kê driver-level
ethtool -S eth0

# Xem offload settings
ethtool -k eth0

# Xem ring buffer size
ethtool -g eth0

# Tăng ring buffer (giảm packet drop)
ethtool -G eth0 rx 4096 tx 4096

# Xem interrupt coalescing
ethtool -c eth0

# Bật pause frames (flow control)
ethtool -A eth0 rx on tx on
```

### tcpdump & Wireshark

```bash
# Capture tất cả traffic trên eth0
tcpdump -i eth0

# Capture TCP port 80, ghi ra file
tcpdump -i eth0 -w capture.pcap tcp port 80

# Capture và không resolve tên
tcpdump -i eth0 -nn

# Bộ lọc phức tạp
tcpdump -i any 'tcp[tcpflags] & tcp-syn != 0'   # Chỉ SYN
tcpdump -i eth0 'host 10.0.0.1 and port 443'
tcpdump -i eth0 'net 10.0.0.0/24'

# Xem nội dung (ASCII)
tcpdump -i eth0 -A port 80
```

### /proc và /sys Interfaces

```bash
# Thống kê mạng tổng hợp
cat /proc/net/dev
cat /proc/net/softnet_stat   # SoftIRQ stats, drop count

# TCP/UDP statistics
cat /proc/net/snmp
cat /proc/net/netstat

# Conntrack table
cat /proc/net/nf_conntrack

# Tất cả socket đang mở
cat /proc/net/tcp
cat /proc/net/tcp6
cat /proc/net/udp

# Routing table (raw)
cat /proc/net/route
cat /proc/net/fib_trie
```

---

## Tham Số Kernel Quan Trọng (sysctl)

### TCP Tuning

```bash
# Buffer sizes
sysctl -w net.core.rmem_max=134217728           # Max receive buffer (128 MB)
sysctl -w net.core.wmem_max=134217728           # Max send buffer (128 MB)
sysctl -w net.ipv4.tcp_rmem="4096 87380 134217728"   # min/default/max
sysctl -w net.ipv4.tcp_wmem="4096 65536 134217728"

# Backlog & connection queue
sysctl -w net.core.somaxconn=65535              # Max listen backlog
sysctl -w net.ipv4.tcp_max_syn_backlog=8192     # SYN queue size

# Keep-alive
sysctl -w net.ipv4.tcp_keepalive_time=120       # Idle trước khi probe (giây)
sysctl -w net.ipv4.tcp_keepalive_intvl=10       # Khoảng cách giữa probes
sysctl -w net.ipv4.tcp_keepalive_probes=3       # Số lần probe

# TIME_WAIT optimization
sysctl -w net.ipv4.tcp_tw_reuse=1               # Reuse TIME_WAIT sockets
sysctl -w net.ipv4.tcp_fin_timeout=15           # Thời gian FIN_WAIT_2

# Congestion control
sysctl -w net.ipv4.tcp_congestion_control=bbr
sysctl -w net.core.default_qdisc=fq

# TCP Fast Open
sysctl -w net.ipv4.tcp_fastopen=3               # Client + Server

# Window scaling
sysctl -w net.ipv4.tcp_window_scaling=1

# SYN cookies (chống SYN flood)
sysctl -w net.ipv4.tcp_syncookies=1
```

### Network Interface & Queuing

```bash
# Tăng netdev backlog (tránh drop khi burst)
sysctl -w net.core.netdev_max_backlog=250000

# Số lượng flow trong netdev budget
sysctl -w net.core.netdev_budget=600

# RPS/RFS
echo 32768 > /proc/sys/net/core/rps_sock_flow_entries
echo 4096 > /sys/class/net/eth0/queues/rx-0/rps_flow_cnt
```

### IP Forwarding & Security

```bash
# Bật IP forwarding (cần cho router, NAT, Kubernetes)
sysctl -w net.ipv4.ip_forward=1
sysctl -w net.ipv6.conf.all.forwarding=1

# Reverse path filtering (chống spoofing)
sysctl -w net.ipv4.conf.all.rp_filter=1

# Không chấp nhận ICMP redirects
sysctl -w net.ipv4.conf.all.accept_redirects=0
sysctl -w net.ipv4.conf.all.send_redirects=0

# Conntrack table size
sysctl -w net.netfilter.nf_conntrack_max=1048576
sysctl -w net.netfilter.nf_conntrack_tcp_timeout_established=600
```

### Áp Dụng Cấu Hình Vĩnh Viễn

```bash
# Ghi vào /etc/sysctl.conf hoặc /etc/sysctl.d/99-network.conf
cat > /etc/sysctl.d/99-network-tuning.conf << 'EOF'
# TCP Buffer
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.ipv4.tcp_rmem = 4096 87380 134217728
net.ipv4.tcp_wmem = 4096 65536 134217728

# BBR + FQ
net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq

# Connection
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_syncookies = 1

# Forwarding (bỏ comment nếu cần)
# net.ipv4.ip_forward = 1
EOF

# Apply ngay
sysctl -p /etc/sysctl.d/99-network-tuning.conf
```

---

## Tài Liệu Tham Khảo

- [Linux Kernel Networking: Implementation and Theory](https://www.apress.com/gp/book/9781430261964) — Rami Rosen
- [Linux Kernel Source](https://github.com/torvalds/linux) — `net/` directory
- [Kernel Documentation](https://www.kernel.org/doc/html/latest/networking/)
- [`ip-route(8)` man page](https://man7.org/linux/man-pages/man8/ip-route.8.html)
- [Cloudflare Blog: Linux Network Stack](https://blog.cloudflare.com/tag/linux/)
- [Red Hat Performance Tuning Guide](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/9/html/monitoring_and_managing_system_status_and_performance/)

---

*Tài liệu được soạn thảo dựa trên Linux Kernel 6.x. Một số chi tiết nội bộ có thể thay đổi giữa các phiên bản kernel.*