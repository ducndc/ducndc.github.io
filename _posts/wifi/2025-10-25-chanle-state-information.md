---
layout: post
title: "CSI Sensing"
date: 2025-10-24 10:00:00 +0700
categories: [WiFi]
math: true
---

## Channel State Information (CSI)

<div style="text-align: justify; text-indent: 2em;">
In wireless communications, channel state information (CSI) is the known channel properties of a communication link. This information describes how a signal propagates from the transmitter to the receiver and represents the combined effect of, for example, scattering, fading, and power decay with distance. The method is called channel estimation. The CSI makes it possible to adapt transmissions to current channel conditions, which is crucial for achieving reliable communication with high data rates in multiantenna systems.
</div>

<div style="text-align: justify; text-indent: 2em;">
CSI provides more detailed information about wireless channels, including amplitude, phase, and frequency response. In contrast, RSSI only provides a general measurement of signal strength.
</div>

### Mathematical description

<div style="text-align: justify; text-indent: 2em;">
In a narrowband flat-fading channel with multiple transmit and receive antennas (MIMO), the system is modeled as
</div>

<div style="text-align: center;">
\( \mathbf{y} = \mathbf{H}\mathbf{x} + \mathbf{n} \)
</div>

<div style="text-align: justify; text-indent: 2em;">
where:
</div>

<ul style="text-align: justify;">
  <li>\( \mathbf{y} \in \mathbb{C}^{N_r \times 1} \) is the received signal vector.</li>
  <li>\( \mathbf{x} \in \mathbb{C}^{N_t \times 1} \) is the transmitted signal vector.</li>
  <li>\( \mathbf{H} \in \mathbb{C}^{N_r \times N_t} \) is the channel matrix, whose element \( h_{i,j} \) represents the complex channel gain from transmit antenna \( j \) to receive antenna \( i \).</li>
  <li>\( \mathbf{n} \in \mathbb{C}^{N_r \times 1} \) is the additive white Gaussian noise (AWGN) vector, with \( \mathbf{n} \sim \mathcal{CN}(0, N_0 \mathbf{I}) \).</li>
</ul>

<div style="text-align: justify; text-indent: 2em;">
Each element \( h_{i,j} \) of the channel matrix contains both the amplitude attenuation and the phase shift experienced by the signal. It can be represented as
</div>

<div style="text-align: center;">
\( h_{i,j} = |h_{i,j}| e^{j\phi_{i,j}} \)
</div>

<div style="text-align: justify; text-indent: 2em;">
where \( |h_{i,j}| \) is the channel magnitude and \( \phi_{i,j} \) is the channel phase. The collection of these complex coefficients across all antennas and subcarriers (in OFDM systems) forms the Channel State Information (CSI).
</div>

<div style="text-align: justify; text-indent: 2em;">
In practical Wi-Fi systems such as IEEE 802.11n/ac/ax, CSI is estimated using pilot (training) symbols inserted into OFDM subcarriers. These CSI values enable advanced techniques such as beamforming, channel equalization, and device-free sensing applications.
</div>

## Characteristics of Wireless Channels

The main characteristics of wireless channels include:

<div style="text-align: justify; text-indent: 2em;">
Attenuation and Path Loss: Signals attenuate and lose energy during propagation, and are also affected by path loss.
</div>

<div style="text-align: justify; text-indent: 2em;">
Multipath Effects: Signals experience phase and amplitude variations due to multiple paths, impacting communication quality.
</div>

<div style="text-align: justify; text-indent: 2em;">
Delay Spread: Extension of signal arrival times due to multipath effects.
</div>

<div style="text-align: justify; text-indent: 2em;">
Multi-User Interference: Multiple users sharing the same spectrum can interfere with each other, affecting communication reliability and efficiency.
</div>

<div style="text-align: justify; text-indent: 2em;">
Shadowing: Signal strength weakening due to obstacles.
</div>

## Relationship Between CSI and Wireless Channel Characteristics

Channel State Information (CSI) provides detailed channel information, aiding in understanding and utilizing various wireless channel characteristics to optimize the performance and reliability of wireless communication systems. Several important applications in wireless communication, especially involving multipath effects and Channel State Information (CSI), include:

### 1. Multipath Beamforming

Multipath beamforming is a technique that utilizes multipath effects to enhance or suppress signals in specific directions. Multipath beamforming can be applied in the following ways:

- **Beam Tracking:** Using CSI information to track changes in multipath propagation channels to optimize beam shapes and maximize received signal strength.
- **Interference Suppression:** Accurately measuring and analyzing CSI of multipath channels enables spatial suppression of interference sources, improving Signal-to-Interference Ratio (SIR) and system capacity.

### 2. Localization and Tracking

Multipath effects are crucial for precise localization and mobile tracking. CSI can be applied in localization and tracking as follows:

- **Multipath Imaging:** Analyzing CSI data to construct multipath images around objects, enabling high-resolution position estimation.
- **Attitude Estimation:** Using multipath effects to accurately estimate the direction and attitude of mobile devices, improving navigation system accuracy.

### 3. Multi-User MIMO Systems

In multi-user MIMO systems, combining CSI with multipath effects has the following applications:

- **Multi-User Diversity:** Utilizing CSI of multipath propagation to receive users' data streams on different paths, improving system spectral efficiency and capacity.
- **Spatial Multi-User Scheduling:** Using CSI information of multipath channels to achieve spatial multi-user scheduling, maximizing system throughput and resource utilization.

### 4. Dynamic Spectrum Access and Spectrum Sensing

Multipath effects and CSI are also applied in dynamic spectrum access (DSA) and spectrum sensing:

- **Optimizing Spectrum Utilization:** Analyzing CSI of multipath channels to accurately evaluate and optimize spectrum resource utilization, including achieving dynamic spectrum access in spectrum blanks.
- **Spectrum Interference Detection:** Using multipath effects and CSI information for rapid detection and localization of spectrum interference sources, enhancing system interference resistance.

### 5. High-Speed Mobile Communications

In high-speed mobile communication environments, applications of multipath effects and CSI include:

- **Mobile Channel Modeling:** Analyzing multipath effects and CSI to establish accurate mobile channel models, supporting high-speed mobile communications.
- **Mobile User Tracking:** Using multipath effects and CSI information for rapid tracking and localization of high-speed mobile users, improving communication system stability and reliability.
This translation captures the essential details and applications of wireless channel fundamentals and their relationship with CSI in optimizing wireless communication systems.

## CSI Sensing

<div style="text-align: justify; text-indent: 2em;">
CSI sensing is a technology that uses channel state information (CSI) in Wi-Fi signals to detect human activities (such as walking and breathing) and the state, location, and motion of objects in an environment.
</div>

## How Does CSI Sensing Work?

<div style="text-align: justify; text-indent: 2em;">
CSI sensing works based on the multipath effect of radio signal propagation and changes to CSI.
</div>

<div style="text-align: justify; text-indent: 2em;">
Due to the propagation characteristics of radio signals, the electromagnetic wave signals radiated by a transmit antenna can reach a receive antenna either through a direct path or by reflection off the surrounding environment (such as walls, human bodies, and furniture). Finally, the electromagnetic wave signals reaching the receive antenna are the superposition of direct-path signals and multiple reflection-path signals. This phenomenon is known as the multipath effect of radio signal propagation.
</div>

![H1](/assets/img/wifi/CSI1.png)

<div style="text-align: justify; text-indent: 2em;">
Environmental changes can result in changes in the reflection paths as well as in CSI data. CSI is an important concept in wireless communications. It provides detailed data of the end-to-end signal transmission process. CSI data, including amplitude attenuation and phase offset during propagation, is carried in subcarriers, which are formed by dividing a channel using Wi-Fi OFDM technology. When no object moves in an environment, the paths of multipath signals are relatively stable, and there are only slight changes to CSI data. When a person or object moves in the space, the signal reflection paths change (for example, a path is blocked or a reflection path is added). As a result, the amplitude and phase of multipath signals change after being superimposed, causing fluctuations in CSI data.
</div>

<div style="text-align: justify; text-indent: 2em;">
By collecting and analyzing the variation pattern of CSI data, CSI sensing technology can detect human presence, identify behaviors, and even measure weak fluctuations due to breathing and heartbeats. For example, when a person is sleeping, the only movements are regular changes in the chest position due to breathing. By extracting the regular changes of CSI, the chest movements can be detected, making it possible to identify whether a person is present.
</div>

<div style="text-align: justify; text-indent: 2em;">
Depending on the location relationship between the transmitter and receiver, CSI sensing can be classified as bi-static or mono-static sensing.
</div>

<div style="text-align: justify; text-indent: 2em;">
Bi-static sensing: Two devices participate in sensing — one sends Wi-Fi signals and one receives Wi-Fi signals.
</div>

<div style="text-align: justify; text-indent: 2em;">
Mono-static sensing: The same device is used to receive and send Wi-Fi signals. For example, the CSI sensing function provided by Huawei APs innovatively uses the antenna-algorithm co-design to minimize non-ideal factors and strong self-interference between the transmitter and receiver. A single AP can sense centimeter-level movements in the environment using the sonar-like capability, without the need of other devices. This greatly reduces deployment and maintenance costs.
</div>

![H1](/assets/img/wifi/CSI2.png)

<div style="text-align: justify; text-indent: 2em;">

</div>


<div style="text-align: justify; text-indent: 2em;">

</div>


<div style="text-align: justify; text-indent: 2em;">

</div>

<div style="text-align: justify; text-indent: 2em;">

</div>

## References

[1] https://en.wikipedia.org/wiki/Channel_state_information

[2] https://info.support.huawei.com/info-finder/encyclopedia/en/CSI+Sensing.html