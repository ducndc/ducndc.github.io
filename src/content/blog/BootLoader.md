---
title: 'Bootloader trong hệ thống nhúng Linux'
description: 'Bootloader trong hệ thống nhúng Linux'
pubDate: 'Jun 14 2026'
heroImage: '../../assets/bootloader.png'
---

## Mục Lục

1. [Tổng Quan](#1-tổng-quan)
2. [Quá Trình Khởi Động (Boot Process)](#2-quá-trình-khởi-động-boot-process)
3. [Các Loại Bootloader Phổ Biến](#3-các-loại-bootloader-phổ-biến)
4. [U-Boot – Universal Bootloader](#4-u-boot--universal-bootloader)
5. [Barebox](#5-barebox)
6. [GRUB trong Embedded Linux](#6-grub-trong-embedded-linux)
7. [Cấu Trúc Bộ Nhớ và Phân Vùng](#7-cấu-trúc-bộ-nhớ-và-phân-vùng)
8. [Quá Trình Biên Dịch và Cấu Hình](#8-quá-trình-biên-dịch-và-cấu-hình)
9. [Device Tree (DTB)](#9-device-tree-dtb)
10. [Bảo Mật Bootloader](#10-bảo-mật-bootloader)
11. [Debug và Troubleshooting](#11-debug-và-troubleshooting)
12. [Tài Liệu Tham Khảo](#12-tài-liệu-tham-khảo)

---

## Tổng Quan

### Bootloader là gì?

Bootloader (hay boot loader) là chương trình phần mềm đầu tiên được thực thi khi hệ thống nhúng được cấp nguồn hoặc reset. Nhiệm vụ chính của bootloader là **khởi tạo phần cứng cơ bản** và **nạp kernel Linux** vào RAM để thực thi.

Trong hệ thống nhúng, bootloader đóng vai trò đặc biệt quan trọng vì:

- Phần cứng nhúng đa dạng, không có BIOS/UEFI chuẩn như PC
- Cần khởi tạo bộ nhớ DDR trước khi bất kỳ phần mềm nào có thể chạy
- Quản lý quá trình nạp kernel từ nhiều nguồn khác nhau (flash, SD card, mạng)
- Hỗ trợ môi trường phát triển và debug

### Vị Trí trong Hệ Thống

```
+------------------+
|   Power ON / Reset
+--------+---------+
         |
         v
+--------+---------+
|   ROM Code (SoC) |  ← Chip nội bộ, không thể thay đổi
|   (BootROM)      |
+--------+---------+
         |
         v
+--------+---------+
|   SPL / MLO      |  ← Secondary Program Loader (First Stage)
|   (First Stage)  |     Chạy từ SRAM nội bộ (~4-256 KB)
+--------+---------+
         |
         v
+--------+---------+
|   U-Boot / Main  |  ← Second Stage Bootloader
|   Bootloader     |     Chạy từ DDR RAM
+--------+---------+
         |
         v
+--------+---------+
|   Linux Kernel   |  ← Hệ điều hành chính
+--------+---------+
         |
         v
+--------+---------+
|   Root Filesystem|  ← User space
+------------------+
```

---

## Quá Trình Khởi Động (Boot Process)

### Giai Đoạn 0: BootROM

Khi SoC được cấp nguồn, CPU bắt đầu thực thi code từ địa chỉ cố định trong **ROM nội bộ** (không thể thay đổi bởi người dùng).

BootROM thực hiện:
- Reset CPU về trạng thái ban đầu
- Thiết lập clock cơ bản
- Phát hiện thiết bị boot (SD, eMMC, SPI Flash, USB,...)
- Nạp SPL/MLO vào SRAM nội bộ và chuyển quyền điều khiển

```
BootROM Address (ARM Cortex-A):
- Reset Vector: 0x00000000 hoặc 0xFFFF0000 (tùy chế độ)
- Exception Vector Table tại địa chỉ này
```

### Giai Đoạn 1: SPL (Secondary Program Loader)

SPL (hay MLO trên TI AM335x) là bootloader giai đoạn đầu, có kích thước rất nhỏ (thường < 64KB để vừa SRAM).

**Nhiệm vụ của SPL:**

```c
/* Luồng thực thi điển hình của SPL */
void board_init_f(ulong dummy)
{
    /* 1. Khởi tạo UART để debug */
    preloader_console_init();
    
    /* 2. Cấu hình Power Management IC (PMIC) */
    pmic_init();
    
    /* 3. Khởi tạo DDR/SDRAM - quan trọng nhất */
    sdram_init();
    
    /* 4. Nạp U-Boot từ thiết bị lưu trữ vào DDR */
    spl_load_image();
}
```

**Kích thước SRAM điển hình theo SoC:**

| SoC | SRAM Size | SPL Max Size |
|-----|-----------|--------------|
| TI AM335x | 128 KB | 64 KB (MLO) |
| NXP i.MX6 | 256 KB | 68 KB (IVT Header) |
| Allwinner H3 | 32 KB | 32 KB |
| Rockchip RK3399 | 200 KB | ~100 KB |
| Raspberry Pi | GPU SRAM | Không giới hạn |

### Giai Đoạn 2: Bootloader Chính (U-Boot)

Sau khi DDR được khởi tạo, U-Boot chính được nạp và thực thi với không gian bộ nhớ đầy đủ.

**Luồng thực thi U-Boot:**

```
board_init_r()
    ├── board_early_init_r()      # Khởi tạo phần cứng sớm
    ├── env_init()                 # Đọc biến môi trường
    ├── serial_init()              # Khởi tạo UART
    ├── console_init_r()           # Console đầy đủ
    ├── interrupt_init()           # Bộ xử lý ngắt
    ├── timer_init()               # Timer
    ├── board_init()               # Board-specific init
    ├── mmc_initialize()           # Khởi tạo MMC/SD
    ├── net_init()                 # Khởi tạo mạng
    └── main_loop()                # Vòng lặp chính (CLI hoặc autoboot)
```

### Giai Đoạn 3: Nạp Kernel

```bash
# Quy trình nạp kernel điển hình trong U-Boot

# 1. Đọc kernel image từ MMC
load mmc 0:1 ${kernel_addr_r} /boot/Image

# 2. Đọc Device Tree Blob
load mmc 0:1 ${fdt_addr_r} /boot/my-board.dtb

# 3. Đọc initramfs (nếu có)
load mmc 0:1 ${ramdisk_addr_r} /boot/initramfs.cpio.gz

# 4. Thiết lập bootargs
setenv bootargs "console=ttyS0,115200 root=/dev/mmcblk0p2 rootwait rw"

# 5. Boot kernel
booti ${kernel_addr_r} ${ramdisk_addr_r}:${filesize} ${fdt_addr_r}
```

---

## Các Loại Bootloader Phổ Biến

#### So Sánh Tổng Quan

| Bootloader | Kiến Trúc Hỗ Trợ | Giao Thức | Use Case |
|------------|------------------|-----------|----------|
| **U-Boot** | ARM, x86, MIPS, RISC-V, PowerPC | CLI, Script | Phổ biến nhất, đa nền tảng |
| **Barebox** | ARM, x86, MIPS | Shell-like | Thay thế U-Boot hiện đại |
| **GRUB2** | x86, ARM64, RISC-V | Scripting | x86 embedded, UEFI |
| **Coreboot** | x86, ARM | Payload-based | PC nhúng, Chromebook |
| **Das U-Boot** | Hầu hết kiến trúc | CLI | = U-Boot |
| **LILO** | x86 | Đơn giản | Cũ, ít dùng |
| **RedBoot** | ARM, MIPS, x86 | CLI | Cisco router cũ |
| **OpenWRT boot** | MIPS, ARM | Minimal | Router, IoT |

#### Lựa Chọn Bootloader theo Use Case

```
Hệ thống nhúng ARM/RISC-V thông thường → U-Boot
Hệ thống cần bảo mật cao (Secure Boot) → U-Boot + TF-A
Phát triển hiện đại, cần shell linh hoạt → Barebox
x86 Embedded (industrial PC) → GRUB2 hoặc Coreboot
IoT thiết bị nhỏ, flash ít → Stripped U-Boot hoặc SPL only
```

---

## U-Boot – Universal Bootloader

#### Kiến Trúc U-Boot

```
u-boot/
├── arch/                    # Kiến trúc CPU (arm, x86, mips, riscv...)
│   └── arm/
│       ├── cpu/             # CPU-specific code
│       ├── dts/             # Device Tree Sources
│       └── mach-*/          # Machine/SoC specific
├── board/                   # Board-specific code
│   ├── raspberrypi/
│   ├── ti/
│   └── freescale/
├── common/                  # Code dùng chung
│   ├── cmd/                 # Lệnh CLI (cmd_mmc.c, cmd_net.c...)
│   └── spl/                 # SPL framework
├── drivers/                 # Device drivers
│   ├── mmc/
│   ├── net/
│   ├── serial/
│   └── usb/
├── fs/                      # Filesystem (ext4, fat, ubifs...)
├── include/                 # Header files
├── lib/                     # Thư viện (crypto, lzma, zlib...)
├── net/                     # Network stack (TFTP, DHCP, NFS...)
└── tools/                   # mkimage, dts compiler...
```

#### Biến Môi Trường U-Boot

Biến môi trường là cơ chế cấu hình linh hoạt của U-Boot, được lưu trong flash/eMMC.

```bash
# Xem tất cả biến môi trường
printenv

# Thiết lập biến
setenv ipaddr 192.168.1.100
setenv serverip 192.168.1.1
setenv netmask 255.255.255.0

# Lưu vào bộ nhớ không bay hơi
saveenv

# Biến môi trường quan trọng:
# bootdelay    - Thời gian chờ autoboot (giây), -1 = không autoboot
# bootcmd      - Lệnh boot mặc định
# bootargs     - Tham số truyền cho kernel
# ethaddr      - Địa chỉ MAC
# ipaddr       - IP tĩnh của board
# serverip     - IP của TFTP server
```

**Ví dụ cấu hình bootcmd:**

```bash
# Boot từ eMMC
setenv bootcmd 'mmc dev 0; \
    load mmc 0:1 ${kernel_addr_r} Image; \
    load mmc 0:1 ${fdt_addr_r} board.dtb; \
    booti ${kernel_addr_r} - ${fdt_addr_r}'

# Boot từ network (TFTP)
setenv bootcmd 'dhcp; \
    tftp ${kernel_addr_r} Image; \
    tftp ${fdt_addr_r} board.dtb; \
    booti ${kernel_addr_r} - ${fdt_addr_r}'

# Boot từ NFS
setenv bootargs 'console=ttyS0,115200 \
    root=/dev/nfs \
    nfsroot=192.168.1.1:/srv/nfs/rootfs,v3,tcp \
    ip=dhcp'
```

#### Scripting trong U-Boot

U-Boot hỗ trợ script đơn giản với điều kiện và vòng lặp:

```bash
# Script phức tạp hơn với điều kiện
setenv boot_script '
    echo "Detecting boot media...";
    if mmc dev 0; then
        echo "Booting from eMMC";
        run boot_emmc;
    elif mmc dev 1; then
        echo "Booting from SD card";
        run boot_sd;
    else
        echo "Fallback: Network boot";
        run boot_net;
    fi
'

# Lưu script thành binary
mkimage -T script -C none -n 'Boot Script' \
    -d boot.txt boot.scr
```

#### Lệnh U-Boot Thường Dùng

```bash
# ---- Thông tin hệ thống ----
bdinfo              # Board information
version             # U-Boot version
coninfo             # Console devices info

# ---- Bộ nhớ ----
md.b 0x80000000 64  # Đọc memory (bytes), 64 bytes từ 0x80000000
mw.l 0x80000000 0 16 # Ghi memory (long), 16 words = 0
cp.b src dst len    # Copy memory

# ---- MMC/SD ----
mmc list            # Liệt kê tất cả MMC devices
mmc dev 0           # Chọn MMC device 0
mmc info            # Thông tin MMC
mmc read addr blk cnt # Đọc raw blocks
fatls mmc 0:1       # Liệt kê file trên FAT partition
ls ext4 mmc 0:2 /   # Liệt kê file trên ext4 partition
load mmc 0:1 addr filename  # Load file từ partition

# ---- Mạng ----
ping 192.168.1.1    # Ping
dhcp                # DHCP
tftp addr filename  # Download qua TFTP

# ---- Flash (SPI/NAND/NOR) ----
sf probe            # Khởi tạo SPI flash
sf read addr offset len   # Đọc từ SPI flash
sf write addr offset len  # Ghi vào SPI flash
sf erase offset len       # Xóa SPI flash
nand info           # Thông tin NAND flash
nand read addr offset len # Đọc từ NAND

# ---- USB ----
usb start           # Khởi tạo USB
usb info            # Thông tin USB devices
usb storage         # Liệt kê USB storage

# ---- Boot ----
booti addr - fdtaddr  # Boot ARM64 Linux Image
bootz addr - fdtaddr  # Boot ARM32 zImage
bootm addr            # Boot uImage
```

#### Địa Chỉ Load Kernel Tiêu Chuẩn

```
ARM 32-bit (thường dùng):
  kernel_addr_r  = 0x82000000
  fdt_addr_r     = 0x88000000
  ramdisk_addr_r = 0x88080000

ARM 64-bit (AArch64):
  kernel_addr_r  = 0x40200000
  fdt_addr_r     = 0x40000000
  ramdisk_addr_r = 0x44000000

RISC-V 64-bit:
  kernel_addr_r  = 0x80200000
  fdt_addr_r     = 0x80000000
```

---

## Barebox

#### Giới Thiệu

Barebox là bootloader hiện đại, được phát triển như một "U-Boot thế hệ tiếp theo". Barebox có giao diện shell giống Unix hơn và kiến trúc driver model tương tự Linux kernel.

#### Tính Năng Nổi Bật

- **Shell mạnh mẽ**: hỗ trợ pipeline, biến, điều kiện đầy đủ
- **Device model**: dùng lại model từ Linux kernel
- **DTS/DTB**: hỗ trợ tốt Device Tree
- **Scripting**: script shell linh hoạt hơn U-Boot
- **Debugging**: hỗ trợ kprobes, ftrace (trên một số nền tảng)

#### Ví Dụ Script Barebox

```bash
#!/bin/env bash
# /env/boot/default - Barebox boot script

# Phát hiện và mount thiết bị
if [ -e /dev/mmc0 ]; then
    mkdir -p /mnt/mmc
    mount /dev/mmc0.1 /mnt/mmc
    
    kernel=/mnt/mmc/zImage
    fdt=/mnt/mmc/board.dtb
    
    if [ -f $kernel ] && [ -f $fdt ]; then
        bootm -f $kernel -o $fdt \
              -a "console=ttyS0,115200 root=/dev/mmcblk0p2 rootwait"
    fi
fi

# Fallback: network boot
dhcp
tftp $kernel /zImage
tftp $fdt /board.dtb
bootm -f $kernel -o $fdt
```

---

## GRUB trong Embedded Linux

#### Khi Nào Dùng GRUB cho Embedded

GRUB phù hợp với embedded x86/x86_64 như:
- Industrial PC (IPC)
- Thiết bị dùng Intel Atom, AMD Embedded
- Hệ thống có UEFI firmware
- Chromebook, mini PC

#### Cấu Hình GRUB cho Embedded

```
# /boot/grub/grub.cfg

set default=0
set timeout=3

menuentry "Embedded Linux" {
    linux /boot/vmlinuz console=ttyS0,115200 quiet root=/dev/sda2
    initrd /boot/initramfs.img
}

menuentry "Recovery Mode" {
    linux /boot/vmlinuz-recovery console=ttyS0,115200 \
          root=/dev/sda3 init=/bin/sh
}
```

---

## Cấu Trúc Bộ Nhớ và Phân Vùng

#### Layout eMMC/SD Card Điển Hình

```
┌─────────────────────────────────────────────────────────┐
│                     eMMC/SD Card                        │
├──────────┬──────────┬──────────┬───────────┬────────────┤
│  Sector 0│  Sector 1│ Partition│ Partition │ Partition  │
│  (MBR)   │ (U-Boot  │    1     │     2     │     3      │
│          │  SPL)    │ /boot    │ rootfs    │  data      │
│          │          │ FAT32    │  ext4     │  ext4      │
│  512B    │ 512B-4MB │  64MB    │  512MB    │  Còn lại   │
└──────────┴──────────┴──────────┴───────────┴────────────┘
```

**Vị trí SPL/U-Boot trên eMMC (TI AM335x làm ví dụ):**

```
Offset 0x000000 : MBR
Offset 0x020000 : MLO (SPL) - 128KB, sector 256
Offset 0x060000 : U-Boot binary
Offset 0x260000 : U-Boot environment
Offset 0x280000 : DTB
Offset 0x300000 : Start of partition table
```

#### Layout NAND Flash

```
┌────────────────────────────────────────────────────────┐
│                      NAND Flash                        │
├────────┬─────────┬──────────┬────────────┬─────────────┤
│ Block 0│ Block 1 │ Block 2-N│ Block N+1  │ Remaining   │
│  SPL   │  SPL    │  U-Boot  │  Kernel    │ UBI volume  │
│  (bk)  │  (bk)   │  (uImage)│  (uImage)  │ (rootfs)    │
│ 128KB  │ 128KB   │  512KB   │   4MB      │             │
└────────┴─────────┴──────────┴────────────┴─────────────┘

bk = backup copy (NAND có thể có bad block)
UBI = Unsorted Block Image - filesystem layer cho NAND
```

#### Layout SPI NOR Flash

```
Địa chỉ    Kích thước  Nội dung
0x000000    256 KB      U-Boot (SPL + main)
0x040000    64  KB      U-Boot environment
0x050000    64  KB      DTB
0x060000    còn lại     Kernel + rootfs (squashfs/jffs2)
```

#### Thiết Lập Partition Table

```bash
# Tạo partition table cho SD card trên host
sudo fdisk /dev/sdX << EOF
o        # Tạo MBR partition table mới
n p 1    # Partition 1 primary
         # First sector (default)
+64M     # Size 64MB
t 0b     # Type FAT32
n p 2    # Partition 2 primary
         # First sector (default)
+2G      # Size 2GB
n p 3    # Partition 3 primary
         # (remaining space)
w        # Ghi và thoát
EOF

# Format
sudo mkfs.vfat -F 32 -n BOOT /dev/sdX1
sudo mkfs.ext4 -L rootfs /dev/sdX2
sudo mkfs.ext4 -L data /dev/sdX3
```

---

## Quá Trình Biên Dịch và Cấu Hình

#### Thiết Lập Môi Trường Cross-Compile

```bash
# Cài đặt cross-compiler (Ubuntu/Debian)
sudo apt-get install gcc-aarch64-linux-gnu    # ARM64
sudo apt-get install gcc-arm-linux-gnueabihf  # ARM32 hard-float
sudo apt-get install gcc-riscv64-linux-gnu    # RISC-V 64

# Thiết lập biến môi trường
export CROSS_COMPILE=aarch64-linux-gnu-       # ARM64
export ARCH=arm64

# Hoặc ARM32
export CROSS_COMPILE=arm-linux-gnueabihf-
export ARCH=arm
```

#### Cấu Hình U-Boot

```bash
# Clone source
git clone https://github.com/u-boot/u-boot.git
cd u-boot

# Xem danh sách defconfig cho board
ls configs/ | grep -i raspberrypi
ls configs/ | grep -i imx6

# Chọn defconfig cho board của bạn
make rpi_4_defconfig            # Raspberry Pi 4
make mx6ull_14x14_evk_defconfig # NXP i.MX6ULL EVK
make am335x_evm_defconfig       # TI AM335x EVM
make rock64-rk3328_defconfig    # Rock64 (RK3328)

# Tùy chỉnh cấu hình (menuconfig)
make menuconfig

# Quan trọng trong menuconfig:
# Boot media: MMC, SPI Flash, NAND, USB, Network
# SPL: Enable SPL, SPL size limits
# Environment: Storage location, size, offset
# Filesystem: FAT, ext2/4, UBIFS
# Network: DHCP, TFTP, NFS
# Security: Secure Boot, FIT signature
```

#### Biên Dịch U-Boot

```bash
# Biên dịch toàn bộ
make -j$(nproc)

# Output files:
# u-boot.bin        - U-Boot binary thuần
# u-boot.img        - U-Boot với header mkimage
# u-boot-dtb.bin    - U-Boot + DTB
# spl/u-boot-spl.bin - SPL binary
# MLO               - SPL cho TI (với header đặc biệt)
# u-boot.itb        - FIT image (SPL + U-Boot + DTB)

# Chỉ biên dịch tools
make tools

# Chỉ biên dịch dtbs
make dtbs
```

#### Ghi U-Boot vào eMMC/SD

```bash
# ---- SD Card (từ host Linux) ----

# Ghi SPL vào sector 1 (offset 512 bytes = 1 sector)
# (TI AM335x dùng sector 256)
sudo dd if=MLO of=/dev/sdX bs=512 seek=1 conv=notrunc,sync
sudo dd if=u-boot.img of=/dev/sdX bs=512 seek=96 conv=notrunc,sync

# Hoặc ghi trực tiếp (NXP i.MX6, offset 1KB)
sudo dd if=u-boot-dtb.imx of=/dev/sdX bs=1K seek=1 conv=notrunc,sync

# ---- Từ U-Boot CLI (đang chạy) ----

# Load từ TFTP
tftp ${loadaddr} u-boot.bin

# Ghi vào eMMC
mmc dev 0
# Ghi từ sector 2 (offset 1024 bytes), kích thước tính theo sectors
setexpr sz ${filesize} / 0x200
setexpr sz ${sz} + 1
mmc write ${loadaddr} 2 ${sz}

# Ghi vào SPI flash
sf probe 0
sf erase 0 0x50000
sf write ${loadaddr} 0 ${filesize}
```

#### Tạo Custom Board Support

```c
/* board/mycompany/myboard/myboard.c */
#include <common.h>
#include <init.h>
#include <asm/io.h>

/* Cấu hình DDR */
static const struct mx6_ddr_sysinfo ddr_info = {
    .dsize      = 1,  /* 32-bit data bus */
    .cs_density = 32,
    .ncs        = 1,
    .cs1_mirror = 0,
    .rtt_wr     = 1,  /* DDR3_RTT_60_OHM */
    .rtt_nom    = 1,
    .walat      = 1,
    .ralat      = 5,
    .mif3_mode  = 3,
    .bi_on      = 1,
    .sde_to_rst = 0x10,
    .rst_to_cke = 0x23,
};

/* Hàm bắt buộc: Thông tin board */
int checkboard(void)
{
    puts("Board: MyBoard v1.0\n");
    return 0;
}

/* Hàm bắt buộc: Khởi tạo sớm */
int board_early_init_f(void)
{
    /* Setup UART pads */
    setup_uart();
    return 0;
}

/* Hàm bắt buộc: Khởi tạo chính */
int board_init(void)
{
    /* Address of boot parameters */
    gd->bd->bi_boot_params = PHYS_SDRAM + 0x100;
    
    setup_i2c();
    setup_usb();
    setup_spi();
    
    return 0;
}

/* Thiết lập biến môi trường động */
int board_late_init(void)
{
    /* Đọc serial number từ fuse / EEPROM */
    char serial[32];
    read_serial_number(serial);
    env_set("serial#", serial);
    
    /* Tự động phát hiện boot media */
    if (is_recovery_button_pressed())
        env_set("bootcmd", "run recovery_boot");
    
    return 0;
}
```

---

## Device Tree (DTB)

#### Vai Trò của Device Tree trong Boot

Device Tree (DT) là cơ chế mô tả phần cứng để truyền từ bootloader sang kernel, giúp kernel nhận biết các thiết bị có mặt mà không cần hard-code vào kernel.

```
Bootloader đọc DTB file
        ↓
Bootloader có thể chỉnh sửa DTB (fixup) trong runtime
        ↓
Bootloader truyền DTB address cho kernel
        ↓
Kernel parse DTB để cấu hình driver
```

#### Ví Dụ Device Tree

```dts
/* arch/arm64/boot/dts/vendor/my-board.dts */
/dts-v1/;
#include "my-soc.dtsi"

/ {
    model = "MyCompany MyBoard v1.0";
    compatible = "mycompany,myboard", "vendor,my-soc";

    /* Mô tả RAM */
    memory@40000000 {
        device_type = "memory";
        reg = <0x0 0x40000000 0x0 0x40000000>; /* 1GB từ 0x40000000 */
    };

    /* Cấu hình console mặc định */
    chosen {
        stdout-path = "serial0:115200n8";
        /* bootargs có thể được set ở đây hoặc từ bootloader */
    };
};

/* Override UART0 từ dtsi */
&uart0 {
    status = "okay";
};

/* Override I2C với PMIC */
&i2c0 {
    status = "okay";
    clock-frequency = <400000>;

    pmic@58 {
        compatible = "dlg,da9063";
        reg = <0x58>;
        interrupt-parent = <&gpio1>;
        interrupts = <5 IRQ_TYPE_LEVEL_LOW>;
    };
};

/* Ethernet */
&ethernet0 {
    status = "okay";
    phy-mode = "rgmii-id";
    phy-handle = <&phy0>;
    
    mdio {
        phy0: ethernet-phy@0 {
            reg = <0>;
            reset-gpios = <&gpio2 10 GPIO_ACTIVE_LOW>;
        };
    };
};
```

#### U-Boot DTB Fixup

```c
/* Bootloader có thể sửa DTB trước khi truyền cho kernel */

int ft_board_setup(void *blob, struct bd_info *bd)
{
    /* Cập nhật địa chỉ RAM */
    fdt_fixup_memory(blob, (u64)PHYS_SDRAM, (u64)PHYS_SDRAM_SIZE);
    
    /* Thêm serial number vào chosen node */
    char serial[32];
    read_serial_from_fuse(serial);
    fdt_setprop_string(blob, fdt_path_offset(blob, "/chosen"),
                       "serial-number", serial);
    
    /* Set MAC address từ environment */
    char *mac = env_get("ethaddr");
    if (mac) {
        u8 mac_bytes[6];
        string_to_enetaddr(mac, mac_bytes);
        fdt_fixup_ethernet(blob);
    }
    
    return 0;
}
```

---

## Bảo Mật Bootloader

#### Secure Boot Chain

```
Secure Boot Chain (ARM TrustZone):

OTP/eFuse (Public Key Hash) ← Được lập trình 1 lần tại nhà máy
        ↓ Verify
BootROM (Immutable)
        ↓ Verify signature
ARM Trusted Firmware (ATF/TF-A)  ← BL1, BL2
        ↓ Verify signature
Secure Bootloader (OP-TEE / BL31)
        ↓ Verify signature
U-Boot (BL33)
        ↓ Verify signature
Linux Kernel (FIT image)
```

#### FIT Image với Signature

```dts
/* boot.its - FIT Image Tree Source */
/dts-v1/;

/ {
    description = "Signed Boot Image";
    #address-cells = <1>;

    images {
        kernel@1 {
            description = "Linux Kernel";
            data = /incbin/("Image");
            type = "kernel";
            arch = "arm64";
            os = "linux";
            compression = "none";
            load = <0x40200000>;
            entry = <0x40200000>;
            
            hash@1 {
                algo = "sha256";
            };
        };

        fdt@1 {
            description = "Device Tree";
            data = /incbin/("my-board.dtb");
            type = "flat_dt";
            arch = "arm64";
            compression = "none";
            
            hash@1 {
                algo = "sha256";
            };
        };
    };

    configurations {
        default = "conf@1";
        
        conf@1 {
            description = "Default Config";
            kernel = "kernel@1";
            fdt = "fdt@1";
            
            signature@1 {
                algo = "sha256,rsa2048";
                key-name-hint = "dev";
                sign-images = "kernel", "fdt";
            };
        };
    };
};
```

```bash
# Tạo và ký FIT image
mkimage -f boot.its -k /path/to/keys -K u-boot.dtb \
        -r -o boot.itb

# Keys được tạo bằng:
openssl genrsa -F4 -out dev.key 2048
openssl req -batch -new -x509 -key dev.key -out dev.crt

# Kiểm tra FIT image
dumpimage -l boot.itb
```

#### Rollback Protection

```c
/* Bảo vệ chống rollback bằng Anti-Rollback Counter (ARC)
   lưu trong eFuse / RPMB */

#define MIN_UBOOT_VERSION  3   /* Phiên bản tối thiểu cho phép */

int board_late_init(void)
{
    /* Đọc phiên bản hiện tại từ eFuse */
    uint32_t arc = read_anti_rollback_counter();
    
    /* Kiểm tra phiên bản image mới */
    uint32_t new_version = get_image_version();
    
    if (new_version < arc) {
        printf("ERROR: Anti-rollback check failed! "
               "Image v%d < ARC v%d\n", new_version, arc);
        return -EPERM;
    }
    
    /* Cập nhật ARC nếu phiên bản mới hơn */
    if (new_version > arc)
        update_anti_rollback_counter(new_version);
    
    return 0;
}
```

#### Lock Down U-Boot

```bash
# Trong U-Boot menuconfig: tắt các tính năng nguy hiểm
CONFIG_BOOTCOMMAND="run distro_bootcmd"  # Không cho phép thay đổi
CONFIG_BOOTDELAY=-2                       # Không có thời gian chờ
CONFIG_CMD_BOOTD=n                        # Tắt lệnh bootd
CONFIG_CMD_LOADS=n                        # Tắt nạp qua serial
CONFIG_ENV_IS_NOWHERE=y                   # Không lưu environment
CONFIG_DISABLE_CONSOLE=y                  # Tắt console (production)
```

---

## Debug và Troubleshooting

#### Output Console Điển Hình

Khi boot thành công, console sẽ hiển thị:

```
U-Boot SPL 2024.01 (Jan 15 2024 - 10:30:00 +0700)
Trying to boot from MMC1

U-Boot 2024.01 (Jan 15 2024 - 10:30:00 +0700)

CPU:   Cortex-A53 @ 1200 MHz
Model: MyCompany MyBoard v1.0
DRAM:  1 GiB
MMC:   mmc@fe310000: 0, mmc@fe320000: 1
Loading Environment from FAT... OK
Hit any key to stop autoboot:  3 2 1 0

## Loading kernel from FIT Image at 40000000 ...
...
Starting kernel ...

[    0.000000] Booting Linux on physical CPU 0x0000000000 [0x410fd034]
[    0.000000] Linux version 6.6.0 ...
```

#### Các Lỗi Thường Gặp

**Lỗi 1: Không có output sau power-on**
```
Nguyên nhân có thể:
- SPL không được ghi đúng offset
- Clock/power chưa đúng
- UART chưa được cấu hình

Debug:
- Kiểm tra JTAG/SWDIO output
- Đo tín hiệu UART với oscilloscope
- Kiểm tra PMIC power rails
- Xác nhận SPL offset với datasheet SoC
```

**Lỗi 2: SPL chạy nhưng U-Boot không load được**
```
SPL: Trying to boot from MMC
SPL: mmc init failed with error: -5
### ERROR ### Please RESET the board ###

Nguyên nhân:
- DDR initialization thất bại
- SPL tìm U-Boot sai offset
- eMMC/SD card bị lỗi

Debug:
U-Boot> md.l 0x80000000 4  # Kiểm tra DDR có accessible không
U-Boot> mmc info            # Kiểm tra MMC
U-Boot> mmc read 0x80000000 0x60 0x100  # Đọc sector 96 (offset U-Boot)
```

**Lỗi 3: U-Boot chạy nhưng không boot kernel**
```
Wrong Image Format for bootm command
ERROR: can't get kernel image!

Nguyên nhân:
- Sai địa chỉ load kernel
- Image format không khớp (Image vs zImage vs uImage)
- DTB không tìm thấy

Debug:
U-Boot> ls mmc 0:1          # Kiểm tra file có tồn tại
U-Boot> load mmc 0:1 ${kernel_addr_r} Image
U-Boot> iminfo ${kernel_addr_r}  # Xem thông tin image
```

**Lỗi 4: Kernel panic ngay sau boot**
```
[    0.000000] Kernel panic - not syncing: VFS: 
               Unable to mount root fs on unknown-block(0,0)

Nguyên nhân: Root filesystem không tìm thấy

Debug:
U-Boot> setenv bootargs "... root=/dev/mmcblk0p2 rootwait debug"
# Thêm "debug" và "rootwait" vào bootargs
# Kiểm tra lại root= device node
```

### Debug qua JTAG/OpenOCD

```bash
# Kết nối OpenOCD với JTAG adapter
openocd -f interface/jlink.cfg \
        -f target/imx6.cfg

# Từ telnet (port 4444)
telnet localhost 4444

# Các lệnh debug
> halt                    # Dừng CPU
> targets                 # Liệt kê targets
> cortex_a.cpu reg        # Đọc registers
> mdw 0x80000000          # Đọc memory word
> arm disassemble 0x80000000 20  # Disassemble
> bp 0x80200000 4 hw      # Hardware breakpoint
> resume                  # Tiếp tục chạy
> step                    # Single step

# Load và debug U-Boot
> load_image u-boot 0x80800000 bin
> reg pc 0x80800000
> resume
```

### Sử Dụng UART Debug Console

```bash
# Kết nối UART từ host
# Cài minicom hoặc picocom
sudo apt install picocom

# Kết nối (thường 115200 baud)
picocom -b 115200 /dev/ttyUSB0

# Ghi log để phân tích
picocom -b 115200 /dev/ttyUSB0 --logfile boot.log

# Phân tích timing trong log
grep -E "^\[.*\]" boot.log | head -50  # Kernel timestamps
```

### Checklist Debug Bootloader

```
□ Power rails đúng điện áp chưa? (VDD_CORE, VDD_IO, VDD_DDR)
□ Clock source có oscillating không? (đo bằng oscilloscope)
□ BOOT_MODE pins đúng chưa? (BOOT từ eMMC/SD/SPI?)
□ SPL được ghi đúng offset chưa? (xem datasheet SoC)
□ DDR training logs có lỗi không?
□ Environment variables có đúng không? (printenv)
□ Kernel image tại đúng địa chỉ? (iminfo)
□ DTB compatible string có khớp với kernel driver?
□ bootargs có đúng root device không?
□ Filesystem có corrupted không? (fsck.ext4)
```

---

## Tài Liệu Tham Khảo

#### Tài Liệu Chính Thức

| Tài Liệu | Đường Dẫn |
|----------|-----------|
| U-Boot Documentation | https://docs.u-boot.org |
| U-Boot Source | https://github.com/u-boot/u-boot |
| Barebox Documentation | https://www.barebox.org/doc |
| Linux Device Tree | https://devicetree.org |
| ARM Trusted Firmware | https://trustedfirmware-a.readthedocs.io |

#### Tài Liệu SoC Cụ Thể

| SoC | Tài Liệu |
|-----|----------|
| NXP i.MX | https://www.nxp.com/design/software/embedded-software/i-mx-software |
| TI AM335x | https://www.ti.com/product/AM3358 |
| Rockchip | https://opensource.rock-chips.com |
| Allwinner | https://linux-sunxi.org |
| Broadcom (RPi) | https://github.com/raspberrypi/firmware |

#### Sách Tham Khảo

- "Embedded Linux Development Using Yocto Project" - Otavio Salvador
- "Mastering Embedded Linux Programming" - Chris Simmonds
- "Building Embedded Linux Systems" - Karim Yaghmour
- "Linux Kernel Development" - Robert Love

#### Cộng Đồng và Hỗ Trợ

- **U-Boot Mailing List**: u-boot@lists.denx.de
- **Linux Kernel Mailing List**: linux-kernel@vger.kernel.org
- **Embedded Linux Wiki**: https://elinux.org
- **bootlin (Free Training)**: https://bootlin.com/docs

---

> **Lưu ý**: Tài liệu này mang tính tổng quan. Chi tiết cụ thể có thể khác nhau tùy theo SoC, board và phiên bản U-Boot. Luôn tham khảo datasheet của SoC và release notes của U-Boot phiên bản đang dùng.

---
