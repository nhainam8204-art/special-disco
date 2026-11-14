# -*- coding: utf-8 -*-
"""
Tập lệnh cập nhật trực tiếp file data.js với nội dung bài học và đề thi mới nhất.
Đồng thời tăng dataVersion lên '2026-curriculum-v2' để kích hoạt đồng bộ trên trình duyệt.
"""

import json

with open('new_courses.json', 'r', encoding='utf-8') as f:
    courses = json.load(f)

# Chuyển đổi courses thành chuỗi JS đẹp mắt
courses_js = json.dumps(courses, ensure_ascii=False, indent=4)

data_js_content = f"""// Du lieu mac dinh cho He thong Hoc Tieng Anh & Cap Chung Chi Noi Bo Truong THPT
window.DEFAULT_SCHOOL_DATA = {{
  schoolConfig: {{
    schoolName: "TRƯỜNG THPT SỐ 2 NGUYỄN TRƯỜNG TỘ",
    schoolSubtitle: "HỆ THỐNG HỌC TẬP TRỰC TUYẾN VÀ CẤP CHỨNG CHỈ MÔN TIẾNG ANH",
    principalName: "Trương Quang Mẫn",
    headTeacherName: "Thầy Nguyễn Hải Nam",
    passScorePercent: 70,
    academicYear: "2026 - 2027",
    allowSelfRegister: false
  }},

  users: [
    {{
      id: "GV001",
      username: "admin",
      password: "123",
      fullName: "Thầy Nguyễn Hải Nam",
      role: "admin",
      className: "Tổ Ngoại Ngữ",
      grade: "GV",
      email: "nam.nguyenhai@thptso2nguyentruongto.edu.vn",
      active: true
    }},
    {{
      id: "HS1001",
      username: "HS1001",
      password: "123",
      fullName: "Nguyễn Văn An (Học sinh mẫu)",
      role: "student",
      className: "10C1",
      grade: "10",
      email: "an.nguyenvan@thptso2nguyentruongto.edu.vn",
      active: true
    }}
  ],

  courses: {courses_js},

  progress: {{}},

  certificates: []
}};

// Nap danh sach hoc sinh toan truong (tu students.js)
if (window.SCHOOL_STUDENTS) {{
  window.DEFAULT_SCHOOL_DATA.users = window.DEFAULT_SCHOOL_DATA.users.concat(window.SCHOOL_STUDENTS);
}}
window.DEFAULT_SCHOOL_DATA.dataVersion = "2026-curriculum-v2";
"""

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(data_js_content)

print("data.js has been successfully written with full curriculum!")
