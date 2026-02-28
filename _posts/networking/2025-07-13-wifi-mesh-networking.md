---
layout: post
title: "Wi-Fi Mesh Systems: EasyMesh and IEEE 1905.1"
date: 2023-09-12 10:00:00 +0700
categories: [Networking]
tags: [networking, wifi, mesh, easymesh, ieee-1905, wireless, access-point]
excerpt: "A technical overview of Wi-Fi Mesh networking — how EasyMesh and IEEE 1905.1 work together to enable multi-AP autoconfiguration, topology discovery, and link metric exchange."
---

Traditional Wi-Fi deployments tie coverage to wherever you can run a cable. Moving an access point means moving wiring. Wi-Fi Mesh solves this by turning multiple APs into a self-organizing network that routes traffic through the best available path — no rewiring required.

![Wi-Fi Mesh system diagram](/assets/img/networking/MeshSystem.webp)

## What is Wi-Fi Mesh?

A Wi-Fi Mesh network — sometimes called a "multi-hop" network — builds on standard Wi-Fi technology but replaces the fixed, star-topology infrastructure model with a peer-to-peer, multi-hop routing architecture. Nodes discover each other, establish backhaul links wirelessly, and forward traffic through the mesh to reach the upstream gateway.

The practical benefit: you place sub-nodes where coverage is needed, not where cable happens to terminate. No additional wiring, no structural changes, and coverage gaps are filled by adding nodes rather than pulling cable.

## Wi-Fi EasyMesh

**Wi-Fi EasyMesh** is the Wi-Fi Alliance's interoperability certification for multi-AP home and small office networks. It standardizes the management and control plane across vendors, so EasyMesh-certified APs from different manufacturers can form a single managed network.

Key capabilities:

- **Increased capacity** — supports more simultaneous services and higher throughput when operating on Wi-Fi 6 / Wi-Fi 6E
- **Flexible placement** — multiple APs can be positioned for optimal coverage rather than optimal wiring
- **Easy onboarding** — secure device setup via QR codes using Wi-Fi Easy Connect
- **Network intelligence** — Wi-Fi Data Elements provide advanced diagnostics for Wi-Fi 6, enabling service provider support and dynamic performance optimization
- **QoS and service prioritization** — low-latency applications can be prioritized; the system guides clients to roam to the best available AP and steers away from interference
- **Multi-vendor scalability** — EasyMesh APs from different vendors can be added to the same network

---

## Protocol Foundation: IEEE 1905.1

The control plane for EasyMesh is built on **IEEE 1905.1**, an abstraction layer that provides a unified interface over heterogeneous link types (Ethernet, Wi-Fi, powerline, MoCA). 1905.1 messages are called **CMDUs** (Control Message Data Units) and are carried directly in 802 frames.

### Addressing

Each 1905.1 device has a **P1905.1 Abstraction Layer (AL) MAC Address** used to identify it within the mesh network. This address:

- Is locally administered
- Serves as source and destination for both data and 1905.1 control messages
- Must be unique within the P1905.1 network — no two AL entities may share the same address

---

## AP Autoconfiguration

When a new AP joins the mesh, it needs to be configured with the correct SSIDs, credentials, and radio parameters. The 1905.1 AP autoconfiguration process automates this using a **Registrar/Enrollee** model:

- **Registration server (Registrar)** — a 1905.1 device that holds the authoritative Wi-Fi configuration
- **Registration client (Enrollee)** — an AP with one or more unconfigured 802.11 interfaces

Configuration is delivered via Wi-Fi Simple Configuration (WSC) M1/M2 message exchange, tunneled transparently over 1905.1.

The process has two phases:

### Phase 1: Registrar Discovery

The enrollee multicasts an **AP-autoconfiguration search** message containing an `UnconfiguredFreqBand` TLV, indicating which frequency band(s) it needs to configure. If a registrar on the network supports that band, it replies with a unicast **AP-autoconfiguration response**.

### Phase 2: 802.11 Parameter Configuration

After receiving the response, the enrollee initiates a WSC exchange:

1. Enrollee sends **AP-autoconfiguration WSC (M1)** — contains the enrollee's public key and capabilities
2. Registrar replies with **AP-autoconfiguration WSC (M2)** — contains the configuration data (`ConfigData`) encrypted with a key derived from the M1/M2 exchange

If the M2 exchange fails or times out, the enrollee restarts the discovery phase. This process runs per 802.11 interface — each unconfigured radio goes through it independently.

![M1/M2 autoconfiguration exchange](/assets/img/networking/M1M2.png)

### Configuration Renewal

When the registrar's configuration changes (e.g., after a password update or firmware upgrade), it multicasts an **AP-autoconfiguration renew** message. All APs previously configured by that registrar restart the parameter configuration phase (Phase 2) to pull the updated settings.

This keeps configuration synchronized across all mesh nodes throughout the network's lifecycle — including across restarts and upgrades.

![Configuration renewal flow](/assets/img/networking/renew.png)

---

## Topology Management

1905.1 devices maintain awareness of the network's physical topology through four message types:

| Message | Type | Trigger / Description |
|---------|------|-----------------------|
| **Topology Discovery** | Neighbor multicast | Sent within 1 s of a topology change; announces the device and its interfaces to neighbors |
| **Topology Query** | Unicast | Sent by any 1905.1 entity to request topology information from a specific peer |
| **Topology Response** | Unicast | Sent within 1 s of receiving a query; echoes the MID from the query; contains interface and neighbor data |
| **Topology Notification** | Relayed multicast | Sent within 1 s when a device detects that any information it would include in a topology response has changed |

Together, these messages allow the network controller to maintain a live map of the mesh topology and react to changes as they occur.

![Topology management message flow](/assets/img/networking/topology.png)

---

## Link Metrics

Beyond knowing the topology, the controller needs to know the *quality* of each link to make intelligent routing and steering decisions. The **link metric dissemination protocol** provides this.

A 1905.1 device can query any peer with a unicast **link metric query message**. The peer responds with a **link metric response** containing metrics for all of its interfaces — either toward a specific neighbor or toward all neighbors, depending on the query. The response is triggered via the 1905.1 ALME primitive and reported per authenticated 1905.1 interface.

These metrics feed into steering decisions: which AP a client should associate with, which backhaul link to prefer, and where congestion is building.

![Link metric exchange](/assets/img/networking/link_metric.png)

---

## Documents

- [IEEE 1905.1 Standard](/assets/documents/networking/IEEESTD.2013.6502164.pdf)
- [Wi-Fi EasyMesh Specification v6.0](/assets/documents/networking/Wi-Fi_EasyMesh_Specification_v6.0.pdf)
- [IEEE 1905.1 Technical Presentation](/assets/documents/networking/802-1-phkl-P1095-Tech-Presentation-1207-v01.pdf)

## References

1. [CDATA — Wi-Fi Mesh and EasyMesh Technology](https://www.cdatatec.com/wifi-mesh-easymesh-technology-and-products.html)
2. [Wi-Fi Alliance — Wi-Fi EasyMesh](https://www.wi-fi.org/discover-wi-fi/wi-fi-easymesh)