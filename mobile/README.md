# VibeShelf Mobile WebView

โปรเจกต์ MIT App Inventor สำหรับเปิดเว็บไซต์ Production ของ VibeShelf ภายใน `WebViewer1`

- Production URL: https://vibeshelf-ebook-shop.vercel.app
- Project file: `VibeShelfWebView.aia`

## การตั้งค่าตามใบงาน

- Screen1 Title: `VibeShelf E-book Shop`
- Sizing: `Responsive`
- WebViewer1 Width / Height: `Fill parent`
- HomeUrl: `https://vibeshelf-ebook-shop.vercel.app`
- FollowLinks: `true`
- IgnoreSslErrors: `false`
- PromptforPermission: `true`
- UsesLocation: `false`
- UsesCamera: `false`
- UsesMicrophone: `false`

## การทดสอบและ Build

Import ไฟล์ `VibeShelfWebView.aia` เข้า MIT App Inventor แล้วทดสอบผ่าน AI Companion หรือ Build เป็น Android App (`.apk`)

เว็บไซต์ Production ใช้ HTTPS และไม่ใช้ `localhost` เป็น HomeUrl

หมายเหตุ: AI Companion บน iOS อาจไม่รองรับบางเมธอดของ WebViewer หรือปุ่ม Back เท่ากับ Android แต่สามารถเปิดเว็บไซต์ Production ผ่าน Safari ได้ตามปกติ
