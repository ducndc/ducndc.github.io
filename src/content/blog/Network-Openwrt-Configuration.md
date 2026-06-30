---
title: 'Network Configuration in OpenWrt'
description: 'Network Configuration in OpenWrt'
pubDate: 'Jun 30 2026'
heroImage: '../../assets/AP_Sys.png'
---

OpenWrt uses a **UCI (Unified Configuration Interface)** configuration system — the entire system configuration is stored as simple text files in `/etc/config/`. This is a major difference from typical router firmware (which hides configuration in NVRAM or binary).

These configuration files are directly related to the network:

| File | Vai trò |
|---|---|
| `/etc/config/network` | Define interface, device, bridge, VLAN, and basic routing |
| `/etc/config/wireless` | Configure radio, SSID, and Wi-Fi security |
| `/etc/config/firewall` | Zone, rule, NAT, port forwarding |
| `/etc/config/dhcp` | DHCP server/client, DNS (dnsmasq), IPv6 RA (odhcpd) |

Each change in these files requires `/etc/init.d/<service> reload` or `reload_config` to apply (or use the `uci commit` + `uci` CLI command instead of editing the file directly).

---

### File `/etc/config/network`

#### Device vs Interface

OpenWrt (from version 21.02 onwards) clearly separates two concepts:

- **`config device`**: Representing Layer 2 — physical ports, bridges, VLAN sub-interfaces. This is the "logical hardware".
- **`config interface`**: Represents Layer 3 — assigns protocols (static/dhcp/pppoe...) and IP addresses to a device.

A device may not have any interface assigned to it (for example, a LAN port connected to a switch doesn't need a dedicated IP address), and an interface must always point to a device.

#### Common types of protocols for interfaces

- `static`: Fixed IP address, manually declares `ipaddr`, `netmask`, and `gateway`. Often used for LANs or APs connected to the main router.
- `dhcp`: Automatically requests IPv4 from the upstream DHCP server. Often used for WANs.
- `dhcpv6`: Requests IPv6 from the upstream (includes DHCP for dual-stack).
- `pppoe`: PPPoE dial-up — common with Vietnam's FTTH infrastructure (requires username/password provided by the ISP).
- `relay`: Used for relay (relayd) models — bridging between two layer-2 networks that cannot be bridged directly (e.g., one side is a Wi-Fi client, the other is a wired LAN).
- `none`: Device is not assigned an IP address, only exists at layer 2 (used for pure switch ports).

#### Bridge

```
config device
    option name 'br-lan'
    option type 'bridge'
    list ports 'eth0'
    list ports 'eth1'
```

A bridge combines multiple physical ports (and/or Wi-Fi interfaces) into a single Layer-2 broadcast domain—essentially acting as a virtual switch. This is the mechanism behind most OpenWrt LAN setups: multiple wired ports and multiple Wi-Fi SSIDs all converging on a bridge share the same IP range.

The STP parameters (`stp`, `forward_delay`, `hello_time`, `ageing_time`, `max_age`, `priority`) are used to prevent network loops when there are multiple loop connections between switches/APs.

#### VLAN

OpenWrt supports two ways to declare VLANs:

**a) VLAN on old chip switches (DSA legacy / swconfig)** — rarely seen on new devices.

**b) Modern DSA-style VLANs** (common on newer devices), there are two types:

- *Tagged sub-interface on a port*: `eth1.2` means VLAN ID 2 on port `eth1`. This is commonly used when the ISP requires VLAN tagging for Internet services (e.g., VLAN 2 for Internet, VLAN 35 for IPTV — common in Vietnamese network providers).
- *Bridge VLAN filtering* (`config bridge-vlan`): declares VLANs directly on the bridge, specifying which ports are tagged (`t`), untagged (`u`), or primary untagged (`u*`):

```
config bridge-vlan
    option device 'br-wan'
    option vlan '2'
    list ports 'eth1:u*'
```

This method allows a bridge to serve multiple VLANs simultaneously, with each VLAN separated into its own logical interface (`br-wan.2`) for IP/protocol assignment.

#### Routing & Globals

```
config globals 'globals'
    option ula_prefix 'fdxx:xxxx:xxxx::/48'
    option _wan_defroute 'wan'
```

- `ula_prefix`: A range of internally generated IPv6 addresses (Unique Local Address), used when there is no IPv6 available from the ISP or for internal routing.
- The default route is determined by the interface with the `option defaultroute '1'` and the lowest metric when multiple interfaces have Internet access.

---

### File `/etc/config/wireless`

#### `wifi-device`: physical radio configuration

Each radio (wifi chip) is a `wifi-device`, containing parameters such as frequency, channel, and power:

- Band: 2.4G or 5G (Wi-Fi 6E/7 devices can add 6G).
- Channel: Fixed or Auto (Activate ACS – Auto Channel Selection).
- HT Mode: Channel width and standard — e.g., HT20/40 (Wi-Fi 4), VHT80 (Wi-Fi 5), HE80 (Wi-Fi 6), EHT160 (Wi-Fi 7).
- Country: Country code, determines the list of valid channels and transmit power according to local laws.
- TX Power: Transmit power (in dBm or %, depending on the driver).

#### `wifi-iface`: Virtual SSID on radio

A radio can broadcast multiple SSIDs simultaneously (multi-SSID/multi-BSSID):

- `mode`: `ap` (broadcast), `sta` (acts as client, used for repeater/mesh backhaul), `mesh` (802.11s), `monitor`.
- `network`: This SSID is assigned to a network interface (layer-3) as declared in `/etc/config/network` — determining which IP range/VLAN the client of that SSID belongs to.
- `encryption`: Security type — `none`, `psk2` (WPA2-PSK), `psk2+ccmp`, `sae` (WPA3), `sae-mixed` (a mixture of WPA2/WPA3 for backward compatibility).
- `ieee80211r`: Fast BSS Transition (fast roaming between APs in the same system).
- `ieee80211k`/`ieee80211v`: assists clients in measuring and being "suggested" to switch to a better AP (band steering, smart roaming).
- `isolate`: enables AP isolation — blocks clients on the same SSID from communicating directly with each other (commonly used for guest networks).
- `hidden`: hides the SSID from the scan list.

#### Advanced concepts (Wi-Fi 6/7, Mesh)

- **MLO (Multi-Link Operation)** — declared via `config wifi-mld`: combines multiple radios (2.4G + 5G, or + 6G) into a single logical link to a Wi-Fi 7-enabled client, increasing bandwidth/stability.
- **EasyMesh / Multi-AP** (`multi_ap`, `multi_ap_backhaul_ssid`): IEEE 1905.1 standard, allows multiple APs from the same manufacturer/ecosystem to automatically discover and coordinate with each other (centralized configuration, seamless roaming) without requiring users to configure each AP individually.
- **Wireless backhaul** (`config wifi-backhaul`, or interface mode `sta` like `apcli0`): allows an AP to wirelessly connect to the base AP to obtain a connection, used in mesh models that do not require LAN cables between nodes.
- **WDS (Wireless Distribution System)**: an older way to connect multiple APs wirelessly, doesn't require the 1905.1 standard, but also doesn't require setting the standby mode.

---

### File `/etc/config/firewall`

#### Zone

Each `config zone` represents a trusted area, associated with one or more interfaces (`list network`):

```
config zone
    option name 'lan'
    list network 'lan'
    option input 'ACCEPT'
    option output 'ACCEPT'
    option forward 'ACCEPT'
```

The default WAN zone policy is usually `input DROP` and `forward REJECT` (blocking all external connections unless explicitly allowed by a rule), while LAN zones typically use `ACCEPT` entirely because they are considered trusted zones.

#### Forwarding & NAT

```
config forwarding
    option src 'lan'
    option dest 'wan'
```

Declare the direction to allow traffic forwarding between the two zones. Combine this with `option masq '1'` on the WAN zone to enable NAT (masquerade) — turning multiple internal IPs into a single public IP when accessing the Internet. This is the core mechanism that transforms OpenWrt into a NAT router instead of just a switch/AP.

#### Rule

The `config rule` handles each specific case, for example:
- Open the necessary ports for DHCP renew, ICMPv6, IGMP (multicast — important for IPTV services).
- Block access to the admin page (ports 80/443) from the WAN to increase security.
- Allow VPN pass-through (ESP, ISAKMP for IPSec).

#### Redirect (Port Forward / DMZ)

```
config redirect
    option src 'wan'
    option dest 'lan'
    option proto 'tcp'
    option dest_port '8080'
    option target 'DNAT'
```

Used to open a port from outside to a specific device in the LAN (e.g., NVR camera, game server). DMZ is a special type that forwards all traffic to a single LAN IP address.

---

### File `/etc/config/dhcp`

Managed by **dnsmasq** (DHCPv4 + DNS) and **odhcpd** (DHCPv6/RA):

```
config dhcp 'lan'
    option interface 'lan'
    option start '100'
    option limit '150'
    option leasetime '12h'
    option dhcpv6 'server'
    option ra 'server'
```

- `start`/`limit`: dynamic IP range allocation (e.g., start 100, limit 150 → allocation from .100 to .249).
- `dhcpv6`/`ra`: enables DHCPv6 server and Router Advertisement for IPv6.
- `option ignore '1'` on an interface: completely disables DHCP allocation on that interface — commonly seen in **Dumb AP** models (because the main router handles allocation, avoiding conflicts between two DHCP servers in the same network).
- `list dhcp_option '6,<dns1>,<dns2>'`: specifies the DNS server to push IP addresses to clients via DHCP option 6.

---

### Summary: How to Quickly Read Any OpenWrt Configuration

When receiving an OpenWrt configuration with an unclear purpose, follow these steps to reconstruct the network architecture:

1. **`/etc/config/network`** → Determine how many physical zones there are (how many bridges, VLANs), which interfaces are WAN (with default routes), and which interfaces are LAN.
2. **`/etc/config/wireless`** → See which network each SSID is assigned to — this will tell you if the Wi-Fi is in a shared LAN or a separate VLAN (guest, IoT).
3. **`/etc/config/firewall`** → Check which zone has `MASQ` (NAT) enabled — if so, the device is acting as a true router/gateway, not a pure AP. If both WAN/LAN zones are REJECTED in both directions and there is no MASQ, it is highly likely to be a dummy AP.
4. **`/etc/config/dhcp`** → If DHCP on the LAN is `ignore '1'`, the device does not automatically assign an IP address — this confirms that this is a secondary AP that relies on DHCP from the main router.

The four steps above are sufficient to classify an OpenWrt device into one of the deployment models: **Dumb AP, Router (NAT), Relay/Repeater, Mesh (EasyMesh/802.11s), or VLAN multi-SSID** as presented in the previous section.

### Network Debugging Tools on OpenWrt

After understanding the static configuration (UCI files), the next step in troubleshooting is to check the actual runtime state using command-line tools. This section is divided by network layers (OSI) for easy lookup when problems arise.

#### Layers 1-2: Checking Interfaces, Links, and Bridges
```
ip link show
```
Check the UP/DOWN, MTU, and MAC status of each physical/virtual interface. An interface showing `DOWN` or `NO-CARRIER` is usually an indication of a faulty cable, damaged port, or unapplied configuration.
 
```
ip a
```
Check all the IP addresses (both IPv4 and IPv6) assigned to each interface — compare them with what's declared in `/etc/config/network` to see if the configuration has actually been applied.
 
```
bridge link show
bridge fdb show
```
The `bridge link` shows which port is on which bridge and the forwarding status. The `bridge fdb` (forwarding database) shows which MAC address the bridge learned through which port — useful when you suspect traffic is being forwarded to the wrong port or is in a loop.
 
```
swconfig list
swconfig dev switch0 show
```
Use this on devices with older-style switch chips (not DSA) to view VLAN configurations at the hardware switch layer.
 
#### Lớp 3: IP, Routing, ARP/Neighbor
 
```
ip route show
ip route show table all
```
Check the current routing table—especially important when you have multiple WANs/multi-route systems—to see which default route is actually being used.
 
```
ip neigh show
arp -a
```
Check the ARP (IPv4) / Neighbor Discovery (IPv6) table to confirm if the device can "see" the gateway or client's MAC address. If the route is correct but there are no ARP entries, the problem is likely at layer 2 (incorrect VLAN, cable, or firewall blocking ARP).
 
```
ping -c 4 <ip>
ping6 -c 4 <ipv6>
traceroute <ip>
mtr <ip>
```
`ping`/`ping6` checks basic connectivity. `traceroute`/`mtr` identifies which hops are experiencing traffic congestion or packet loss — `mtr` is superior because it runs continuously and statistically analyzes packet loss rates for each hop.
 
#### Application Layer / DNS / DHCP
 
```
nslookup google.com
nslookup google.com 8.8.8.8
```
The first query checks the default DNS resolver (usually the local dnsmasq), the second query specifies the external DNS directly to differentiate between errors caused by the local DNS or the upstream DNS.
 
```
cat /tmp/resolv.conf.auto
uci show dhcp
```
View the actual DNS server being used (provided by the ISP via DHCP) and the entire DHCP runtime configuration.
 
```
cat /tmp/dhcp.leases
```
This list includes clients that have been assigned IP addresses via the internal DHCP server—including MAC address, IP address, hostname, and lease expiration date. It's very useful for quickly checking which devices are currently on the network.
 
```
logread | grep dnsmasq
logread -f
```
`logread` reads the OpenWrt system logs (syslog); add `-f` to monitor real-time logs (similar to `tail -f`) — the quickest way to catch DHCP/DNS/wifi association errors as they occur.
 
#### WiFi cụ thể
 
```
iwinfo
iwinfo wlan0 info
iwinfo wlan0 assoclist
```
`iwinfo` (no parameters) lists all radios. `info` shows the channel, power, and current mode. `assoclist` shows a list of connected clients along with RSSI (signal strength) and TX/RX speed — very useful when you suspect a client has a weak signal or has dropped out.
 
```
iwinfo wlan0 scan
```
Scan nearby SSIDs — used to check for channel interference from neighboring APs.
 
```
iw dev
iw dev wlan0 station dump
```
The `iw` toolkit (gradually replacing `iwinfo` in some drivers) provides more detailed information about each connected station (signal, bitrate, retries).
 
With MediaTek chips (as in the configuration in the previous section), there may be additional vendor-specific debugging tools (e.g., `iwpriv`, or a state file in `/proc/`), depending on the specific firmware driver.
 
#### Firewall / NAT / Kết nối
 
```
iptables -t nat -L -n -v
iptables -L -n -v
```
Check the actual NAT rules and filters generated by nftables/iptables-nft from `/etc/config/firewall` — useful to verify that the desired rules are actually applied in the correct order (OpenWrt uses nftables, the equivalent command is `nft list ruleset`).
 
```
nft list ruleset
```
See the full nftables ruleset (the new standard replacing iptables from OpenWrt 21.02+).
 
```
conntrack -L
```
Check the connection tracking table — useful when debugging NAT, port forwarding not working, or if you suspect the connection tracking table is full (causing mass connection drops when there are many clients).
 
#### UCI logical state (via ubus)
 
```
ubus call network.interface dump
ubus call network.device status '{"name":"br-lan"}'
ubus call network.wireless status
```
Unlike reading static configuration files, `ubus` shows the **actual runtime** state that OpenWrt is currently using — including which interfaces are up/down, the IP addresses received (with DHCP/PPPoE), and any configuration errors. This is the most reliable way to know "what the system is thinking" instead of just reading the configuration file (because the file may have been modified but not yet reloaded).
 
#### Bandwidth / Performance
 
```
iperf3 -s # runs at one end as server
iperf3 -c <ip> # runs at the other end as client
```
Measures actual bandwidth between two points in the network (requires installing the `iperf3` package via `opkg install iperf3`) — used to differentiate whether the problem is due to Wi-Fi/wired bandwidth limitations or configuration/software issues.
 
```
top
htop
```
Monitor your device's CPU/RAM — many network problems (dropped connections, high latency) on weak routers are actually due to CPU overload (e.g., too many QoS, SQM, or VPN features enabled).

#### Suggested debugging procedure when encountering network problems

1. Identify the layer of the problem: complete network outage (check `ip a`, `ip route`) or just slow/dropped connections (check `mtr`, `iwinfo assoclist`).
2. Check layer 2 first (`ip link`, `bridge link`) — because if the cable/bridge is faulty, all layers above are meaningless.
3. Check layer 3 (`ip route`, `ping` each hop using `mtr`) to pinpoint the source of the network outage: within the LAN, at the gateway, or on the Internet.
4. If you suspect DNS, test separately using `nslookup <domain> 8.8.8.8` to rule out other possibilities. 5. Compare with the real-time log (`logread -f`) while reproducing the problem — especially effective for Wi-Fi connection drops or DHCP not assigning IP addresses.
6. Use `ubus call network.interface dump` to confirm that the UCI configuration has actually been applied correctly as per the file, avoiding incorrect debugging due to forgetting to reload the service.