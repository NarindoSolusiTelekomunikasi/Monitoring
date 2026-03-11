PRODUCT REQUIREMENT DOCUMENT
NOC Technician Monitoring Dashboard (Frontend)

Version: 1.0
Scope: Frontend UI Dashboard
Platform: Web Application

1. Product Overview
1.1 Background

Data tiket gangguan pelanggan dari sistem operasional disimpan dalam spreadsheet dan berisi informasi seperti:

nomor tiket

status tiket

teknisi

workzone

jenis layanan

tanggal

Namun data tersebut masih berbentuk tabel mentah sehingga sulit digunakan untuk:

monitoring operasional

melihat performa teknisi

melihat kondisi jaringan

Oleh karena itu diperlukan Dashboard UI Monitoring.

1.2 Objective

Membangun UI Dashboard Monitoring Teknisi yang:

visual

real-time ready

mudah dibaca oleh NOC

dapat menampilkan performa teknisi

1.3 Product Goals

Dashboard harus dapat:

Goal	Description
Monitoring	memonitor tiket
Visibility	menampilkan kondisi jaringan
Performance	menampilkan performa teknisi
Decision	membantu supervisor mengambil keputusan
2. Target Users
2.1 NOC (Network Operation Center)

Kebutuhan:

melihat jumlah tiket

melihat tiket open

melihat tiket close

2.2 Supervisor Teknik

Kebutuhan:

melihat performa teknisi

melihat ranking teknisi

2.3 Manager

Kebutuhan:

melihat performa wilayah

3. UI Design Principles

Dashboard harus memiliki prinsip:

Clarity

informasi harus langsung terbaca

Speed

user dapat melihat kondisi dalam < 5 detik

Minimal Interaction

dashboard tidak membutuhkan klik banyak

Visual Monitoring

banyak menggunakan chart dan card

4. Dashboard Layout Structure

Struktur halaman dashboard:

HEADER
│
KPI CARDS
│
CHART SECTION
│
TECHNICIAN RANKING
│
WORKZONE PERFORMANCE
│
TICKET TABLE
5. UI Sections
5.1 Header

Header menampilkan:

Component	Description
Dashboard Title	Monitoring Teknisi
Date	tanggal hari ini
Last Update	waktu update terakhir

Contoh tampilan:

TECHNICIAN MONITORING DASHBOARD
11 March 2026
Last Update : 14:32
5.2 KPI Cards

Menampilkan ringkasan tiket.

KPI Cards
KPI	Description
TOTAL TICKET	jumlah semua tiket
OPEN TICKET	tiket belum selesai
CLOSE TICKET	tiket selesai
ACTIVE TECHNICIAN	teknisi aktif
Layout
[ TOTAL TICKET ]
[ OPEN TICKET ]
[ CLOSE TICKET ]
[ ACTIVE TECHNICIAN ]
5.3 Ticket Status Chart

Chart yang menunjukkan distribusi tiket.

Jenis chart:

Pie Chart

Data:

OPEN
CLOSE
5.4 Workzone Performance Chart

Menampilkan performa wilayah.

Contoh workzone:

KTU
SGB
BTA
MUD
MPA
TAM
TLK

Chart:

Bar Chart

Menampilkan:

Open Ticket
Close Ticket
5.5 Technician Ranking

Menampilkan ranking teknisi berdasarkan:

jumlah tiket close

Layout:

Rank	Teknisi	Close
1	FREDI AGUSTINUS	12
2	FIRDAUS	9
3	JERRY	7
5.6 Technician Performance Table

Menampilkan performa teknisi.

Teknisi	Total	Open	Close	Productivity
5.7 Ticket List Table

Menampilkan tiket secara detail.

Incident	Customer	Workzone	Status	Teknisi	Date
6. Visual Design
6.1 Theme

Direkomendasikan:

NOC DARK THEME

Alasan:

nyaman dilihat lama

cocok untuk monitoring

6.2 Color System
Element	Color
Open Ticket	Red
Close Ticket	Green
Total Ticket	Blue
Warning	Orange
6.3 Font

Font rekomendasi:

Inter
Roboto
7. UI Components

Komponen yang harus dibuat.

Card Component

Menampilkan KPI.

Contoh:

+----------------------+
| TOTAL TICKET         |
| 232                  |
+----------------------+
Chart Component

Menggunakan:

Chart.js

Chart:

Pie chart

Bar chart

Table Component

Menampilkan data tiket.

Fitur:

sortable

searchable

8. Responsive Design

Dashboard harus responsive.

Device	Layout
Desktop	full dashboard
Tablet	stacked charts
Mobile	vertical layout
9. Frontend Technology Stack

Frontend menggunakan:

HTML5
CSS3
Javascript
Chart.js

Optional:

TailwindCSS
10. File Structure

Struktur project frontend:

dashboard/
│
├── index.html
├── style.css
├── script.js
│
├── components
│     ├ cards.js
│     ├ charts.js
│     └ tables.js
│
└── assets
      └ icons
11. UI Development Plan
Phase 1 — Wireframe

Membuat layout dashboard.

Tujuan:

menentukan posisi komponen

Output:

wireframe dashboard
Phase 2 — Static UI

Membuat UI tanpa data.

Output:

dashboard design

Komponen:

header

cards

charts

tables

Phase 3 — Dummy Data Integration

Menggunakan:

dummy JSON

untuk simulasi data.

Phase 4 — Chart Integration

Menampilkan chart:

pie chart

bar chart

Phase 5 — Table Integration

Menampilkan:

ticket list

technician ranking

Phase 6 — Responsive Design

Optimasi tampilan:

desktop

mobile

12. Testing Plan
UI Testing

Memastikan UI tampil dengan benar.

Tes:

Test	Result
Card tampil	OK
Chart tampil	OK
Table tampil	OK
Browser Testing

Test di:

Chrome
Edge
Firefox
Responsive Testing

Test di:

Desktop
Tablet
Mobile
Performance Testing

Target:

Load < 2 seconds
13. UI Acceptance Criteria

Dashboard dianggap selesai jika:

Criteria	Target
UI layout selesai	100%
Charts tampil	OK
Tables tampil	OK
Responsive	OK
14. Deliverables

Output dari frontend development:

index.html
style.css
script.js