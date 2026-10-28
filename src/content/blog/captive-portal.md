---
title: 'Wi-Fi Captive Portal'
description: 'Wi-Fi Captive Portal: Deep Technical Analysis'
pubDate: 'Oct 23 2026'
heroImage: '../../assets/captive_portal.jpg'
category: 'Wi-Fi'
---

## Overview

---

A captive portal is a Layer-3 gateway policy, not a Wi-Fi feature. The client associates and gets an address normally, and a stateful enforcement point blocks forwarding until a web or API transaction marks that client as authorized. Nothing in IEEE 802.11 defines it. The IETF standardizes only discovery (RFC 8910) and a status API (RFC 8908), plus an informational architecture (RFC 8952). Everything else interception, the login UI, the session model and the firewall mechanics is implementation specific.

---

### Typical Deployments

---

| Deployment | Typical access method |
| --- | --- |
| Public hotspots and cafés | Terms-of-service click-through |
| Hotels | Room number + surname, or PMS-issued voucher |
| Airports | Time-limited free tier, paid upgrade |
| Enterprise guest access | Sponsor approval, SMS/email OTP |
| Subscription hotspots | Account login, often RADIUS-backed |
| Home routers | Guest SSID with a simple portal |

---

### Component Roles

---

| Component | Role in the portal |
| --- | --- |
| Wireless client (STA) | Associates, runs DHCP/SLAAC, runs OS captive-portal detection, renders the login page. |
| AP / hostapd + driver | Beacons, association, keying, per-STA isolation (`ap_isolate`), VLAN tagging; emits STA connect/disconnect events. No HTTP role. |
| DHCP server (dnsmasq/odhcpd) | Assigns addresses, advertises RFC 8910 option; leases are the main IP↔MAC binding source. |
| DNS resolver | Resolves walled-garden names; must answer truthfully. |
| Gateway / firewall | The enforcement device: drops or redirects unauthorized forwarding, NATs authorized traffic. |
| Portal web server | Serves the splash page, the RFC 8908 API and the login endpoint. |
| Portal controller / session DB | Maps client → session, holds state, programs the firewall, handles expiry. |
| Authentication backend / RADIUS | Validates credentials or vouchers; returns policy (session timeout, bandwidth, VLAN); receives accounting. |

---

### Standard 

---

| Standardized | Implementation-specific |
| --- | --- |
| 802.11 auth/assoc, RSN, SAE, OWE (RFC 8110), 802.1X, 802.11u ANQP elements | HTTP 302 interception and walled-garden lists |
| DHCPv4 opt 114, DHCPv6 opt 103, RA opt 37 (RFC 8910) | OS probe URLs and expected bodies |
| Captive Portal API, `application/captive+json` (RFC 8908) | Splash page, login flows, vouchers |
| CAPPORT architecture (RFC 8952, Informational) | Client identification, firewall rules, session DB |
| HTTP 511 Network Authentication Required (RFC 6585) | Multi-AP session sharing |
| RADIUS (RFC 2865/2866), CoA/Disconnect (RFC 5176) | Vendor RADIUS attributes for portals (e.g. WISPr) |

---

### End-to-end Connection Flow

---

The client reaches the Internet only after thirteen hand-offs, and only stages 10–11 are portal-specific; most field failures happen at stages 4–7, before any login.

<div style="text-align: center;">

![Alt text](../../assets/technology/Captive_Portal/wi-fi-captive-portal-onboarding-flow-light.svg)

</div>

---

### Stage-by-stage

---

| # | Stage | Initiator → processor | Protocol / message | Expected result | Common failures |
| --- | --- | --- | --- | --- | --- |
| 1 | Scan, SSID select | STA → AP | Probe Req/Resp, Beacon; optional ANQP (802.11u) | SSID listed with correct security | Hidden SSID; wrong country/channel; client refuses OWE transition mode |
| 2 | 802.11 auth + association | STA → hostapd/driver | Auth (Open/SAE), (Re)Assoc Req/Resp | AID assigned | Max STA reached; ACL deny; SAE H2E/PMF mismatch |
| 3 | Security negotiation | AP ↔ STA | EAPOL-Key 4-way (WPA2/3/OWE) or EAP (802.1X) | PTK/GTK installed, port open | Wrong PSK; PMF required but unsupported; group rekey timeouts |
| 4 | Address assignment | STA → DHCP server; STA → router (RS) | DHCPv4 DORA; SLAAC/DHCPv6; RFC 8910 options | IPv4 lease, IPv6 addresses, opt 114/103/RA 37 | DHCP blocked by guest firewall; pool exhausted by randomized MACs; VLAN mismatch |
| 5 | DNS | STA → resolver | DNS/UDP 53 (or DoT/DoH) | Real answers for all names | Resolver unreachable from guest zone; client uses DoH to a blocked IP |
| 6 | Portal detection | STA OS | RFC 8908 API GET, or HTTP probe | OS decides "captive" | Probe host in walled garden (no detection); probe blocked instead of redirected ("no Internet") |
| 7 | Interception / discovery | Gateway | nftables DNAT tcp/80 → portal; or API URL | 302 or `captive:true` | HTTPS probe timeouts; IPv6 probe bypasses rules; redirect to IP literal with TLS |
| 8 | Portal page | STA → portal web server | HTTPS | Page renders in CNA/browser | Cert not valid for name; CDN assets outside walled garden; CNA lacks cookies/JS features |
| 9 | User action | User → portal app | HTTPS POST | Credentials/voucher submitted | CSRF/session cookie lost between CNA and browser |
| 10 | Backend authorization | Portal → auth backend | RADIUS Access-Request, REST, DB | Accept + policy | RADIUS secret/timeout; clock skew on vouchers |
| 11 | Firewall update | Controller → kernel | netlink (nft), ipset | Client's addresses in auth sets | Race: OS re-probes before rule installed; only IPv4 added |
| 12 | Internet access | STA → Internet via gateway | Routed + NAT | OS shows connected | MTU, upstream DNS, NAT table full |
| 13 | Expiry / logout | Kernel timer or controller | Set timeout, RADIUS Session-Timeout, CoA/Disconnect (RFC 5176), STA disassoc | Client returns to captive | Stale conntrack keeps flows alive; set entries never removed |

---

### Captive Portal Detection on Client Devices

---

Every major OS uses two mechanisms: 
- **positive signal** (RFC 8910 option → RFC 8908 API)
- **legacy cleartext HTTP probe** to a vendor host whose exact response it knows

Any deviation a redirect, a different body, an empty 200 is read as "captive", a timeout or reset is read as "no Internet", which shows no login prompt. Probe URLs below are as documented by the vendor where a vendor document exists; anything marked *observed* comes from third-party captures and can change without notice.

---

#### Standards-based Discovery

---

- The network places an HTTPS API URI in **DHCPv4 option 114**, **DHCPv6 option 103** or **IPv6 RA option 37**. RFC 8910 replaced RFC 7710, whose DHCPv4 code 160 conflicted with other uses ([RFC 8910](https://www.rfc-editor.org/rfc/rfc8910.html)). The URI `urn:ietf:params:capport:unrestricted` tells clients they can skip detection.
- The client sends `GET` with `Accept: application/captive+json`; the server must answer with that content type and a JSON body whose only mandatory key is `captive` (boolean). Optional keys: `user-portal-url`, `venue-info-url`, `can-extend-session`, `seconds-remaining`, `bytes-remaining` ([RFC 8908](https://www.rfc-editor.org/rfc/rfc8908.html)).
- The API **must** be HTTPS with a certificate valid for the provisioned hostname; if validation fails the client must ignore the API and fall back to legacy behaviour. Responses should carry `Cache-Control: private` or `no-store`. A captive network should still allow OCSP/CRL and NTP so the client can validate the certificate.
- Client identity: if the API server cannot see the client's identity itself (e.g. the API is off-box and NATed), RFC 8908 §4 recommends a **per-client API URI** (e.g. `/captive-portal/api/X54PD39JV`) handed out in each DHCP lease.

---

## System Architecture

---

<div style="text-align: center;">

![Alt text](../../assets/technology/Captive_Portal/guest-wi-fi-captive-portal-topology-light.svg)

</div>

The gateway is the only place that sees all guest traffic, has the DHCP bindings, and can NAT. The APs only bridge the guest SSID into VLAN 30 and isolate clients; they hold no authorization state, so roaming between them does not affect the portal session.

---

### Responsibilities

---

| Component | Owns | Inputs | Outputs | Must not |
| --- | --- | --- | --- | --- |
| hostapd + driver | Association, keying, PMF, per-STA isolation, VLAN mapping | hostapd.conf (via netifd/UCI) | STA connect/disconnect events (ctrl iface, ubus `hostapd.*`) | Make portal decisions |
| dnsmasq | DHCPv4 leases, opt 114, DNS forwarding | UCI `dhcp` | Lease DB, `dhcp-script` / ubus lease events | Fake DNS answers for the whole Internet |
| odhcpd | RA, DHCPv6, NDP proxying | UCI `dhcp` | IPv6 lease/neighbour data | Hand out global IPv6 if IPv6 is not enforced |
| nftables (fw4 + custom table) | Packet enforcement, redirect, NAT, rate limits | Rules + dynamic sets | Accept/drop/DNAT decisions, counters | Contain business logic |
| Portal controller | Session lifecycle, client identity binding, timers, RADIUS client | Leases, STA events, login results | Set element add/del, accounting, logs | Trust client-supplied identifiers |
| Web server | TLS termination, splash, login, API | HTTP requests | Calls to controller | Expose management UI on the guest interface |
| Auth backend / RADIUS | Credentials, vouchers, policy | Access-Request | Accept + attributes; CoA/Disconnect | — |

---

### Comparison of Deployment Models

---

Gateway-based enforcement with an optionally external or cloud-hosted portal UI is the right default for embedded products; AP-based enforcement only makes sense for standalone single-AP devices or with a controller that synchronizes state.

---

| Aspect | A. Gateway-based | B. AP-based | C. Centralized enterprise (controller) | D. External portal | E. Cloud-managed |
| --- | --- | --- | --- | --- | --- |
| Traffic flow | AP bridges to gateway; gateway redirects, enforces, NATs | AP filters/redirects locally (often bridge-family rules), then bridges or routes | APs tunnel (CAPWAP/GRE/VXLAN) or VLAN-trunk guest traffic to controller/anchor | Enforcement local; splash/login on a remote web server, result returned to enforcement point via signed redirect or API | Local enforcement (AP or gateway) driven by cloud policy; portal often cloud-hosted |
| Session-state location | Gateway | Each AP | Controller (replicated in HA pairs) | Enforcement point + external server | Cloud DB, cached on device |
| Roaming | Transparent across APs on the same L2 guest VLAN | Lost on roam unless APs sync state | Transparent (central anchor) | Same as the enforcement point used | Depends on whether device or cloud is authoritative; usually re-auth by MAC on new AP |
| Scalability | Hundreds to low thousands of clients per gateway (CPU/conntrack bound) | Scales with APs, but per-AP RAM is small | High, controller-sized | Portal scales independently | High; enforcement still local |
| Security boundary | One hardened box; guest never touches AP management | Every AP is an enforcement point and must be hardened | Strong; guests tunneled away from local LAN | Must authenticate the callback (HMAC/token), or anyone can grant access | Cloud account and device-cloud channel become attack surface |
| External dependency | None for local ToS/voucher | None | Controller reachability | Login impossible if WAN or portal host is down | Login and policy changes depend on WAN + cloud; define offline behaviour |
| Operational complexity | Low–medium | Low per box, high at scale | High | Medium | Low for operator, high for vendor |
| Home router | Best fit | Acceptable (single AP) | Overkill | Rare | Common in ISP CPE |
| Hospitality | Good (PMS integration on portal server) | Weak | Good for large hotels | Common (vendor portal) | Very common |
| Public hotspot | Good | Weak | Good (carrier) | Common | Very common |
| Enterprise guest | Good for branches | Weak | Best fit | Common (sponsor portal) | Common |

---

| Model | Typical use | Key strength | Main limitation / design note |
| --- | --- | --- | --- |
| Gateway-based | Single-site routers and gateways | Sees every packet, owns DHCP bindings, applies IPv4 and IPv6 policy consistently | CPU for TLS and nftables set size on small SoCs; budget conntrack entries per client |
| AP-based | Standalone APs that also route (travel routers, single-AP SOHO) | No separate gateway needed | With multiple bridged APs, each sees only its own clients, so a roam re-captures the client unless the session is pushed to all APs. Bridge-family filtering needs `br_netfilter` or the nftables `bridge` family and must handle IPv6 ND and DHCP explicitly |
| Centralized controller | Large enterprise and campus | Guest traffic tunneled to an anchor controller (often in a DMZ): strong isolation, one session store | Tunnel MTU overhead; dependency on the controller |
| External portal | Vendor or hosted login UI (openNDS calls it FAS; vendors call it external captive portal) | UI and authentication scale independently of the enforcement box | Security rests on the token exchange: the enforcement device redirects with a signed query string, the external server calls back with a token. openNDS, for example, sends a hashed client id and requires a return hash computed with a pre-shared `faskey` ([openNDS FAS](https://opennds.readthedocs.io/en/stable/fas.html)) |
| Cloud-managed | Multi-site operators | Same as D, plus central configuration and reporting | Define WAN-loss behaviour: fail-closed (no new logins), fail-open for existing sessions, or a local ToS fallback |

---

### Linux/OpenWrt Implementation

---

| Component | Change needed | Integration point |
| --- | --- | --- |
| hostapd / wpad, driver | None (config only) | UCI `wireless`; ubus `hostapd.<ifname>` events and `del_client`; `hostapd_cli` |
| netifd | None | UCI `network`; ubus `network.interface.guest` |
| dnsmasq | None (config; `dnsmasq-full` if you need nftset walled garden) | UCI `dhcp`, `dhcpscript` lease hook, `dhcp_option` |
| odhcpd | None | UCI `dhcp`; `ubus call dhcp ipv6leases` |
| firewall4 | None | UCI zones/rules; custom table in a separate file |
| nftables | New table `inet portal` | `nft -f`, netlink from controller |
| Web server | New uhttpd instance or nginx bound to guest IP | UCI `uhttpd` or nginx conf |
| Portal controller | **New** daemon | procd service, ubus object `portal`, nft netlink, RADIUS client |

---

## Captive Portal on OpenWrt with uspot + spotfilter

---

| | |
|---|---|
| **Scope** | Design, porting and hardening of a production captive portal for OpenWrt-based access points, built on **uspot** (control plane) and **spotfilter** (eBPF data plane) |
| **Audience** | Firmware / platform engineers, portal & RADIUS backend engineers, QA |
| **Baseline code** | `uspot` (OpenWiFi, J. Crispin) and `spotfilter` (F. Fietkau) as provided in `uspot.zip` and `spotfilter.zip` |
| **Target platform** | Qualcomm-based OpenWrt AP (fw4/nftables, NSS ECM present) |
| **Status** | Draft for development — sections marked **[VERIFY]** must be confirmed on target hardware |

---

### Why is the uspot?

---

| Concern | CoovaChilli (current) | uspot + spotfilter (target) |
|---|---|---|
| Client data path | Every client packet passes through the `chilli` process (raw socket → `tun0`) | Kernel forwarding; packets never enter userspace |
| Throughput | Bounded by one userspace process on the AP CPU | Bounded by kernel / hardware forwarding |
| DHCP for clients | Chilli's own DHCP server | Standard OpenWrt `dnsmasq` |
| Access decision | Per packet in userspace | eBPF classifier sets a firewall mark; fw4 enforces |
| fw4 / nftables integration | Indirect (`iptables-nft` shims, duplicate-packet RST issue required an extra prerouting rule) | Native: one mark, a handful of fw4 rules |
| Accounting counters | Chilli | eBPF per-client counters |
| Code base | C, largely unmaintained (v1.6 on target) | ucode + small C/eBPF components, part of the OpenWrt/OpenWiFi ecosystem |


---

###  System Architecture

---

```mermaid
flowchart TB
    C["STA"]
    P["External portal<br/>UAM web server"]
    subgraph AP["OpenWrt access point"]
        direction LR
        SF["spotfilter<br/>eBPF data plane"]
        UP["uspot<br/>control plane"]
        SF -. "client state via ubus" .- UP
    end
    I(("Internet"))
    R["RADIUS server<br/>auth + accounting + CoA"]
 
    C -- "1 - WiFi, DHCP, DNS, user traffic" --> SF
    C -- "2 - HTTP redirects, /logon, /logoff" --> UP
    C -- "3 - HTTPS login page" --> P
    SF -- "4 - authenticated traffic, NAT" --> I
    UP -- "5 - Access-Request, Accounting-Request" --> R
    R -- "6 - Disconnect / CoA via hostapd DAS" --> UP
```

| # | Interaction |
|---|---|
| 1 | Client associates and sends all its packets through the spotfilter classifier on the WiFi netdev |
| 2 | uspot (uhttpd handlers) redirects garden clients and receives the `/logon` request built by the portal |
| 3 | Client loads the login page from the external portal (whitelisted host); the portal answers with a 302 to the AP's `/logon` |
| 4 | After login, packets carry mark 1 and are forwarded and NATed to the Internet |
| 5 | uspot authenticates the user and reports accounting to RADIUS; Access-Accept carries the policy attributes |
| 6 | The backend disconnects a client through hostapd's Dynamic Authorization Server |

---

### Control plane (uspot)

---

```mermaid
flowchart TB
    UH["uhttpd + ucode handlers<br/>handler-cpd.uc :80<br/>handler.uc /hotspot<br/>handler-uam.uc :3990"]
    PO["portal.uc<br/>shared library"]
    UAM["uam.so<br/>MD5, CHAP"]
    RC["radius-client<br/>C, libradcli"]
    UD["uspot.uc daemon<br/>accounting, timeouts, quota"]
    HP["hostapd<br/>RADIUS DAS"]
    RL["ratelimit<br/>per-client shaping"]
    SFD["spotfilter daemon<br/>see 3.2.2"]
    CT["conntrack"]
    R["RADIUS server"]
 
    UH --> PO
    PO --> UAM
    PO --> RC
    PO -- "client_set / client_get" --> SFD
    PO -- "uspot client_add / remove" --> UD
    UD --> RC
    RC -- "RADIUS" --> R
    UD -- "client_list / client_set" --> SFD
    UD -- "client_set / delete" --> RL
    HP -- "notify coa" --> UD
    UD -- "conntrack -D on kick" --> CT
```

---

### Data plane (spotfilter)

---

```mermaid
flowchart TB
    CLI["captive generate<br/>uspot UCI to JSON"]
    SFD["spotfilter daemon<br/>station tracking<br/>DHCP / ARP / NA / DNS snooping"]
    DM["dnsmasq<br/>DHCP + DNS"]
    subgraph KS["Kernel"]
        direction TB
        MAPS[("BPF maps<br/>client, class, whitelist")]
        BPFI["spotfilter_in<br/>tc ingress on wlanX"]
        BPFE["spotfilter_out<br/>tc egress on wlanX"]
        IFB["spotfilter-ifb<br/>snoop device"]
        FW["fw4 / nftables<br/>mark 1/127"]
    end
 
    CLI -- "ubus interface_add" --> SFD
    SFD -- "map updates" --> MAPS
    MAPS --- BPFI
    MAPS --- BPFE
    BPFI -- "clone control packets" --> IFB
    BPFE -- "clone DHCP and DNS replies" --> IFB
    IFB -- "AF_PACKET raw socket" --> SFD
    BPFI -- "skb mark" --> FW
    DM -. "DHCP ACK, DNS replies" .-> BPFE
```

---

### Internal/Local Captive Portal

---

```mermaid
flowchart LR
    C["WiFi client"]
    subgraph AP["OpenWrt AP"]
        direction LR
        UH["uhttpd<br/>portal"] --> US["uspot"] --> UF["uspotfilter"] --> FW["fw4<br/>set uspot"]
    end
    I(("Internet"))
 
    C -- "login page" --> UH
    C -- "traffic" --> FW
    FW -- "MAC in set" --> I
```

---

| Component | Package / file | Role |
|---|---|---|
| uhttpd + ucode handlers | `uhttpd-mod-ucode`, `/usr/share/uspot/handler*.uc` | Serves the portal: `/cpd` redirects any garden request, `/hotspot` shows and processes the login form |
| Templates | `/usr/share/uspot/templates/*.ut` | Login, click, connected, error pages; they include `/www-uspot/header.html` and `footer.html` |
| uspot daemon | `/usr/share/uspot/uspot.uc` (procd service `uspot`) | Validates credentials (or calls RADIUS), keeps the session table, timeouts, accounting, rate limits |
| uspotfilter | package `uspotfilter` (separate procd service) | Tracks clients and puts authorised MACs into the nftables set; supplies the client list to uspot |
| fw4 set | `config ipset` named like `setname` | MACs of authorised clients; the firewall forwards only these |
| uspot-das | `/usr/bin/uspot-das` | RADIUS Dynamic Authorization (CoA/Disconnect); started only when `das_secret` is set |
| dnsmasq | standard OpenWrt | DHCP and DNS for captive clients |

---

```mermaid
flowchart LR
    W1["wlan5<br/>Free-WiFi, open, isolated"] --> BC["br-captive<br/>10.0.0.1/22<br/>zone captive"]
    W2["wlan1 / wlan9<br/>private SSIDs"] --> BL["br-lan<br/>192.168.2.1/24<br/>zone lan"]
    BC -- "only MACs in set uspot" --> WAN["wan0 / eth0.35<br/>masquerade"]
    BL --> WAN
```

The captive SSID has its **own bridge, IP subnet, DHCP scope and firewall zone**. Private SSIDs are not affected.

---

#### Processing Flows

---

#### Client joins the captive network

---

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant D as dnsmasq
    participant F as fw4
    participant H as uhttpd /cpd
 
    C->>D: DHCP Discover / Request on br-captive
    D-->>C: DHCP ACK 10.0.0.x, gateway and DNS 10.0.0.1
    C->>D: DNS query (allowed before login)
    D-->>C: DNS answer
    C->>F: HTTP GET captive-detection URL
    F->>H: MAC not in set uspot - DNAT to 10.0.0.1:80
    H-->>C: 302 to http://10.0.0.1/hotspot
    Note over C: OS opens the Captive Wi-Fi sheet
```

---

#### Login with local credentials

---

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant H as uhttpd /hotspot
    participant U as uspot daemon
    participant UF as uspotfilter
    participant F as fw4 set uspot
 
    C->>H: GET /hotspot
    H->>U: client state for this MAC
    U-->>H: not authenticated
    H-->>C: credentials page (header.html + form + footer.html)
    C->>H: POST action=credentials, username, password
    H->>U: ubus uspot client_auth
    U->>U: match credentials sections with option uspot = captive
    alt match
        U->>U: create client (session, timeouts)
        U->>UF: ubus uspotfilter client_set
        UF->>F: add client MAC
        H-->>C: allowed - redirect / connected page
        C->>F: traffic to Internet - forwarded
    else no match
        H-->>C: credentials page again (error flag)
    end
```

---

#### Firewall Decision

---

```mermaid
flowchart LR
    P["Client packet"] --> A{"To AP?"}
    A -- "yes" --> B{"DHCP, DNS<br/>or HTTP?"}
    B -- "yes" --> OK["ACCEPT"]
    B -- "no" --> R["REJECT"]
    A -- "no" --> C{"MAC in<br/>set uspot?"}
    C -- "yes" --> FWD["FORWARD + NAT"]
    C -- "no" --> D{"HTTP?"}
    D -- "yes" --> DNAT["DNAT to portal"]
    D -- "no" --> R
```

Ports: DHCP = UDP 67, DNS = UDP/TCP 53, HTTP = TCP 80. The DNAT target is `10.0.0.1:80`, where `/cpd` answers with a 302 to `/hotspot`.

---

#### Session End

---

```mermaid
flowchart LR
    T["Every 10 s"] --> L["Client list<br/>from uspotfilter"]
    L --> X{"Timeout<br/>or gone?"}
    X -- "yes" --> K["Remove client"]
    X -- "no" --> T
```

"Timeout" means `session_timeout` or `idle_timeout` exceeded; "gone" means the client left the WiFi. When a client is removed, uspotfilter takes its MAC out of the set and the client sees the login page again.
 
**Important:** this loop depends on the client list from uspotfilter. If uspotfilter is not running, uspot logs `no client list from uspotfilter!` every 10 s and **never expires sessions**

---
#### Prerequisites Packages
---

```
uspot uspotfilter uhttpd uhttpd-mod-ucode dnsmasq
ucode-mod-bpf ucode-mod-fs ucode-mod-math ucode-mod-nl80211 ucode-mod-rtnl
ucode-mod-struct ucode-mod-ubus ucode-mod-uci ucode-mod-uloop ucode-mod-log
kmod-sched-bpf libbpf1
```

---
#### Captive network and WiFi
---

```bash
# Bridge with IP address (uspot uses OpenWrt DHCP, unlike CoovaChilli)
uci set network.captive_dev=device
uci set network.captive_dev.name='br-captive'
uci set network.captive_dev.type='bridge'
uci set network.captive_dev.bridge_empty='1'
 
uci set network.captive=interface
uci set network.captive.device='br-captive'
uci set network.captive.proto='static'
uci set network.captive.ipaddr='10.0.0.1'
uci set network.captive.netmask='255.255.252.0'
 
# DHCP scope
uci set dhcp.captive=dhcp
uci set dhcp.captive.interface='captive'
uci set dhcp.captive.start='10'
uci set dhcp.captive.limit='1000'
uci set dhcp.captive.leasetime='1h'
 
# Captive SSID
uci set wireless.wlan5.network='captive'
uci set wireless.wlan5.ssid='Free-WiFi'        # must differ from every private SSID
uci set wireless.wlan5.encryption='none'
uci set wireless.wlan5.isolate='1'             # clients cannot reach each other
uci -q delete wireless.wlan5.key
uci -q delete wireless.wlan5.sae_pwe
uci set wireless.wlan5.ieee80211w='0'
 
uci commit network; uci commit dhcp; uci commit wireless
/etc/init.d/network reload
/etc/init.d/dnsmasq restart
wifi reload
```
 
Verify:
 
```bash
ip addr show br-captive                       # inet 10.0.0.1/22
ifstatus captive | grep -E '"up"|"address"'
```
 
If dnsmasq is restricted to some interfaces (`uci show dhcp | grep "@dnsmasq\[0\].interface"`), add `captive`:
 
```bash
uci add_list dhcp.@dnsmasq[0].interface='captive'
uci commit dhcp; /etc/init.d/dnsmasq restart
```

---
#### Firewall
---

```bash
# Set of authorised client MACs - name must equal uspot "setname"
uci set firewall.uspot_set=ipset
uci set firewall.uspot_set.name='uspot'
uci add_list firewall.uspot_set.match='src_mac'
 
# Captive zone - no "forwarding captive -> wan" section!
uci set firewall.captive_zone=zone
uci set firewall.captive_zone.name='captive'
uci add_list firewall.captive_zone.network='captive'
uci set firewall.captive_zone.input='REJECT'
uci set firewall.captive_zone.output='ACCEPT'
uci set firewall.captive_zone.forward='REJECT'
 
# Unauthorised HTTP -> portal on the AP
uci set firewall.captive_cpd=redirect
uci set firewall.captive_cpd.name='Redirect-unauth-captive-CPD'
uci set firewall.captive_cpd.src='captive'
uci set firewall.captive_cpd.proto='tcp'
uci set firewall.captive_cpd.src_dport='80'
uci set firewall.captive_cpd.dest_port='80'
uci set firewall.captive_cpd.target='DNAT'
uci set firewall.captive_cpd.reflection='0'
uci set firewall.captive_cpd.ipset='!uspot'
 
# Services on the AP for captive clients
uci set firewall.captive_in=rule
uci set firewall.captive_in.name='Allow-captive-portal'
uci set firewall.captive_in.src='captive'
uci set firewall.captive_in.proto='tcp'
uci set firewall.captive_in.dest_port='80'
uci set firewall.captive_in.target='ACCEPT'
 
uci set firewall.captive_dhcp=rule
uci set firewall.captive_dhcp.name='Allow-captive-DHCP'
uci set firewall.captive_dhcp.src='captive'
uci set firewall.captive_dhcp.proto='udp'
uci set firewall.captive_dhcp.dest_port='67'
uci set firewall.captive_dhcp.target='ACCEPT'
 
uci set firewall.captive_dns=rule
uci set firewall.captive_dns.name='Allow-captive-DNS'
uci set firewall.captive_dns.src='captive'
uci add_list firewall.captive_dns.proto='udp'
uci add_list firewall.captive_dns.proto='tcp'
uci set firewall.captive_dns.dest_port='53'
uci set firewall.captive_dns.target='ACCEPT'
 
# Authorised clients -> Internet
uci set firewall.captive_fwd=rule
uci set firewall.captive_fwd.name='Forward-auth-captive'
uci set firewall.captive_fwd.src='captive'
uci set firewall.captive_fwd.dest='wan'
uci set firewall.captive_fwd.proto='all'
uci set firewall.captive_fwd.ipset='uspot'
uci set firewall.captive_fwd.target='ACCEPT'
 
uci commit firewall
/etc/init.d/firewall restart
nft list set inet fw4 uspot          # exists, type ether_addr, empty
```
 
The `wan` zone must keep `masq '1'`. For UAM/RADIUS modes, also allow TCP 3990

---
#### uhttpd and portal pages
---

---
#### Listener
---

```bash
uci -q delete uhttpd.uspot
uci set uhttpd.uspot=uhttpd
uci add_list uhttpd.uspot.listen_http='10.0.0.1:80'
uci set uhttpd.uspot.redirect_https='0'
uci set uhttpd.uspot.no_dirlists='1'
uci set uhttpd.uspot.max_requests='5'
uci set uhttpd.uspot.home='/www-uspot'
uci add_list uhttpd.uspot.ucode_prefix='/hotspot=/usr/share/uspot/handler.uc'
uci add_list uhttpd.uspot.ucode_prefix='/cpd=/usr/share/uspot/handler-cpd.uc'
uci set uhttpd.uspot.error_page='/cpd'          # every unknown path -> CPD redirect
 
# LuCI must not grab port 80 on all addresses
uci -q delete uhttpd.main.listen_http
uci add_list uhttpd.main.listen_http='192.168.2.1:80'
 
uci commit uhttpd
mkdir -p /www-uspot
```
---
#### Header and footer (mandatory)
---

The templates include **`/www-uspot/header.html`** and **`/www-uspot/footer.html`** (path hard-coded in `portal.uc`). They are not shipped; without them the portal returns *500 Include file not found*.
 
```bash
cat > /www-uspot/header.html <<'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Free WiFi</title>
<style>
 body{font-family:system-ui,-apple-system,sans-serif;background:#f4f6f8;margin:0;color:#1d1f21}
 .box{max-width:380px;margin:40px auto;background:#fff;border-radius:12px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,.08)}
 h1{font-size:22px;margin:0 0 16px;text-align:center}
 input[type=text],input[type=password]{width:100%;padding:12px;margin:6px 0;border:1px solid #ccd;border-radius:8px;font-size:16px;box-sizing:border-box}
 input[type=submit],button{width:100%;padding:12px;margin-top:12px;border:0;border-radius:8px;background:#0b6e8a;color:#fff;font-size:16px}
</style>
</head>
<body><div class="box"><h1>Free WiFi</h1>
EOF
 
cat > /www-uspot/footer.html <<'EOF'
</div></body></html>
EOF
```
 
Rules for customisation:
 
- Both files are processed as **ucode templates**: never use `{{`, `{%` or `{#` in them.
- Images and CSS placed in `/www-uspot/` are served directly (e.g. `<img src="/logo.png">`).
- Changes take effect on the next page load; no restart needed.
- Page bodies are in `/usr/share/uspot/templates/*.ut` (package files; keep a copy of any change, upgrades overwrite them).

---
#### uspot configuration (local credentials)
---

```bash
cat > /etc/config/uspot <<'EOF'
config uspot 'captive'
	option auth_mode 'credentials'
	option interface 'captive'
	option setname 'uspot'
	option idle_timeout '900'
	option session_timeout '3600'
	option debug '0'
 
config credentials 'user1'
	option uspot 'captive'
	option username 'demo'
	option password 'demo123'
 
config credentials 'user2'
	option uspot 'captive'
	option username 'guest'
	option password 'guest2026'
EOF
```
 
| Option | Required | Meaning |
|---|---|---|
| section name (`captive`) | yes | uspot instance name; referenced by `credentials ... option uspot` and in ubus calls |
| `auth_mode` | yes | `credentials`, `click-to-continue`, `radius`, `uam` |
| `interface` | yes | **Network** section of the captive bridge (`network.captive`), not a WiFi device |
| `setname` | yes | nftables set name; must match the fw4 `ipset` name |
| `idle_timeout` | no | Seconds, default 600 |
| `session_timeout` | no | Seconds, default 0 = unlimited |
| `debug` | no | `1` logs each portal step |
| `credentials.uspot` | yes | Name of the uspot section this account belongs to |
| `credentials.username/password` | yes | Plain text, case-sensitive |
 
For a terms-only portal use `auth_mode 'click-to-continue'` and no `credentials` sections.
 
Accounts are read by the uspot daemon: after editing them run `/etc/init.d/uspot restart`.

---
#### Start-up and verification
---

#### Enable services
 
---

```bash
/etc/init.d/uspotfilter enable
/etc/init.d/uspotfilter start
/etc/init.d/uspot enable
/etc/init.d/uspot restart
/etc/init.d/uhttpd restart
```
 
**uspotfilter is a separate service.** The `uspot` init script does not start it.

---
#### Checks on the AP
--- 
```bash
ps w | grep -E "uspot|uspotfilter" | grep -v grep   # both processes present
ubus list | grep -i uspot                           # uspot AND uspotfilter
netstat -ltn | grep "10.0.0.1:80"                    # portal listener
nft list set inet fw4 uspot                          # empty before any login
logread -e uspot | tail                              # no errors, no "no client list"
```

---
#### End-to-end test
---
1. Phone (mobile data off) joins `Free-WiFi` and receives `10.0.0.x`.
2. The Captive Wi-Fi sheet opens (or browse to `http://1.1.1.1`) and shows the login form.
3. Log in with `demo` / `demo123`.
4. On the AP:
```bash
   nft list set inet fw4 uspot        # phone MAC listed
   logread -e uspot | tail -5         # "creating client", "allowing client"
```
5. The phone browses the Internet.
6. After `session_timeout` the MAC disappears from the set and the login page is shown again.

---
### External RADIUS authentication
---

Validated in the lab: login page served by the AP (auth_mode 'radius'), user accounts checked by an existing RADIUS server, authentication only (no accounting). Network, firewall, uhttpd, header/footer and uspotfilter are exactly as in sections 4–6 and 8; only the uspot configuration changes and the radcli dictionary is added.

---
#### Processing Flows
---

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant H as uhttpd /hotspot
    participant U as uspot
    participant RC as radius-client
    participant R as RADIUS RADIUS_SERVER_IP
    participant UF as uspotfilter
 
    C->>H: POST username, password
    H->>U: client_auth
    U->>RC: request (PAP)
    RC->>R: Access-Request, UDP 1812
    R-->>RC: Access-Accept or Reject
    RC-->>U: result
    U->>UF: client_set (on Accept)
    UF-->>C: MAC added to set - Internet
```

The same `credentials.ut` form is used for `credentials` and `radius` modes; its hidden `action` field is set from `auth_mode`, so no template change is needed.

---
#### Information for the RADIUS administrator
---

The AP must be declared as a RADIUS client (NAS) on the server:
 
| Item | Value |
|---|---|
| NAS IP (source of RADIUS packets) | IP (AP WAN address) |
| Shared secret | Agreed with the RADIUS team; letters and digits only, ≥ 16 characters |
| Port | UDP 1812 (authentication). No accounting |
| NAS-Identifier | `AP-240B2A000002` |
| Authentication method | **PAP** (User-Password) must be allowed. On Windows NPS: enable *Unencrypted authentication (PAP, SPAP)* in the network policy |
| Attributes sent by the AP | User-Name, User-Password, NAS-Identifier, NAS-IP-Address, Called-Station-Id, Calling-Station-Id (client MAC), Framed-IP-Address, NAS-Port-Type = 19 |
| Optional reply attributes | `Session-Timeout`, `Idle-Timeout`, `WISPr-Bandwidth-Max-Down/Up` (bit/s), `Reply-Message` |
| Test account | Requested from the RADIUS team |

---
#### radcli dictionary (mandatory)
---

`radius-client` reads `/etc/radcli/dictionary` on every request. The OpenWrt `libradcli` package does not ship it. Without it every login fails with `invalid credentials` (see 10.8).
 
**Step 1 — standard dictionary.** The files are plain text and architecture-independent; copy them from any Linux host with radcli installed (e.g. Ubuntu `libradcli4`):
 
```bash
# on the Ubuntu PC
sudo apt install libradcli4
ssh root@<AP> 'mkdir -p /etc/radcli'
scp -O /etc/radcli/dictionary* root@<AP>:/etc/radcli/
```
 
On the AP, every file named in an `$INCLUDE` line must exist:
 
```bash
grep '^\$INCLUDE' /etc/radcli/dictionary
ls /etc/radcli/
```
 
**Step 2 — hotspot vendor dictionary.** The radcli set has no WISPr (14122) or ChilliSpot (14559) attributes, which uspot uses. Without them `radius-client` fails with `Failed to lookup attribute key N`.
 
```bash
cat > /etc/radcli/dictionary.hotspot <<'EOF'
# WISPr vendor-specific attributes
VENDOR          WISPr           14122
ATTRIBUTE       WISPr-Location-ID                       1       string  WISPr
ATTRIBUTE       WISPr-Location-Name                     2       string  WISPr
ATTRIBUTE       WISPr-Logoff-URL                        3       string  WISPr
ATTRIBUTE       WISPr-Redirection-URL                   4       string  WISPr
ATTRIBUTE       WISPr-Bandwidth-Min-Up                  5       integer WISPr
ATTRIBUTE       WISPr-Bandwidth-Min-Down                6       integer WISPr
ATTRIBUTE       WISPr-Bandwidth-Max-Up                  7       integer WISPr
ATTRIBUTE       WISPr-Bandwidth-Max-Down                8       integer WISPr
ATTRIBUTE       WISPr-Session-Terminate-Time            9       string  WISPr
ATTRIBUTE       WISPr-Billing-Class-Of-Service          11      string  WISPr
 
# ChilliSpot vendor-specific attributes
VENDOR          ChilliSpot      14559
ATTRIBUTE       ChilliSpot-Max-Input-Octets             1       integer ChilliSpot
ATTRIBUTE       ChilliSpot-Max-Output-Octets            2       integer ChilliSpot
ATTRIBUTE       ChilliSpot-Max-Total-Octets             3       integer ChilliSpot
ATTRIBUTE       ChilliSpot-Bandwidth-Max-Up             4       integer ChilliSpot
ATTRIBUTE       ChilliSpot-Bandwidth-Max-Down           5       integer ChilliSpot
ATTRIBUTE       ChilliSpot-Config                       6       string  ChilliSpot
ATTRIBUTE       ChilliSpot-Lang                         7       string  ChilliSpot
ATTRIBUTE       ChilliSpot-Version                      8       string  ChilliSpot
ATTRIBUTE       ChilliSpot-OriginalURL                  9       string  ChilliSpot
EOF
 
grep -q dictionary.hotspot /etc/radcli/dictionary || \
  echo '$INCLUDE /etc/radcli/dictionary.hotspot' >> /etc/radcli/dictionary
grep -c "$(printf '\t')" /etc/radcli/dictionary.hotspot     # must be 0
```
 
radcli dictionary rules learnt in the lab:
 
| Rule | Consequence if broken |
|---|---|
| Vendor attributes use the format `ATTRIBUTE <name> <id> <type> <vendor>` after a `VENDOR <name> <id>` line; `BEGIN-VENDOR` / `END-VENDOR` blocks are not used | `invalid Vendor-Id` |
| Separate fields with **spaces**. Pasting tab characters into the BusyBox shell triggers tab completion and corrupts the line | `invalid Vendor-Id on line N` |
| Attribute names must be **shorter than about 32 characters** (`WISPr-Session-Terminate-End-Of-Day`, 34 characters, is rejected and therefore omitted above) | `invalid name length on line N` |
| Every `$INCLUDE` target must exist | `couldn't open dictionary` |
 
`radius-client` reads the dictionary on each login, so no restart is needed after editing it.

---
#### uspot Configuration
---

```bash
uci set uspot.captive.auth_mode='radius'
uci set uspot.captive.auth_server='RADIUS_SERVER_IP'
uci set uspot.captive.auth_port='1812'
uci set uspot.captive.auth_secret='<SHARED_SECRET>'
uci set uspot.captive.acct_server='RADIUS_SERVER_IP'
uci set uspot.captive.acct_port='1813'
uci set uspot.captive.acct_secret='<SHARED_SECRET>'
uci set uspot.captive.acct_interval='300'
uci set uspot.captive.nasid='AP-240B2A000002'
uci set uspot.captive.nasmac='24-0B-2A-00-00-02'
uci set uspot.captive.nas_ip='AP_WAN_IP'
uci set uspot.captive.mac_format='AA-BB-CC-DD-EE-FF'
uci -q delete uspot.user1          # local accounts are not used in radius mode
uci -q delete uspot.user2
uci commit uspot
```

Resulting section:
 
```
config uspot 'captive'
	option auth_mode 'radius'
	option interface 'captive'
	option setname 'uspot'
	option idle_timeout '900'
	option session_timeout '3600'
	option auth_server 'RADIUS_SERVER_IP'
	option auth_port '1812'
	option auth_secret '<SHARED_SECRET>'
	option nasid 'AP-240B2A000002'
	option nasmac '24-0B-2A-00-00-02'
	option nas_ip 'AP_WAN_IP'
	option mac_format 'AA-BB-CC-DD-EE-FF'
	option debug '0'
```
 
| Option | Note |
|---|---|
| `auth_server`, `auth_secret` | Required in `radius` and `uam` modes |
| `nasid`, `nasmac` | **Required** in `radius` and `uam` modes; uspot refuses to start without them |
| `nas_ip` | Makes NAS-IP-Address equal to the address the server sees (WAN `AP_WAN_IP`) instead of the captive address `10.0.0.1`; some servers reject a mismatch |
| `acct_server`, `acct_secret` | Not set: accounting disabled |
 
No firewall change is needed: RADIUS traffic is generated by the AP itself (zone output ACCEPT) and replies return through conntrack. Check the route first:
 
```bash
ping -c 3 RADIUS_SERVER_IP
ip route get RADIUS_SERVER_IP           # dev eth0.35 src AP_WAN_IP
```

---
#### Switching mode and Testing
---

Sessions from the previous mode (for example a phone logged in with a local account) stay valid until they expire. Clear them when switching mode:
 
```bash
/etc/init.d/uspot stop
/etc/init.d/uspotfilter restart
nft flush set inet fw4 uspot
/etc/init.d/uspot start
nft list set inet fw4 uspot          # empty
```
 
Then on the phone: *Forget this network* and rejoin `Free-WiFi`. Test with two SSH sessions:
 
```bash
tcpdump -ni eth0.35 udp port 1812          # Access-Request / Access-Accept
logread -f | grep -E "uspot|radcli"         # "allowing client"
```

```bash
root@OpenWrt:~# ubus -v list uspot
'uspot' @07b303b3
        "client_auth":{"uspot":"String","address":"String","client_ip":"String","username":"String","password":"String","challenge":"String","sessionid":"String","reqdata":"Table"}
        "client_enable":{"uspot":"String","address":"String"}
        "client_remove":{"uspot":"String","address":"String"}
        "client_get":{"uspot":"String","address":"String"}
        "client_list":{"uspot":"String"}
        "das_disconnect":{"uspot":"String","request":"Table"}
        "das_coa":{"uspot":"String","request":"Table"}
        "state_get":{"uspot":"String"}
        "state_set":{"uspot":"String","state":"Boolean"}
root@OpenWrt:~# ubus -v list uspotfilter
'uspotfilter' @0234bd26
        "client_get":{"interface":"String","address":"String"}
        "client_set":{"interface":"String","address":"String","state":"Integer","data":"Table"}
        "client_remove":{"interface":"String","address":"String"}
        "client_list":{"interface":"String"}
        "peer_lookup":{"ip":"String"}
```

Expected result: `Access-Request` to RADIUS_SERVER_IP, `Access-Accept` back, `allowing client` in the log, phone MAC in `nft list set inet fw4 uspot`, Internet working.

---
### External portal (UAM)
---

```
config uspot 'captive'
	option auth_mode 'radius'
	option interface 'captive'
	option setname 'uspot'
	option auth_server 'EXTERNAL_SERVER_IP'
	option auth_secret 'RadiusSecret123'
	option acct_server 'EXTERNAL_SERVER_IP'
	option acct_secret 'RadiusSecret123'
	option nasid 'AP-240B2A000002'          # required
	option nasmac '24-0B-2A-00-00-02'       # required
    option auth_mode 'uam'
	option uam_server 'http://EXTERNAL_SERVER_IP/hotspot/login.php'
	option uam_secret 'UamSecret456'
	option uam_port '3990'
```

Also needed: a uhttpd listener on `10.0.0.1:3990` for `/logon` and `/logoff` (handler `handler-uam.uc`), firewall rule allowing TCP 3990, and the portal host or IP reachable before login. The portal must treat `res=reject` as a failed login.

| Option | Purpose |
|---|---|
| `auth_server2`, `auth_secret2`, `auth_port2` | Backup RADIUS server |
| `auth_port`, `acct_port` | Defaults 1812 / 1813 (2083 with RadSec) |
| `rad_serv_type` | `tls` or `dtls` for RadSec |
| `acct_interval` | Interim accounting interval (overrides RADIUS) |
| `das_secret` | Enables `uspot-das` for CoA / Disconnect |
| `mac_auth`, `mac_passwd`, `mac_suffix`, `mac_format` | MAC authentication |
| `ratelimit_def` | Default rate limit |
| `counters` | Enable traffic counters |
| `disconnect_delay` | Grace period before treating a client as gone |
| `location_name`, `nas_ip`, `swapio` | RADIUS attributes |
 
Bandwidth per user comes from RADIUS (`WISPr-Bandwidth-Max-Down/Up`, bit/s).

---
### Troubleshooting
---

Issues met during the lab deployment, in the order they appeared.
 
```mermaid
flowchart LR
    A{"Gets IP?"} -- "yes" --> B{"Login page?"}
    B -- "yes" --> C{"Login OK?"}
    C -- "yes" --> D{"Internet?"}
    A -- "no" --> FA["102"]
    B -- "no" --> FB["103, 104"]
    C -- "no" --> FC["105, 108-1011"]
    D -- "no" --> FD["106"]
```
 
Follow the checks left to right; the first "no" points to the section to read.

---
#### 101 uspot crash loop: `missing auth_mode, interface or setname!`
---

Config written for the old OpenWiFi uspot. Use the section 7 format: add `setname`, remove `list ifname` and `configure_spotfilter`.

---
#### 102 `dnsmasq-dhcp: no address range available for DHCP request via br-captive`
---

- `ip addr show br-captive` must show `10.0.0.1/22` (else `/etc/init.d/network reload`).
- `uci show dhcp.captive` must exist with `interface 'captive'`.
- Restart dnsmasq after adding the section: `/etc/init.d/dnsmasq restart`.
- Check `dhcp.@dnsmasq[0].interface` / `notinterface` do not exclude `captive`.

---
#### 103 Portal not reachable
---

- `netstat -ltn | grep 10.0.0.1:80` — listener present.
- `uhttpd.main` must not listen on `0.0.0.0:80`.
- Firewall redirect `captive_cpd` and rule `captive_in` present.

---
#### 104 `500 ... Include file not found ... include(header)`
---

Create `/www-uspot/header.html` and `/www-uspot/footer.html` (section 6.2).

---
#### 105 `invalid credentials` with correct password
---

- Each `credentials` section needs **`option uspot '<uspot section name>'`**. `option interface` is ignored.
- Restart uspot after editing accounts.
- Username and password are case-sensitive; iOS may capitalise the first letter in the Captive Wi-Fi sheet.
- Enable `option debug '1'` and watch `logread | grep uspot`.

---
#### 106 "Connected" page but no Internet / `no client list from uspotfilter!`
---

Symptoms:
 
- Login succeeded (`allowing client` in log) but the MAC is not in `nft list set inet fw4 uspot`.
- `ubus list` shows `uspot` but not `uspotfilter`.
- Warning `no client list from uspotfilter!` every 10 s.
- Later, the phone always gets the *connected* page without login: uspot cannot expire sessions without the uspotfilter client list, so the stale session stays forever.
Cause: the **uspotfilter service is not running**.
 
Fix:
 
```bash
/etc/init.d/uspotfilter enable
/etc/init.d/uspotfilter start
/etc/init.d/uspot restart            # clears stale sessions held in memory
ubus list | grep -i uspot            # uspot and uspotfilter
```
 
Isolation test (firewall vs uspotfilter): add the MAC manually; if Internet then works, the firewall is correct.
 
```bash
nft add element inet fw4 uspot '{ aa:bb:cc:dd:ee:ff }'
nft delete element inet fw4 uspot '{ aa:bb:cc:dd:ee:ff }'
```
--- 
#### 107 Vendor firewall messages
---

`[firewall] section name not matched` and `No WAN default route found, skipping WAN zone sync` come from the vendor firewall scripts during network reloads. They are harmless if `ip route | grep default` still shows the WAN gateway.

---
#### 108 RADIUS: `couldn't open dictionary /etc/radcli/dictionary`
---

```
uspot-radius: radcli: rc_read_dictionary couldn't open dictionary /etc/radcli/dictionary: No such file or directory
uspot-radius: Failed to read dictionary!
uspot: ... - invalid credentials
```
 
No RADIUS packet is sent; uspot reports every login as invalid. Install the radcli dictionary files.

--- 
#### 109 RADIUS: `Failed to lookup attribute key N`
---

```
uspot-radius: Failed to lookup attribute key 23
uspot: ... - invalid credentials
```
 
The dictionary loads but lacks an attribute that `radius-client` uses — in the lab, the WISPr / ChilliSpot vendor attributes. Add `dictionary.hotspot`. To list the attribute names the binary expects:
 
```bash
grep -ao '[A-Z][A-Za-z]*-[A-Za-z-]*' /usr/bin/radius-client | sort -u
```
---
#### 1010 RADIUS: dictionary syntax errors
---

| Log | Cause | Fix |
|---|---|---|
| `invalid Vendor-Id on line N of dictionary ...` | Tab characters mangled by the shell during paste, or `BEGIN-VENDOR` syntax | Rewrite the file with spaces only, vendor name as last column; check with `grep -c "$(printf '\t')" file` and `head -2 file \| hexdump -C` |
| `invalid name length on line N` | Attribute name too long (≈ 32 characters) | Remove or shorten that attribute |

--- 
#### 1011 RADIUS: no reply or Access-Reject
---

Watch `tcpdump -ni eth0.35 udp port 1812` during a login:
 
| tcpdump | Cause |
|---|---|
| No packet at all | Dictionary problem (108–1010) or uspot not restarted after configuration change |
| Access-Request, no reply | AP not declared as NAS `AP_WAN_IP`, wrong shared secret (servers drop silently), or UDP 1812 blocked on the server side |
| Access-Reject | Wrong account, or PAP not allowed by the server policy; ask the RADIUS team for the server log |

--- 
#### 1012 Phone gets Internet without logging in after a mode change
---

The previous session (e.g. from `credentials` mode) is still valid. Clear sessions and rejoin the SSID.
 
---

### References

---

- [RFC 8910 — Captive-Portal Identification in DHCP and Router Advertisements](https://www.rfc-editor.org/rfc/rfc8910.html) (Standards Track, Sept 2020)
- [RFC 8908 — Captive Portal API](https://www.rfc-editor.org/rfc/rfc8908.html) (Standards Track, Sept 2020)
- [RFC 8952 — Captive Portal Architecture](https://www.rfc-editor.org/rfc/rfc8952.html) (Informational, Nov 2020)
- [Android 11: Captive portal API support](https://developer.android.com/about/versions/11/features/captive-portal)
- [Apple Developer: How to modernize your captive network](https://developer.apple.com/news/?id=q78sq5rv) (iOS 14 / macOS Big Sur)
- [Apple Developer Forums: captive network documentation scope](https://origin-devforums.apple.com/forums/thread/834869)
- [Apple: Prepare your network or web server for iCloud Private Relay](https://developer.apple.com/support/prepare-your-network-for-icloud-private-relay/)
- [Microsoft Learn: NCSI frequently asked questions](https://learn.microsoft.com/en-us/windows-server/networking/ncsi/ncsi-frequently-asked-questions)
- [Microsoft Learn: Troubleshoot NCSI](https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/troubleshoot-ncsi-guidance)
- [NetworkManager.conf reference — connectivity section](https://networkmanager.dev/docs/api/latest/NetworkManager.conf.html)
- [Mozilla Support: Firefox captive portal detection](https://support.mozilla.org/kb/captive-portal)
- [OpenWrt 22.03.0 release announcement (firewall4)](https://desiato.infradead.org/pipermail/openwrt-devel/2022-September/039343.html)
- [openNDS FAQ (v10 nftables migration)](https://github.com/openNDS/openNDS/blob/stable/docs/source/faq.rst)
- [openNDS: Forwarding Authentication Service](https://opennds.readthedocs.io/en/stable/fas.html)
