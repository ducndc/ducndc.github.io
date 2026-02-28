---
layout: post
title: "Running a Custom Linux Kernel with QEMU"
date: 2025-07-14 10:00:00 +0700
categories: [Linux]
---

QEMU makes it easy to boot a custom-built Linux kernel without touching your host machine. This is useful for kernel development, bug reproduction, and security research. This guide walks through the full process: installing dependencies, fetching kernel source, configuring and building the kernel, creating a root filesystem, and launching QEMU.

---

## What is QEMU?

QEMU is an open-source machine emulator and virtualizer. It operates in two modes:

**Emulator mode** — QEMU translates guest machine instructions on the fly, allowing you to run software built for one architecture (e.g., ARM) on a completely different host (e.g., x86). Performance is good thanks to dynamic translation, but slower than native.

**Virtualizer mode** — When the guest and host share the same architecture, QEMU can run guest code directly on the host CPU, achieving near-native performance. On Linux, this is done through the **KVM** kernel module. KVM-accelerated QEMU supports x86, ARM (32/64-bit), PowerPC, S390, MIPS, and more.

For kernel development, we'll use QEMU with KVM enabled.

---

## Step 1: Install Dependencies

```bash
sudo apt-get update
sudo apt-get install \
    git fakeroot build-essential ncurses-dev xz-utils \
    libssl-dev bc flex libelf-dev bison \
    qemu-system-x86 debootstrap
```

---

## Step 2: Get the Kernel Source

Download and extract a stable kernel release from kernel.org:

```bash
wget https://cdn.kernel.org/pub/linux/kernel/v5.x/linux-5.10.54.tar.xz
tar xvf linux-5.10.54.tar.xz
cd linux-5.10.54
```

---

## Step 3: Configure the Kernel

Kernel configuration is stored in a `.config` file. Start from a reasonable baseline and layer on the options you need.

### Base configuration

```bash
make defconfig       # generate a default .config for your host architecture
make kvm_guest.config  # merge in KVM guest settings (use kvmconfig on older kernels)
```

### Enable KVM guest support

These should already be set by `kvm_guest.config`, but verify they're present in `.config`:

```
CONFIG_KVM_GUEST=y
CONFIG_HAVE_KVM=y
CONFIG_PTP_1588_CLOCK_KVM=y
```

### Enable KASAN and debug instrumentation

[KASAN](https://www.kernel.org/doc/html/latest/dev-tools/kasan.html) (Kernel Address Sanitizer) detects memory bugs like use-after-free and out-of-bounds accesses at runtime. Add these to `.config`:

```
# Code coverage for fuzzing
CONFIG_KCOV=y

# Debug symbols for stack symbolization
CONFIG_DEBUG_INFO=y

# Memory error detector
CONFIG_KASAN=y
CONFIG_KASAN_INLINE=y

# Required for Debian-based root filesystem
CONFIG_CONFIGFS_FS=y
CONFIG_SECURITYFS=y
```

### Finalize the configuration

After editing `.config` manually, regenerate it to resolve any new dependencies introduced by your changes:

```bash
make olddefconfig
```

---

## Step 4: Build the Kernel

```bash
make -j$(nproc)
```

This uses all available CPU cores. Expect the build to take 10–30 minutes depending on your machine. When it completes, verify the kernel image was produced:

```bash
ls arch/x86/boot/bzImage
```

---

## Step 5: Create a Root Filesystem

A kernel alone can't boot — it needs a root filesystem. The [syzkaller](https://github.com/google/syzkaller) project provides a script that creates a Debian-based image with useful tooling pre-installed:

```bash
mkdir image && cd image
wget https://raw.githubusercontent.com/google/syzkaller/master/tools/create-image.sh -O create-image.sh
chmod +x create-image.sh
./create-image.sh
cd ..
```

This produces three things in the `image/` directory:
- `bullseye.img` — the root filesystem image
- `bullseye.id_rsa` / `bullseye.id_rsa.pub` — an RSA keypair for SSH access into the running VM

---

## Step 6: Boot the Kernel

Create a launch script `run.sh` in the `linux-5.10.54` directory:

```bash
#!/bin/bash

KERNEL_DIR=${1:-.}
IMAGE_DIR=${2:-image}

qemu-system-x86_64 \
    -m 2G \
    -smp 2 \
    -kernel "$KERNEL_DIR/arch/x86/boot/bzImage" \
    -append "console=ttyS0 root=/dev/sda earlyprintk=serial net.ifnames=0 nokaslr" \
    -drive file="$IMAGE_DIR/bullseye.img",format=raw \
    -net user,host=10.0.2.10,hostfwd=tcp:127.0.0.1:10021-:22 \
    -net nic,model=e1000 \
    -enable-kvm \
    -nographic \
    -pidfile vm.pid \
    2>&1 | tee vm.log
```

Key flags explained:

| Flag | Purpose |
|------|---------|
| `-m 2G` | Allocate 2 GB RAM to the VM |
| `-smp 2` | Give the VM 2 virtual CPUs |
| `-kernel` | Path to the kernel image |
| `-append` | Kernel command line: serial console, root device, no KASLR (useful for debugging) |
| `-drive` | Root filesystem image |
| `-net user,...hostfwd=...` | Forward host port 10021 to guest port 22 for SSH |
| `-enable-kvm` | Enable KVM hardware acceleration |
| `-nographic` | No GUI; use the terminal as the serial console |

Make it executable and launch:

```bash
chmod +x run.sh
./run.sh . image/
```

The kernel will boot and print output to your terminal. Log in as `root` with no password.

---

## Connecting via SSH

Once the VM is running, you can SSH in from another terminal using the generated key:

```bash
ssh -i image/bullseye.id_rsa \
    -p 10021 \
    -o StrictHostKeyChecking=no \
    root@localhost
```

---

## Stopping the VM

To shut down cleanly from inside the VM:

```bash
poweroff
```

Or kill the QEMU process from the host using the PID written to `vm.pid`:

```bash
kill $(cat vm.pid)
```