---
layout: post
title: "The Big Picture of Embedded Linux Systems"
date: 2026-02-08 10:00:00 +0700
categories: [Linux]
tags: [linux, embedded, hardware, soc, risc, uart, ethernet]
excerpt: "A high-level look at the hardware architecture of a typical embedded Linux system, from processor and memory to peripherals and the development setup."
---

Understanding the hardware landscape is the first step in any embedded Linux project. Before you write a line of code or configure a kernel, you need a clear picture of what components your system contains and how they fit together.

## Typical Embedded System Architecture

The figure below shows a block diagram of a typical embedded system — a simplified wireless access point — that illustrates the common elements you'll encounter across a wide range of embedded designs.

![Embedded system block diagram](/assets/img/linux/EmbeddedSystem.png)

The system is built around a **32-bit RISC processor**, which handles the main instruction stream. The key components are:

- **Flash memory** — non-volatile storage for the bootloader, kernel image, root filesystem, and persistent configuration data
- **SDRAM** — the main working memory, ranging from a few megabytes to several hundred depending on the application
- **Real-time clock (RTC)** — typically battery-backed to maintain the time of day across power cycles
- **Ethernet controller** — wired network connectivity
- **USB controller** — host or device-mode USB interface
- **Serial port (RS-232)** — a console interface, almost universally present in embedded designs for debug and recovery access
- **802.11 chipset** — the wireless modem for Wi-Fi connectivity

## The Role of the Processor: System on Chip

In most modern embedded designs, the processor does far more than execute instructions. The hypothetical processor in the diagram integrates several peripheral controllers directly on-die:

- An **integrated UART** for the serial interface
- An **integrated USB controller**
- An **integrated Ethernet controller (MAC)**

This pattern — combining a CPU core with memory interfaces, I/O controllers, and other peripherals on a single piece of silicon — is what defines a **System on Chip (SoC)**. SoCs are the norm in embedded Linux systems because they reduce board complexity, lower cost, and shrink physical footprint. Examples include the Raspberry Pi's Broadcom BCM2711, the BeagleBone's TI AM335x, and the widely-used NXP i.MX series.

## Development Setup

Embedded development typically involves two machines: the **host** (your development workstation) and the **target** (the embedded hardware). Code is compiled on the host using a cross-toolchain and then transferred to the target for testing.

![Development setup](/assets/img/linux/DevelopmentSetup.png)

The serial console connection between host and target is particularly important early in a project — it's usually the first interface available after power-on, and it's the channel through which the bootloader and kernel print their startup messages.