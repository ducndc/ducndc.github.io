---
layout: post
title: "The Stack and The Heap"
date: 2025-08-11 10:00:00 +0700
categories: [Programming]
---

<div style="text-align: justify; text-indent: 2em;">
Nhiều ngôn ngữ lập trình không yêu cầu bạn phải suy nghĩ về ngăn xếp và vùng nhớ heap thường xuyên. Nhưng trong một ngôn ngữ lập trình hệ thống như Rust, việc một giá trị nằm trên ngăn xếp hay vùng nhớ heap sẽ ảnh hưởng đến cách ngôn ngữ hoạt động và lý do tại sao bạn phải đưa ra một số quyết định nhất định. Các phần về quyền sở hữu sẽ được mô tả liên quan đến ngăn xếp và vùng nhớ heap sau trong chương này, vì vậy đây là một lời giải thích ngắn gọn để chuẩn bị.

</div>

<div style="text-align: justify; text-indent: 2em;">
Cả ngăn xếp và vùng nhớ heap đều là các phần của bộ nhớ mà mã của bạn có thể sử dụng trong thời gian chạy, nhưng chúng được cấu trúc theo những cách khác nhau. Ngăn xếp lưu trữ các giá trị theo thứ tự nó nhận được và loại bỏ các giá trị theo thứ tự ngược lại. Điều này được gọi là vào sau, ra trước (LIFO). Hãy nghĩ về một chồng đĩa: khi bạn thêm đĩa, bạn đặt chúng lên trên cùng, và khi bạn cần một chiếc đĩa, bạn lấy một chiếc ra khỏi trên cùng. Thêm hoặc bớt đĩa từ giữa hoặc dưới cùng sẽ không hiệu quả! Việc thêm dữ liệu vào ngăn xếp được gọi là đẩy (push) vào ngăn xếp, và việc xóa dữ liệu khỏi ngăn xếp được gọi là lấy dữ liệu ra (popping) khỏi ngăn xếp. Tất cả dữ liệu được lưu trữ trên ngăn xếp phải có kích thước cố định, đã biết. Dữ liệu có kích thước không xác định tại thời điểm biên dịch hoặc kích thước có thể thay đổi phải được lưu trữ trên vùng nhớ heap.

</div>

<div style="text-align: justify; text-indent: 2em;">
Vùng nhớ heap ít được tổ chức hơn: khi bạn đưa dữ liệu vào vùng nhớ heap, bạn yêu cầu một lượng không gian nhất định. Bộ cấp phát bộ nhớ tìm một vị trí trống trong vùng nhớ heap đủ lớn, đánh dấu nó là đang được sử dụng và trả về một con trỏ, đó là địa chỉ của vị trí đó. Quá trình này được gọi là cấp phát trên vùng nhớ heap và đôi khi được viết tắt là chỉ cấp phát (đẩy giá trị vào ngăn xếp không được coi là cấp phát). Bởi vì con trỏ đến vùng nhớ heap có kích thước cố định, đã biết, bạn có thể lưu trữ con trỏ trên ngăn xếp, nhưng khi bạn muốn dữ liệu thực tế, bạn phải theo con trỏ. Hãy tưởng tượng bạn đang ngồi ở một nhà hàng. Khi vào, bạn cho biết số người trong nhóm của mình, và người phục vụ sẽ tìm một bàn trống đủ chỗ cho mọi người rồi dẫn bạn đến đó. Nếu có ai đó trong nhóm đến muộn, họ có thể hỏi bạn đã ngồi ở đâu để tìm bạn.
</div>

<div style="text-align: justify; text-indent: 2em;">
Việc đẩy dữ liệu vào ngăn xếp nhanh hơn so với việc cấp phát trên vùng nhớ heap vì bộ cấp phát không bao giờ phải tìm kiếm vị trí để lưu trữ dữ liệu mới; vị trí đó luôn nằm ở đỉnh của ngăn xếp. Ngược lại, việc cấp phát không gian trên vùng nhớ heap đòi hỏi nhiều công việc hơn vì bộ cấp phát phải tìm một không gian đủ lớn để chứa dữ liệu và sau đó thực hiện các thao tác quản lý để chuẩn bị cho lần cấp phát tiếp theo.

</div>

<div style="text-align: justify; text-indent: 2em;">
Truy cập dữ liệu trong vùng nhớ heap thường chậm hơn so với truy cập dữ liệu trên ngăn xếp vì bạn phải theo một con trỏ để đến đó. Các bộ xử lý hiện đại sẽ nhanh hơn nếu chúng ít phải di chuyển trong bộ nhớ. Tiếp tục với ví dụ tương tự, hãy xem xét một người phục vụ tại nhà hàng đang nhận đơn đặt hàng từ nhiều bàn. Cách hiệu quả nhất là nhận tất cả các đơn đặt hàng từ một bàn trước khi chuyển sang bàn tiếp theo. Việc lấy đơn hàng từ bàn A, sau đó từ bàn B, rồi lại từ A, và cuối cùng lại từ B sẽ là một quá trình chậm hơn nhiều. Tương tự, bộ xử lý thường hoạt động tốt hơn nếu nó xử lý dữ liệu gần với các dữ liệu khác (như trên ngăn xếp) hơn là ở xa (như trên vùng nhớ heap).

</div>

<div style="text-align: justify; text-indent: 2em;">
Khi mã của bạn gọi một hàm, các giá trị được truyền vào hàm (bao gồm cả con trỏ đến dữ liệu trên vùng nhớ heap) và các biến cục bộ của hàm sẽ được đẩy vào ngăn xếp. Khi hàm kết thúc, các giá trị đó sẽ được lấy ra khỏi ngăn xếp.

</div>

<div style="text-align: justify; text-indent: 2em;">
Việc theo dõi xem phần nào của mã đang sử dụng dữ liệu nào trên vùng nhớ heap, giảm thiểu lượng dữ liệu trùng lặp trên vùng nhớ heap và dọn dẹp dữ liệu không sử dụng trên vùng nhớ heap để tránh hết dung lượng đều là những vấn đề mà quyền sở hữu giải quyết. Một khi bạn hiểu về quyền sở hữu, bạn sẽ không cần phải nghĩ về ngăn xếp và vùng nhớ heap thường xuyên nữa, nhưng việc biết rằng mục đích chính của quyền sở hữu là quản lý dữ liệu vùng nhớ heap có thể giúp giải thích tại sao nó hoạt động theo cách đó.
</div>