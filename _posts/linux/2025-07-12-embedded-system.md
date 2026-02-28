---
layout: post
title: "Embedded Linux Systems"
date: 2025-06-14 10:00:00 +0700
categories: [Linux]
---
1. **Hardware Support**
2. **Development Tools**
3. **Kernel Considerations**
4. **Root Filesystem Content**
5. **Storage Device Manipulation**
6. **Root Filesystem Setup**
7. **Setting Up the Bootloader**
8. **Setting Up Networking Services**
9. **Debugging Tools**

## Hardware Support

### Processor Architectures

<div style="text-align: justify; text-indent: 2em;">
Linux runs on a large and ever-growing number of machine architectures, but not all these architectures are actually used in embedded configurations, as already mentioned. A quick look at the arch subdirectory of the Linux kernel sources shows 24 architectures supported in the official kernel at the time of this writing, with others maintained by developers in separate development trees, possibly making it into a future release of the official kernel. Of those 24 architectures, we will cover 8 that are used in embedded Linux systems (in alphabetical order): ARM, AVR32, Intel x86, M32R, MIPS, Motorola 68000, PowerPC, and Super-H.
</div>

### Buses and Interfaces

<div style="text-align: justify; text-indent: 2em;">
The buses and interfaces are the fabric that connects the CPU to the peripherals on the system. Each bus and interface has its own intricacies, and the level of support Linux provides them varies accordingly. A rundown follows of some of the many different buses and interfaces found in typical embedded systems, and the level of support Linux provides them. Some of these other buses are used in older systems, are workstation- or server-centric, or are just a little too quirky to go into here. In addition, some buses are proprietary to a specific system vendor, or are not yet heavily adopted.
</div>

### PCI/PCI-X/PCIe

<div style="text-align: justify; text-indent: 2em;">
The Peripheral Component Interconnect (PCI) bus, managed by the PCI Special Interest Group (PCI-SIG), is the most popular bus currently available. Designed as a replacement for the legacy Intel PC ISA bus, PCI is now available in two forms: the traditional parallel slot form factor using 120 (32-bit PCI) or 184 (64-bit PCI-X) I/O lines, and the newer (and also potentially much faster) PCI Express (commonly called PCIe or PCI-E) packet-switched serial implementation as used in most recent designs. Whether conventional PCI, 64-bit PCI-X, or serial PCI-Express, PCI remains software compatible between the different implementations, because the physical interconnect used underneath is generally abstracted by the standard itself. Linux support is very good indeed, but for those times when special support quirks are needed, Linux offers PCI “quirks” too.
</div>

### Input and Output

1. **Serial Port**
2. **Parallel Port**
3. **Modem**
4. **Data Acquisition**
5. **Keyboard**
6. **Mouse**
7. **Display**
8. **Sound**
9. **Printer**

### Storage

1. **Memory Technology Devices**
2. **PATA, SATA, and ATAPI (IDE)**
3. **Non-MTD Flash-Based devices**

### General-Purpose Networking

1. **Ethernet**
2. **IrDA**
3. **IEEE 802.11A/B/G/N/AC/AX/BE (Wireless)**
4. **Bluetooth**

### Industrial-Grade Networking

1. **CAN**
2. **Modbus**

### System Monitoring

<div style="text-align: justify; text-indent: 2em;">
Both hardware and software are prone to failure, sometimes drastically. Although the occurrence of failures can be reduced through careful design and runtime testing, they are sometimes unavoidable. It is the task of the embedded system designer to plan for such a possibility and to provide means of recovery. Often, failure detection and recovery is done by means of system monitoring hardware and software such as watchdogs.
</div>

<div style="text-align: justify; text-indent: 2em;">
Linux supports two types of system monitoring facilities: watchdog timers and hardware health monitoring. There are both hardware and software implementations of watchdog timers, whereas health monitors always require appropriate hardware. Watchdog timers depend on periodic reinitialization so as not to reboot the system. If the system hangs, the timer eventually expires and causes a reboot. Hardware health monitors provide information regarding the system’s physical state. This information can in turn be used to carry out appropriate actions to signal or solve actual physical problems such as overheating or voltage irregularities
</div>

## Development Tools

1. **A Practical Project Workspace**

   In the course of developing and customizing software for your target, you need to organize various software packages and project components in a comprehensive and easy-to-use directory structure.

2. **GNU Cross-Platform Development Toolchain**

   A toolchain is a set of software tools needed to build computer software. Traditionally, these include a linker, assembler, archiver, C (and other languages) compiler, and the C library and headers. This last component, the C library and its headers, is a shared code library that acts as a wrapper around the raw Linux kernel API, and it is used by practically any application running in a Linux system.

3. **C Library Alternatives**

   Given the constraints and limitations of embedded systems, the size of the standard GNU C library makes it an unlikely candidate for use on our target. Instead, we need to look for a C library that will have sufficient functionality while being relatively small.

4. **Java**

5. **Perl**

6. **Python**

7. **Other Programming Languages**

8. **An Integrated Development Environment**

9. **Terminal Emulators**


## Kernel Considerations

## Root Filesystem Content

## Storage Device Manipulation

## Root Filesystem Setup

## Setting Up the Bootloader

## Setting Up Networking Services

## Debugging Tools