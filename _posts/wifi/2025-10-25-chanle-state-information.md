---
layout: post
title: "CSI Sensing"
date: 2025-10-24 10:00:00 +0700
categories: [WiFi]
math: true
tags: [csi, mimo, sensing, wifi]
description: "Channel State Information (CSI) concepts, math and applications."
toc: true
pin: true
---

## Channel State Information (CSI)
{: #channel-state-information-csi}

Trong truyền thông không dây, thông tin trạng thái kênh (CSI) là các thuộc tính kênh đã biết của một liên kết truyền thông. Thông tin này mô tả cách tín hiệu lan truyền từ bộ phát đến bộ thu và thể hiện hiệu ứng tổng hợp của, ví dụ, tán xạ, suy giảm tín hiệu và suy hao công suất theo khoảng cách. Phương pháp này được gọi là ước lượng kênh. CSI cho phép điều chỉnh việc truyền tín hiệu phù hợp với điều kiện kênh hiện tại, điều này rất quan trọng để đạt được khả năng truyền thông đáng tin cậy với tốc độ dữ liệu cao trong các hệ thống đa anten.

CSI cung cấp thông tin chi tiết hơn về các kênh không dây, bao gồm biên độ, pha và đáp ứng tần số. Ngược lại, RSSI chỉ cung cấp phép đo tổng quát về cường độ tín hiệu.

### Mô tả toán học
{: #m-t-to-n-h-c}

Trong kênh suy hao phẳng băng hẹp với nhiều anten phát và thu (MIMO), hệ thống được mô hình hóa như sau:

<div style="text-align: center;">
\( \mathbf{y} = \mathbf{H}\mathbf{x} + \mathbf{n} \)

where:

<ul style="text-align: justify;">
  <li>\( \mathbf{y} \in \mathbb{C}^{N_r \times 1} \) là vectơ tín hiệu nhận được.</li>
  <li>\( \mathbf{x} \in \mathbb{C}^{N_t \times 1} \) là vectơ tín hiệu được truyền đi.</li>
  <li>\( \mathbf{H} \in \mathbb{C}^{N_r \times N_t} \) là ma trận kênh, có phần tử là \( h_{i,j} \) biểu thị độ lợi kênh phức tạp từ anten phát. \( j \) để nhận ăng-ten \( i \).</li>
  <li>\( \mathbf{n} \in \mathbb{C}^{N_r \times 1} \) là vectơ nhiễu Gauss trắng cộng tính (AWGN), với \( \mathbf{n} \sim \mathcal{CN}(0, N_0 \mathbf{I}) \).</li>
</ul>

Mỗi yếu tố \( h_{i,j} \) của ma trận kênh chứa cả sự suy giảm biên độ và sự dịch chuyển pha mà tín hiệu trải qua. Nó có thể được biểu diễn như sau:

<div style="text-align: center;">
\( h_{i,j} = |h_{i,j}| e^{j\phi_{i,j}} \)

trong đó \( |h_{i,j}| \) là biên độ kênh và \( \phi_{i,j} \) là pha kênh. Tập hợp các hệ số phức này trên tất cả các anten và sóng mang phụ (trong hệ thống OFDM) tạo thành Thông tin Trạng thái Kênh (CSI).

Trong các hệ thống Wi-Fi thực tế như IEEE 802.11n/ac/ax, thông tin trạng thái kênh (CSI) được ước tính bằng cách sử dụng các ký hiệu thí điểm (huấn luyện) được chèn vào các sóng mang phụ OFDM. Các giá trị CSI này cho phép áp dụng các kỹ thuật tiên tiến như tạo chùm tia, cân bằng kênh và các ứng dụng cảm biến không cần thiết bị.

## Đặc điểm của các kênh truyền không dây
{: #c-i-m-c-a-c-c-k-nh-truy-n-kh-ng-d-y}

Các đặc điểm chính của kênh truyền không dây bao gồm:






## Mối quan hệ giữa CSI và đặc tính kênh truyền không dây
{: #m-i-quan-h-gi-a-csi-v-c-t-nh-k-nh-truy-n-kh-ng-d-y}

Thông tin trạng thái kênh (CSI) cung cấp thông tin chi tiết về kênh, giúp hiểu và tận dụng các đặc điểm khác nhau của kênh không dây để tối ưu hóa hiệu suất và độ tin cậy của hệ thống truyền thông không dây. Một số ứng dụng quan trọng trong truyền thông không dây, đặc biệt là liên quan đến hiệu ứng đa đường và Thông tin trạng thái kênh (CSI), bao gồm:

### 1.Tạo chùm tia đa đường
{: #1-t-o-ch-m-tia-a-ng}

Tạo chùm tia đa đường là một kỹ thuật sử dụng hiệu ứng đa đường để tăng cường hoặc triệt tiêu tín hiệu theo các hướng cụ thể. Tạo chùm tia đa đường có thể được áp dụng theo các cách sau:

- **Theo dõi chùm tia:** Sử dụng thông tin CSI để theo dõi sự thay đổi trong các kênh truyền dẫn đa đường nhằm tối ưu hóa hình dạng chùm tia và tối đa hóa cường độ tín hiệu nhận được.
- **Khử nhiễu:** Đo lường và phân tích chính xác thông tin CSI của các kênh đa đường cho phép khử nhiễu trong không gian, cải thiện tỷ lệ tín hiệu trên nhiễu (SIR) và dung lượng hệ thống.

### 2. Định vị và Theo dõi
{: #2-nh-v-v-theo-d-i}

Hiệu ứng đa đường truyền rất quan trọng đối với việc định vị chính xác và theo dõi thiết bị di động. Thông tin trạng thái kênh (CSI) có thể được áp dụng trong định vị và theo dõi như sau:

- **Hình ảnh đa đường truyền:** Phân tích dữ liệu CSI để xây dựng hình ảnh đa đường truyền xung quanh các đối tượng, cho phép ước tính vị trí với độ phân giải cao.

- **Ước tính hướng:** Sử dụng hiệu ứng đa đường truyền để ước tính chính xác hướng và hướng của thiết bị di động, cải thiện độ chính xác của hệ thống định vị.

### 3. Hệ thống MIMO đa người dùng
{: #3-h-th-ng-mimo-a-ng-i-d-ng}

Trong hệ thống MIMO đa người dùng, việc kết hợp CSI với hiệu ứng đa đường truyền có các ứng dụng sau:

- **Đa dạng người dùng:** Sử dụng CSI của sự lan truyền đa đường truyền để nhận luồng dữ liệu của người dùng trên các đường truyền khác nhau, cải thiện hiệu suất phổ và dung lượng của hệ thống.

- **Lập lịch đa người dùng không gian:** Sử dụng thông tin CSI của các kênh đa đường truyền để đạt được lập lịch đa người dùng không gian, tối đa hóa thông lượng và sử dụng tài nguyên của hệ thống.

### 4. Truy cập phổ động và cảm biến phổ
{: #4-truy-c-p-ph-ng-v-c-m-bi-n-ph}

Các hiệu ứng đa đường và thông tin trạng thái kênh (CSI) cũng được áp dụng trong truy cập phổ động (DSA) và cảm biến phổ:

- **Tối ưu hóa sử dụng phổ:** Phân tích CSI của các kênh đa đường để đánh giá chính xác và tối ưu hóa việc sử dụng tài nguyên phổ, bao gồm cả việc đạt được truy cập phổ động trong các vùng phổ trống.

- **Phát hiện nhiễu phổ:** Sử dụng các hiệu ứng đa đường và thông tin CSI để nhanh chóng phát hiện và định vị các nguồn nhiễu phổ, tăng cường khả năng chống nhiễu của hệ thống.

### 5. Truyền thông di động tốc độ cao
{: #5-truy-n-th-ng-di-ng-t-c-cao}

Trong môi trường truyền thông di động tốc độ cao, các ứng dụng của hiệu ứng đa đường truyền và thông tin trạng thái kênh (CSI) bao gồm:

- **Mô hình hóa kênh di động:** Phân tích hiệu ứng đa đường truyền và CSI để thiết lập các mô hình kênh di động chính xác, hỗ trợ truyền thông di động tốc độ cao.

- **Theo dõi người dùng di động:** Sử dụng hiệu ứng đa đường truyền và thông tin CSI để theo dõi và định vị nhanh chóng người dùng di động tốc độ cao, cải thiện tính ổn định và độ tin cậy của hệ thống truyền thông.

Bản dịch này nắm bắt các chi tiết thiết yếu và ứng dụng của các nguyên tắc cơ bản về kênh không dây và mối quan hệ của chúng với CSI trong việc tối ưu hóa hệ thống truyền thông không dây.

## Cảm biến CSI
{: #c-m-bi-n-csi}

## Conclusion
{: #conclusion}

CSI provides rich per-subcarrier channel information useful for beamforming, localization, and advanced sensing applications in Wi‑Fi systems.

Cảm biến CSI là một công nghệ sử dụng thông tin trạng thái kênh (CSI) trong tín hiệu Wi-Fi để phát hiện các hoạt động của con người (như đi bộ và thở) và trạng thái, vị trí và chuyển động của các vật thể trong môi trường.


## Cảm biến CSI hoạt động như thế nào?
{: #c-m-bi-n-csi-ho-t-ng-nh-th-n-o}

Cảm biến CSI hoạt động dựa trên hiệu ứng đa đường truyền của sự lan truyền tín hiệu vô tuyến và sự thay đổi của CSI.


Do đặc tính lan truyền của tín hiệu vô tuyến, tín hiệu sóng điện từ được phát ra từ anten phát có thể đến anten thu thông qua đường truyền trực tiếp hoặc bằng cách phản xạ từ môi trường xung quanh (như tường, cơ thể người và đồ nội thất). Cuối cùng, tín hiệu sóng điện từ đến anten thu là sự chồng chất của các tín hiệu đường truyền trực tiếp và nhiều tín hiệu đường truyền phản xạ. Hiện tượng này được gọi là hiệu ứng đa đường truyền của sự lan truyền tín hiệu vô tuyến.


![H1](/assets/img/wifi/CSI1.png)

Những thay đổi trong môi trường có thể dẫn đến những thay đổi trong đường phản xạ cũng như dữ liệu CSI. CSI là một khái niệm quan trọng trong truyền thông không dây. Nó cung cấp dữ liệu chi tiết về quá trình truyền tín hiệu từ đầu đến cuối. Dữ liệu CSI, bao gồm suy giảm biên độ và độ lệch pha trong quá trình lan truyền, được mang trong các sóng mang phụ, được hình thành bằng cách chia kênh bằng công nghệ Wi-Fi OFDM. Khi không có vật thể nào di chuyển trong môi trường, đường đi của tín hiệu đa đường tương đối ổn định và chỉ có những thay đổi nhỏ đối với dữ liệu CSI. Khi một người hoặc vật thể di chuyển trong không gian, đường phản xạ tín hiệu sẽ thay đổi (ví dụ: một đường bị chặn hoặc một đường phản xạ được thêm vào). Kết quả là, biên độ và pha của tín hiệu đa đường thay đổi sau khi được chồng chất, gây ra sự dao động trong dữ liệu CSI.

Bằng cách thu thập và phân tích mô hình biến đổi của dữ liệu CSI, công nghệ cảm biến CSI có thể phát hiện sự hiện diện của con người, nhận diện hành vi và thậm chí đo lường những dao động nhỏ do nhịp thở và nhịp tim. Ví dụ, khi một người đang ngủ, chuyển động duy nhất là những thay đổi đều đặn ở vị trí ngực do thở. Bằng cách trích xuất những thay đổi đều đặn của CSI, chuyển động của ngực có thể được phát hiện, giúp xác định xem có người hiện diện hay không.


Tùy thuộc vào mối quan hệ vị trí giữa bộ phát và bộ thu, cảm biến CSI có thể được phân loại là cảm biến hai chiều hoặc cảm biến một chiều.


Cảm biến hai chiều: Hai thiết bị tham gia vào quá trình cảm biến — một thiết bị phát tín hiệu Wi-Fi và một thiết bị nhận tín hiệu Wi-Fi.

Cảm biến đơn tĩnh: Cùng một thiết bị được sử dụng để nhận và phát tín hiệu Wi-Fi. Ví dụ, chức năng cảm biến CSI do AP của Huawei cung cấp sử dụng thiết kế đồng bộ thuật toán ăng-ten một cách sáng tạo để giảm thiểu các yếu tố không lý tưởng và nhiễu tự thân mạnh giữa bộ phát và bộ thu. Một AP duy nhất có thể cảm nhận chuyển động ở mức centimet trong môi trường bằng khả năng giống như sonar, mà không cần đến các thiết bị khác. Điều này giúp giảm đáng kể chi phí triển khai và bảo trì.

![H1](/assets/img/wifi/CSI2.png)

## References
{: #references}

[1] https://en.wikipedia.org/wiki/Channel_state_information

[2] https://info.support.huawei.com/info-finder/encyclopedia/en/CSI+Sensing.html