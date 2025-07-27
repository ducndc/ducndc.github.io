---
layout: post
title: "Quản trị Linux"
date: 2022-10-25 10:00:00 +0700
categories: [Linux]
---

## Bản phân phối Linux

<div style="text-align: justify; text-indent: 2em;">
Một hệ điều hành được tạo thành từ một bộ sưu tập phần mềm, dựa trên Linuxkernel và một hệ thống quản lý gói.
</div>

<div style="text-align: justify; text-indent: 2em;">
Hệ điều hành Linux: Linux kernel + GNU shell + môi trường đồ họa máy tính để bàn và nhiều hơn nữa
</div>

## Terminal

<div style="text-align: justify; text-indent: 2em;">
Cho phép người dùng truy cập hệ thống thông qua shell
</div>

### A shell

<div style="text-align: justify; text-indent: 2em;">
Một chương trình tiếp nhận lệnh từ người dùng và chuyển chúng đến nhân hệ điều hành để thực thi.
</div>

<div style="text-align: justify; text-indent: 2em;">
Còn được gọi là trình thông dịch lệnh
</div>

<div style="text-align: justify; text-indent: 2em;">
shell được khởi động khi người dùng đăng nhập hoặc khởi động terminal
</div>

### man 

<div style="text-align: justify; text-indent: 2em;">
man là trình phân trang hướng dẫn sử dụng của hệ thống. Mỗi đối số trang được cung cấp cho man thường là tên của một chương trình, tiện ích hoặc hàm. Trang hướng dẫn sử dụng liên kết với mỗi đối số này sau đó sẽ được tìm thấy và hiển thị.
</div>

![H1](/assets/img/linux/man_ls.png)

### type

<div style="text-align: justify; text-indent: 2em;">
Kiểm tra xem lệnh có phải là tệp thực thi hay là shell được xây dựng
</div>

![H1](/assets/img/linux/type.png)

### help

<div style="text-align: justify; text-indent: 2em;">
Được sử dụng để hiển thị thông tin về các lệnh tích hợp của shell trực tiếp từ thiết bị đầu cuối
</div>

![H1](/assets/img/linux/help.png)

### apropos

![H1](/assets/img/linux/apropos.png)

<div style="text-align: justify; text-indent: 2em;">
Khi không nhớ chính xác lệnh nhưng biết một vài từ khóa liên quan đến lệnh để xác định cách sử dụng hoặc chức năng của lệnh đó
</div>

### TAB

- Ctrl + C: ngắt
- Ctrl + Z: dừng
- Ctrl + L: xóa
- Ctrl + R: quay lại lệnh trước đó

## Linux có 2 nhóm người dùng chính

1. người dùng không có đặc quyền

2. người dùng root (chỉ có một)

## Hệ thống tập tin Linux

- Hệ thống tệp kiểm soát cách dữ liệu được lưu trữ và truy xuất.
- Mỗi nhóm dữ liệu được gọi là một tệp, các cấu trúc và quy tắc logic được sử dụng để quản lý tệp và tên của chúng được gọi là hệ thống tệp.
- Hệ thống tệp là một tập hợp logic các tệp trên một phân vùng hoặc đĩa.
- Trên hệ thống Linux, mọi thứ đều được coi là một tệp.
- Trên Linux, tên tệp và thư mục phân biệt chữ hoa và chữ thường.

## Tiêu chuẩn phân cấp hệ thống tập tin (FHS)

- `/bin`: chứa các tệp nhị phân hoặc các tệp thực thi dành cho tất cả người dùng.
- `/sbin`: chứa các ứng dụng chỉ dành cho người dùng siêu cấp (superuser).
- `/boot`: chứa các tệp cần thiết để khởi động hệ thống.
- `/home`: là nơi chứa thư mục cá nhân của người dùng. Bên trong thư mục này sẽ có một thư mục con cho từng người dùng, nếu người đó có thư mục cá nhân riêng.
- `root` có thư mục cá nhân riêng biệt với các người dùng khác, nằm tại `/root`.
- `/dev`: chứa các tệp thiết bị (device files).
- `/etc`: chứa hầu hết, nếu không phải là tất cả, các tệp cấu hình hệ thống ở cấp độ toàn cục.
- `/lib`: chứa các tệp thư viện dùng chung (shared libraries) được sử dụng bởi nhiều ứng dụng khác nhau.
- `/media`: được sử dụng để gắn kết (mount) thiết bị lưu trữ ngoài một cách tự động.
- `/mnt`: tương tự như `/media`, nhưng hiện nay ít được sử dụng hơn.
- `/tmp`: chứa các tệp tạm thời, thường được lưu bởi các ứng dụng đang chạy. Người dùng không có quyền cao cũng có thể lưu tạm thời các tệp tại đây.
- `/proc`: là một thư mục ảo, chứa thông tin về phần cứng máy tính, chẳng hạn như CPU, bộ nhớ RAM hoặc Kernel. Các tệp và thư mục trong đó được tạo khi máy tính khởi động, hoặc tạo động trong quá trình hệ thống đang chạy và thay đổi.
- `/sys`: chứa thông tin về thiết bị, trình điều khiển (drivers) và một số tính năng của kernel.
- `/srv`: chứa dữ liệu dành cho các dịch vụ máy chủ (server).
- `/run`: là một hệ thống tệp tạm thời hoạt động trong RAM.
- `/usr`: chứa nhiều thư mục con khác như tệp thực thi (binaries), thư viện dùng chung, v.v. Trên một số bản phân phối như CentOS, nhiều lệnh được lưu trong `/usr/bin` và `/usr/sbin` thay vì `/bin` và `/sbin`.
- `/var`: thường chứa các tệp có độ dài thay đổi như tệp log – là các tệp ghi lại các sự kiện xảy ra trong hệ thống.

## Các lệnh liệt kê thư mục trong Linux

- **Liệt kê thư mục hiện tại:**
  - `~`: thư mục chính của người dùng (home directory).
  - `.`: thư mục hiện tại.
  - `..`: thư mục cha.

- Liệt kê thư mục hiện tại:
  ```bash
  ls .
  ls ~ /var /
  ls -1 /etc
  ls -h /etc
```

## Dấu thời gian của tệp: atime, mtime, ctime

- Hệ thống Linux ghi lại **thời gian thực hiện các thao tác trên tệp**. Các dấu thời gian rất hữu ích vì chúng lưu giữ thông tin về thời điểm tệp được truy cập, chỉnh sửa hoặc thay đổi siêu dữ liệu.

- Mỗi tệp trong Linux có **3 loại dấu thời gian**:

  - **atime (Access Time)** – *Dấu thời gian truy cập*:  
    Cho biết lần **cuối cùng tệp được truy cập** (ví dụ như mở đọc nội dung).

  - **mtime (Modify Time)** – *Dấu thời gian đã sửa đổi*:  
    Cho biết lần **cuối cùng nội dung tệp được chỉnh sửa**.

  - **ctime (Change Time)** – *Dấu thời gian thay đổi*:  
    Cho biết lần **cuối cùng một số siêu dữ liệu liên quan đến tệp** (như quyền truy cập, chủ sở hữu, liên kết) được thay đổi.  
    > Lưu ý: `ctime` không phải là thời gian tạo tệp.

## Xem tập tin

- cat
- less
- tail
- head
- watch

## Tạo tập tin

- touch
- mkdir

## Đếm dòng, từ và byte trong tệp với `wc`

Lệnh `wc` trong Linux được dùng để **in số dòng, số từ và số byte** của mỗi tệp. Nếu chỉ định nhiều tệp, `wc` sẽ hiển thị kết quả cho từng tệp và một dòng tổng cộng ở cuối. Trong đó:

- Một "từ" được định nghĩa là **chuỗi ký tự có độ dài khác 0**, được phân cách bởi khoảng trắng.
- Nếu không chỉ định FILE, hoặc nếu FILE là `-`, `wc` sẽ đọc từ **đầu vào tiêu chuẩn** (stdin).

### Các tùy chọn chính:
Các tùy chọn dưới đây có thể được sử dụng để chọn loại thông tin cần in ra. Kết quả luôn được hiển thị theo **thứ tự sau**: dòng mới (newline), từ (word), ký tự (character), byte, độ dài dòng dài nhất.

Một số ví dụ:

- `wc filename` – đếm số dòng, từ và byte của `filename`.
- `wc -l filename` – chỉ đếm số dòng.
- `wc -w filename` – chỉ đếm số từ.
- `wc -c filename` – chỉ đếm số byte.
- `wc -m filename` – đếm số ký tự (có thể khác byte nếu tệp chứa ký tự UTF-8).
- `wc -L filename` – hiển thị độ dài dòng dài nhất trong tệp.

## Command Redirection

Mỗi lệnh hoặc chương trình trong Linux đều có 3 luồng dữ liệu được kết nối:

1. **STDIN (0)** – Standard Input (nhập chuẩn)  
2. **STDOUT (1)** – Standard Output (xuất chuẩn)  
3. **STDERR (2)** – Standard Error (lỗi chuẩn)


### Ký hiệu chuyển hướng

- `>`: ghi đè vào 1 file  
- `>>`: ghi tiếp vào 1 file  
- `2>`: ghi lỗi stderr vào file  
- `&>`: ghi cả stdout và stderr vào file  

### Một số lệnh liên quan:

- `cut`
- `tee`
- `ls -lSh /etc/ | head`  
  _→ hiển thị 10 file đầu tiên theo kích thước (giảm dần)_

- `ps -ef | grep sshd`  
  _→ kiểm tra tiến trình sshd có đang chạy hay không_

- `ps aux --sort=-%mem | head -n 3`  
  _→ hiển thị 3 tiến trình tiêu thụ RAM nhiều nhất_

## Tìm kiếm tệp và đường dẫn lệnh trong Linux

### Tìm kiếm tệp nhanh chóng

Lệnh `locate` sử dụng cơ sở dữ liệu đã lập chỉ mục để tìm kiếm tệp nhanh chóng theo tên. Một số thao tác phổ biến:

- **Cập nhật cơ sở dữ liệu locate**:
  ```bash
  sudo updatedb
	```
- **Hiển thị thống kê cơ sở dữ liệu**:
  ```bash
  locate -S
	```
- **Tìm kiếm tệp theo tên gần đúng**:
  ```bash
  locate filename
	```
	filename sẽ tự động được hiểu là *filename*

- **Không phân biệt chữ hoa/thường**:
  ```bash
  locate -i filename
	```
- **Tìm kiếm chính xác tên tệp (dùng tên gốc)**:
  ```bash
  locate -b '\filename'
	```

- **Tìm kiếm bằng biểu thức chính quy (regex)**:
  ```bash
  locate -r 'regex'
	```

- **Chỉ hiển thị tệp nếu nó thực sự tồn tại**:
  ```bash
  locate -e filename
	```

## Xác định đường dẫn đến lệnh thực thi

```bash
which -a command
```

## Tìm kiếm tệp bằng `find` trong Linux

Cú pháp cơ bản:

```bash
find [ĐƯỜNG_DẪN] [TÙY_CHỌN] [BIỂU_THỨC]
```

## Hard Links and the Inode Structure

<div style="text-align: justify; text-indent: 2em;">
Hard links là các liên kết cấp thấp ( low-level links) mà hệ thống sử dụng để tạo các thành phần của chính hệ thống file, chẳng hạn như file và thư mục. Liên kết cứng sẽ tạo một liên kết trong cùng hệ thống tập tin với 2 inode entry tương ứng trỏ đến cùng một nội dung vật lý (cùng số inode vì chúng trỏ đến cùng dữ liệu).
</div>

![H1](/assets/img/linux/link.png)

<div style="text-align: justify; text-indent: 2em;">
Tất cả các hệ thống tệp tin dựa trên thư mục phải có ít nhất một liên kết cứng (link counts từ 1 trở lên) cung cấp tên gốc cho mỗi tệp tin.
</div>

![H1](/assets/img/linux/hardlink.png)

## Quản lý tài khoản người dùng

### Tệp `/etc/passwd` trong Linux

Tệp `/etc/passwd` chứa **thông tin cơ bản về mỗi tài khoản người dùng** trên hệ thống.

- Mỗi dòng trong tệp đại diện cho **một người dùng**.
- Mỗi dòng bao gồm **7 trường**, được phân tách bằng dấu hai chấm `:`.

#### Cấu trúc 7 trường trong một dòng:

1. **username** – Tên đăng nhập của người dùng  
2. **password** – Thường là ký tự `x`, vì mật khẩu được lưu ở `/etc/shadow`  
3. **UID** – User ID (số định danh người dùng)  
4. **GID** – Group ID (nhóm chính của người dùng)  
5. **comment** – Thông tin mô tả (có thể là tên thật, ghi chú,...)  
6. **home_directory** – Đường dẫn đến thư mục cá nhân của người dùng  
7. **shell** – Shell mặc định mà người dùng sử dụng (ví dụ: `/bin/bash`)

#### Ví dụ:

```bash
john:x:1001:1001:John Doe:/home/john:/bin/bash
```

### Tệp `/etc/shadow` trong Linux

Tệp `/etc/shadow` chứa **thông tin về mật khẩu** của các tài khoản người dùng trên hệ thống.

- Đây là tệp **rất nhạy cảm**, chỉ **người dùng `root`** mới có quyền đọc.
- Được sử dụng để **lưu trữ mật khẩu đã mã hóa** và các thông tin liên quan đến chính sách mật khẩu (hết hạn, khóa tài khoản,...).

#### Cấu trúc một dòng trong `/etc/shadow`:

1. **username** – Tên đăng nhập người dùng  
2. **encrypted_password** – Mật khẩu đã mã hóa, hoặc ký hiệu đặc biệt:
   - `x`: dùng chung với `/etc/passwd`
   - `!`: tài khoản bị khóa
   - `*`: không thể đăng nhập bằng mật khẩu  
3. **last_changed** – Ngày cuối cùng thay đổi mật khẩu (tính theo số ngày kể từ 1/1/1970)  
4. **min_age** – Số ngày tối thiểu trước khi cho phép đổi mật khẩu tiếp theo  
5. **max_age** – Số ngày tối đa mật khẩu có hiệu lực  
6. **warn** – Số ngày trước khi hết hạn sẽ cảnh báo người dùng  
7. **inactive** – Số ngày sau khi mật khẩu hết hạn thì tài khoản bị vô hiệu hóa  
8. **expire** – Ngày tài khoản hết hạn (tính theo số ngày kể từ 1/1/1970)

#### Ví dụ:

```bash
john:$6$abcde...:19325:0:90:7:14:
```

### Nhóm người dùng (Linux Group)

Trong Linux, **Group (nhóm)** được dùng để **quản lý quyền truy cập** cho nhiều người dùng cùng lúc. Thay vì thiết lập quyền truy cập cho từng người dùng riêng lẻ, bạn có thể gán quyền cho một nhóm, rồi cho nhiều người dùng thuộc nhóm đó.

#### Các loại nhóm trong Linux

- **Primary group (nhóm chính):**
  - Là nhóm mặc định của người dùng.
  - Mỗi tệp được tạo bởi người dùng sẽ có nhóm sở hữu là nhóm chính.
  - Được chỉ định trong tệp `/etc/passwd`.

- **Secondary group (nhóm phụ):**
  - Là các nhóm bổ sung mà người dùng có thể thuộc vào.
  - Người dùng có thể là thành viên của nhiều nhóm phụ.
  - Được khai báo trong tệp `/etc/group`.

#### Cấu trúc của tệp `/etc/group`

Tệp `/etc/group` lưu thông tin về tất cả các nhóm trên hệ thống. Mỗi dòng có định dạng:

- **group_name** – Tên nhóm
- **password** – Thường để trống hoặc `x`
- **GID** – Group ID (mã số định danh nhóm)
- **user_list** – Danh sách người dùng trong nhóm (phân cách bằng dấu phẩy)

<div style="text-align: justify; text-indent: 2em;">

</div>

<div style="text-align: justify; text-indent: 2em;">

</div>

<div style="text-align: justify; text-indent: 2em;">

</div>

<div style="text-align: justify; text-indent: 2em;">

</div>

<div style="text-align: justify; text-indent: 2em;">

</div>

<div style="text-align: justify; text-indent: 2em;">

</div>

<div style="text-align: justify; text-indent: 2em;">

</div>

<div style="text-align: justify; text-indent: 2em;">

</div>

<div style="text-align: justify; text-indent: 2em;">

</div>

<div style="text-align: justify; text-indent: 2em;">

</div>

<div style="text-align: justify; text-indent: 2em;">

</div>