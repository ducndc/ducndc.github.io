---
title: '802.11r Fast Roaming'
description: '802.11r Fast Roaming'
pubDate: 'Aug 8 2026'
heroImage: '../../assets/prplmesh.png'
---

### Overview

<div style="text-align: justify; text-indent: 2em;">
On a WLAN, when a STA moves between different APs, the service continuity and data transmission stability must be ensured. In traditional roaming technologies, when a STA roams from one AP to another, the STA needs to re-perform identity authentication and key negotiation. As a result, services are interrupted for a long time during roaming, degrading user experience. To solve this problem, the 802.11r standard is introduced. 802.11r, or Fast Basic Service Set Transition (FT), allows a STA to complete authentication and key negotiation with the target AP in advance. This process skips 802.1X authentication and key negotiation during roaming, reducing the number of information exchanges and achieving low latency and service data flow continuity during roaming.
</div>

![Alt text](../../assets/technology/802_11r/beacon.png)

![Alt text](../../assets/technology/802_11r/auth.png)

--- 

### 802.1x Implementation

![Alt text](../../assets/technology/802_11r/802.1x.png)

![Alt text](../../assets/technology/802_11r/802_1x.png)

![Alt text](../../assets/technology/802_11r/802_1x_ext.png)

--- 

### Fast BSS Transition

![Alt text](../../assets/technology/802_11r/ftbss.png)

1. Each STA-AP combination needs a 4-Way-Handshake generate the PTK from the PMK.
2. Each STA-AP combination needs a PMK.

![Alt text](../../assets/technology/802_11r/fbss1.png)

#### Key Hierarchy

<div style="text-align: center;">

![Alt text](../../assets/technology/802_11r/key.png)

</div>

<div style="text-align: center;">

![Alt text](../../assets/technology/802_11r/key1.png)

</div>

<div style="text-align: center;">

![Alt text](../../assets/technology/802_11r/key2.png)

</div>

1. The R0KH interacts with the IEEE 802.1X Authenticator to receive the MSK resulting from an EAP authentication.
2. The R1KH interacts with the IEEE 802.1X Authenticator to open the Controlled Port.

#### Is Fast BSS Transition available?

1. mobility domain: A set of basic service sets (BSSs), within the
same extended service set (ESS), that support fast BSS transitions
between themselves and that are identi ed by the set’s mobility
domain identi er (MDID).
2. mobility domain identi er (MDID): An identi er that names
a mobility domain.

<div style="text-align: center;">

![Alt text](../../assets/technology/802_11r/key3.png)

</div>

---

### Over-the-Air

<div style="text-align: center;">

![Alt text](../../assets/technology/802_11r/OverAir.png)

</div>

![Alt text](../../assets/technology/802_11r/connection-message-flow.png)

### Over-the-DS

<div style="text-align: center;">

![Alt text](../../assets/technology/802_11r/OverDS.png)

</div>

![Alt text](../../assets/technology/802_11r/overDS.png)

---

### FT Protocols

1. FT protocol
2. FT resource request protocol

This protocol is executed when an FTO requires a resource request prior to its transition.

<div style="text-align: center;">

![Alt text](../../assets/technology/802_11r/ft.png)

</div>

![Alt text](../../assets/technology/802_11r/ft1.png)

![Alt text](../../assets/technology/802_11r/rnse.png)

![Alt text](../../assets/technology/802_11r/rnse2.png)

<div style="text-align: center;">

![Alt text](../../assets/technology/802_11r/FTO.png)

</div>

---

### Frame by Frame

![Alt text](../../assets/technology/802_11r/fbf.png)

![Alt text](../../assets/technology/802_11r/fbf1.png)

![Alt text](../../assets/technology/802_11r/fbf2.png)

![Alt text](../../assets/technology/802_11r/fbf3.png)

![Alt text](../../assets/technology/802_11r/fbf4.png)

![Alt text](../../assets/technology/802_11r/fbf5.png)

![Alt text](../../assets/technology/802_11r/fbf6.png)

![Alt text](../../assets/technology/802_11r/fbf7.png)

#### MSK -> PMK-R0

![Alt text](../../assets/technology/802_11r/mpsk.png)

#### PMK-R0 -> PMK-R1
![Alt text](../../assets/technology/802_11r/pmkr0.png)

The computation of PMK-R0 and PMK-R1, and all of the intermediate
results in the computations, shall be restricted to the R0KH.

![Alt text](../../assets/technology/802_11r/fbf8.png)

#### PMK-R1 -> PTK

![Alt text](../../assets/technology/802_11r/pmkri.png)

The computation of PTK, and all intermediate results
in its computation, shall be restricted to the R1KH.

![Alt text](../../assets/technology/802_11r/fbf9.png)

![Alt text](../../assets/technology/802_11r/fbf10.png)

![Alt text](../../assets/technology/802_11r/fbf11.png)

![Alt text](../../assets/technology/802_11r/fbf12.png)

![Alt text](../../assets/technology/802_11r/fbf13.png)

![Alt text](../../assets/technology/802_11r/fbf14.png)

![Alt text](../../assets/technology/802_11r/fbf15.png)

<div style="text-align: justify; text-indent: 2em;">
The R0KH and the R1KH are assumed to have a secure channel between them that can be used to
exchange cryptographic keys without exposure to any intermediate parties. The cryptographic strength
of the secure channel between the R0KH and R1KH is assumed to be greater than or equal to the
cryptographic strength of the channels for which the keys are used.
</div>

![Alt text](../../assets/technology/802_11r/fbf16.png)

![Alt text](../../assets/technology/802_11r/fbf17.png)

![Alt text](../../assets/technology/802_11r/fbf18.png)

![Alt text](../../assets/technology/802_11r/fbf19.png)

![Alt text](../../assets/technology/802_11r/fbf20.png)

![Alt text](../../assets/technology/802_11r/fbf21.png)

---

### Relationship between state and services between a given pair of nonmesh STAs

![Alt text](../../assets/technology/802_11r/fbf22.png)

![Alt text](../../assets/technology/802_11r/fbf23.png)

![Alt text](../../assets/technology/802_11r/fbf24.png)

### Source 

[1] www.thewlpc.com/presentations/analysis-of-a-fast-roam-prg-25