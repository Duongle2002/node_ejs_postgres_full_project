# Admin account (tạo tự động)

Để tự động tạo tài khoản admin khi app khởi động trên Render, đặt các ENV sau trong Web Service:

- `ADMIN_EMAIL` ví dụ: `admin@example.com`
- `ADMIN_PASSWORD` mật khẩu mạnh (sẽ được hash với bcrypt)
- `ADMIN_NAME` (tùy chọn, mặc định `Admin`)

File migration `migrations/ensure_admin_user.js` sẽ:
1. Kiểm tra email có tồn tại.
2. Nếu chưa có: hash mật khẩu rồi chèn user với role `admin`.
3. Nếu đã có: cập nhật role thành `admin` (đảm bảo quyền).

Muốn đổi mật khẩu admin sau này: sửa ENV `ADMIN_PASSWORD` rồi deploy lại – lần sau khởi động sẽ không đổi (vì user đã tồn tại). Để cưỡng bức đổi mật khẩu, xóa user đó trực tiếp bằng SQL hoặc tạm thời đổi email.

SQL thủ công (nếu cần chạy trong psql dashboard Render):

```sql
-- Tạo mật khẩu bcrypt tạm bằng Node (xem hướng dẫn bên dưới), sau đó:
INSERT INTO users (name,email,password,role) VALUES ('Admin','admin@example.com','$2b$10$HASH_HERE','admin');
```

Tạo hash nhanh bằng Node REPL local:
```bash
node -e "require('bcryptjs').hash(process.argv[1],10).then(h=>console.log(h))" 'YourStrongPass123!'
```

Sau đó lấy output (bắt đầu bằng `$2b$10$...`) đưa vào câu lệnh INSERT.

