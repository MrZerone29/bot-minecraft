# KingMC AFK Bot

Bot tự động AFK cho server Minecraft KingMC (`kingmc.vn`), tự đăng nhập, mở menu và đứng yên tại AFK zone.

---

## Yêu cầu

- [Node.js](https://nodejs.org/) v18 trở lên
- npm (đi kèm Node.js)

---

## Cài đặt

**Cách 1: Clone bằng Git**
```bash
git clone https://github.com/MrZerone29/bot-minecraft.git
cd bot-minecraft
```

**Cách 2: Tải file ZIP**
1. Tải ZIP tại đây: [bot-minecraft.zip](https://github.com/MrZerone29/bot-minecraft/archive/refs/heads/main.zip)
2. Giải nén file vừa tải
3. Mở terminal, `cd` vào thư mục vừa giải nén

```bash
# Sau khi clone hoặc giải nén xong, cài dependencies
npm install
```

---

## Cấu hình

Mở file `index.js`, sửa 2 dòng đầu:

```js
const username = 'acc'   // ← Tên tài khoản
const password = 'pass'  // ← Mật khẩu
```

---

## Chạy bot

```bash
npm start
```

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

| Tình huống | Hành động |
|---|---|
| Mất kết nối thông thường | Reconnect sau **10 giây** |
| Bị kick do đã kết nối / lỗi nội bộ | Reconnect sau **5 phút** |
| Mở menu thất bại quá **5 lần** | **Dừng bot** |
| Bị kick quá **5 lần** | **Dừng bot** |

---

## Cấu trúc project

```
kingmc-afk-bot/
├── index.js        # Code chính của bot
├── package.json    # Cấu hình npm
└── README.md       # Hướng dẫn này
```

---

## Dependencies

| Package | Chức năng |
|---|---|
| `mineflayer` | Thư viện tạo Minecraft bot |
| `mineflayer-gui` | Plugin tương tác với GUI trong game |
