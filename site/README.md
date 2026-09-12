# VibeShelf E-book Shop

เว็บไซต์ร้าน E-book แบบสาธิตตามใบงาน Vibe Coding: E-book Shop

## ขอบเขตที่ทำงานได้

- หน้าร้าน E-book 3 รายการจาก Tarot App, Task Manager PRO และ Media Player PRO
- หน้ารายละเอียดหนังสือและ Checkout
- สร้างเลขคำสั่งซื้อและเก็บสถานะ `PENDING` ใน Browser Local Storage
- Mock Payment พร้อมป้าย `DEMO ONLY` และเปลี่ยนเป็น `PAID`
- จำลองผลการส่งอีเมลและลิงก์ดาวน์โหลดอายุ 15 นาที
- ติดตามคำสั่งซื้อด้วยเลขคำสั่งซื้อและอีเมลที่ต้องตรงกัน
- Responsive สำหรับ Desktop, Tablet และ Mobile

## วิธีเปิดในเครื่อง

ให้เปิด HTTP server ที่โฟลเดอร์ `dist` แล้วเข้า `index.html` ผ่าน URL ของ server ห้ามเปิดด้วย `file://` เพราะเบราว์เซอร์บางตัวจะจำกัด Local Storage และการดาวน์โหลด

## ข้อจำกัดของเวอร์ชันสาธิต

ข้อมูลคำสั่งซื้อเก็บอยู่ใน Browser Local Storage ของอุปกรณ์ที่ใช้งาน ไม่มี Payment Gateway จริง ไม่มีการส่งอีเมลจริง และลิงก์ชั่วคราวเป็นการจำลองฝั่งผู้ใช้ การนำไปใช้รับเงินจริงต้องย้ายข้อมูลไปเก็บฝั่ง server และใช้ private object storage

## Deploy

โฟลเดอร์ `dist` เป็น Static Site พร้อม Deploy ไปยัง Vercel ได้โดยตรง
