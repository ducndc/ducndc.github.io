---
layout: post
title: "The Big Picture of Embedded Linux Systems"
date: 2026-02-08 10:00:00 +0700
categories: [Linux]
tags: [embedded, architecture, linux]
description: "Block diagrams and high-level overview of hardware components in embedded Linux devices."
toc: true
pin: true
---

# Overview

A high-level diagram and explanation of the typical hardware components
found in an embedded Linux device, using a wireless access point as an
example.


The figure below shows a block diagram of a typical embedded system (a
wireless access point). It centres on a 32‑bit RISC processor with flash
for firmware and SDRAM for runtime memory. A real‑time clock maintains
the calendar, and standard peripherals such as Ethernet, USB and a serial
console are exposed. The 802.11 chipset provides the wireless link.

Often the processor in an embedded system performs many functions beyond the
traditional core instruction stream. The hypothetical processor shown in
Figure 2‑1 contains an integrated UART for serial, plus USB and Ethernet
controllers; such chips are commonly called system‑on‑chip (SoC).


![Embedded system block diagram](/assets/img/linux/EmbeddedSystem.png)


![Development environment layout](/assets/img/linux/DevelopmentSetup.png)
