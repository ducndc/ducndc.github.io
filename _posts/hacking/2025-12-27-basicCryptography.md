---
layout: post
title: "Mật Mã Cơ Bản"
date: 2025-11-16 10:00:00 +0700
categories: [Hacking]
---

<div style="text-align: justify; text-indent: 2em;">
Mật mã là một ứng dụng khoa học kỹ thuật quan trọng trong quá tình trao đổi thông tin trên hạ tầng kĩ thuật số. Trong tài liệu này sẽ phân tích các thành phần trong việc ứng dụng mật mã, giúp làm rõ vai trò, nhiệm vụ và cách thức hoạt động trong hạ tầng thông tin số.
</div>

## Mã Hóa Khóa Bí Mật (Private Key Encryption)

<div style="text-align: justify; text-indent: 2em;">
Mã hóa khóa bí mật là khóa được lưu trữ phía gửi và phía nhận, được sử dụng ở phía gửi cho việc mã hóa thông tin và ở phía nhận cho việc giải mã thông tin.k
</div>

<div style="text-align: justify; text-indent: 2em;">
Mã hóa khóa bí mật thường được chia làm 2 phương pháp là mã hóa dòng (Stream Ciphers) và mã hóa khối (Block Ciphers).
</div>

### Stream Ciphers

<div style="text-align: justify; text-indent: 2em;">
Làm việc trên một bit đơn lẻ tại một thời điểm, một trong những thuật toán được biết đến rộng rãi là RC4 (Rivest Cipher 4)
</div>

### Block Ciphers

<div style="text-align: justify; text-indent: 2em;">
Làm việc trên những nhóm bit có độ dài cố định, những khối có độ dài như 64, 128, 256 bits. Những thuật toán mã hóa khối được biết đến rộng rãi như DES (Dât Encryption Standard), Triple DES, IDEA (International Dât Encryption Algorithm), RC5 (Rivest Cipher 5), AES (Advanced Encryption Standard), Blowfish, ..
</div>

<div style="text-align: justify; text-indent: 2em;">
Một trong những vấn đề  lớn nhất của mã hóa khóa bí mật là phải tìm cách lấy được khóa từ phía chia sẻ dữ liệu, việc chia sẻ khóa này sẽ gây rủi ro lớn cho vấn đề bảo mật và giải pháp đưa ra là sử dụng mã hóa công khai.
</div>

## Mã Hóa Khóa Công Khai (Public Key Encryption)

<div style="text-align: justify; text-indent: 2em;">
Trong mã khóa khóa công khai, sẽ dùng 2 khóa khác nhau cho việc mã hóa và giải mã dữ liệu và giữa 2 khóa này có mối liên hệ toán học với nhau. Hai khóa này là một cặp gồm khóa công khai và khóa bí mật.
</div>

<div style="text-align: justify; text-indent: 2em;">
Khóa công khai có thể chia sẻ cho bất kỳ ai trong khi khóa bí mật chỉ duy nhất người tạo ra hai khóa này nắm giữ. Do đó, việc phía gửi sẽ sử dụng khóa công khai để mã hóa dữ liệu và phía nhận sẽ sử dụng khóa bí mật để giải mã dữ liệu nhận từ phía gửi.
</div>

Ví dụ: Các bước trong truyền nhận dữ liệu với mã hóa khóa công khai 

Kịch bản: An cần gửi cho Hoa một bản tin

1. Hoa tạo ra một cặp khóa công khai và khóa bí mật
2. Hoa đẩy khóa công khai này lên máy chủ chia sẻ khóa công khai, bất kỳ ai cũng có thể lấy khóa này và báo cho An lấy khóa công khai này
3. An lấy khóa công khai của Hoa
4. An lấy dữ liệu muốn gửi cho Hoa và mã hóa nó với khóa công khai của Hoa
5. An gửi dữ liệu đã được mã hóa cho Hoa
6. Hoa dùng khóa bí mật để giải mã dữ liệu nhận từ An

<div style="text-align: justify; text-indent: 2em;">
Dù khóa bí mật của Hoa có thể khiến không một ai có thể đọc và thay đổi dữ liệu trong quá trình gửi đến cho Hoa nhưng nó không thể xác minh người gửi dữ liệu đến cho Hoa là ai, có thể là An nhưng cũng có thể là bất kỳ ai sử dụng khóa công khai của Hoa. Để chứng minh người gửi là ai, ta cần một công nghệ khác được biết đến với tên gọi chữ ký số.
</div>

## Hàm Một Chiều và Hàm Cửa Sập trong Mật Mã Học Hiện Đại

### Hàm Một Chiều 

<div style="text-align: justify; text-indent: 2em;">
Ta lấy một ví dụ khi trộn 4 loại quả khác nhau và xay chúng thành một hỗn hợp nước sinh tố thơm ngon, việc này thật dễ dàng để thực hiện nhưng ở chiều ngược lại việc lấy cốc sinh tố  nào đó và phân biệt có những loại quả nào trong đó thì sẽ khó hơn rất nhiều. Vậy thực tế hàm một chiều là hàm với x dễ dàng tính toán được f(x) nhưng rất khó để từ f(x) ta tìm được x.
</div>

### Hàm Cửa Sập 

<div style="text-align: justify; text-indent: 2em;">
Hàm cửa sập là một trường hợp đặc biệt của hàm một chiều, với một thông tin cửa sập (t) được cho ta có thể dễ dàng tìm ngược lại giá trij của x. Hàm cửa sập được sử dụng rộng rãi trong mã hóa khóa công khai. Mọi người có thể mã hóa với khóa công khai nhưng chỉ duy nhất một người nắm khóa bí mật có thể giải mã. Hệ thống mã hóa RSA và chữ ký số sử dụng chức năng cửa sập.
</div>

## Thuật Toán Băm (Hash Algorithm)

<div style="text-align: justify; text-indent: 2em;">
Thuật toán băm (SHA-256, ....) được sử dụng chủ yếu chi mục đích so sánh chứ không cho mã hóa. Những thuật toán băm được biết tới với 3 đặc điểm chính:
</div>

1. Khó dịch ngược 
2. Cố định kích thước (128, 256 bits), nghĩa là đầu ra thường có kích thước cố định dù đầu vào có 1 hay nhiều ký tự 
3. Duy nhất, hai dữ liệu khác nhau không thể có đầu ra giống nhau

<div style="text-align: justify; text-indent: 2em;">
Được sử dụng rộng rãi cho mật khẩu. Hãy nhớ lấy điều này, mọi mật khẩu nên lưu trữ dưới dạng đầu ra của một thuật toán băm và mọi mật khẩu không nên bao giờ được lưu dưới dạng gốc trong bất kỳ cơ sở dữ liệu nào. Khi bạn đăng nhập với mật khẩu, nó được băm ra và so sánh với phần băm được lưu trữ trong cơ sở dữ liệu, đó là lý do nó dùng cho mục đích so sánh thay vì mã hóa. Một điều kỳ lạ, vậy tại sao vẫn có thể trộm mật khẩu của bạn?
</div>

## Một Số Cách Lấy Mật Khẩu Đã Được Băm

<div style="text-align: justify; text-indent: 2em;">
Trường hợp bạn để mật khẩu đơn giản, một số ứng dụng giúp kiểm tra các chuỗi ký tự và so sánh chúng với chuỗi băm để cho ra kết quả là mật khẩu được băm. Vì vậy, hãy đặt mật khẩu phức tạp hơn, có đầy đủ ký tự chữ số, viết hóa và ký tự đặc biệt, điều này sẽ giúp mật khẩu của bạn khó bị đánh cắp một cách dễ dàng.
</div>

## Tấn Công Từ Điển và Tấn Công Vét Cạn 

## Tấn Công Từ Điển
<div style="text-align: justify; text-indent: 2em;">
Việc tấn công từ điển là việc sử một danh sách các mật khẩu phổ biến.
</div>

Bước 1: Từ một từ điển, tạo ra các chuỗi băm tương ứng, với hàng nghìn chuỗi như vậy, và đưa vào bảng để tìm kiếm ngược lại các chuỗi này

Bước 2: So sánh các chuỗi băm trong bảng với chuỗi băm cần tấn công, nếu tìm được chuỗi giống nhau ta lấy được chuỗi mật khẩu 

## Tấn Công Vét Cạn

<div style="text-align: justify; text-indent: 2em;">
Sử dụng vòng lặp mỗi ký tự được thử tự động, có thể là từ, ký tự, số, hoặc bất cứ thứ gì. Phương pháp này hiệu quả với các mật khẩu ngắn. Trong tương lai, nếu việc tính toán đủ nhanh (lượng tử) thì mọi mật khẩu với cơ chế hiện tại đều dễ dàng bị tấn công bới phương pháp vét cạn này.
</div>

<div style="text-align: justify; text-indent: 2em;">
Kẻ tấn công thường sử dụng kết hợp hai phuong pháp này, và để bảo vệ tốt hơn cho mật khẩu của bạn sẽ có 3 điều cần chú ý:
</div>

1. Mật khẩu mạnh: ít nhất 12 ký tự, trong đó sử dụng cả chữ cái hoa, thường, số, ký tự đặc biệt
2. Mật khẩu duy nhất: bạn sẽ có nhiều mật khẩu cho mỗi tài khoản khác nhau, mỗi mật khẩu này cần khác biệt với nhau
3. Mật khẩu luôn đổi: thay đổi mật khẩu ít nhất sau 3 tháng 