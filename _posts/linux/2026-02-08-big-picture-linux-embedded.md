---
layout: post
title: "The Big Picture of Embedded Linux Systems"
date: 2026-02-08 10:00:00 +0700
categories: [Linux]
---

<div style="text-align: justify; text-indent: 2em;">
The below figure is a block diagram of a typical embedded system, which is a simple example of high-level hardware architeture of a wireless access point. The system is architected around a 32-bit RISC processor. Flash memory is used for nonvolatile program and data storage. Main memory is synchronous dynamic random-access memory (SDRAM), which might conatin anywhere from a few megabytes to hundreds of megabytes, depending on the application. A real-time clock module, often backed up by battery, keeps the time of day (calendar/wall clock, including date). This system includes an Ethernet and USB interface, as well as a serial port for console access via RS-232. The 802.11 chipset or module implements the wireless modem function.
</div>

<div style="text-align: justify; text-indent: 2em;">
Often the processor in an embedded system performs many functions beyond the
traditional core instruction stream processing. The hypothetical processor shown in
Figure 2-1 contains an integrated UART for a serial interface and integrated USB and
Ethernet controllers. Many processors contain integrated peripherals. Sometimes they
are referred to as system on chip (SOC)
</div>

![H1](/assets/img/linux/EmbeddedSystem.png)

<div style="text-align: justify; text-indent: 2em;">

</div>

![H1](/assets/img/linux/DevelopmentSetup.png)

<div style="text-align: justify; text-indent: 2em;">

</div>