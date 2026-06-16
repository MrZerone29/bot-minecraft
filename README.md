# KingMC AFK Bot

Bot tự động AFK cho server Minecraft KingMC (`kingmc.vn`), tự đăng nhập, mở menu và đứng yên tại AFK zone.

---

## Yêu cầu

- [Node.js](https://nodejs.org/) v18 trở lên
- npm (đi kèm Node.js)

---

## Cài đặt

**Cách 1: Clone bằng Git**

```
git clone https://github.com/MrZerone29/bot-minecraft.git
cd bot-minecraft
```

**Cách 2: Tải file ZIP**

1. Tải ZIP tại đây: [bot-minecraft.zip](https://github.com/MrZerone29/bot-minecraft/archive/refs/heads/main.zip)
2. Giải nén file vừa tải
3. Mở terminal, `cd` vào thư mục vừa giải nén

```
# Sau khi clone hoặc giải nén xong, cài dependencies
npm install
```

---

## Cấu hình

Mở file `bot.js`, sửa 2 dòng đầu:

```
const username = 'acc'   // ← Tên tài khoản
const password = 'pass'  // ← Mật khẩu
```

---

## Chạy bot

**Cách 1: Dùng lệnh npm**

```
npm start
```

**Cách 2: Dùng Node trực tiếp**

```
node index.js
```

**Cách 3: Chạy bằng file `start.bat` (Windows)**

1. Tạo file `start.bat` trong thư mục bot với nội dung sau:

```bat
@echo off
echo Dang cai dat dependencies...
npm install
echo.
echo Dang khoi dong KingMC AFK Bot...
npm start
pause
```

2. Nhấp đôi vào `start.bat` để tự động cài module rồi chạy bot, không cần mở terminal thủ công.

> **Lưu ý:** Lệnh `pause` giữ cửa sổ lại sau khi bot dừng để bạn có thể xem log lỗi nếu có.

---

## Cách hoạt động

1. Bot kết nối vào `kingmc.vn:25565`
2. Sau khi spawn, tự gửi lệnh `/dn <password>` để đăng nhập
3. Sau khi xác nhận đăng nhập thành công, đợi 3 giây rồi mở Clock menu
4. Click vào slot KingSMP (slot 24)
5. Đợi 5 giây rồi gửi `/warp afk` để vào AFK zone
6. Bot đứng yên tại đó

---

## Tự động reconnect

| Tình huống                          | Hành động                 |
| ----------------------------------- | ------------------------- |
| Mất kết nối thông thường            | Reconnect sau **10 giây** |
| Bị kick do đã kết nối / lỗi nội bộ | Reconnect sau **5 phút**  |
| Mở menu thất bại quá **5 lần**      | **Dừng bot**              |
| Bị kick quá **5 lần**               | **Dừng bot**              |

---

## Cấu trúc project

```
kingmc-afk-bot/
├── bot.js          # Code chính của bot
├── package.json    # Cấu hình npm
├── start.bat       # File chạy nhanh trên Windows
└── README.md       # Hướng dẫn này
```

---

## Dependencies

| Package          | Chức năng                           |
| ---------------- | ----------------------------------- |
| `mineflayer`     | Thư viện tạo Minecraft bot          |
| `mineflayer-gui` | Plugin tương tác với GUI trong game |

---

## 🚧 Tính năng đang phát triển

Chức năng **sử dụng Proxy** hiện đang trong quá trình phát triển và chưa ổn định. Tính năng này có thể gây lỗi hoặc hoạt động không như mong đợi. Vui lòng chờ các bản cập nhật tiếp theo.

---

## ❤️ Donate

Nếu bot hữu ích với bạn, hãy ủng hộ mình trong **KingSMP** bằng lệnh:

```
/pay Mr_Zerone <số tiền>
```

Cảm ơn bạn rất nhiều! 💙
