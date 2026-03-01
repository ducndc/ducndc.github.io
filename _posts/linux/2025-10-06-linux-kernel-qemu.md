---
layout: post
title: "Building and Running the Linux Kernel in QEMU"
date: 2025-07-14 10:00:00 +0700
categories: [Linux]
tags: [kernel, qemu, kvm, build]
description: "Step-by-step instructions for compiling a Linux kernel and booting it under QEMU/KVM."
toc: true
pin: true
---

# Overview

This post walks through compiling a Linux kernel from source and booting
it inside a QEMU virtual machine. The workflow is useful for kernel
development, debugging, and experimenting with configuration options
without affecting your host system.

## Prerequisites

- A Linux host with development tools installed
- `qemu-system-x86` (or appropriate architecture binary)
- `debootstrap` for creating a root filesystem (optional but convenient)

## Installing QEMU and build dependencies

```bash
sudo apt-get update
sudo apt-get install git fakeroot build-essential ncurses-dev \
    xz-utils libssl-dev bc flex libelf-dev bison qemu-system-x86 debootstrap
```

## Obtaining the kernel source

```bash
wget https://cdn.kernel.org/pub/linux/kernel/v5.x/linux-5.10.54.tar.xz
tar xvf linux-5.10.54.tar.xz
cd linux-5.10.54
```

## Configuring the kernel

Start from the default configuration then enable KVM-related options
and debugging helpers:

```bash
make defconfig            # create a .config file
make kvmconfig            # enable KVM guest options (or kvm_guest.config)
# enable additional debugging features
scripts/config --enable KCOV
scripts/config --enable DEBUG_INFO
scripts/config --enable KASAN
scripts/config --enable KASAN_INLINE
scripts/config --enable CONFIGFS_FS
scripts/config --enable SECURITYFS

make olddefconfig         # update .config with the new options
```

You can also edit `.config` manually with `make menuconfig`.

## Building the kernel

Compile using all available cores:

```bash
make -j"$(nproc)"
```

When the build finishes, the bootable image will be at
`arch/x86_64/boot/bzImage`.

## Creating a root filesystem image

A minimal Debian filesystem can be created with the syzkaller helper
script:

```bash
mkdir image && cd image
wget https://raw.githubusercontent.com/google/syzkaller/master/tools/create-image.sh -O create-image.sh
chmod +x create-image.sh
./create-image.sh
```

This produces `stretch.img` (or `bullseye.img`) and an SSH key for
accessing the VM.

## Running the kernel in QEMU

Save the following helper script as `run.sh` in the kernel source
root directory:

```bash
#!/bin/sh
qemu-system-x86_64 \
    -m 2G \
    -smp 2 \
    -kernel "$1"/arch/x86/boot/bzImage \
    -append "console=ttyS0 root=/dev/sda earlyprintk=serial net.ifnames=0 nokaslr" \
    -drive file="$2"/stretch.img,format=raw \
    -net user,host=10.0.2.10,hostfwd=tcp:127.0.0.1:10021-:22 \
    -net nic,model=e1000 \
    -enable-kvm \
    -nographic \
    -pidfile vm.pid \
    2>&1 | tee vm.log
```

Make it executable and launch the VM:

```bash
chmod +x run.sh
./run.sh . image/
```

The guest will boot, and you can log in as `root` without a password.

## Notes

- Adjust memory (`-m`) and CPU count (`-smp`) as needed.
- Use the SSH key generated in `image/` to connect to the guest.
- Enable additional kernel features as required for your experiments.

## Conclusion

Running a custom kernel in QEMU allows you to test patches,
experiment with configuration options, and reproduce bugs in a
controlled environment. The steps above provide a reproducible workflow
that can be adapted for other architectures supported by QEMU.
