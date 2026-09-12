from __future__ import annotations

from pathlib import Path
from typing import Callable

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


WORKSPACE = Path(r"D:\ใบงาน_Vibe_Coding_Ebook_2026")
OUTPUT_DIR = WORKSPACE / "output" / "pdf"
SCRATCH = Path(r"C:\Users\HP\.gemini\antigravity\scratch")

FONT_REGULAR = Path(r"C:\Windows\Fonts\tahoma.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\tahomabd.ttf")

NAVY = colors.HexColor("#102A5D")
NAVY_DARK = colors.HexColor("#081A3C")
BLUE = colors.HexColor("#1C4D9E")
GOLD = colors.HexColor("#C99513")
GOLD_LIGHT = colors.HexColor("#FFF3CD")
INK = colors.HexColor("#102142")
MUTED = colors.HexColor("#5D6B83")
LINE = colors.HexColor("#DCE2EB")
CANVAS = colors.HexColor("#F7F8FB")
GREEN = colors.HexColor("#087A4B")


pdfmetrics.registerFont(TTFont("Tahoma", str(FONT_REGULAR)))
pdfmetrics.registerFont(TTFont("Tahoma-Bold", str(FONT_BOLD)))


BASE_STYLES = getSampleStyleSheet()
STYLES = {
    "title": ParagraphStyle(
        "ThaiTitle",
        parent=BASE_STYLES["Title"],
        fontName="Tahoma-Bold",
        fontSize=30,
        leading=38,
        textColor=colors.white,
        alignment=TA_CENTER,
        spaceAfter=12,
    ),
    "subtitle": ParagraphStyle(
        "ThaiSubtitle",
        fontName="Tahoma",
        fontSize=14,
        leading=22,
        textColor=colors.HexColor("#E6ECF7"),
        alignment=TA_CENTER,
    ),
    "h1": ParagraphStyle(
        "ThaiH1",
        parent=BASE_STYLES["Heading1"],
        fontName="Tahoma-Bold",
        fontSize=21,
        leading=29,
        textColor=NAVY_DARK,
        spaceBefore=6,
        spaceAfter=12,
    ),
    "h2": ParagraphStyle(
        "ThaiH2",
        parent=BASE_STYLES["Heading2"],
        fontName="Tahoma-Bold",
        fontSize=15,
        leading=22,
        textColor=BLUE,
        spaceBefore=12,
        spaceAfter=7,
    ),
    "body": ParagraphStyle(
        "ThaiBody",
        parent=BASE_STYLES["BodyText"],
        fontName="Tahoma",
        fontSize=10.6,
        leading=18,
        textColor=INK,
        alignment=TA_LEFT,
        spaceAfter=7,
    ),
    "small": ParagraphStyle(
        "ThaiSmall",
        fontName="Tahoma",
        fontSize=8.8,
        leading=14,
        textColor=MUTED,
        spaceAfter=5,
    ),
    "bullet": ParagraphStyle(
        "ThaiBullet",
        parent=BASE_STYLES["BodyText"],
        fontName="Tahoma",
        fontSize=10.4,
        leading=17,
        textColor=INK,
        leftIndent=16,
        firstLineIndent=-10,
        bulletIndent=0,
        spaceAfter=5,
    ),
    "code": ParagraphStyle(
        "Code",
        fontName="Courier",
        fontSize=8.5,
        leading=13,
        textColor=colors.HexColor("#DDE7F5"),
        backColor=NAVY_DARK,
        borderPadding=10,
        borderRadius=5,
        spaceBefore=5,
        spaceAfter=10,
    ),
    "callout": ParagraphStyle(
        "ThaiCallout",
        fontName="Tahoma",
        fontSize=10,
        leading=17,
        textColor=colors.HexColor("#684300"),
        backColor=GOLD_LIGHT,
        borderColor=colors.HexColor("#EAC96F"),
        borderWidth=0.7,
        borderPadding=10,
        borderRadius=5,
        spaceBefore=5,
        spaceAfter=10,
    ),
}


def para(text: str, style: str = "body") -> Paragraph:
    return Paragraph(text, STYLES[style])


def bullet(text: str) -> Paragraph:
    return Paragraph(f"• {text}", STYLES["bullet"])


def make_page_decorator(book_title: str, accent: colors.Color) -> Callable:
    def decorate(canvas, doc):
        width, height = A4
        canvas.saveState()
        if doc.page == 1:
            canvas.setFillColor(NAVY_DARK)
            canvas.rect(0, 0, width, height, fill=1, stroke=0)
            canvas.setFillColor(NAVY)
            canvas.circle(width / 2, height * 0.58, 8.8 * cm, fill=1, stroke=0)
            canvas.setStrokeColor(accent)
            canvas.setLineWidth(2)
            canvas.circle(width / 2, height * 0.58, 8.1 * cm, fill=0, stroke=1)
            canvas.setFillColor(accent)
            canvas.rect(0, height - 0.16 * cm, width, 0.16 * cm, fill=1, stroke=0)
            canvas.setFont("Tahoma-Bold", 10)
            canvas.setFillColor(colors.white)
            canvas.drawString(1.65 * cm, height - 1.0 * cm, "VibeShelf")
            canvas.setFont("Tahoma", 8)
            canvas.setFillColor(colors.HexColor("#C8D5EA"))
            canvas.drawRightString(width - 1.65 * cm, height - 1.0 * cm, "E-book จากผลงานจริง")
        else:
            canvas.setFillColor(NAVY_DARK)
            canvas.rect(0, height - 1.55 * cm, width, 1.55 * cm, fill=1, stroke=0)
            canvas.setFillColor(accent)
            canvas.rect(0, height - 1.6 * cm, width, 0.07 * cm, fill=1, stroke=0)
            canvas.setFont("Tahoma-Bold", 8.5)
            canvas.setFillColor(colors.white)
            canvas.drawString(1.65 * cm, height - 1.0 * cm, book_title)
            canvas.setStrokeColor(LINE)
            canvas.line(1.65 * cm, 1.3 * cm, width - 1.65 * cm, 1.3 * cm)
            canvas.setFont("Tahoma", 8)
            canvas.setFillColor(MUTED)
            canvas.drawString(1.65 * cm, 0.82 * cm, "VibeShelf • E-book จากผลงานจริง")
            canvas.drawRightString(width - 1.65 * cm, 0.82 * cm, f"หน้า {doc.page}")
        canvas.restoreState()

    return decorate


def cover_story(title: str, thai_title: str, tagline: str, icon_path: Path, accent: colors.Color):
    icon = Image(str(icon_path), width=5.5 * cm, height=5.5 * cm)
    icon.hAlign = "CENTER"
    info = Table(
        [[para("DIGITAL E-BOOK", "small")]],
        colWidths=[4.2 * cm],
        rowHeights=[0.8 * cm],
    )
    info.hAlign = "CENTER"
    info.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("TEXTCOLOR", (0, 0), (-1, -1), NAVY_DARK),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("BOX", (0, 0), (-1, -1), 0.8, accent),
            ]
        )
    )
    return [
        Spacer(1, 2.2 * cm),
        info,
        Spacer(1, 0.85 * cm),
        icon,
        Spacer(1, 0.7 * cm),
        para(title, "title"),
        para(thai_title, "subtitle"),
        Spacer(1, 0.55 * cm),
        para(tagline, "subtitle"),
        Spacer(1, 2.1 * cm),
        para("คู่มือสรุปจากโปรเจกต์ที่พัฒนาและทดสอบจริง", "subtitle"),
        para("Python • PyQt6 • Vibe Coding", "subtitle"),
        PageBreak(),
    ]


def info_table(rows):
    table = Table(rows, colWidths=[4.0 * cm, 12.4 * cm], repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Tahoma-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Tahoma"),
                ("FONTSIZE", (0, 0), (-1, -1), 9.2),
                ("LEADING", (0, 0), (-1, -1), 14),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.5, LINE),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, CANVAS]),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return table


def build_book(
    filename: str,
    title: str,
    thai_title: str,
    tagline: str,
    icon_path: Path,
    accent: colors.Color,
    story,
):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output = OUTPUT_DIR / filename
    doc = SimpleDocTemplate(
        str(output),
        pagesize=A4,
        rightMargin=1.65 * cm,
        leftMargin=1.65 * cm,
        topMargin=2.15 * cm,
        bottomMargin=1.75 * cm,
        title=f"{title} — {thai_title}",
        author="VibeShelf",
        subject="E-book สรุปจากโปรเจกต์เดิม",
    )

    full_story = cover_story(title, thai_title, tagline, icon_path, accent) + story
    decorator = make_page_decorator(title, accent)
    doc.build(full_story, onFirstPage=decorator, onLaterPages=decorator)
    return output


def tarot_story():
    return [
        para("ภาพรวมโปรเจกต์", "h1"),
        para(
            "Tarot App เป็น Desktop Application สำหรับสุ่มไพ่ Major Arcana 3 ใบในตำแหน่งอดีต ปัจจุบัน และอนาคต โดยเน้นความชัดเจนของภาพ ชื่อ และความหมายภาษาไทย พร้อมระบบเพลงประกอบที่ควบคุมได้",
        ),
        para("เป้าหมายการเรียนรู้", "h2"),
        bullet("เปลี่ยน User Story ให้เป็น Functional Requirements และ Acceptance Criteria"),
        bullet("ออกแบบ UI แบบ 3 คอลัมน์ที่อ่านง่ายและเลื่อนได้เมื่อจอเล็ก"),
        bullet("ใช้ random.sample เพื่อสุ่มข้อมูลโดยไม่ซ้ำกัน"),
        bullet("จัดการไฟล์ภาพและเสียงอย่างปลอดภัยเพื่อไม่ให้โปรแกรมหยุดทำงาน"),
        bullet("Build เป็นไฟล์ EXE พร้อม assets ด้วย PyInstaller"),
        para("User Story", "h2"),
        para(
            "ในฐานะผู้ใช้ที่ต้องการอ่านไพ่ ฉันต้องการกดปุ่มเพียงครั้งเดียวเพื่อสุ่มไพ่ Major Arcana 3 ใบที่ไม่ซ้ำกัน และเห็นภาพ ชื่อ และความหมายของไพ่ในตำแหน่งอดีต ปัจจุบัน และอนาคตอย่างชัดเจน พร้อมฟังเพลงประกอบและควบคุมเสียงได้",
            "callout",
        ),
        PageBreak(),
        para("Requirement และโครงหน้าจอ", "h1"),
        info_table(
            [
                ["ส่วน", "สิ่งที่ต้องทำได้"],
                ["สำรับ", "มีไพ่ Major Arcana ครบ 22 ใบ ลำดับ 0–21"],
                ["การสุ่ม", "สุ่มไพ่พร้อมกัน 3 ใบและห้ามซ้ำกันในรอบเดียว"],
                ["การแสดงผล", "แสดงภาพ ชื่อภาษาอังกฤษ และความหมายภาษาไทย"],
                ["เสียง", "เลือกเพลง เล่น พัก หยุด และปรับระดับเสียง 0–100%"],
                ["Fallback", "ภาพหรือเพลงเสียต้องแจ้งสถานะและทำงานต่อโดยไม่ crash"],
                ["Release", "Build เป็น EXE พร้อมไอคอน ภาพ และเพลงใน assets"],
            ]
        ),
        Spacer(1, 0.4 * cm),
        para("แนวทาง UI", "h2"),
        para(
            "ธีม Mystical Dark / Warm Gold ใช้พื้นหลังดำอมม่วง กรอบไพ่สีทอง และสีประจำตำแหน่งเพื่อแยกอดีต ปัจจุบัน และอนาคต ส่วนปุ่มเปิดไพ่เป็น Primary Action ที่เด่นที่สุด และ Audio Control รวมอยู่ในแถบเดียวด้านล่าง",
        ),
        PageBreak(),
        para("แนวคิดสำคัญในโค้ด", "h1"),
        para("1. ข้อมูลไพ่แยกจาก UI", "h2"),
        para("เก็บ id, name, meaning และ image path ของไพ่ทุกใบใน cards.py ทำให้ตรวจจำนวนข้อมูลและทดสอบได้โดยไม่ต้องเปิดหน้าต่างโปรแกรม"),
        para("2. สุ่มโดยไม่ซ้ำ", "h2"),
        para("selected = random.sample(CARDS, 3)", "code"),
        para("random.sample เลือกสมาชิกจากรายการโดยไม่เลือกซ้ำ จึงตรงกับ Acceptance Criteria โดยตรง"),
        para("3. จัดการข้อผิดพลาด", "h2"),
        bullet("ตรวจว่าไฟล์ภาพมีอยู่ก่อนสร้าง QPixmap"),
        bullet("จับข้อผิดพลาดจาก audio backend และแสดงข้อความสถานะแทน Traceback"),
        bullet("ใช้ placeholder เมื่อภาพอ่านไม่ได้ และยังอนุญาตให้เปิดไพ่รอบใหม่"),
        para("4. Build ให้หา assets ได้ทั้ง Source และ EXE", "h2"),
        para("กำหนดฟังก์ชันหา resource path โดยรองรับทั้งโฟลเดอร์โปรเจกต์และโฟลเดอร์ชั่วคราวของ PyInstaller"),
        PageBreak(),
        para("การทดสอบและส่งมอบ", "h1"),
        bullet("ตรวจข้อมูลและภาพ Major Arcana ครบ 22 ใบ"),
        bullet("สุ่มอย่างน้อย 200 รอบและไม่พบไพ่ซ้ำในรอบเดียว"),
        bullet("ทดสอบการแสดงภาพ ชื่อ และความหมายครบทั้ง 3 ตำแหน่ง"),
        bullet("ทดสอบกรณีภาพหายและเพลงเสีย โดยหน้าต่างยังทำงานต่อ"),
        bullet("ทดสอบเล่น พัก เล่นต่อ หยุด และปรับเสียง"),
        bullet("Build TarotApp.exe และตรวจว่า assets อยู่ครบ"),
        para("โครงสร้างโปรเจกต์", "h2"),
        para("tarot-app/<br/>├── assets/<br/>├── tests/<br/>├── cards.py<br/>├── main.py<br/>├── requirements.txt<br/>└── TarotApp.spec", "code"),
        para("หมายเหตุ", "h2"),
        para("โปรแกรมอ่านไพ่จัดทำเพื่อการเรียนและความบันเทิง ไม่ใช่คำแนะนำด้านการแพทย์ กฎหมาย หรือการเงิน", "callout"),
    ]


def task_story():
    requirements = [
        ["ระบบ", "ความสามารถหลัก"],
        ["บัญชีผู้ใช้", "Login, Register และผู้ใช้เริ่มต้นสำหรับทดสอบ"],
        ["งาน", "เพิ่ม แก้ไข ลบ ทำซ้ำ และบันทึกเวลาเสร็จ"],
        ["จัดลำดับ", "Priority ต่ำ ปานกลาง สูง พร้อมสีแยกชัดเจน"],
        ["หมวดหมู่", "เพิ่ม แก้ไข ลบ และผูกหมวดหมู่กับงาน"],
        ["ค้นหา", "ค้นหา Real-time และกรองสถานะ หมวดหมู่ Priority"],
        ["Dashboard", "สรุปงานทั้งหมด เสร็จแล้ว ค้าง และใกล้ครบกำหนด"],
        ["ความปลอดภัยข้อมูล", "Trash/Restore, CSV, Backup และ Restore SQLite"],
        ["การใช้งาน", "Due Date Reminder และ Dark/Light Theme"],
    ]
    return [
        para("ภาพรวมโปรเจกต์", "h1"),
        para(
            "Task Manager PRO เป็นระบบจัดการงานบน Desktop ที่ใช้ PyQt6 สร้างหน้าจอและ SQLite จัดเก็บข้อมูล รองรับบัญชีผู้ใช้ หมวดหมู่ ระดับความสำคัญ Dashboard ถังขยะ การนำเข้า–ส่งออก CSV และการสำรองฐานข้อมูล",
        ),
        para("เป้าหมายการเรียนรู้", "h2"),
        bullet("ออกแบบฐานข้อมูลเชิงสัมพันธ์ระหว่าง users, categories และ tasks"),
        bullet("เชื่อม UI กับ CRUD Operations อย่างเป็นระบบ"),
        bullet("คำนวณ Dashboard และตัวกรองจากข้อมูลจริง"),
        bullet("ป้องกันข้อมูลสูญหายด้วย Soft Delete และ Backup"),
        bullet("ทดสอบ workflow ตั้งแต่ Login ถึง Build EXE"),
        para("User Story", "h2"),
        para(
            "ในฐานะผู้ใช้งานที่มีภาระงานหลากหลาย ฉันต้องการระบบ Task Manager ที่เข้าสู่ระบบได้ บันทึกงานพร้อม Priority และ Category ได้ เห็น Dashboard มีถังขยะ แจ้งเตือนวันครบกำหนด นำเข้า–ส่งออกข้อมูล และสำรองฐานข้อมูลได้",
            "callout",
        ),
        PageBreak(),
        para("Functional Requirements", "h1"),
        info_table(requirements),
        Spacer(1, 0.45 * cm),
        para("แนวทาง UI", "h2"),
        para(
            "หน้าต่างหลักแบ่งเป็น Header, Dashboard Cards, Filter Bar, Action Toolbar และ Task Table ทำให้ผู้ใช้เห็นภาพรวมและเริ่มจัดการงานได้จากหน้าจอเดียว สีเขียว เหลือง แดงใช้เฉพาะเพื่อสื่อระดับความสำคัญและสถานะ",
        ),
        PageBreak(),
        para("ออกแบบฐานข้อมูล SQLite", "h1"),
        para("ตารางหลัก", "h2"),
        bullet("users: เก็บชื่อผู้ใช้และ password hash"),
        bullet("categories: เก็บชื่อหมวดหมู่และสี"),
        bullet("tasks: เก็บชื่อ รายละเอียด สถานะ Priority หมวดหมู่ วันครบกำหนด และเวลา"),
        para(
            "CREATE TABLE tasks (<br/>  id INTEGER PRIMARY KEY AUTOINCREMENT,<br/>  title TEXT NOT NULL,<br/>  status TEXT NOT NULL DEFAULT 'todo',<br/>  priority TEXT NOT NULL DEFAULT 'medium',<br/>  category_id INTEGER,<br/>  due_date TEXT,<br/>  created_at TEXT NOT NULL,<br/>  completed_at TEXT,<br/>  is_deleted INTEGER NOT NULL DEFAULT 0<br/>);",
            "code",
        ),
        para("แนวคิด Soft Delete", "h2"),
        para("เมื่อผู้ใช้ลบงาน ระบบตั้ง is_deleted = 1 แทนการลบแถวทันที หน้าถังขยะจึงสามารถกู้คืนได้ ส่วนการลบถาวรต้องถามยืนยันอีกครั้ง"),
        PageBreak(),
        para("Workflow สำคัญ", "h1"),
        para("Dashboard", "h2"),
        bullet("งานทั้งหมด: งานที่ยังไม่อยู่ในถังขยะ"),
        bullet("เสร็จแล้ว: status = done"),
        bullet("งานค้าง: status = todo"),
        bullet("ใกล้กำหนด: วันครบกำหนดอยู่ภายใน 3 วันและยังไม่เสร็จ"),
        para("Import / Export CSV", "h2"),
        para("ส่งออกด้วย utf-8-sig เพื่อให้ Microsoft Excel เปิดภาษาไทยได้ถูกต้อง ส่วนการนำเข้าต้องตรวจชื่อคอลัมน์และข้อมูลแต่ละแถวก่อนบันทึก"),
        para("Backup / Restore", "h2"),
        para("สำรองไฟล์ tasks.db ไปยังตำแหน่งที่ผู้ใช้เลือก และปิดการเชื่อมต่อฐานข้อมูลก่อน Restore เพื่อลดโอกาสไฟล์เสียหาย"),
        para("Theme", "h2"),
        para("ใช้ QSettings จดจำ Dark/Light Theme ทำให้เมื่อเปิดโปรแกรมครั้งถัดไปยังคงธีมเดิม"),
        PageBreak(),
        para("การทดสอบและส่งมอบ", "h1"),
        bullet("Login สำเร็จและล้มเหลวแสดงผลถูกต้อง"),
        bullet("เพิ่ม แก้ไข ลบ ทำซ้ำ และเปลี่ยนสถานะงานได้"),
        bullet("Priority และ Category แสดงสีและตัวเลือกถูกต้อง"),
        bullet("Dashboard อัปเดตหลังข้อมูลเปลี่ยน"),
        bullet("Trash, Restore และ Permanent Delete ทำงานตามลำดับ"),
        bullet("Import/Export CSV ภาษาไทยไม่เพี้ยน"),
        bullet("Backup/Restore ฐานข้อมูลได้ครบ"),
        bullet("Build TaskManagerPRO.exe และเปิดได้โดยไม่ติดตั้ง Python"),
        para("โครงสร้างโปรเจกต์", "h2"),
        para("task-manager-pro/<br/>├── assets/<br/>├── tests/<br/>├── database.py<br/>├── main.py<br/>├── tasks.db<br/>├── requirements.txt<br/>└── TaskManagerPRO.spec", "code"),
    ]


def media_story():
    return [
        para("ภาพรวมโปรเจกต์", "h1"),
        para(
            "Media Player PRO เป็นเครื่องเล่นเพลง Desktop ด้วย Python และ PyQt6 ผู้ใช้เพิ่มเพลงหลายไฟล์ลง Playlist ดับเบิลคลิกเพื่อเล่น ควบคุมการเล่น กรอเวลา ปรับเสียง ลบรายการ และล้าง Playlist ได้",
        ),
        para("เป้าหมายการเรียนรู้", "h2"),
        bullet("ทำงานกับไฟล์หลายรายการผ่าน QFileDialog"),
        bullet("เชื่อมสัญญาณ QMediaPlayer กับปุ่มและ Slider"),
        bullet("จัดการสถานะ Playlist และเพลงที่กำลังเล่น"),
        bullet("ออกแบบ Fault Tolerance สำหรับกรณีไม่มีเพลงหรือไฟล์เสีย"),
        bullet("Build โปรแกรมพร้อมไอคอนและไฟล์ตัวอย่าง"),
        para("User Story", "h2"),
        para(
            "ในฐานะผู้ฟังเพลง ฉันต้องการเลือกเพลงหลายไฟล์เข้ามาใน Playlist ได้พร้อมกัน เลือกเพลงเพื่อเล่น ลบเพลงหรือล้างทั้งหมด ลาก Slider เพื่อกรอเพลง และปรับระดับเสียง 0–100% โดยโปรแกรมไม่ค้างเมื่อใช้งานผิดพลาด",
            "callout",
        ),
        PageBreak(),
        para("Requirement และ UI", "h1"),
        info_table(
            [
                ["ส่วน", "สิ่งที่ต้องทำได้"],
                ["เพิ่มเพลง", "เลือก MP3, WAV, OGG หรือ M4A ได้หลายไฟล์พร้อมกัน"],
                ["Playlist", "แสดงลำดับ ชื่อเพลง และดับเบิลคลิกเพื่อเล่น"],
                ["ควบคุม", "เล่น พัก เล่นต่อ และหยุด"],
                ["Progress", "Slider เลื่อนตามเวลาและลาก Seek ไปตำแหน่งที่ต้องการ"],
                ["Volume", "ปรับระดับเสียง 0–100% พร้อมตัวเลขเปอร์เซ็นต์"],
                ["จัดการรายการ", "ลบเพลงที่เลือกและล้าง Playlist ทั้งหมดหลังยืนยัน"],
                ["Fallback", "ไม่มีเพลงหรือไฟล์เสียให้แจ้งเตือนแทนการ crash"],
            ]
        ),
        Spacer(1, 0.4 * cm),
        para("แนวทาง UI", "h2"),
        para("Modern Dark Theme วาง Now Playing ด้านบน Playlist อยู่กึ่งกลาง ปุ่มจัดการรายการอยู่ใต้ Playlist และแยก Progress, Playback Controls และ Volume เป็นกลุ่มที่มองเห็นลำดับการใช้งานชัดเจน"),
        PageBreak(),
        para("แนวคิดสำคัญในโค้ด", "h1"),
        para("Playlist State", "h2"),
        para("เก็บ path ของเพลงจริงแยกจากข้อความที่แสดงใน QListWidget ทำให้ชื่อใน UI อ่านง่ายแต่ยังเปิดไฟล์ต้นฉบับได้ถูกต้อง"),
        para("เล่นเพลงที่เลือก", "h2"),
        bullet("ดับเบิลคลิกเรียก play_selected()"),
        bullet("ตรวจว่ามีรายการและมีเพลงที่เลือกก่อนสั่งเล่น"),
        bullet("อัปเดต Now Playing หลัง QMediaPlayer รับ source สำเร็จ"),
        para("Progress และ Seek", "h2"),
        para("เชื่อม positionChanged กับค่า Slider และเชื่อม sliderReleased กลับไปยัง setPosition() เพื่อให้ลากข้ามท่อนเพลงได้โดยไม่เกิดการเรียกวนซ้ำ"),
        para("จัดการรายการ", "h2"),
        para("เมื่อลบเพลงที่กำลังเล่น ต้องหยุด player และรีเซ็ตเวลา ส่วน Clear All ต้องถามยืนยันก่อนลบทุกแถว"),
        PageBreak(),
        para("การทดสอบและส่งมอบ", "h1"),
        bullet("เพิ่มเพลงตัวอย่างหลายไฟล์พร้อมกันและลำดับแสดงถูกต้อง"),
        bullet("ดับเบิลคลิกเพลงแล้ว Now Playing เปลี่ยนตามรายการ"),
        bullet("Play, Pause, Resume และ Stop ทำงานครบ"),
        bullet("Slider ขยับตามเวลาและ Seek ได้"),
        bullet("Volume เปลี่ยนได้ตั้งแต่ 0 ถึง 100%"),
        bullet("ลบเพลงเดี่ยวและ Clear All หลังยืนยัน"),
        bullet("กด Play ตอน Playlist ว่างแล้วแสดงข้อความสุภาพ"),
        bullet("Build MediaPlayerPRO.exe และเปิดได้โดยไม่ติดตั้ง Python"),
        para("โครงสร้างโปรเจกต์", "h2"),
        para("media-player-pro/<br/>├── assets/<br/>├── sample_music/<br/>├── tests/<br/>├── main.py<br/>├── requirements.txt<br/>└── MediaPlayerPRO.spec", "code"),
    ]


def main():
    outputs = [
        build_book(
            "tarot-app-ebook.pdf",
            "Tarot App",
            "คู่มือสร้างแอปไพ่ทาโรต์ 3 กาล",
            "สุ่มไพ่ • แสดงความหมาย • ควบคุมเสียง • Build EXE",
            SCRATCH / "tarot-app" / "assets" / "app.png",
            colors.HexColor("#F0C23D"),
            tarot_story(),
        ),
        build_book(
            "task-manager-pro-ebook.pdf",
            "Task Manager PRO",
            "คู่มือสร้างระบบจัดการงานด้วย SQLite",
            "Login • Dashboard • Search • Backup • Build EXE",
            SCRATCH / "task-manager-pro" / "assets" / "app.png",
            colors.HexColor("#E1B53A"),
            task_story(),
        ),
        build_book(
            "media-player-pro-ebook.pdf",
            "Media Player PRO",
            "คู่มือสร้างเครื่องเล่นเพลงด้วย PyQt6",
            "Playlist • Playback • Seek • Volume • Build EXE",
            SCRATCH / "media-player-pro" / "assets" / "app.png",
            colors.HexColor("#FF3B64"),
            media_story(),
        ),
    ]
    for output in outputs:
        print(output)


if __name__ == "__main__":
    main()
