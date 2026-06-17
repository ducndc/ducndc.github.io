---
title: 'Co-Channel Interference'
description: 'o-Channel Interference'
pubDate: 'May 08 2025'
heroImage: '../../assets/AP_Sys.png'
---

## Mechanism of Interference at PHY and MAC Layers

Interference from non-Wi-Fi devices (like wireless audio transmitters) operates at two main levels:
- Physical (PHY) Layer: IEEE 802.11 devices use the Carrier Sense Multiple Access with Collision Avoidance (CSMA/CA) algorithm to check if a channel is busy. When a wireless audio transmitter operates continuously on the 2.4 GHz band, Wi-Fi stations detect this radiofrequency energy as "noise" or a "busy medium" at the PHY layer
- MAC Layer: If the medium is sensed as busy, the Wi-Fi device must "back off" and wait for a random period before re-checking. If a collision occurs due to sporadic interference, the data frame is corrupted, leading to NO ACK (no acknowledgment) and forcing continuous retransmissions, which drastically reduces useful throughput

## Impact of Channel Occupancy on Throughput

The relationship between channel occupancy (utilization) and throughput is mathematically defined in the sources. For Single-Link Operation (SLO), the average throughput ($$Th_{SLO}$$) can be approximated as: 
$$
\begin{aligned}
Th_{SLO} &= \frac{(1 - \alpha)L}{T}
\end{aligned}
$$

Where:
+ $\alpha$ is the occupancy (utilization) of the primary link
+ $L$ is the packet size
+ $T$ is the total transmission time

As occupancy ($\alpha$) increases toward 1.0 (100%), the "free airtime" ($1− \alpha$) approaches zero, causing throughput to plummet
