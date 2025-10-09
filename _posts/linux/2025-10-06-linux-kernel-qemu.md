---
layout: post
title: "Linux Kernel with Qemu"
date: 2025-07-14 10:00:00 +0700
categories: [Linux]
---

## QEMU

<div style="text-align: justify; text-indent: 2em;">
QEMU is a generic and open source machine emulator and virtualizer.

When used as a machine emulator, QEMU can run OSes and programs made for one machine (e.g. an ARM board) on a different machine (e.g. your own PC). By using dynamic translation, it achieves very good performance.
</div>

<div style="text-align: justify; text-indent: 2em;">
When used as a virtualizer, QEMU achieves near native performance by executing the guest code directly on the host CPU. QEMU supports virtualization when executing under the Xen hypervisor or using the KVM kernel module in Linux. When using KVM, QEMU can virtualize x86, server and embedded PowerPC, 64-bit POWER, S390, 32-bit and 64-bit ARM, and MIPS guests.
</dev>

### Install QEMU

```bash
sudo apt-get update
sudo apt-get install git fakeroot build-essential ncurses-dev xz-utils libssl-dev bc flex libelf-dev bison qemu-system-x86
```

## Getting kernel source

<div style="text-align: justify; text-indent: 2em;">
The Linux kernel is a free and open-source Unix-like kernel that is used in many computer systems worldwide. The kernel was created by Linus Torvalds in 1991 and was soon adopted as the kernel for the GNU operating system which was created to be a free replacement for Unix.
</div>

```bash
wget https://cdn.kernel.org/pub/linux/kernel/v5.x/linux-5.10.54.tar.xz
tar xvf linux-5.10.54.tar.xz
cd linux-5.10.54
```

## Building the kernel

<div style="text-align: justify; text-indent: 2em;">
To prepare the kernel for building, we need to set up the .config file.
</div>

```bash
# from inside Linux-5.10.54 folder
make defconfig # creates a .config file
make kvmconfig # modifies .config to set up everything necessary for it to run on QEMU
# or make kvm_guest.config in more recent kernels
```

<div style="text-align: justify; text-indent: 2em;">
Use KVM for debugging
</div>

```bash
CONFIG_KVM_GUEST=y
# CONFIG_KVM_DEBUG_FS is not set
CONFIG_HAVE_KVM=y
# CONFIG_KVM is not set
CONFIG_PTP_1588_CLOCK_KVM=y
```
<div style="text-align: justify; text-indent: 2em;">
Use KASAN
</div>

```bash
# Coverage collection.
CONFIG_KCOV=y

# Debug info for symbolization.
CONFIG_DEBUG_INFO=y

# Memory bug detector
CONFIG_KASAN=y
CONFIG_KASAN_INLINE=y

# Required for Debian Stretch
CONFIG_CONFIGFS_FS=y
CONFIG_SECURITYFS=y
```
<div style="text-align: justify; text-indent: 2em;">
Finally, run make olddefconfig to regenerate the configurations with the necessary modifications that the previous lines introduced.
</div>

```bash
make olddefconfig
```
<div style="text-align: justify; text-indent: 2em;">
Run "make -j `nproc`" to start building the linux kernel. It could take a few dozens of minutes, so be patient. In the end, a bzImage file should have been created:
</div>

```bash
ls arch/x86_64/boot/bzImage
```

### Creating an image for the kernel

<div style="text-align: justify; text-indent: 2em;">
The kernel cannot boot without a filesystem. There are multiple ways to set up one, including initramfs and others, but I prefer to follow syzkaller guide again and use their script to set up a Debian-like environment which comes with a bunch of handy tools:
</div>

```bash
# from the source folder root
sudo apt-get install debootstrap
mkdir image && cd image
wget https://raw.githubusercontent.com/google/syzkaller/master/tools/create-image.sh -O create-image.sh
chmod +x create-image.sh
./create-image.sh
```

<div style="text-align: justify; text-indent: 2em;">
The result is a chroot folder is created, alongside an RSA key that will be used to ssh into QEMU when booted, and stretch.img, which is the actual file system.
</div>

## Running the kernel

<div style="text-align: justify; text-indent: 2em;">
Finally, to run the kernel, I have a script run.sh that I like to use to make things easier:
</div>

```bash
qemu-system-x86_64 \
        -m 2G \
        -smp 2 \
        -kernel $1/arch/x86/boot/bzImage \
        -append "console=ttyS0 root=/dev/sda earlyprintk=serial net.ifnames=0 nokaslr" \
        -drive file=$2/bullseye.img,format=raw \
        -net user,host=10.0.2.10,hostfwd=tcp:127.0.0.1:10021-:22 \
        -net nic,model=e1000 \
        -enable-kvm \
        -nographic \
        -pidfile vm.pid \
        2>&1 | tee vm.log
```

<div style="text-align: justify; text-indent: 2em;">
Put it in the linux-5.10.54 folder, and run it:
</div>

```bash
chmod +x run.sh
./run.sh . image/
```