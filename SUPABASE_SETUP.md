# ตั้งค่า Supabase สำหรับ VibeShelf

ชุดไฟล์นี้เตรียมการเชื่อมต่อโดยไม่เก็บ Secret ไว้ในหน้าเว็บ

## 1. สร้างฐานข้อมูล

1. เปิด Supabase Dashboard ของโปรเจกต์ `vibeshelf-ebook-shop`
2. ไปที่ **SQL Editor** แล้วเลือก **New query**
3. เปิดไฟล์ `supabase/setup.sql` ในโฟลเดอร์งาน
4. คัดลอก SQL ทั้งหมดไปวาง แล้วกด **Run**
5. ตรวจใน **Table Editor** ว่ามีตาราง `books` และ `orders`
6. ตรวจใน **Storage** ว่ามี bucket ชื่อ `ebooks` และเป็น Private

## 2. ใส่ค่าที่หน้าเว็บใช้ได้

1. ใน Supabase กด **Connect**
2. คัดลอก **Project URL**
3. คัดลอก **Publishable key** ที่ขึ้นต้นด้วย `sb_publishable_`
4. เปิด `site/dist/supabase-config.js`
5. ใส่สองค่านี้ใน `projectUrl` และ `publishableKey`

ตัวอย่าง:

```js
window.VIBESHELF_SUPABASE_CONFIG = Object.freeze({
  projectUrl: "https://PROJECT_REF.supabase.co",
  publishableKey: "sb_publishable_REPLACE_ME",
});
```

ห้ามใส่ Database password, `sb_secret_...` หรือ `service_role` ลงไฟล์นี้

## 3. ตรวจการเชื่อมต่อ

เปิดเว็บไซต์ผ่าน Local Server แล้วเปิด Browser Console จากนั้นใช้:

```js
await VibeShelfDB.healthCheck()
```

ผลที่ถูกต้องคือ `{ connected: true, readableBooks: true }`

## 4. งานที่ยังต้องทำต่อ

- เชื่อมการสร้างและติดตามคำสั่งซื้อผ่าน Edge Function
- อัปโหลด PDF ทั้ง 3 เล่มเข้า Private bucket `ebooks`
- สร้าง Signed URL หลังสถานะ `PAID`
- เชื่อมบริการส่งอีเมลจาก Edge Function

ตาราง `orders` ไม่มีสิทธิ์อ่านหรือเขียนจาก Browser โดยตรง เพื่อป้องกันชื่อและอีเมลลูกค้า

