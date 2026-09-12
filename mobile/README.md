# VibeShelf Mobile WebView

โปรเจกต์ MIT App Inventor สำหรับเปิดเว็บไซต์ production ของ VibeShelf ภายใน `WebViewer1`

## การตั้งค่าตามใบงาน

- Screen1 Title: `VibeShelf E-book Shop`
- Sizing: `Responsive`
- WebViewer1 Width / Height: `Fill parent`
- FollowLinks: `true`
- IgnoreSslErrors: `false`
- UsesLocation: `false`
- UsesCamera: `false`
- UsesMicrophone: `false`
- ปุ่ม Back: หาก `WebViewer1.CanGoBack` เป็นจริง ให้เรียก `WebViewer1.GoBack` มิฉะนั้นจึงปิดแอป

## ก่อน Build APK

ต้องแทนที่ `https://YOUR-PROJECT.vercel.app` ใน `Screen1.scm` ด้วย Vercel production URL แล้วสร้างไฟล์ `.aia` ใหม่ จากนั้น Import เข้า MIT App Inventor เพื่อทดสอบด้วย AI Companion และ Build เป็น Android App (`.apk`)

ห้ามตั้ง `IgnoreSslErrors` เป็น `true` และห้ามใช้ `localhost` เป็น HomeUrl สำหรับไฟล์ส่งงาน
