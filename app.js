// Logic dieu khien he thong hoc tap Tieng Anh - Truong THPT So 2 Nguyen Truong To
const STORAGE_KEY = "THPT_ENGLISH_LMS_STATE_V1";

const app = {
  state: null,
  currentUser: null,
  activeTab: "courses",
  selectedGradeFilter: "ALL",
  activeCourseId: null,
  activeLessonId: null,
  activeLessonSubTab: "theory",
  examTimerInterval: null,
  examRemainingSeconds: 0,

  async init() {
    await this.loadState();

    // Dong bo danh sach hoc sinh toan truong khi co phien ban du lieu moi
    const defData = window.DEFAULT_SCHOOL_DATA;
    if (this.state && defData && this.state.dataVersion !== defData.dataVersion) {
      const validIds = new Set(defData.users.map(u => u.id));
      // Giu lai tien do hoc tap cua hoc sinh con ton tai trong danh sach moi
      const oldProg = this.state.progress || {};
      const newProg = {};
      Object.keys(oldProg).forEach(id => { if (validIds.has(id)) newProg[id] = oldProg[id]; });
      const oldCerts = (this.state.certificates || []).filter(c => validIds.has(c.userId));
      // Giu mat khau da doi cua hoc sinh cu (neu co)
      const oldPass = {};
      (this.state.users || []).forEach(u => { oldPass[u.id] = u.password; });
      this.state.users = defData.users.map(u => {
        const nu = JSON.parse(JSON.stringify(u));
        if (nu.role === "student" && oldPass[nu.id]) nu.password = oldPass[nu.id];
        return nu;
      });
      this.state.progress = newProg;
      this.state.certificates = oldCerts;
      this.state.dataVersion = defData.dataVersion;
      await this.saveState();
    }

    // Dong bo ten truong va ten quan tri vien (Thay Nguyen Hai Nam)
    let needsSave = false;
    if (this.state?.schoolConfig) {
      if (this.state.schoolConfig.schoolName !== "TRƯỜNG THPT SỐ 2 NGUYỄN TRƯỜNG TỘ") {
        this.state.schoolConfig.schoolName = "TRƯỜNG THPT SỐ 2 NGUYỄN TRƯỜNG TỘ";
        needsSave = true;
      }
      if (this.state.schoolConfig.headTeacherName !== "Thầy Nguyễn Hải Nam") {
        this.state.schoolConfig.headTeacherName = "Thầy Nguyễn Hải Nam";
        needsSave = true;
      }
      if (this.state.schoolConfig.principalName !== "Trương Quang Mẫn") {
        this.state.schoolConfig.principalName = "Trương Quang Mẫn";
        needsSave = true;
      }
    }

    if (this.state?.users) {
      const adminUser = this.state.users.find(u => u.role === "admin" || u.username === "admin");
      if (adminUser && adminUser.fullName !== "Thầy Nguyễn Hải Nam") {
        adminUser.fullName = "Thầy Nguyễn Hải Nam";
        adminUser.email = "nam.nguyenhai@thptso2nguyentruongto.edu.vn";
        needsSave = true;
      }
    }

    if (this.state?.courses) {
      this.state.courses.forEach(c => {
        if (c.teacher !== "Thầy Nguyễn Hải Nam") {
          c.teacher = "Thầy Nguyễn Hải Nam";
          needsSave = true;
        }
      });
    }

    if (this.state?.certificates) {
      this.state.certificates.forEach(c => {
        if (c.schoolName !== "TRƯỜNG THPT SỐ 2 NGUYỄN TRƯỜNG TỘ") {
          c.schoolName = "TRƯỜNG THPT SỐ 2 NGUYỄN TRƯỜNG TỘ";
          needsSave = true;
        }
        if (c.headTeacherName !== "Thầy Nguyễn Hải Nam") {
          c.headTeacherName = "Thầy Nguyễn Hải Nam";
          needsSave = true;
        }
        if (c.principalName !== "Trương Quang Mẫn") {
          c.principalName = "Trương Quang Mẫn";
          needsSave = true;
        }
      });
    }

    if (needsSave) {
      await this.saveState();
    }

    this.updateHeaderBranding();

    const params = new URLSearchParams(window.location.search);
    const verifyCode = params.get("verify");
    if (verifyCode) {
      this.openVerifyModal(verifyCode);
    }

    const savedSessionUserId = sessionStorage.getItem("THPT_LMS_USER_ID");
    if (savedSessionUserId) {
      const user = this.state.users.find(u => u.id === savedSessionUserId && u.active !== false);
      if (user) {
        this.loginSuccess(user);
      }
    }
  },

  async loadState() {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (res.ok) {
        const serverData = await res.json();
        if (serverData && serverData.users) {
          this.state = serverData;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
          return;
        }
      }
    } catch (e) {
      // Chay che do tinh
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        this.state = JSON.parse(raw);
      } catch (err) {
        this.state = JSON.parse(JSON.stringify(window.DEFAULT_SCHOOL_DATA));
      }
    } else {
      this.state = JSON.parse(JSON.stringify(window.DEFAULT_SCHOOL_DATA));
      await this.saveState();
    }
  },

  async saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    try {
      await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.state)
      });
    } catch (e) {
      // Khong the ket noi may chu cuc bo
    }
  },

  updateHeaderBranding() {
    const cfg = this.state.schoolConfig;
    document.getElementById("topbar-school-name").textContent = cfg.schoolName;
    document.getElementById("topbar-school-sub").textContent = cfg.schoolSubtitle;
  },

  fillDemoLogin(username, password) {
    document.getElementById("login-username").value = username;
    document.getElementById("login-password").value = password;
    document.getElementById("login-error").classList.add("hidden");
  },

  handleLogin(e) {
    e.preventDefault();
    const uInput = document.getElementById("login-username").value.trim();
    const pInput = document.getElementById("login-password").value.trim();
    const errEl = document.getElementById("login-error");

    const user = this.state.users.find(
      u => (u.username.toLowerCase() === uInput.toLowerCase() || u.id.toLowerCase() === uInput.toLowerCase()) && u.password === pInput
    );

    if (!user) {
      errEl.textContent = "Thông tin đăng nhập hoặc mật khẩu không chính xác. Vui lòng liên hệ Thầy Nguyễn Hải Nam để được hỗ trợ.";
      errEl.classList.remove("hidden");
      return;
    }

    if (user.active === false) {
      errEl.textContent = "Tài khoản hiện đang trong trạng thái tạm khóa. Vui lòng liên hệ ban quản trị nhà trường.";
      errEl.classList.remove("hidden");
      return;
    }

    errEl.classList.add("hidden");
    this.loginSuccess(user);
  },

  loginSuccess(user) {
    this.currentUser = user;
    sessionStorage.setItem("THPT_LMS_USER_ID", user.id);

    document.getElementById("view-login").classList.add("hidden");
    document.getElementById("view-main").classList.remove("hidden");
    document.getElementById("topbar-user-area").classList.remove("hidden");

    const roleLabel = user.role === "admin" ? "Quản trị viên" : `Học sinh lớp ${user.className} (${user.id})`;
    document.getElementById("topbar-user-info").textContent = `${roleLabel}: ${user.fullName}`;

    if (user.role === "admin") {
      this.activeTab = "admin-students";
    } else {
      this.activeTab = "courses";
      this.selectedGradeFilter = "ALL";
    }

    this.renderMain();
  },

  logout() {
    this.stopExamTimer();
    this.currentUser = null;
    sessionStorage.removeItem("THPT_LMS_USER_ID");
    document.getElementById("view-main").classList.add("hidden");
    document.getElementById("topbar-user-area").classList.add("hidden");
    document.getElementById("view-login").classList.remove("hidden");
  },

  switchTab(tabName) {
    if (this.isExamActive) {
      alert("CẢNH BÁO QUY CHẾ THI: Bài kiểm tra đang diễn ra ở chế độ toàn màn hình. Bạn không được chuyển trang khác trong lúc làm bài!");
      return;
    }
    this.stopExamTimer();
    this.activeTab = tabName;
    this.renderMain();
  },

  renderMain() {
    this.renderNavTabs();
    const container = document.getElementById("main-dynamic-content");

    if (this.currentUser.role === "admin") {
      if (this.activeTab === "admin-students") {
        container.innerHTML = this.renderAdminStudents();
      } else if (this.activeTab === "admin-courses") {
        container.innerHTML = this.renderAdminCourses();
      } else if (this.activeTab === "admin-certs") {
        container.innerHTML = this.renderAdminCertificates();
      } else if (this.activeTab === "admin-settings") {
        container.innerHTML = this.renderAdminSettings();
      } else if (this.activeTab === "courses") {
        container.innerHTML = this.renderStudentCoursesView();
      } else if (this.activeTab === "classroom") {
        container.innerHTML = this.renderClassroomView();
      } else if (this.activeTab === "transcript") {
        container.innerHTML = this.renderStudentTranscriptView();
      }
      return;
    }

    if (this.activeTab === "courses") {
      container.innerHTML = this.renderStudentCoursesView();
    } else if (this.activeTab === "classroom") {
      container.innerHTML = this.renderClassroomView();
    } else if (this.activeTab === "certificates") {
      container.innerHTML = this.renderStudentCertificatesView();
      this.drawAllQrCanvases();
    } else if (this.activeTab === "transcript") {
      container.innerHTML = this.renderStudentTranscriptView();
    }
  },

  renderNavTabs() {
    const bar = document.getElementById("nav-tabs-bar");
    if (this.currentUser.role === "admin") {
      bar.innerHTML = `
        <button class="nav-tab ${this.activeTab === 'admin-students' ? 'active' : ''}" onclick="app.switchTab('admin-students')">
          Quản lý học sinh
        </button>
        <button class="nav-tab ${this.activeTab === 'admin-courses' ? 'active' : ''}" onclick="app.switchTab('admin-courses')">
          Quản lý khóa học
        </button>
        <button class="nav-tab ${this.activeTab === 'admin-certs' ? 'active' : ''}" onclick="app.switchTab('admin-certs')">
          Sổ cấp chứng chỉ (${this.state.certificates.length})
        </button>
        <button class="nav-tab ${this.activeTab === 'admin-settings' ? 'active' : ''}" onclick="app.switchTab('admin-settings')">
          Cấu hình hệ thống
        </button>
        <button class="nav-tab ${this.activeTab === 'courses' || this.activeTab === 'classroom' ? 'active' : ''}" onclick="app.switchTab('courses')">
          Xem giao diện học sinh
        </button>
      `;
    } else {
      const myCerts = this.state.certificates.filter(c => c.userId === this.currentUser.id);
      bar.innerHTML = `
        <button class="nav-tab ${this.activeTab === 'courses' ? 'active' : ''}" onclick="app.switchTab('courses')">
          Danh mục khóa học
        </button>
        ${this.activeCourseId ? `
          <button class="nav-tab ${this.activeTab === 'classroom' ? 'active' : ''}" onclick="app.switchTab('classroom')">
            Phòng học trực tuyến
          </button>
        ` : ''}
        <button class="nav-tab ${this.activeTab === 'certificates' ? 'active' : ''}" onclick="app.switchTab('certificates')">
          Chứng chỉ đã cấp (${myCerts.length})
        </button>
        <button class="nav-tab ${this.activeTab === 'transcript' ? 'active' : ''}" onclick="app.switchTab('transcript')">
          Bảng điểm & Học bạ tổng kết
        </button>
      `;
    }
  },

  getUserProgress(userId) {
    if (!this.state.progress[userId]) {
      this.state.progress[userId] = {
        completedLessons: [],
        lessonScores: {},
        examScores: {},
        quizAttempts: {},
        listeningAttempts: {},
        examAttempts: {}
      };
    }
    const p = this.state.progress[userId];
    if (!p.completedLessons) p.completedLessons = [];
    if (!p.lessonScores) p.lessonScores = {};
    if (!p.examScores) p.examScores = {};
    if (!p.quizAttempts) p.quizAttempts = {};
    if (!p.listeningAttempts) p.listeningAttempts = {};
    if (!p.examAttempts) p.examAttempts = {};
    return p;
  },

  renderStudentCoursesView() {
    const prog = this.getUserProgress(this.currentUser.id);
    const myCerts = this.state.certificates.filter(c => c.userId === this.currentUser.id);

    const totalLessonsAll = this.state.courses.reduce((acc, c) => acc + c.lessons.length, 0);
    const completedCount = prog.completedLessons.length;

    const filteredCourses = this.state.courses.filter(c => {
      if (this.selectedGradeFilter === "ALL") return true;
      return c.grade === this.selectedGradeFilter;
    });

    const cardsHtml = filteredCourses.map(course => {
      const totalL = course.lessons.length;
      const doneL = course.lessons.filter(l => prog.completedLessons.includes(l.id)).length;
      const percent = totalL > 0 ? Math.round((doneL / totalL) * 100) : 0;
      const examScore = prog.examScores[course.id];
      const cert = myCerts.find(c => c.courseId === course.id);

      return `
        <div class="course-card">
          <div>
            <div class="course-banner">
              <span class="course-grade-tag">Khối Lớp ${course.grade} - ${course.level}</span>
              <h3>${course.title}</h3>
            </div>
            <div class="course-body">
              <div class="course-meta">
                <span>Giáo viên phụ trách: ${course.teacher}</span>
                <span>Thời lượng: ${course.duration} (${totalL} bài học)</span>
                <span>Thời gian thi cuối khóa: ${course.examDurationMinutes} phút</span>
              </div>
              <p style="font-size:13.5px; color:#475569; margin-bottom:10px;">${course.description}</p>
              <div class="progress-wrap">
                <div class="progress-label">
                  <span>Tiến độ học tập: ${doneL}/${totalL} bài</span>
                  <span>${percent}%</span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" style="width:${percent}%"></div>
                </div>
              </div>
              ${examScore !== undefined ? `
                <div style="margin-top:10px; font-size:13px; font-weight:600; color:${examScore >= this.state.schoolConfig.passScorePercent ? '#15803d' : '#b45309'};">
                  Kết quả thi cuối khóa cao nhất: ${examScore}/100 điểm
                </div>
              ` : ''}
            </div>
          </div>
          <div class="course-footer">
            <button class="btn btn-primary btn-sm" onclick="app.openCourseClassroom('${course.id}')">
              ${doneL > 0 ? 'Tiếp tục học' : 'Vào học'}
            </button>
            ${cert ? `
              <button class="btn btn-accent btn-sm" onclick="app.switchTab('certificates')">
                Xem chứng chỉ
              </button>
            ` : `
              <span style="font-size:12px; color:#64748b;">Đạt từ ${this.state.schoolConfig.passScorePercent}% để nhận chứng chỉ</span>
            `}
          </div>
        </div>
      `;
    }).join("");

    return `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-info">
            <h3>${this.state.courses.length}</h3>
            <p>Khóa học tiếng Anh</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-info">
            <h3>${completedCount}/${totalLessonsAll}</h3>
            <p>Bài học đã hoàn thành</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-info">
            <h3>${myCerts.length}</h3>
            <p>Chứng chỉ đã cấp</p>
          </div>
        </div>
      </div>

      <div class="filter-bar">
        <h2 style="font-size:18px; font-weight:700; color:#0f2757;">Danh mục khóa học Tiếng Anh</h2>
        <div class="grade-pills">
          <button class="grade-pill ${this.selectedGradeFilter === 'ALL' ? 'active' : ''}" onclick="app.setGradeFilter('ALL')">Tất cả các khối</button>
          <button class="grade-pill ${this.selectedGradeFilter === '10' ? 'active' : ''}" onclick="app.setGradeFilter('10')">Khối 10</button>
          <button class="grade-pill ${this.selectedGradeFilter === '11' ? 'active' : ''}" onclick="app.setGradeFilter('11')">Khối 11</button>
          <button class="grade-pill ${this.selectedGradeFilter === '12' ? 'active' : ''}" onclick="app.setGradeFilter('12')">Khối 12</button>
        </div>
      </div>

      <div class="courses-grid">
        ${cardsHtml}
      </div>
    `;
  },

  setGradeFilter(grade) {
    this.selectedGradeFilter = grade;
    this.renderMain();
  },

  openCourseClassroom(courseId) {
    const course = this.state.courses.find(c => c.id === courseId);
    if (!course) return;
    this.activeCourseId = course.id;
    this.activeLessonId = course.lessons[0]?.id || null;
    this.activeLessonSubTab = "theory";
    this.activeTab = "classroom";
    this.renderMain();
  },

  renderClassroomView() {
    const course = this.state.courses.find(c => c.id === this.activeCourseId);
    if (!course) return `<p>Chưa chọn khóa học.</p>`;

    const prog = this.getUserProgress(this.currentUser.id);
    const allLessonsDone = course.lessons.every(l => prog.completedLessons.includes(l.id));

    const sidebarLessonsHtml = course.lessons.map((lesson, idx) => {
      const isDone = prog.completedLessons.includes(lesson.id);
      const isActive = this.activeLessonSubTab !== "exam" && this.activeLessonId === lesson.id;
      return `
        <div class="lesson-item ${isActive ? 'active' : ''}" onclick="app.selectLesson('${lesson.id}')">
          <div>
            <div style="font-size:12px; color:#64748b;">Bài ${idx + 1} - ${lesson.duration}</div>
            <div>${lesson.title}</div>
          </div>
          <span style="font-size:12px; font-weight:600; color:${isDone ? '#15803d' : '#64748b'};">
            ${isDone ? '[Đã hoàn thành]' : '[Chưa học]'}
          </span>
        </div>
      `;
    }).join("");

    let rightPanelHtml = "";
    if (this.activeLessonSubTab === "exam") {
      rightPanelHtml = this.renderFinalExamPanel(course);
    } else {
      const lesson = course.lessons.find(l => l.id === this.activeLessonId) || course.lessons[0];
      rightPanelHtml = this.renderLessonDetailPanel(course, lesson);
    }

    return `
      <div style="margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
        <button class="btn btn-outline btn-sm" onclick="app.switchTab('courses')">Quay lại danh mục khóa học</button>
        <span class="badge badge-info">Khối ${course.grade} - ${course.level}</span>
      </div>

      <div class="classroom-layout">
        <aside class="lesson-sidebar">
          <div class="sidebar-header">
            <h3>${course.title}</h3>
            <p style="font-size:12px; color:#64748b; margin-top:4px;">Giáo viên: ${course.teacher}</p>
          </div>
          ${sidebarLessonsHtml}
          <div style="padding:14px; background-color:#f8fafc; border-top:1px solid #cbd5e1;">
            <div style="font-size:12.5px; font-weight:700; color:#0f2757; margin-bottom:6px; text-transform:uppercase;">
              Bài kiểm tra đánh giá cuối khóa
            </div>
            <p style="font-size:12px; color:#475569; margin-bottom:10px; line-height:1.4;">
              Tiêu chuẩn đạt chứng chỉ: Từ <strong>${this.state.schoolConfig.passScorePercent}%</strong> trở lên (${course.finalExam.length} câu hỏi).
              ${!allLessonsDone ? '<br/>Lưu ý: Khuyến khích hoàn thành đầy đủ bài học trước khi làm bài thi.' : '<br/>Trạng thái: Đã hoàn thành đủ các bài học.'}
            </p>
            <button class="btn btn-accent" style="width:100%;" onclick="app.startFinalExam()">
              Làm bài kiểm tra cuối khóa
            </button>
          </div>
        </aside>

        <section class="lesson-content-panel">
          ${rightPanelHtml}
        </section>
      </div>
    `;
  },

  selectLesson(lessonId) {
    this.stopExamTimer();
    this.activeLessonId = lessonId;
    this.activeLessonSubTab = "theory";
    this.renderMain();
  },

  selectLessonSubTab(subTab) {
    this.activeLessonSubTab = subTab;
    this.renderMain();
  },

  renderLessonDetailPanel(course, lesson) {
    const prog = this.getUserProgress(this.currentUser.id);
    const isCompleted = prog.completedLessons.includes(lesson.id);

    let tabBody = "";
    if (this.activeLessonSubTab === "theory") {
      tabBody = `
        <div style="font-size:14.5px; line-height:1.7;">
          ${lesson.theoryHtml}
        </div>
        <div style="margin-top:24px; padding-top:16px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:13px; color:#64748b;">Nội dung tiếp theo: Từ vựng và luyện phát âm chuẩn</span>
          <button class="btn btn-primary" onclick="app.selectLessonSubTab('vocab')">Chuyển sang phần Từ vựng</button>
        </div>
      `;
    } else if (this.activeLessonSubTab === "vocab") {
      const vocabCards = (lesson.vocab || []).map(v => `
        <div class="vocab-card">
          <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:6px;">
            <div>
              <div class="vocab-word">${v.word}</div>
              <div class="vocab-phonetic">${v.phonetic} - <em>${v.pos}</em></div>
            </div>
            <div style="display:flex; gap:4px;">
              <button class="btn btn-outline btn-sm" onclick="app.speakText('${v.word.replace(/'/g, "\\'")}', 'en-US')">Phát âm US</button>
              <button class="btn btn-outline btn-sm" onclick="app.speakText('${v.word.replace(/'/g, "\\'")}', 'en-GB')">Phát âm UK</button>
            </div>
          </div>
          <div class="vocab-meaning">Nghĩa tiếng Việt: ${v.meaning}</div>
          <div class="vocab-example">
            "${v.example}"
            <div style="margin-top:6px;">
              <button class="btn btn-outline btn-sm" onclick="app.speakText('${v.example.replace(/'/g, "\\'")}', 'en-US')">
                Nghe câu ví dụ
              </button>
            </div>
          </div>
        </div>
      `).join("");

      tabBody = `
        <div style="margin-bottom:14px;">
          <p style="font-size:13.5px; color:#475569;">Chọn nút Phát âm US hoặc UK để nghe chuẩn âm và luyện tập phát âm theo mẫu.</p>
        </div>
        <div class="vocab-grid">
          ${vocabCards}
        </div>
        <div style="margin-top:24px; padding-top:16px; border-top:1px solid #e2e8f0; display:flex; justify-content:flex-end;">
          <button class="btn btn-primary" onclick="app.selectLessonSubTab('listening')">Chuyển sang phần Luyện nghe</button>
        </div>
      `;
    } else if (this.activeLessonSubTab === "listening") {
      const lis = lesson.listening;
      const listeningAttempt = prog.listeningAttempts ? prog.listeningAttempts[lesson.id] : null;

      const linesHtml = (lis.lines || []).map((line, i) => `
        <div class="dialogue-line">
          <div>
            <span class="dialogue-speaker">${line.speaker}:</span>
            <span>${line.text}</span>
          </div>
          <button class="btn btn-outline btn-sm" onclick="app.speakText('${line.text.replace(/'/g, "\\'")}', '${i % 2 === 0 ? 'en-US' : 'en-GB'}')">
            Nghe câu
          </button>
        </div>
      `).join("");

      tabBody = `
        <div style="background-color:#f8fafc; border:1px solid #cbd5e1; border-left:3px solid var(--primary); padding:14px; border-radius:var(--radius-sm); margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
              <h4 style="color:#0f2757; font-size:15px; margin-bottom:2px;">${lis.title}</h4>
              <p style="font-size:13px; color:#334155;">${lis.context}</p>
            </div>
            <button class="btn btn-primary btn-sm" onclick="app.playFullDialogue()">
              Nghe toàn bộ bài
            </button>
          </div>
        </div>

        <h4 style="margin-bottom:8px; font-size:14px;">Nội dung bài đối thoại:</h4>
        ${linesHtml}

        ${lis.checkQuestion ? `
          <div class="quiz-question-card" style="margin-top:18px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
              <h4 style="margin:0; font-size:14px; color:#0f2757;">Listening Comprehension Check: ${lis.checkQuestion.question}</h4>
              ${listeningAttempt ? `<span class="badge ${listeningAttempt.isCorrect ? 'badge-success' : 'badge-danger'}">${listeningAttempt.isCorrect ? 'Answered Correctly' : 'Answered Incorrectly'} (Single Attempt)</span>` : ''}
            </div>
            ${lis.checkQuestion.options.map((opt, idx) => {
              const isSelected = listeningAttempt && listeningAttempt.chosenIdx === idx;
              const isCorrectOpt = idx === lis.checkQuestion.correctIndex;
              let optClass = "quiz-option";
              let labelSuffix = "";
              if (listeningAttempt) {
                optClass += " disabled";
                if (isCorrectOpt) {
                  optClass += " choice-correct";
                  labelSuffix = " (Correct Answer)";
                } else if (isSelected) {
                  optClass += " choice-wrong";
                  labelSuffix = " (Your Choice - Incorrect)";
                }
              }
              return `
                <label class="${optClass}" ${!listeningAttempt ? `onclick="app.checkListeningAnswer('${lesson.id}', ${idx}, ${lis.checkQuestion.correctIndex})"` : ''}>
                  <input type="radio" name="listen-q-${lesson.id}" ${isSelected ? 'checked' : ''} ${listeningAttempt ? 'disabled' : ''} />
                  <span><strong>${String.fromCharCode(65 + idx)}.</strong> ${opt} <em>${labelSuffix}</em></span>
                </label>
              `;
            }).join("")}
            <div id="listen-check-feedback" style="margin-top:8px; font-weight:600; font-size:13px;">
              ${listeningAttempt ? (listeningAttempt.isCorrect ? '<span style="color:#15803d;">Correct! Your choice has been saved to your learning progress record. Retake is prohibited.</span>' : '<span style="color:#b91c1c;">Incorrect. Your choice has been recorded into your academic history. Single-attempt policy: retake is not allowed.</span>') : ''}
            </div>
          </div>
        ` : ''}

        <div style="margin-top:24px; padding-top:16px; border-top:1px solid #e2e8f0; display:flex; justify-content:flex-end;">
          <button class="btn btn-success" onclick="app.selectLessonSubTab('quiz')">Làm bài tập củng cố (English Quiz)</button>
        </div>
      `;
    } else if (this.activeLessonSubTab === "quiz") {
      const quizAttempt = prog.quizAttempts ? prog.quizAttempts[lesson.id] : null;

      if (quizAttempt) {
        // Locked mode
        tabBody = `
          <div class="exam-status-box exam-status-locked">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
              <span class="exam-security-tag" style="background-color:#0f2757;">HỒ SƠ ĐÃ KHÓA / COMPLETED ASSESSMENT</span>
              <span class="badge ${quizAttempt.score >= 60 ? 'badge-success' : 'badge-danger'}">
                ${quizAttempt.score >= 60 ? 'ĐẠT YÊU CẦU HOÀN THÀNH BÀI HỌC (>= 60%)' : 'CHƯA ĐẠT TIÊU CHUẨN (< 60%)'}
              </span>
            </div>
            <h3 style="font-size:16px; margin:8px 0 4px; color:#0f2757;">
              Kết quả bài tập: ${quizAttempt.correct}/${quizAttempt.total} câu đúng (${quizAttempt.score}%)
            </h3>
            <p style="font-size:13px; color:#334155; margin-bottom:6px;">
              Thời gian nộp bài: <strong>${new Date(quizAttempt.submittedAt).toLocaleString('vi-VN')}</strong>
            </p>
            <div style="background-color:#ffffff; border:1px solid #cbd5e1; padding:10px 12px; border-radius:4px; font-size:12.5px; color:#475569; line-height:1.5;">
              <strong>QUY CHẾ KHẢO THÍ:</strong> Mỗi học sinh chỉ được làm bài 01 lần duy nhất. Khi làm sai, hệ thống <strong>TUYỆT ĐỐI KHÔNG CHO LÀM LẠI</strong> để bảo đảm tính trung thực của học bạ điện tử. Kết quả này đã được lưu vĩnh viễn vào hệ thống.
            </div>
          </div>

          <div style="margin-top:14px;">
            ${(lesson.quiz || []).map((q, qIdx) => {
              const studentAns = quizAttempt.answers ? quizAttempt.answers[qIdx] : -1;
              const isRight = studentAns === q.correctIndex;
              return `
                <div class="quiz-question-card" style="border-left: 4px solid ${isRight ? '#16a34a' : '#dc2626'};">
                  <div style="font-weight:700; margin-bottom:8px; font-size:14px;">
                    Question ${qIdx + 1}: ${q.question}
                  </div>
                  ${q.options.map((opt, oIdx) => {
                    const isSelected = studentAns === oIdx;
                    const isCorrectOpt = oIdx === q.correctIndex;
                    let optClass = "quiz-option disabled";
                    let labelSuffix = "";
                    if (isCorrectOpt) {
                      optClass += " choice-correct";
                      labelSuffix = " (Correct Answer)";
                    } else if (isSelected) {
                      optClass += " choice-wrong";
                      labelSuffix = " (Your Choice - Incorrect)";
                    }
                    return `
                      <label class="${optClass}">
                        <input type="radio" disabled ${isSelected ? 'checked' : ''} />
                        <span><strong>${String.fromCharCode(65 + oIdx)}.</strong> ${opt} <em>${labelSuffix}</em></span>
                      </label>
                    `;
                  }).join("")}
                  <div style="margin-top:8px; padding:8px 10px; border-radius:var(--radius-sm); font-size:13px; background-color:#f1f5f9; color:#334155; border-left:3px solid #0f2757;">
                    <strong>Explanation:</strong> ${q.explanation || 'No explanation.'}
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        `;
      } else {
        // Not attempted yet
        const questionsHtml = (lesson.quiz || []).map((q, qIdx) => `
          <div class="quiz-question-card">
            <div style="font-weight:700; margin-bottom:8px; font-size:14px;">
              Question ${qIdx + 1}: ${q.question}
            </div>
            ${q.options.map((opt, oIdx) => `
              <label class="quiz-option">
                <input type="radio" name="lesson-q-${qIdx}" value="${oIdx}" required />
                <span><strong>${String.fromCharCode(65 + oIdx)}.</strong> ${opt}</span>
              </label>
            `).join("")}
          </div>
        `).join("");

        tabBody = `
          <div class="exam-notice-banner">
            <strong>BÀI TẬP CỦNG CỐ KIẾN THỨC (ENGLISH QUIZ - SINGLE ATTEMPT):</strong><br/>
            1. Đề bài, câu hỏi và đáp án biên soạn 100% bằng Tiếng Anh.<br/>
            2. <strong>QUY ĐỊNH 01 LẦN DUY NHẤT:</strong> Học sinh chỉ được thực hiện nộp bài 01 lần. Khi làm sai, hệ thống <strong>TUYỆT ĐỐI KHÔNG CHO PHÉP LÀM LẠI</strong> mà sẽ lưu điểm trực tiếp vào hồ sơ học bạ. Hãy kiểm tra thật kỹ trước khi nộp.
          </div>
          <form onsubmit="app.submitLessonQuiz(event, '${lesson.id}')">
            ${questionsHtml}
            <div style="margin-top:16px; display:flex; justify-content:flex-end;">
              <button type="submit" class="btn btn-success" style="padding:10px 20px; font-size:14px;">
                Nộp bài tập (Submit Assessment - 01 Attempt Only)
              </button>
            </div>
          </form>
        `;
      }
    }

    return `
      <div style="display:flex; justify-content:space-between; align-items:start; gap:12px; flex-wrap:wrap; margin-bottom:12px;">
        <div>
          <h2 style="font-size:18px; font-weight:700; color:#0f2757;">${lesson.title}</h2>
          <p style="font-size:13px; color:#64748b;">Thời lượng dự kiến: ${lesson.duration}</p>
        </div>
        ${isCompleted ? `<span class="badge badge-success">Đã hoàn thành (Điểm: ${prog.lessonScores[lesson.id] || 100}%)</span>` : `<span class="badge badge-warn">Đang học</span>`}
      </div>

      <div class="sub-tabs">
        <button class="sub-tab ${this.activeLessonSubTab === 'theory' ? 'active' : ''}" onclick="app.selectLessonSubTab('theory')">
          1. Lý thuyết và ngữ pháp
        </button>
        <button class="sub-tab ${this.activeLessonSubTab === 'vocab' ? 'active' : ''}" onclick="app.selectLessonSubTab('vocab')">
          2. Từ vựng trọng tâm (${(lesson.vocab || []).length})
        </button>
        <button class="sub-tab ${this.activeLessonSubTab === 'listening' ? 'active' : ''}" onclick="app.selectLessonSubTab('listening')">
          3. Luyện kỹ năng nghe
        </button>
        <button class="sub-tab ${this.activeLessonSubTab === 'quiz' ? 'active' : ''}" onclick="app.selectLessonSubTab('quiz')">
          4. Bài tập củng cố (${(lesson.quiz || []).length} câu)
        </button>
      </div>

      ${tabBody}
    `;
  },

  speakText(text, lang = "en-US") {
    if (!("speechSynthesis" in window)) {
      alert("Trình duyệt không hỗ trợ chức năng phát âm tự động.");
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.92;
    window.speechSynthesis.speak(utter);
  },

  playFullDialogue() {
    const course = this.state.courses.find(c => c.id === this.activeCourseId);
    const lesson = course?.lessons.find(l => l.id === this.activeLessonId);
    if (!lesson || !lesson.listening) return;

    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    lesson.listening.lines.forEach((line, idx) => {
      const utter = new SpeechSynthesisUtterance(`${line.speaker} says: ${line.text}`);
      utter.lang = idx % 2 === 0 ? "en-US" : "en-GB";
      utter.rate = 0.92;
      window.speechSynthesis.speak(utter);
    });
  },

  async checkListeningAnswer(lessonId, chosenIdx, correctIdx) {
    const prog = this.getUserProgress(this.currentUser.id);
    if (!prog.listeningAttempts) prog.listeningAttempts = {};
    if (prog.listeningAttempts[lessonId]) return; // Single attempt rule

    prog.listeningAttempts[lessonId] = {
      chosenIdx,
      isCorrect: chosenIdx === correctIdx,
      submittedAt: new Date().toISOString()
    };
    await this.saveState();
    this.renderMain();
  },

  async submitLessonQuiz(e, lessonId) {
    e.preventDefault();
    const course = this.state.courses.find(c => c.id === this.activeCourseId);
    const lesson = course?.lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    const prog = this.getUserProgress(this.currentUser.id);
    if (prog.quizAttempts && prog.quizAttempts[lessonId]) {
      alert("Bài tập này đã được hoàn thành trước đó. Theo quy chế của nhà trường, mỗi học sinh chỉ được làm 01 lần duy nhất!");
      return;
    }

    const confirmed = confirm("XÁC NHẬN NỘP BÀI TẬP CỦNG CỐ:\n\nBạn có chắc chắn muốn nộp bài? Theo quy định của nhà trường, bạn TUYỆT ĐỐI KHÔNG được làm lại bài tập này sau khi đã nộp. Kết quả sẽ được lưu vĩnh viễn vào học bạ.\n\nNhấn OK để nộp bài.");
    if (!confirmed) return;

    let correct = 0;
    const total = lesson.quiz.length;
    const answers = {};

    lesson.quiz.forEach((q, qIdx) => {
      const selected = document.querySelector(`input[name="lesson-q-${qIdx}"]:checked`);
      const val = selected ? parseInt(selected.value, 10) : -1;
      answers[qIdx] = val;
      if (val === q.correctIndex) {
        correct++;
      }
    });

    const scorePercent = Math.round((correct / total) * 100);
    if (!prog.quizAttempts) prog.quizAttempts = {};
    prog.quizAttempts[lessonId] = {
      score: scorePercent,
      correct,
      total,
      answers,
      submittedAt: new Date().toISOString()
    };
    prog.lessonScores[lessonId] = scorePercent;

    if (scorePercent >= 60) {
      if (!prog.completedLessons.includes(lessonId)) {
        prog.completedLessons.push(lessonId);
      }
    }

    await this.saveState();
    this.renderMain();
  },

  viewExamResultPanel(courseId) {
    this.activeCourseId = courseId;
    this.activeLessonSubTab = "exam";
    this.renderMain();
  },

  confirmAndStartFinalExam() {
    const course = this.state.courses.find(c => c.id === this.activeCourseId);
    if (!course) return;
    const prog = this.getUserProgress(this.currentUser.id);
    if (prog.examAttempts && prog.examAttempts[course.id]) {
      alert("Học sinh đã hoàn tất bài thi cuối khóa này trước đó. Theo quy chế khảo thí của nhà trường, mỗi học sinh chỉ được làm bài 01 lần duy nhất!");
      return;
    }

    const agree = confirm("QUY CHẾ PHÒNG THI TRỰC TUYẾN - TRƯỜNG THPT SỐ 2 NGUYỄN TRƯỜNG TỘ:\n\n1. Bài thi hiển thị 100% bằng Tiếng Anh.\n2. BẮT BUỘC CHẾ ĐỘ TOÀN MÀN HÌNH: Trình duyệt sẽ tự động kích hoạt toàn màn hình. Học sinh TUYỆT ĐỐI KHÔNG được thoát toàn màn hình hoặc chuyển tab.\n3. Nếu thoát toàn màn hình quá 3 lần, hệ thống sẽ tự động đình chỉ và thu bài thi ngay lập tức.\n4. QUY ĐỊNH 01 LẦN DUY NHẤT: Khi làm sai TUYỆT ĐỐI KHÔNG được làm lại, kết quả sẽ được lưu vĩnh viễn vào học bạ tổng kết.\n\nBạn đã sẵn sàng kích hoạt toàn màn hình và bắt đầu làm bài thi?");
    if (!agree) return;

    this.startFinalExam();
  },

  async startFinalExam() {
    const course = this.state.courses.find(c => c.id === this.activeCourseId);
    if (!course) return;

    this.isExamActive = true;
    this.examViolationCount = 0;
    this.activeLessonSubTab = "exam";
    this.examRemainingSeconds = (course.examDurationMinutes || 15) * 60;

    // Kich hoat che do toan man hinh (Request Fullscreen)
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen request warning:", err);
    }

    this.bindExamSecurityListeners();
    this.renderMain();
    this.startExamTimer();
  },

  bindExamSecurityListeners() {
    this.unbindExamSecurityListeners();

    this._onFullScreenChange = () => {
      if (this.isExamActive && !document.fullscreenElement && !document.webkitFullscreenElement) {
        this.handleExamViolation("Bạn vừa thoát khỏi chế độ toàn màn hình!");
      }
    };
    this._onVisibilityChange = () => {
      if (this.isExamActive && document.hidden) {
        this.handleExamViolation("Bạn vừa rời khỏi tab giao diện phòng thi trực tuyến!");
      }
    };
    this._onBeforeUnload = (e) => {
      if (this.isExamActive) {
        e.preventDefault();
        e.returnValue = "Bài thi đang diễn ra, nếu thoát bạn sẽ mất kết quả bài làm!";
        return e.returnValue;
      }
    };
    this._onContextMenu = (e) => {
      if (this.isExamActive) {
        e.preventDefault();
      }
    };

    document.addEventListener("fullscreenchange", this._onFullScreenChange);
    document.addEventListener("webkitfullscreenchange", this._onFullScreenChange);
    document.addEventListener("visibilitychange", this._onVisibilityChange);
    window.addEventListener("beforeunload", this._onBeforeUnload);
    document.addEventListener("contextmenu", this._onContextMenu);
  },

  unbindExamSecurityListeners() {
    if (this._onFullScreenChange) {
      document.removeEventListener("fullscreenchange", this._onFullScreenChange);
      document.removeEventListener("webkitfullscreenchange", this._onFullScreenChange);
    }
    if (this._onVisibilityChange) {
      document.removeEventListener("visibilitychange", this._onVisibilityChange);
    }
    if (this._onBeforeUnload) {
      window.removeEventListener("beforeunload", this._onBeforeUnload);
    }
    if (this._onContextMenu) {
      document.removeEventListener("contextmenu", this._onContextMenu);
    }
  },

  handleExamViolation(reason) {
    if (!this.isExamActive) return;
    this.examViolationCount = (this.examViolationCount || 0) + 1;

    const overlay = document.getElementById("exam-violation-overlay");
    const warningText = document.getElementById("exam-violation-warning-text");

    if (warningText) {
      warningText.innerHTML = `Lý do cảnh báo: ${reason}<br/>Số lần vi phạm: <strong>${this.examViolationCount}/3</strong>. Nếu tiếp tục vi phạm quá 3 lần, hệ thống sẽ tự động đình chỉ bài thi và lưu điểm tại thời điểm hiện tại!`;
    }
    if (overlay) {
      overlay.classList.remove("hidden");
    }

    const ind = document.getElementById("exam-violation-indicator");
    if (ind) {
      ind.textContent = `Cảnh báo vi phạm: ${this.examViolationCount}/3`;
    }

    if (this.examViolationCount >= 3) {
      alert("CẢNH BÁO ĐẶC BIỆT:\n\nBạn đã vi phạm quy chế thi trực tuyến 3 lần do cố tình thoát màn hình hoặc chuyển ứng dụng. Hệ thống tự động thu bài và khóa bài thi ngay lập tức!");
      this.autoSubmitExamDueToViolations();
    }
  },

  async resumeExamFullScreen() {
    const overlay = document.getElementById("exam-violation-overlay");
    if (overlay) overlay.classList.add("hidden");

    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen resume failed", err);
    }
  },

  exitExamFullScreen() {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      }
    } catch (err) {
      console.warn("Exit fullscreen failed", err);
    }
    const overlay = document.getElementById("exam-violation-overlay");
    if (overlay) overlay.classList.add("hidden");
  },

  autoSubmitExamDueToViolations() {
    this.submitFinalExamLogic(true);
  },

  startExamTimer() {
    this.stopExamTimer();
    this.examTimerInterval = setInterval(() => {
      this.examRemainingSeconds--;
      const timerEl = document.getElementById("exam-timer-display");
      if (timerEl) {
        const m = String(Math.floor(this.examRemainingSeconds / 60)).padStart(2, "0");
        const s = String(this.examRemainingSeconds % 60).padStart(2, "0");
        timerEl.textContent = `Time Remaining: ${m}:${s}`;
      }
      if (this.examRemainingSeconds <= 0) {
        this.stopExamTimer();
        alert("Hết thời gian làm bài thi! Hệ thống tự động nộp bài của bạn.");
        this.submitFinalExamLogic(false);
      }
    }, 1000);
  },

  stopExamTimer() {
    if (this.examTimerInterval) {
      clearInterval(this.examTimerInterval);
      this.examTimerInterval = null;
    }
  },

  renderFinalExamPanel(course) {
    const prog = this.getUserProgress(this.currentUser.id);
    const examAttempt = prog.examAttempts ? prog.examAttempts[course.id] : null;

    if (examAttempt) {
      // Locked completed mode
      const questionsReviewHtml = course.finalExam.map((q, idx) => {
        const studentAns = examAttempt.answers ? examAttempt.answers[idx] : -1;
        const isRight = studentAns === q.correctIndex;
        return `
          <div class="quiz-question-card" style="border-left: 4px solid ${isRight ? '#16a34a' : '#dc2626'};">
            <div style="font-weight:700; margin-bottom:8px; font-size:14px;">
              Question ${idx + 1}: ${q.question}
            </div>
            ${q.options.map((opt, oIdx) => {
              const isSelected = studentAns === oIdx;
              const isCorrectOpt = oIdx === q.correctIndex;
              let optClass = "quiz-option disabled";
              let labelSuffix = "";
              if (isCorrectOpt) {
                optClass += " choice-correct";
                labelSuffix = " (Correct Answer)";
              } else if (isSelected) {
                optClass += " choice-wrong";
                labelSuffix = " (Your Choice - Incorrect)";
              }
              return `
                <label class="${optClass}">
                  <input type="radio" disabled ${isSelected ? 'checked' : ''} />
                  <span><strong>${String.fromCharCode(65 + oIdx)}.</strong> ${opt} <em>${labelSuffix}</em></span>
                </label>
              `;
            }).join("")}
          </div>
        `;
      }).join("");

      return `
        <div class="exam-status-box ${examAttempt.passed ? 'exam-status-passed' : 'exam-status-failed'}">
          <span class="exam-security-tag" style="background-color:${examAttempt.passed ? '#15803d' : '#b91c1c'};">
            ${examAttempt.passed ? 'KỲ THI ĐÃ HOÀN TẤT - ĐẠT CHUẨN CẤP CHỨNG CHỈ' : 'KỲ THI ĐÃ HOÀN TẤT - CHƯA ĐẠT CHUẨN'}
          </span>
          <h2 style="font-size:18px; margin:8px 0 6px; color:#0f2757;">
            Điểm số chính thức: ${examAttempt.score}/100 điểm (${examAttempt.correct}/${examAttempt.total} câu đúng)
          </h2>
          <p style="font-size:13.5px; margin-bottom:8px;">
            Xếp loại: <strong>${examAttempt.classification || (examAttempt.passed ? 'Đạt' : 'Chưa đạt')}</strong> | 
            Ngày nộp bài: <strong>${new Date(examAttempt.submittedAt).toLocaleString('vi-VN')}</strong> | 
            Cảnh báo thoát màn hình: <strong>${examAttempt.violations || 0} lần</strong>
            ${examAttempt.isAutoViolated ? '<br/><span style="color:#b91c1c; font-weight:700;">Ghi chú: Bài thi bị thu tự động do vi phạm thoát toàn màn hình quá 3 lần.</span>' : ''}
          </p>
          <p style="font-size:13px; margin:0; line-height:1.5;">
            <strong>QUY CHẾ KHẢO THÍ CHÍNH THỨC:</strong> Kỳ thi đánh giá năng lực cuối khóa chỉ được thực hiện 01 lần duy nhất. Kết quả đã được niêm phong vào hồ sơ học bạ điện tử của học sinh và không thể sửa đổi hoặc thi lại dưới bất kỳ hình thức nào.
          </p>
          ${examAttempt.passed ? `
            <div style="margin-top:14px;">
              <button class="btn btn-accent" onclick="app.switchTab('certificates')">Xem Chứng Chỉ Chính Thức</button>
            </div>
          ` : `
            <div style="margin-top:14px;">
              <button class="btn btn-primary btn-sm" onclick="app.switchTab('transcript')">Xem Bảng Điểm Tổng Kết Học Bạ</button>
            </div>
          `}
        </div>

        <h3 style="font-size:16px; color:#0f2757; margin-bottom:12px;">Nội dung đề thi và đáp án chi tiết (English Examination Review):</h3>
        ${questionsReviewHtml}
      `;
    }

    // Active exam mode (Full Screen)
    if (this.isExamActive) {
      const m = String(Math.floor(this.examRemainingSeconds / 60)).padStart(2, "0");
      const s = String(this.examRemainingSeconds % 60).padStart(2, "0");

      const questionsHtml = course.finalExam.map((q, idx) => `
        <div class="quiz-question-card">
          <div style="font-weight:700; margin-bottom:8px; font-size:14px;">
            Question ${idx + 1}: ${q.question}
          </div>
          ${q.options.map((opt, oIdx) => `
            <label class="quiz-option">
              <input type="radio" name="final-exam-q-${idx}" value="${oIdx}" required />
              <span><strong>${String.fromCharCode(65 + oIdx)}.</strong> ${opt}</span>
            </label>
          `).join("")}
        </div>
      `).join("");

      return `
        <div class="exam-fs-bar">
          <div>
            <span class="exam-security-tag">PHÒNG THI TRỰC TUYẾN - GIÁM SÁT TOÀN MÀN HÌNH</span>
            <h2 style="font-size:17px; color:#ffffff; margin:4px 0 2px;">${course.title}</h2>
            <p style="font-size:12.5px; color:#cbd5e1; margin:0;">
              Thí sinh: <strong>${this.currentUser.fullName}</strong> (${this.currentUser.id}) - Lớp: <strong>${this.currentUser.className}</strong>
            </p>
          </div>
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <div class="exam-violations-tag" id="exam-violation-indicator">
              Cảnh báo vi phạm: ${this.examViolationCount || 0}/3
            </div>
            <div id="exam-timer-display" style="background-color:rgba(255,255,255,0.18); border:1px solid rgba(255,255,255,0.3); padding:8px 14px; border-radius:var(--radius-sm); font-weight:700; font-size:14px; color:#ffffff;">
              Time Remaining: ${m}:${s}
            </div>
          </div>
        </div>

        <div style="background-color:#fee2e2; border:1px solid #fca5a5; padding:10px 14px; border-radius:var(--radius-sm); margin-bottom:16px; font-size:13px; color:#991b1b; font-weight:600;">
          Lưu ý nghiêm cấm: Tuyệt đối không thoát toàn màn hình (phím ESC / F11) hoặc chuyển tab ứng dụng. Mọi thao tác rời màn hình thi đều được hệ thống ghi nhận.
        </div>

        <form id="final-exam-form" onsubmit="app.submitFinalExam(event, '${course.id}')">
          ${questionsHtml}
          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
            <button type="submit" class="btn btn-accent" style="padding:12px 24px; font-size:14.5px;">
              Nộp bài thi chính thức (Submit Final Exam)
            </button>
          </div>
        </form>
      `;
    }

    // Pre-Exam briefing view (Not yet started)
    return `
      <div style="background-color:#ffffff; border:1px solid #cbd5e1; border-radius:var(--radius-sm); padding:24px;">
        <div style="border-bottom:2px solid #0f2757; padding-bottom:12px; margin-bottom:16px;">
          <span class="badge badge-info" style="margin-bottom:6px;">KỲ THI ĐÁNH GIÁ NĂNG LỰC CUỐI KHÓA</span>
          <h2 style="color:#0f2757; font-size:20px; margin-top:4px;">${course.title}</h2>
          <p style="font-size:13.5px; color:#64748b; margin-top:2px;">
            Thời lượng: <strong>${course.examDurationMinutes || 15} phút</strong> - Số lượng: <strong>${course.finalExam.length} câu trắc nghiệm</strong> - Điểm chuẩn đạt chứng chỉ: <strong>${this.state.schoolConfig.passScorePercent}%</strong>
          </p>
        </div>

        <div style="background-color:#fef2f2; border:1px solid #fecaca; border-left:4px solid #b91c1c; padding:16px; margin-bottom:20px;">
          <h4 style="color:#991b1b; font-size:15px; margin-bottom:10px; text-transform:uppercase;">QUY CHẾ KHẢO THÍ TRỰC TUYẾN BẮT BUỘC:</h4>
          <ul style="margin-left:20px; font-size:13.5px; color:#7f1d1d; line-height:1.65;">
            <li><strong>1. Đề thi 100% bằng Tiếng Anh:</strong> Toàn bộ câu hỏi, lựa chọn và hướng dẫn hiển thị hoàn toàn bằng Tiếng Anh chuẩn.</li>
            <li><strong>2. Bắt buộc chế độ toàn màn hình:</strong> Khi bấm nút Bắt đầu, hệ thống sẽ tự động bật toàn màn hình. Học sinh <strong>TUYỆT ĐỐI KHÔNG ĐƯỢC THOÁT RA NGOÀI</strong>, không chuyển tab, không mở tài liệu khác.</li>
            <li><strong>3. Giám sát vi phạm tự động:</strong> Mọi hành vi thoát màn hình sẽ bị cảnh báo ngay. Nếu vi phạm quá 3 lần, hệ thống sẽ tự động thu bài và khóa bài thi ngay lập tức.</li>
            <li><strong>4. QUY ĐỊNH 01 LẦN DUY NHẤT:</strong> Khi làm sai <strong>TUYỆT ĐỐI KHÔNG CHO PHÉP LÀM LẠI</strong>. Toàn bộ điểm số được lưu vĩnh viễn vào hệ thống học bạ điện tử của Trường THPT Số 2 Nguyễn Trường Tộ.</li>
          </ul>
        </div>

        <button class="btn btn-accent" style="width:100%; padding:14px; font-size:15px; font-weight:700;" onclick="app.confirmAndStartFinalExam()">
          BẮT ĐẦU BÀI KIỂM TRA VÀ KÍCH HOẠT CHẾ ĐỘ TOÀN MÀN HÌNH
        </button>
      </div>
    `;
  },

  async submitFinalExam(e, courseId) {
    if (e) e.preventDefault();
    const confirmed = confirm("XÁC NHẬN NỘP BÀI THI CUỐI KHÓA:\n\nBạn có chắc chắn muốn nộp bài thi? Theo quy chế khảo thí, bạn TUYỆT ĐỐI KHÔNG được làm lại bài thi này. Điểm số sẽ được niêm phong vào hồ sơ học bạ.\n\nNhấn OK để nộp bài.");
    if (!confirmed) return;

    this.submitFinalExamLogic(false);
  },

  async submitFinalExamLogic(isAutoViolated = false) {
    this.stopExamTimer();
    this.unbindExamSecurityListeners();
    this.exitExamFullScreen();
    this.isExamActive = false;

    const course = this.state.courses.find(c => c.id === this.activeCourseId);
    if (!course) return;

    let correct = 0;
    const total = course.finalExam.length;
    const answers = {};

    course.finalExam.forEach((q, idx) => {
      const checked = document.querySelector(`input[name="final-exam-q-${idx}"]:checked`);
      const val = checked ? parseInt(checked.value, 10) : -1;
      answers[idx] = val;
      if (val === q.correctIndex) {
        correct++;
      }
    });

    const scorePercent = Math.round((correct / total) * 100);
    const passThreshold = this.state.schoolConfig.passScorePercent || 70;
    const prog = this.getUserProgress(this.currentUser.id);
    const passed = scorePercent >= passThreshold;
    const classification = scorePercent >= 85 ? "Xuất sắc (Distinction)" : scorePercent >= 75 ? "Giỏi (Merit)" : scorePercent >= passThreshold ? "Đạt (Pass)" : "Chưa đạt";
    const todayStr = new Date().toLocaleDateString("vi-VN");

    let certId = null;
    if (passed) {
      course.lessons.forEach(l => {
        if (!prog.completedLessons.includes(l.id)) prog.completedLessons.push(l.id);
      });

      let cert = this.state.certificates.find(c => c.userId === this.currentUser.id && c.courseId === course.id);
      if (!cert) {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        certId = `CERT-THPT-2026-${randomNum}`;
        cert = {
          certId,
          userId: this.currentUser.id,
          studentName: this.currentUser.fullName,
          className: this.currentUser.className,
          grade: this.currentUser.grade || course.grade,
          courseId: course.id,
          courseTitle: course.title,
          level: course.level,
          score: scorePercent,
          classification,
          issuedDate: todayStr,
          schoolName: this.state.schoolConfig.schoolName,
          principalName: this.state.schoolConfig.principalName,
          headTeacherName: "Thầy Nguyễn Hải Nam"
        };
        this.state.certificates.unshift(cert);
      } else {
        certId = cert.certId;
        cert.score = scorePercent;
        cert.classification = classification;
      }
    }

    prog.examScores[course.id] = scorePercent;
    if (!prog.examAttempts) prog.examAttempts = {};
    prog.examAttempts[course.id] = {
      score: scorePercent,
      correct,
      total,
      answers,
      submittedAt: new Date().toISOString(),
      passed,
      classification,
      certId,
      violations: this.examViolationCount || 0,
      isAutoViolated
    };

    await this.saveState();
    this.renderNavTabs();
    this.renderMain();
  },

  renderStudentCertificatesView() {
    const myCerts = this.state.certificates.filter(c => c.userId === this.currentUser.id);
    if (myCerts.length === 0) {
      return `
        <div style="background-color:#ffffff; padding:40px 20px; border-radius:var(--radius-sm); text-align:center; border:1px solid var(--border-color);">
          <h3 style="font-size:17px; margin-bottom:6px; color:#0f2757;">Hồ sơ hiện tại chưa có chứng chỉ</h3>
          <p style="color:#64748b; max-width:520px; margin:0 auto 16px; font-size:13.5px;">
            Vui lòng hoàn thành các bài học và đạt từ ${this.state.schoolConfig.passScorePercent}% trở lên trong bài kiểm tra cuối khóa để được cấp giấy chứng nhận.
          </p>
          <button class="btn btn-primary" onclick="app.switchTab('courses')">Xem danh mục khóa học</button>
        </div>
      `;
    }

    const certsHtml = myCerts.map(cert => this.renderSingleCertificateCard(cert)).join("");
    return `
      <div class="no-print" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; flex-wrap:wrap; gap:12px;">
        <div>
          <h2 style="font-size:18px; font-weight:700; color:#0f2757;">Hồ sơ chứng chỉ cá nhân</h2>
          <p style="font-size:13px; color:#64748b;">Mỗi chứng chỉ được cấp có mã định danh và mã QR để đối chiếu xác thực thông tin.</p>
        </div>
        <button class="btn btn-primary" onclick="window.print()">In chứng chỉ (Lưu PDF)</button>
      </div>
      <div id="printable-cert-area">
        ${certsHtml}
      </div>
    `;
  },

  renderSingleCertificateCard(cert) {
    return `
      <div class="certificate-frame">
        <div>
          <div style="text-align:center; margin-bottom:6px;">
            <img src="logo.png" alt="Logo Trường THPT Số 2 Nguyễn Trường Tộ" style="width:68px; height:68px; object-fit:contain; border-radius:50%; border:1px solid #cbd5e1;" />
          </div>
          <div class="cert-header-republic">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div style="font-size:12px; font-weight:700; margin-bottom:8px; color:#334155;">Độc lập - Tự do - Hạnh phúc</div>
          <div class="cert-school-title">${cert.schoolName || this.state.schoolConfig.schoolName}</div>
          <div class="cert-main-heading">CERTIFICATE OF COMPLETION</div>
          <div class="cert-sub-heading">GIẤY CHỨNG NHẬN HOÀN THÀNH KHÓA HỌC TIẾNG ANH</div>

          <p style="font-size:14px; color:#475569; margin-top:10px;">Ban Giám hiệu và Tổ Ngoại ngữ chứng nhận học sinh:</p>
          <div class="cert-student-name">${cert.studentName}</div>
          <p style="font-size:13.5px; color:#334155; margin-bottom:8px;">
            Mã số học sinh: <strong>${cert.userId}</strong> &nbsp;|&nbsp; Lớp: <strong>${cert.className}</strong> (Khối ${cert.grade})
          </p>

          <p style="font-size:14px; color:#475569;">Đã hoàn thành chương trình bồi dưỡng và vượt qua kỳ kiểm tra đánh giá năng lực:</p>
          <div class="cert-course-title">${cert.courseTitle}</div>

          <div style="display:inline-flex; gap:16px; background-color:#f8fafc; border:1px solid #cbd5e1; padding:6px 18px; border-radius:var(--radius-sm); margin:10px 0; font-size:13.5px;">
            <span>Trình độ: <strong>${cert.level}</strong></span>
            <span>-</span>
            <span>Điểm đánh giá: <strong>${cert.score}/100</strong></span>
            <span>-</span>
            <span>Xếp loại: <strong>${cert.classification}</strong></span>
          </div>

          <div class="cert-footer-grid">
            <div style="text-align:center;">
              <canvas class="qr-canvas" data-code="${cert.certId}" width="88" height="88" style="border:1px solid #cbd5e1; padding:3px; background-color:#ffffff;"></canvas>
              <div style="font-size:11.5px; color:#475569; margin-top:4px;">
                Mã số: <strong>${cert.certId}</strong><br/>
                Ngày cấp: ${cert.issuedDate}
              </div>
            </div>

            <div style="text-align:center;">
              <div style="font-size:12.5px; font-weight:700; color:#334155; text-transform:uppercase;">TỔ TRƯỞNG CHUYÊN MÔN</div>
              <div style="height:38px; display:flex; align-items:center; justify-content:center; font-size:13px; color:#64748b; font-style:italic;">(Đã ký xác nhận)</div>
              <div style="font-size:13.5px; font-weight:700; color:#0f2757;">Thầy Nguyễn Hải Nam</div>
            </div>

            <div style="text-align:center;">
              <div style="font-size:12.5px; font-weight:700; color:#334155; text-transform:uppercase;">HIỆU TRƯỞNG</div>
              <div class="cert-seal">TRƯỜNG THPT SỐ 2<br/>NGUYỄN TRƯỜNG TỘ<br/>ĐÃ XÁC THỰC</div>
              <div style="font-size:13.5px; font-weight:700; color:#0f2757;">${cert.principalName || this.state.schoolConfig.principalName}</div>
            </div>
          </div>

          <div class="no-print" style="margin-top:16px; text-align:right;">
            <button class="btn btn-outline btn-sm" onclick="app.openVerifyModal('${cert.certId}')">
              Tra cứu mã xác thực ${cert.certId}
            </button>
          </div>
        </div>
      </div>
    `;
  },

  drawAllQrCanvases() {
    const canvases = document.querySelectorAll(".qr-canvas");
    canvases.forEach(canvas => {
      const code = canvas.getAttribute("data-code") || "CERT";
      const ctx = canvas.getContext("2d");
      const size = 21;
      const cell = canvas.width / size;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#0f2757";

      const drawFinder = (r0, c0) => {
        for (let r = 0; r < 7; r++) {
          for (let c = 0; c < 7; c++) {
            if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
              ctx.fillRect((c0 + c) * cell, (r0 + r) * cell, Math.ceil(cell), Math.ceil(cell));
            }
          }
        }
      };

      drawFinder(0, 0);
      drawFinder(0, size - 7);
      drawFinder(size - 7, 0);

      let hash = 2166136261;
      for (let i = 0; i < code.length; i++) {
        hash ^= code.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const inFinder = (r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8);
          if (inFinder) continue;
          hash ^= (r * 31 + c * 17);
          hash = Math.imul(hash, 16777619);
          if ((Math.abs(hash) % 10) < 5) {
            ctx.fillRect(c * cell, r * cell, Math.ceil(cell), Math.ceil(cell));
          }
        }
      }
    });
  },

  openVerifyModal(prefillCode = "") {
    const modal = document.getElementById("modal-verify");
    modal.classList.remove("hidden");
    const input = document.getElementById("verify-input-code");
    if (prefillCode) {
      input.value = prefillCode;
      this.verifyCertificateCode();
    } else {
      document.getElementById("verify-result-box").innerHTML = "";
    }
  },

  closeVerifyModal() {
    document.getElementById("modal-verify").classList.add("hidden");
  },

  verifyCertificateCode() {
    const code = document.getElementById("verify-input-code").value.trim().toUpperCase();
    const resBox = document.getElementById("verify-result-box");
    if (!code) {
      resBox.innerHTML = `<p style="color:#b91c1c; font-size:13.5px;">Vui lòng nhập mã chứng chỉ cần tra cứu.</p>`;
      return;
    }

    const cert = this.state.certificates.find(c => c.certId.toUpperCase() === code);
    if (!cert) {
      resBox.innerHTML = `
        <div style="background-color:#fee2e2; border:1px solid #fca5a5; padding:12px; border-radius:var(--radius-sm); color:#991b1b; font-size:13.5px;">
          <strong>Không tìm thấy dữ liệu:</strong> Mã chứng chỉ <code>${code}</code> không tồn tại trong sổ gốc của nhà trường.
        </div>
      `;
      return;
    }

    resBox.innerHTML = `
      <div style="background-color:#dcfce7; border:1px solid #86efac; padding:14px; border-radius:var(--radius-sm);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span class="badge badge-success">CHỨNG CHỈ HỢP LỆ VÀ ĐÃ XÁC THỰC</span>
          <span style="font-size:12.5px; color:#166534; font-weight:700;">${cert.certId}</span>
        </div>
        <table style="width:100%; font-size:13px; border-collapse:collapse;">
          <tr><td style="padding:4px 0; color:#475569;">Học sinh:</td><td style="font-weight:700;">${cert.studentName} (${cert.userId})</td></tr>
          <tr><td style="padding:4px 0; color:#475569;">Lớp và Khối:</td><td style="font-weight:700;">Lớp ${cert.className} (Khối ${cert.grade})</td></tr>
          <tr><td style="padding:4px 0; color:#475569;">Khóa học hoàn thành:</td><td style="font-weight:700; color:#0f2757;">${cert.courseTitle}</td></tr>
          <tr><td style="padding:4px 0; color:#475569;">Kết quả đánh giá:</td><td style="font-weight:700; color:#15803d;">${cert.score}/100 điểm - ${cert.classification}</td></tr>
          <tr><td style="padding:4px 0; color:#475569;">Ngày cấp:</td><td>${cert.issuedDate} - ${cert.schoolName}</td></tr>
          <tr><td style="padding:4px 0; color:#475569;">Tổ trưởng chuyên môn:</td><td style="font-weight:700;">Thầy Nguyễn Hải Nam</td></tr>
        </table>
      </div>
    `;
  },

  renderStudentTranscriptView() {
    return this.buildTranscriptHtmlForUser(this.currentUser);
  },

  viewStudentTranscriptModal(studentId) {
    const student = this.state.users.find(u => u.id === studentId);
    if (!student) return;
    const modal = document.getElementById("modal-generic");
    const box = document.getElementById("modal-generic-content");
    box.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid #cbd5e1; padding-bottom:8px;">
        <h3 style="color:#0f2757; font-size:17px; margin:0;">Hồ sơ học bạ học sinh: ${student.fullName} (${student.id})</h3>
        <button class="btn btn-outline btn-sm" onclick="app.closeGenericModal()">Đóng</button>
      </div>
      ${this.buildTranscriptHtmlForUser(student)}
    `;
    modal.classList.remove("hidden");
  },

  closeGenericModal() {
    const modal = document.getElementById("modal-generic");
    if (modal) modal.classList.add("hidden");
  },

  buildTranscriptHtmlForUser(student) {
    const prog = this.getUserProgress(student.id);
    const myCerts = this.state.certificates.filter(c => c.userId === student.id);

    const allQuizRows = [];
    this.state.courses.forEach(course => {
      course.lessons.forEach((l, lIdx) => {
        const attempt = prog.quizAttempts ? prog.quizAttempts[l.id] : null;
        allQuizRows.push({
          courseTitle: course.title,
          lessonTitle: `Bài ${lIdx + 1}: ${l.title}`,
          lessonId: l.id,
          attempt
        });
      });
    });

    const allExamRows = this.state.courses.map(course => {
      const attempt = prog.examAttempts ? prog.examAttempts[course.id] : null;
      return {
        course,
        attempt
      };
    });

    const completedQuizzesCount = allQuizRows.filter(r => r.attempt).length;
    const totalQuizzesCount = allQuizRows.length;
    const avgScore = completedQuizzesCount > 0 
      ? Math.round(allQuizRows.filter(r => r.attempt).reduce((sum, r) => sum + r.attempt.score, 0) / completedQuizzesCount) 
      : 0;

    return `
      <div style="background-color:#ffffff; border:1px solid #cbd5e1; border-radius:var(--radius-sm); padding:20px; margin-bottom:18px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; border-bottom:2px solid #0f2757; padding-bottom:14px; margin-bottom:16px;">
          <div>
            <span class="badge badge-info" style="margin-bottom:4px;">HỌC BẠ ĐIỆN TỬ NỘI BỘ</span>
            <h2 style="font-size:18px; color:#0f2757; margin:0;">BẢNG TỔNG KẾT ĐÁNH GIÁ QUÁ TRÌNH HỌC TẬP MÔN TIẾNG ANH</h2>
            <p style="font-size:13px; color:#64748b; margin-top:3px;">
              Học sinh: <strong>${student.fullName}</strong> | Mã số: <strong>${student.id}</strong> | Lớp: <strong>${student.className}</strong> | Niên khóa: <strong>2025 - 2026</strong>
            </p>
          </div>
          <div style="text-align:right;">
            <div style="font-size:12px; color:#64748b;">Trường THPT Số 2 Nguyễn Trường Tộ</div>
            <div style="font-size:12.5px; font-weight:700; color:#0f2757;">Hệ thống Khảo thí & LMS Tiếng Anh</div>
          </div>
        </div>

        <div style="background-color:#f8fafc; border:1px solid #e2e8f0; padding:12px 16px; border-radius:var(--radius-sm); margin-bottom:18px; font-size:13px; color:#334155; line-height:1.5;">
          <strong>QUY CHẾ KHẢO THÍ:</strong> Tất cả các bài tập củng cố và bài kiểm tra đánh giá cuối khóa đều được quy định <strong>thực hiện 01 lần duy nhất</strong>. Khi học sinh làm sai, hệ thống <strong>TUYỆT ĐỐI KHÔNG CHO PHÉP LÀM LẠI</strong> để đảm bảo sự trung thực và đánh giá đúng thực chất năng lực. Toàn bộ kết quả được lưu trữ vĩnh viễn vào học bạ điện tử.
        </div>

        <div class="stats-grid" style="margin-bottom:18px;">
          <div class="stat-card">
            <div class="stat-info">
              <h3>${completedQuizzesCount}/${totalQuizzesCount}</h3>
              <p>Bài tập củng cố đã hoàn thành</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-info">
              <h3>${avgScore}%</h3>
              <p>Điểm trung bình bài tập củng cố</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-info">
              <h3>${myCerts.length}</h3>
              <p>Chứng chỉ đã được cấp</p>
            </div>
          </div>
        </div>

        <h3 style="font-size:15px; color:#0f2757; margin-bottom:10px;">1. Bảng Điểm Bài Tập Củng Cố Từng Bài Học (English Lesson Quizzes - Single Attempt):</h3>
        <div style="overflow-x:auto; margin-bottom:24px;">
          <table class="assessment-table">
            <thead>
              <tr>
                <th style="width:40px;">STT</th>
                <th>Khóa học</th>
                <th>Tên bài học</th>
                <th>Điểm số</th>
                <th>Số câu đúng</th>
                <th>Thời gian nộp</th>
                <th>Đánh giá</th>
                <th>Trạng thái hồ sơ</th>
              </tr>
            </thead>
            <tbody>
              ${allQuizRows.map((row, idx) => {
                if (row.attempt) {
                  return `
                    <tr>
                      <td>${idx + 1}</td>
                      <td>${row.courseTitle}</td>
                      <td><strong>${row.lessonTitle}</strong></td>
                      <td><strong style="color:${row.attempt.score >= 60 ? '#15803d' : '#b91c1c'};">${row.attempt.score}%</strong></td>
                      <td>${row.attempt.correct}/${row.attempt.total} câu</td>
                      <td>${new Date(row.attempt.submittedAt).toLocaleString('vi-VN')}</td>
                      <td><span class="badge ${row.attempt.score >= 60 ? 'badge-success' : 'badge-danger'}">${row.attempt.score >= 60 ? 'Đạt chuẩn' : 'Chưa đạt'}</span></td>
                      <td><span class="badge badge-attempt-locked" style="background-color:#e2e8f0; color:#334155;">Đã khóa vĩnh viễn</span></td>
                    </tr>
                  `;
                } else {
                  return `
                    <tr style="color:#94a3b8;">
                      <td>${idx + 1}</td>
                      <td>${row.courseTitle}</td>
                      <td>${row.lessonTitle}</td>
                      <td>Chưa làm</td>
                      <td>--</td>
                      <td>--</td>
                      <td><span class="badge badge-warn">Chưa hoàn thành</span></td>
                      <td>Chưa làm</td>
                    </tr>
                  `;
                }
              }).join("")}
            </tbody>
          </table>
        </div>

        <h3 style="font-size:15px; color:#0f2757; margin-bottom:10px;">2. Bảng Điểm Bài Kiểm Tra Cuối Khóa (Final Exams - Full Screen Proctored):</h3>
        <div style="overflow-x:auto;">
          <table class="assessment-table">
            <thead>
              <tr>
                <th style="width:40px;">STT</th>
                <th>Khóa học</th>
                <th>Điểm thi chính thức</th>
                <th>Điểm chuẩn</th>
                <th>Xếp loại tốt nghiệp</th>
                <th>Cảnh báo toàn màn hình</th>
                <th>Chứng chỉ</th>
                <th>Thời gian nộp</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              ${allExamRows.map((r, idx) => {
                if (r.attempt) {
                  return `
                    <tr>
                      <td>${idx + 1}</td>
                      <td><strong>${r.course.title}</strong></td>
                      <td><strong style="font-size:15px; color:${r.attempt.passed ? '#15803d' : '#b91c1c'};">${r.attempt.score}/100</strong></td>
                      <td>${this.state.schoolConfig.passScorePercent}%</td>
                      <td>${r.attempt.classification || (r.attempt.passed ? 'Đạt' : 'Chưa đạt')}</td>
                      <td>${r.attempt.violations || 0} lần</td>
                      <td>${r.attempt.certId ? `<code>${r.attempt.certId}</code>` : 'Chưa đủ điểm'}</td>
                      <td>${new Date(r.attempt.submittedAt).toLocaleString('vi-VN')}</td>
                      <td><span class="badge ${r.attempt.passed ? 'badge-success' : 'badge-danger'}">${r.attempt.passed ? 'Đạt chuẩn' : 'Chưa đạt'} (Đã khóa)</span></td>
                    </tr>
                  `;
                } else {
                  return `
                    <tr style="color:#94a3b8;">
                      <td>${idx + 1}</td>
                      <td>${r.course.title}</td>
                      <td>Chưa thi</td>
                      <td>${this.state.schoolConfig.passScorePercent}%</td>
                      <td>--</td>
                      <td>--</td>
                      <td>--</td>
                      <td>--</td>
                      <td><span class="badge badge-warn">Chưa làm bài thi</span></td>
                    </tr>
                  `;
                }
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderAdminStudents() {
    const students = this.state.users.filter(u => u.role === "student");

    const rowsHtml = students.map(s => {
      const prog = this.getUserProgress(s.id);
      const certsCount = this.state.certificates.filter(c => c.userId === s.id).length;
      return `
        <tr>
          <td><strong>${s.id}</strong></td>
          <td>${s.fullName}</td>
          <td><span class="badge badge-info">Lớp ${s.className}</span></td>
          <td><code>${s.password}</code></td>
          <td>${prog.completedLessons.length} bài đã học</td>
          <td>${certsCount > 0 ? `<span class="badge badge-success">${certsCount} chứng chỉ</span>` : `<span style="color:#64748b; font-size:12.5px;">Chưa có</span>`}</td>
          <td>
            <div style="display:flex; gap:4px;">
              <button class="btn btn-primary btn-sm" onclick="app.viewStudentTranscriptModal('${s.id}')">Học bạ</button>
              <button class="btn btn-outline btn-sm" onclick="app.resetStudentPassword('${s.id}')">Đặt lại MK</button>
              <button class="btn btn-danger btn-sm" onclick="app.deleteStudent('${s.id}')">Xóa</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    return `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
        <div>
          <h2 style="font-size:18px; font-weight:700; color:#0f2757;">Quản lý danh sách học sinh (${students.length} học sinh)</h2>
          <p style="font-size:13px; color:#64748b;">Chỉ học sinh có tên trong danh sách lớp mới có quyền đăng nhập vào hệ thống.</p>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-outline btn-sm" onclick="app.openBulkImportModal()">Nhập danh sách theo lớp</button>
          <button class="btn btn-primary btn-sm" onclick="app.openAddStudentModal()">Thêm học sinh mới</button>
        </div>
      </div>

      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã học sinh</th>
              <th>Họ và tên</th>
              <th>Lớp</th>
              <th>Mật khẩu</th>
              <th>Tiến độ học tập</th>
              <th>Chứng chỉ</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  },

  openAddStudentModal() {
    const modal = document.getElementById("modal-generic");
    const box = document.getElementById("modal-generic-content");
    const nextNum = 1000 + this.state.users.length;
    box.innerHTML = `
      <h3 style="font-size:17px; margin-bottom:12px; color:#0f2757;">Thêm tài khoản học sinh</h3>
      <form onsubmit="app.saveNewStudent(event)">
        <div class="form-group">
          <label>Mã số học sinh (Dùng để đăng nhập)</label>
          <input type="text" id="new-stu-id" class="form-control" value="HS${nextNum}" required />
        </div>
        <div class="form-group">
          <label>Họ và tên học sinh</label>
          <input type="text" id="new-stu-name" class="form-control" placeholder="Ví dụ: Nguyễn Văn An" required />
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div class="form-group">
            <label>Khối lớp</label>
            <select id="new-stu-grade" class="form-control">
              <option value="10">Khối 10</option>
              <option value="11">Khối 11</option>
              <option value="12">Khối 12</option>
            </select>
          </div>
          <div class="form-group">
            <label>Tên lớp</label>
            <input type="text" id="new-stu-class" class="form-control" value="10A1" required />
          </div>
        </div>
        <div class="form-group">
          <label>Mật khẩu khởi tạo</label>
          <input type="text" id="new-stu-pass" class="form-control" value="123" required />
        </div>
        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
          <button type="button" class="btn btn-outline btn-sm" onclick="app.closeGenericModal()">Hủy</button>
          <button type="submit" class="btn btn-primary btn-sm">Lưu thông tin</button>
        </div>
      </form>
    `;
    modal.classList.remove("hidden");
  },

  async saveNewStudent(e) {
    e.preventDefault();
    const id = document.getElementById("new-stu-id").value.trim().toUpperCase();
    const fullName = document.getElementById("new-stu-name").value.trim();
    const grade = document.getElementById("new-stu-grade").value;
    const className = document.getElementById("new-stu-class").value.trim().toUpperCase();
    const password = document.getElementById("new-stu-pass").value.trim();

    if (this.state.users.some(u => u.id.toUpperCase() === id)) {
      alert("Mã số học sinh này đã tồn tại trong hệ thống.");
      return;
    }

    this.state.users.push({
      id,
      username: id,
      password,
      fullName,
      role: "student",
      grade,
      className,
      active: true
    });

    await this.saveState();
    this.closeGenericModal();
    this.renderMain();
  },

  openBulkImportModal() {
    const modal = document.getElementById("modal-generic");
    const box = document.getElementById("modal-generic-content");
    box.innerHTML = `
      <h3 style="font-size:17px; margin-bottom:6px; color:#0f2757;">Nhập danh sách học sinh theo lớp</h3>
      <p style="font-size:13px; color:#475569; margin-bottom:12px;">
        Định dạng mỗi dòng: <code>Mã_HS, Họ và tên, Lớp, Mật_khẩu</code> (hoặc chỉ cần nhập Họ và tên trên từng dòng).
      </p>
      <form onsubmit="app.handleBulkImport(event)">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div class="form-group">
            <label>Lớp mặc định</label>
            <input type="text" id="bulk-default-class" class="form-control" value="10A2" required />
          </div>
          <div class="form-group">
            <label>Mật khẩu mặc định</label>
            <input type="text" id="bulk-default-pass" class="form-control" value="123" required />
          </div>
        </div>
        <div class="form-group">
          <label>Danh sách học sinh (Mỗi học sinh 1 dòng)</label>
          <textarea id="bulk-lines" class="form-control" rows="5" placeholder="HS1005, Vũ Hoàng Nam, 10A2, 123&#10;HS1006, Đặng Ngọc Ánh, 10A2, 123&#10;Hoàng Minh Tuấn" required></textarea>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:8px;">
          <button type="button" class="btn btn-outline btn-sm" onclick="app.closeGenericModal()">Hủy</button>
          <button type="submit" class="btn btn-primary btn-sm">Thực hiện nhập</button>
        </div>
      </form>
    `;
    modal.classList.remove("hidden");
  },

  async handleBulkImport(e) {
    e.preventDefault();
    const defClass = document.getElementById("bulk-default-class").value.trim().toUpperCase();
    const defPass = document.getElementById("bulk-default-pass").value.trim();
    const lines = document.getElementById("bulk-lines").value.split("\n").map(l => l.trim()).filter(Boolean);

    let added = 0;
    lines.forEach((line) => {
      const parts = line.split(",").map(p => p.trim());
      let id, fullName, className, password;
      if (parts.length >= 2) {
        id = parts[0].toUpperCase();
        fullName = parts[1];
        className = (parts[2] || defClass).toUpperCase();
        password = parts[3] || defPass;
      } else {
        id = `HS${Math.floor(1000 + Math.random() * 9000)}`;
        fullName = parts[0];
        className = defClass;
        password = defPass;
      }
      const gradeMatch = className.match(/^(10|11|12)/);
      const grade = gradeMatch ? gradeMatch[1] : "10";

      if (!this.state.users.some(u => u.id.toUpperCase() === id)) {
        this.state.users.push({
          id,
          username: id,
          password,
          fullName,
          role: "student",
          grade,
          className,
          active: true
        });
        added++;
      }
    });

    await this.saveState();
    this.closeGenericModal();
    alert(`Đã thêm thành công ${added} học sinh vào hệ thống.`);
    this.renderMain();
  },

  async resetStudentPassword(userId) {
    const newPass = prompt(`Nhập mật khẩu mới cho học sinh ${userId}:`, "123");
    if (!newPass) return;
    const u = this.state.users.find(x => x.id === userId);
    if (u) {
      u.password = newPass.trim();
      await this.saveState();
      this.renderMain();
    }
  },

  async deleteStudent(userId) {
    if (!confirm(`Xác nhận xóa tài khoản học sinh ${userId}?`)) return;
    this.state.users = this.state.users.filter(u => u.id !== userId);
    await this.saveState();
    this.renderMain();
  },

  closeGenericModal() {
    document.getElementById("modal-generic").classList.add("hidden");
  },

  renderAdminCourses() {
    const rows = this.state.courses.map(c => `
      <tr>
        <td><strong>${c.id}</strong></td>
        <td>${c.title}</td>
        <td><span class="badge badge-info">Khối ${c.grade}</span></td>
        <td>${c.lessons.length} bài học</td>
        <td>${c.finalExam.length} câu hỏi thi</td>
        <td>
          <div style="display:flex; gap:4px;">
            <button class="btn btn-outline btn-sm" onclick="app.openCourseClassroom('${c.id}')">Xem nội dung</button>
            <button class="btn btn-primary btn-sm" onclick="app.openAddExamQuestionModal('${c.id}')">Thêm câu hỏi thi</button>
          </div>
        </td>
      </tr>
    `).join("");

    return `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
        <div>
          <h2 style="font-size:18px; font-weight:700; color:#0f2757;">Quản lý khóa học và đề thi</h2>
          <p style="font-size:13px; color:#64748b;">Quản trị viên: Thầy Nguyễn Hải Nam - Tổ Ngoại ngữ</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="app.openAddCourseModal()">Tạo khóa học mới</button>
      </div>

      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã khóa học</th>
              <th>Tên khóa học</th>
              <th>Khối lớp</th>
              <th>Số bài học</th>
              <th>Số câu thi cuối khóa</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  },

  openAddCourseModal() {
    const modal = document.getElementById("modal-generic");
    const box = document.getElementById("modal-generic-content");
    box.innerHTML = `
      <h3 style="font-size:17px; margin-bottom:12px; color:#0f2757;">Tạo khóa học Tiếng Anh mới</h3>
      <form onsubmit="app.saveNewCourse(event)">
        <div class="form-group">
          <label>Tên khóa học</label>
          <input type="text" id="new-course-title" class="form-control" placeholder="Ví dụ: Tiếng Anh Lớp 10 - Học Kỳ II: Ecotourism" required />
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div class="form-group">
            <label>Khối lớp</label>
            <select id="new-course-grade" class="form-control">
              <option value="10">Khối 10</option>
              <option value="11">Khối 11</option>
              <option value="12">Khối 12</option>
            </select>
          </div>
          <div class="form-group">
            <label>Trình độ (Khung tham chiếu)</label>
            <input type="text" id="new-course-level" class="form-control" value="Intermediate (B1)" required />
          </div>
        </div>
        <div class="form-group">
          <label>Mô tả khóa học</label>
          <textarea id="new-course-desc" class="form-control" rows="3" required>Khóa học bám sát chương trình sách giáo khoa mới, rèn luyện từ vựng, ngữ pháp và kỹ năng nghe hiểu.</textarea>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:8px;">
          <button type="button" class="btn btn-outline btn-sm" onclick="app.closeGenericModal()">Hủy</button>
          <button type="submit" class="btn btn-primary btn-sm">Tạo khóa học</button>
        </div>
      </form>
    `;
    modal.classList.remove("hidden");
  },

  async saveNewCourse(e) {
    e.preventDefault();
    const title = document.getElementById("new-course-title").value.trim();
    const grade = document.getElementById("new-course-grade").value;
    const level = document.getElementById("new-course-level").value.trim();
    const description = document.getElementById("new-course-desc").value.trim();
    const id = `ENG-G${grade}-${Math.floor(100 + Math.random() * 900)}`;

    this.state.courses.push({
      id,
      title,
      grade,
      level,
      duration: "10 tiết",
      teacher: "Thầy Nguyễn Hải Nam",
      description,
      badgeColor: "#0f2757",
      examDurationMinutes: 15,
      lessons: [
        {
          id: `${id}-L1`,
          title: "Unit 1: Core Grammar & Vocabulary",
          duration: "45 phút",
          theoryHtml: `<p>Nội dung bài giảng lý thuyết của khóa <strong>${title}</strong>.</p>`,
          vocab: [
            { word: "ecotourism", phonetic: "/ˈiːkəʊtʊərɪzəm/", pos: "noun", meaning: "Du lịch sinh thái", example: "Ecotourism helps protect the local environment and culture." }
          ],
          listening: {
            title: "Listening Practice",
            context: "Nghe câu phát biểu mẫu:",
            lines: [
              { speaker: "Teacher", text: "Welcome to our new English course. Let us practice speaking and listening regularly." }
            ],
            checkQuestion: {
              question: "Nội dung giáo viên khuyến nghị học sinh là gì?",
              options: ["Luyện tập nói và nghe thường xuyên", "Bỏ qua kỹ năng nghe", "Chỉ học ngữ pháp", "Không làm bài tập"],
              correctIndex: 0
            }
          },
          quiz: [
            {
              question: "Ecotourism helps _______ the natural environment.",
              options: ["protect", "destroy", "pollute", "ignore"],
              correctIndex: 0,
              explanation: "'protect the natural environment' mang ý nghĩa bảo vệ môi trường tự nhiên."
            }
          ]
        }
      ],
      finalExam: [
        {
          question: "1. Ecotourism is a form of sustainable travel that supports the local _______.",
          options: ["environment", "pollution", "damage", "rubbish"],
          correctIndex: 0
        }
      ]
    });

    await this.saveState();
    this.closeGenericModal();
    this.renderMain();
  },

  openAddExamQuestionModal(courseId) {
    const course = this.state.courses.find(c => c.id === courseId);
    if (!course) return;
    const modal = document.getElementById("modal-generic");
    const box = document.getElementById("modal-generic-content");
    box.innerHTML = `
      <h3 style="font-size:17px; margin-bottom:8px; color:#0f2757;">Thêm câu hỏi thi cuối khóa</h3>
      <p style="font-size:13px; color:#64748b; margin-bottom:12px;">Khóa học: <strong>${course.title}</strong></p>
      <form onsubmit="app.saveNewExamQuestion(event, '${course.id}')">
        <div class="form-group">
          <label>Nội dung câu hỏi</label>
          <input type="text" id="eq-text" class="form-control" placeholder="Ví dụ: If I _______ you, I would spend more time practicing English." required />
        </div>
        <div class="form-group">
          <label>Đáp án A</label>
          <input type="text" id="eq-opt0" class="form-control" placeholder="were" required />
        </div>
        <div class="form-group">
          <label>Đáp án B</label>
          <input type="text" id="eq-opt1" class="form-control" placeholder="am" required />
        </div>
        <div class="form-group">
          <label>Đáp án C</label>
          <input type="text" id="eq-opt2" class="form-control" placeholder="will be" required />
        </div>
        <div class="form-group">
          <label>Đáp án D</label>
          <input type="text" id="eq-opt3" class="form-control" placeholder="have been" required />
        </div>
        <div class="form-group">
          <label>Đáp án chính xác</label>
          <select id="eq-correct" class="form-control">
            <option value="0">Đáp án A</option>
            <option value="1">Đáp án B</option>
            <option value="2">Đáp án C</option>
            <option value="3">Đáp án D</option>
          </select>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:8px;">
          <button type="button" class="btn btn-outline btn-sm" onclick="app.closeGenericModal()">Hủy</button>
          <button type="submit" class="btn btn-primary btn-sm">Thêm vào đề thi</button>
        </div>
      </form>
    `;
    modal.classList.remove("hidden");
  },

  async saveNewExamQuestion(e, courseId) {
    e.preventDefault();
    const course = this.state.courses.find(c => c.id === courseId);
    if (!course) return;
    const nextIdx = course.finalExam.length + 1;
    const question = `${nextIdx}. ` + document.getElementById("eq-text").value.trim();
    const options = [
      document.getElementById("eq-opt0").value.trim(),
      document.getElementById("eq-opt1").value.trim(),
      document.getElementById("eq-opt2").value.trim(),
      document.getElementById("eq-opt3").value.trim()
    ];
    const correctIndex = parseInt(document.getElementById("eq-correct").value, 10);

    course.finalExam.push({ question, options, correctIndex });
    await this.saveState();
    this.closeGenericModal();
    alert("Đã bổ sung câu hỏi mới vào đề thi.");
    this.renderMain();
  },

  renderAdminCertificates() {
    const rows = this.state.certificates.map(c => `
      <tr>
        <td><code>${c.certId}</code></td>
        <td><strong>${c.studentName}</strong> (${c.userId})</td>
        <td><span class="badge badge-info">Lớp ${c.className}</span></td>
        <td>${c.courseTitle}</td>
        <td><strong>${c.score}/100</strong> (${c.classification})</td>
        <td>${c.issuedDate}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="app.openVerifyModal('${c.certId}')">Chi tiết</button>
        </td>
      </tr>
    `).join("");

    return `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
        <div>
          <h2 style="font-size:18px; font-weight:700; color:#0f2757;">Sổ gốc cấp chứng chỉ toàn trường (${this.state.certificates.length})</h2>
          <p style="font-size:13px; color:#64748b;">Danh sách học sinh hoàn thành khóa học và được cấp chứng chỉ điện tử.</p>
        </div>
        <button class="btn btn-success btn-sm" onclick="app.exportCertificatesCSV()">Xuất dữ liệu CSV</button>
      </div>

      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã chứng chỉ</th>
              <th>Họ và tên học sinh</th>
              <th>Lớp</th>
              <th>Khóa học</th>
              <th>Điểm và Xếp loại</th>
              <th>Ngày cấp</th>
              <th>Kiểm tra</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  },

  exportCertificatesCSV() {
    const headers = ["Mã Chứng Chỉ", "Mã Học Sinh", "Họ và Tên", "Lớp", "Khối", "Khóa Học", "Điểm Số", "Xếp Loại", "Ngày Cấp"];
    const lines = [headers.join(",")];

    this.state.certificates.forEach(c => {
      const row = [
        `"${c.certId}"`,
        `"${c.userId}"`,
        `"${c.studentName}"`,
        `"${c.className}"`,
        `"${c.grade}"`,
        `"${c.courseTitle.replace(/"/g, '""')}"`,
        c.score,
        `"${c.classification}"`,
        `"${c.issuedDate}"`
      ];
      lines.push(row.join(","));
    });

    const csvContent = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `So_Cap_Chung_Chi_THPT_So_2_Nguyen_Truong_To_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  renderAdminSettings() {
    const cfg = this.state.schoolConfig;
    return `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; align-items:start;">
        <div class="auth-card" style="padding:22px;">
          <h3 style="font-size:17px; margin-bottom:12px; color:#0f2757;">Cấu hình thông tin nhà trường và phôi bằng</h3>
          <form onsubmit="app.saveSchoolSettings(event)">
            <div class="form-group">
              <label>Tên đơn vị trường học</label>
              <input type="text" id="cfg-school-name" class="form-control" value="${cfg.schoolName}" required />
            </div>
            <div class="form-group">
              <label>Tiêu đề hệ thống</label>
              <input type="text" id="cfg-school-sub" class="form-control" value="${cfg.schoolSubtitle}" required />
            </div>
            <div class="form-group">
              <label>Họ tên Hiệu trưởng ký duyệt</label>
              <input type="text" id="cfg-principal" class="form-control" value="${cfg.principalName}" required />
            </div>
            <div class="form-group">
              <label>Tổ trưởng chuyên môn Ngoại ngữ</label>
              <input type="text" id="cfg-head-teacher" class="form-control" value="${cfg.headTeacherName}" required />
            </div>
            <div class="form-group">
              <label>Điểm chuẩn đạt chứng chỉ (%)</label>
              <input type="number" id="cfg-pass-score" class="form-control" min="50" max="100" value="${cfg.passScorePercent}" required />
            </div>
            <div style="display:flex; gap:8px; margin-top:14px;">
              <button type="submit" class="btn btn-primary btn-sm">Lưu cấu hình</button>
              <button type="button" class="btn btn-outline btn-sm" onclick="app.resetDefaultData()">Khôi phục dữ liệu gốc</button>
            </div>
          </form>
        </div>

        <div class="auth-card" style="padding:22px; background-color:#f8fafc;">
          <h3 style="font-size:17px; color:#0f2757; margin-bottom:10px;">Hướng dẫn triển khai nội bộ trường học</h3>
          <p style="font-size:13.5px; color:#334155; margin-bottom:12px; line-height:1.5;">
            Hệ thống áp dụng phương thức cấp tài khoản theo danh sách lớp để đảm bảo an toàn thông tin nội bộ.
          </p>

          <div style="background-color:#ffffff; border:1px solid #cbd5e1; padding:12px; border-radius:var(--radius-sm); margin-bottom:12px;">
            <h4 style="font-size:14px; color:#0f2757; margin-bottom:4px;">1. Sử dụng trên máy chủ trường học</h4>
            <ul style="font-size:13px; color:#475569; margin-left:18px; line-height:1.45;">
              <li>Nhấp đúp chuột vào tệp <code>chay_ung_dung.bat</code> trong thư mục dự án để khởi động.</li>
              <li>Dữ liệu học tập và kết quả bài thi được lưu tự động trong cơ sở dữ liệu <code>school_lms.db</code>.</li>
              <li>Máy tính trong phòng Tin học hoặc kết nối mạng nội bộ có thể truy cập qua địa chỉ IP của máy chủ.</li>
            </ul>
          </div>

          <div style="background-color:#ffffff; border:1px solid #cbd5e1; padding:12px; border-radius:var(--radius-sm);">
            <h4 style="font-size:14px; color:#0f2757; margin-bottom:4px;">2. Triển khai trực tuyến cho học sinh truy cập tại nhà</h4>
            <ul style="font-size:13px; color:#475569; margin-left:18px; line-height:1.45;">
              <li>Tệp cấu hình Netlify (<code>netlify.toml</code>) đã được tạo sẵn trong thư mục.</li>
              <li>Có thể triển khai nhanh chóng lên Netlify hoặc dịch vụ máy chủ của nhà trường để học sinh đăng nhập tự học tại nhà.</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  },

  async saveSchoolSettings(e) {
    e.preventDefault();
    this.state.schoolConfig.schoolName = document.getElementById("cfg-school-name").value.trim();
    this.state.schoolConfig.schoolSubtitle = document.getElementById("cfg-school-sub").value.trim();
    this.state.schoolConfig.principalName = document.getElementById("cfg-principal").value.trim();
    this.state.schoolConfig.headTeacherName = document.getElementById("cfg-head-teacher").value.trim();
    this.state.schoolConfig.passScorePercent = parseInt(document.getElementById("cfg-pass-score").value, 10) || 70;

    await this.saveState();
    this.updateHeaderBranding();
    alert("Đã lưu cấu hình thông tin nhà trường thành công.");
  },

  async resetDefaultData() {
    if (!confirm("Xác nhận khôi phục lại dữ liệu mặc định của hệ thống?")) return;
    this.state = JSON.parse(JSON.stringify(window.DEFAULT_SCHOOL_DATA));
    await this.saveState();
    this.updateHeaderBranding();
    this.renderMain();
  },

  // ==========================================
  // PHAN HE AI CHATBOT HO TRO HOC TAP
  // ==========================================
  chatMessages: [],
  isBotTyping: false,

  toggleChatWindow() {
    const win = document.getElementById("ai-chat-window");
    if (!win) return;
    if (win.classList.contains("hidden")) {
      win.classList.remove("hidden");
      this.initChatbot();
    } else {
      win.classList.add("hidden");
    }
  },

  openChatWindow() {
    const win = document.getElementById("ai-chat-window");
    if (!win) return;
    win.classList.remove("hidden");
    this.initChatbot();
  },

  closeChatWindow() {
    const win = document.getElementById("ai-chat-window");
    if (win) win.classList.add("hidden");
  },

  initChatbot() {
    this.updateChatReminderCard();
    if (this.chatMessages.length === 0) {
      const studentName = this.currentUser ? this.currentUser.fullName : "bạn";
      const initialGreeting = `Chào ${studentName}! Tôi là Trợ lý học tập AI của Trường THPT Số 2 Nguyễn Trường Tộ. Tôi rất vui được đồng hành cùng bạn trong môn Tiếng Anh.\n\nTôi có thể giúp bạn theo dõi lộ trình bài học, giải đáp chi tiết các điểm ngữ pháp khó, ôn tập từ vựng chuẩn US/UK, hoặc hướng dẫn quy chế thi cử và cấp chứng chỉ. Hôm nay bạn đang muốn tôi hỗ trợ nội dung nào?`;
      this.chatMessages.push({ sender: "bot", text: initialGreeting });
    }
    this.renderChatMessages();
  },

  updateChatReminderCard() {
    const cardEl = document.getElementById("chat-reminder-card");
    if (!cardEl) return;

    if (!this.currentUser) {
      cardEl.innerHTML = `
        <strong>Chế độ khách:</strong> Bạn chưa đăng nhập. Vui lòng đăng nhập bằng Mã học sinh do nhà trường cấp để trợ lý AI đồng bộ tiến độ và đưa ra nhắc nhở học tập phù hợp nhất.
      `;
      return;
    }

    if (this.currentUser.role === "admin") {
      cardEl.innerHTML = `
        <strong>Không gian Quản trị viên (${this.currentUser.fullName}):</strong> Hệ thống quản lý ${this.state.users.filter(u => u.role === 'student').length} học sinh, ${this.state.courses.length} khóa học và ${this.state.certificates.length} chứng chỉ điện tử hợp lệ.
      `;
      return;
    }

    const prog = this.getUserProgress(this.currentUser.id);
    const userGrade = this.currentUser.grade || "10";
    const relevantCourse = this.state.courses.find(c => c.grade === userGrade) || this.state.courses[0];
    const totalLessons = relevantCourse.lessons.length;
    const completedInCourse = relevantCourse.lessons.filter(l => prog.completedLessons.includes(l.id)).length;
    const cert = this.state.certificates.find(c => c.userId === this.currentUser.id && c.courseId === relevantCourse.id);
    const examAttempt = prog.examAttempts ? prog.examAttempts[relevantCourse.id] : null;

    let reminderText = "";
    if (cert) {
      reminderText = `Chúc mừng bạn! Bạn đã hoàn thành xuất sắc khóa học <strong>${relevantCourse.title}</strong> với kết quả <strong>${cert.score}/100 điểm</strong> (${cert.classification}). Chứng chỉ số <code>${cert.certId}</code> đã được cấp chính thức. Bạn có thể xem và in chứng chỉ ở mục "Chứng chỉ đã cấp"!`;
    } else if (examAttempt && !examAttempt.passed) {
      reminderText = `Thông báo kết quả: Bạn đã hoàn thành bài thi cuối khóa với điểm số ${examAttempt.score}/100 (chưa đạt mức chuẩn ${this.state.schoolConfig.passScorePercent}%). Theo quy chế khảo thí 01 lần duy nhất, kết quả đã được ghi vào học bạ. Hãy tiếp tục ôn tập kiến thức các chuyên đề nhé.`;
    } else if (completedInCourse === totalLessons) {
      reminderText = `Tuyệt vời! Bạn đã hoàn thành đầy đủ ${totalLessons}/${totalLessons} bài học của khóa <strong>${relevantCourse.title}</strong>. Nhiệm vụ trọng tâm tiếp theo là vào phòng học và bắt đầu "Làm bài kiểm tra cuối khóa" ở chế độ toàn màn hình để xét cấp chứng chỉ!`;
    } else if (completedInCourse === 0) {
      reminderText = `Chào bạn! Bạn chưa bắt đầu bài học nào của khóa <strong>${relevantCourse.title}</strong>. Hãy dành 20 phút hôm nay để học bài 1 (${relevantCourse.lessons[0]?.title}) và làm bài tập củng cố nhé!`;
    } else {
      const nextLesson = relevantCourse.lessons.find(l => !prog.completedLessons.includes(l.id));
      reminderText = `Tiến độ học tập: Bạn đã hoàn thành <strong>${completedInCourse}/${totalLessons}</strong> bài học. Bài tiếp theo của bạn là: <strong>${nextLesson ? nextLesson.title : ''}</strong>. Cố gắng làm bài tập củng cố thật cẩn thận vì hệ thống chỉ cho phép nộp 01 lần duy nhất.`;
    }

    cardEl.innerHTML = `
      <div style="font-weight:700; color:#0f2757; margin-bottom:3px;">Nhắc nhở học tập (${this.currentUser.fullName} - Lớp ${this.currentUser.className}):</div>
      <div>${reminderText}</div>
    `;
  },

  requestPersonalReminder() {
    if (!this.currentUser) {
      this.chatMessages.push({
        sender: "bot",
        text: "Bạn hiện chưa đăng nhập vào hệ thống. Bạn hãy sử dụng Mã học sinh do nhà trường cấp (ví dụ: HS1001, HS1002...) để đăng nhập, sau đó tôi sẽ phân tích tiến độ và gửi nhắc nhở cá nhân hóa ngay cho bạn nhé!"
      });
      this.renderChatMessages();
      return;
    }

    const prog = this.getUserProgress(this.currentUser.id);
    const myCerts = this.state.certificates.filter(c => c.userId === this.currentUser.id);
    const userGrade = this.currentUser.grade || "10";
    const course = this.state.courses.find(c => c.grade === userGrade) || this.state.courses[0];
    const totalL = course.lessons.length;
    const doneL = course.lessons.filter(l => prog.completedLessons.includes(l.id)).length;
    const cert = myCerts.find(c => c.courseId === course.id);
    const examAttempt = prog.examAttempts ? prog.examAttempts[course.id] : null;

    let message = `Chào bạn ${this.currentUser.fullName}! Tôi đã tổng hợp nhanh tình hình học tập môn Tiếng Anh của bạn tại Trường THPT Số 2 Nguyễn Trường Tộ như sau:\n\n`;
    message += `Khóa học hiện tại của bạn là "${course.title}" (Khối ${course.grade} - ${course.level}). Về tiến độ, bạn đã hoàn thành ${doneL}/${totalL} bài học chính.\n\n`;

    if (cert) {
      message += `Về chứng chỉ: Bạn đã được cấp Giấy chứng nhận hoàn thành khóa học chính thức với số điểm ${cert.score}/100, xếp loại ${cert.classification} (Mã chứng chỉ: ${cert.certId}). Bạn có thể chuyển sang mục "Chứng chỉ đã cấp" để in văn bằng có chữ ký của Thầy Hiệu trưởng Trương Quang Mẫn và Thầy Tổ trưởng Nguyễn Hải Nam.`;
    } else if (examAttempt && !examAttempt.passed) {
      message += `Về kỳ thi cuối khóa: Bạn đã tham gia kỳ thi và đạt ${examAttempt.score}/100 điểm. Theo quy chế khảo thí nội bộ, mỗi học sinh chỉ làm bài 01 lần duy nhất, kết quả đã được niêm phong vào học bạ điện tử. Bạn hãy tiếp tục trau dồi các điểm ngữ pháp để nâng cao năng lực nhé.`;
    } else if (doneL === totalL) {
      message += `Về bước tiếp theo: Bạn đã học xong toàn bộ bài học lý thuyết và bài tập củng cố. Hãy chuẩn bị tâm lý tự tin và thiết bị ổn định để bước vào Bài kiểm tra cuối khóa ở chế độ toàn màn hình nhé. Đạt từ ${this.state.schoolConfig.passScorePercent}% trở lên là bạn sẽ nhận được chứng chỉ ngay!`;
    } else {
      const nextLesson = course.lessons.find(l => !prog.completedLessons.includes(l.id));
      message += `Kế hoạch học tập khuyến nghị: Hôm nay bạn nên tập trung vào bài học "${nextLesson?.title}". Nhớ nghe phát âm các từ vựng mới bằng giọng chuẩn US/UK và đọc kỹ lý thuyết trước khi làm bài tập trắc nghiệm củng cố, vì hệ thống chỉ ghi nhận 1 lần làm duy nhất thôi nhé!`;
    }

    this.chatMessages.push({ sender: "bot", text: message });
    this.renderChatMessages();
  },

  handleQuickPrompt(promptText) {
    document.getElementById("chat-user-input").value = promptText;
    const form = document.querySelector("#ai-chat-window form");
    if (form) form.requestSubmit();
  },

  handleChatSubmit(e) {
    e.preventDefault();
    const inputEl = document.getElementById("chat-user-input");
    const query = inputEl.value.trim();
    if (!query) return;

    this.chatMessages.push({ sender: "user", text: query });
    inputEl.value = "";
    this.isBotTyping = true;
    this.renderChatMessages();

    // Phan hoi mo phong suy nghi cua tro ly AI
    setTimeout(() => {
      this.isBotTyping = false;
      const botReply = this.generateAIAnswer(query);
      this.chatMessages.push({ sender: "bot", text: botReply });
      this.renderChatMessages();
    }, 450);
  },

  renderChatMessages() {
    const container = document.getElementById("chat-messages-container");
    if (!container) return;

    let html = this.chatMessages.map(msg => {
      if (msg.sender === "user") {
        return `
          <div class="chat-msg-row user">
            <span class="chat-sender-label">Học sinh</span>
            <div class="chat-bubble-user">${this.escapeHtml(msg.text)}</div>
          </div>
        `;
      } else {
        return `
          <div class="chat-msg-row bot">
            <span class="chat-sender-label">Trợ lý AI - THPT Số 2 Nguyễn Trường Tộ</span>
            <div class="chat-bubble-bot">${this.formatBotResponse(msg.text)}</div>
          </div>
        `;
      }
    }).join("");

    if (this.isBotTyping) {
      html += `
        <div class="chat-msg-row bot">
          <span class="chat-sender-label">Trợ lý AI đang soạn câu trả lời...</span>
          <div class="chat-typing-indicator">
            <span class="chat-typing-dot"></span>
            <span class="chat-typing-dot"></span>
            <span class="chat-typing-dot"></span>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
  },

  escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  },

  formatBotResponse(text) {
    const paragraphs = text.split("\n\n");
    return paragraphs.map(p => {
      if (p.startsWith("-") || p.includes("\n-") || p.startsWith("1.") || p.includes("\n1.")) {
        const lines = p.split("\n");
        const listItems = lines.map(line => `<li>${line.replace(/^[-*•]\s*|^\d+\.\s*/, "")}</li>`).join("");
        return `<ul style="margin-left:18px; margin-top:4px; margin-bottom:6px;">${listItems}</ul>`;
      }
      return `<p>${p.replace(/\n/g, "<br/>")}</p>`;
    }).join("");
  },

  generateAIAnswer(query) {
    const q = query.toLowerCase();

    // 1. Nhac nho tien do hoc tap
    if (q.includes("tiến độ") || q.includes("hôm nay") || q.includes("nhắc nhở") || q.includes("bài tiếp theo") || q.includes("kế hoạch") || q.includes("cần học")) {
      if (!this.currentUser) {
        return "Chào bạn! Để tôi có thể xem chính xác học bạ và nhắc nhở bài học cụ thể cho bạn, bạn hãy đăng nhập bằng Mã học sinh (ví dụ: HS1001, HS1002...) ở màn hình ngoài nhé. Ngay khi đăng nhập, tôi sẽ theo dõi và hỗ trợ bạn từng bước!";
      }
      const prog = this.getUserProgress(this.currentUser.id);
      const userGrade = this.currentUser.grade || "10";
      const course = this.state.courses.find(c => c.grade === userGrade) || this.state.courses[0];
      const totalL = course.lessons.length;
      const doneL = course.lessons.filter(l => prog.completedLessons.includes(l.id)).length;
      const cert = this.state.certificates.find(c => c.userId === this.currentUser.id && c.courseId === course.id);
      const examAttempt = prog.examAttempts ? prog.examAttempts[course.id] : null;

      if (cert) {
        return `Chào bạn ${this.currentUser.fullName}! Bạn đã hoàn thành xuất sắc toàn bộ khóa học ${course.title} với điểm số rất cao ${cert.score}/100 và đã được cấp Giấy chứng nhận (Mã: ${cert.certId}). Bạn có thể chuyển sang mục "Chứng chỉ đã cấp" để tải hoặc in chứng chỉ, hoặc tự tin học tiếp các chuyên đề của khối học cao hơn nhé!`;
      }
      if (examAttempt && !examAttempt.passed) {
        return `Chào bạn ${this.currentUser.fullName}! Theo hồ sơ khảo thí, bạn đã hoàn tất bài thi cuối khóa với điểm số ${examAttempt.score}/100. Do trường áp dụng chính sách làm 1 lần duy nhất để phản ánh đúng thực lực học tập, bài thi đã được khóa và lưu vào học bạ. Bạn hãy tiếp tục ôn luyện các kiến thức ngữ pháp và từ vựng nhé!`;
      }
      if (doneL === totalL) {
        return `Chào bạn ${this.currentUser.fullName}! Tin vui là bạn đã hoàn thành trọn vẹn cả ${totalL}/${totalL} bài học của khóa học ${course.title}. Nhiệm vụ quan trọng nhất của bạn lúc này là vào phòng học và bấm "Bắt đầu bài kiểm tra và kích hoạt toàn màn hình". Chỉ cần đạt từ ${this.state.schoolConfig.passScorePercent}% trở lên là bạn sẽ được cấp chứng chỉ ngay lập tức!`;
      }
      const nextLesson = course.lessons.find(l => !prog.completedLessons.includes(l.id));
      return `Chào bạn ${this.currentUser.fullName}! Hiện tại trong khóa học ${course.title}, bạn đã hoàn thành ${doneL}/${totalL} bài học. Bài tiếp theo bạn cần học là "${nextLesson?.title}". Bạn hãy dành chút thời gian hôm nay xem phần lý thuyết ngữ pháp, luyện nghe các đoạn thoại và làm bài tập củng cố. Hãy đọc thật kỹ câu hỏi vì bài tập củng cố chỉ được làm 1 lần duy nhất thôi nhé!`;
    }

    // 2. Quy che bai kiem tra, toan man hinh va 1 lan duy nhat
    if (q.includes("quy chế") || q.includes("toàn màn hình") || q.includes("thoát ra") || q.includes("làm lại") || q.includes("vi phạm") || q.includes("mấy lần")) {
      return `Chào bạn! Về quy chế kiểm tra và thi trực tuyến tại Trường THPT Số 2 Nguyễn Trường Tộ, bạn cần đặc biệt lưu ý các quy định quan trọng sau:\n\n- Ngôn ngữ bài thi: Toàn bộ câu hỏi, phương án lựa chọn và bài thi được thực hiện 100% bằng Tiếng Anh chuẩn.\n\n- Quy định làm 1 lần duy nhất: Khi học sinh làm sai, hệ thống TUYỆT ĐỐI KHÔNG cho phép làm lại. Điểm số sẽ được niêm phong vĩnh viễn vào học bạ điện tử để tổng kết quá trình học tập thực chất của học sinh.\n\n- Chế độ giám sát toàn màn hình: Khi bước vào bài kiểm tra cuối khóa, hệ thống sẽ tự động bật toàn màn hình và khóa điều hướng. Học sinh tuyệt đối không được thoát toàn màn hình (phím Esc, F11) hoặc chuyển tab sang ứng dụng khác.\n\n- Cảnh báo vi phạm: Mọi hành vi thoát màn hình sẽ bị cảnh báo ngay lập tức. Nếu vi phạm quá 3 lần, hệ thống sẽ tự động đình chỉ bài làm, thu bài và khóa bài thi ngay lập tức.\n\nCác quy chế này nhằm rèn luyện tính tự giác, nghiêm túc và đảm bảo giá trị chứng nhận học tập của nhà trường.`;
    }

    // 3. Ngu phap: Cau bi dong (Passive Voice)
    if (q.includes("bị động") || q.includes("passive")) {
      return `Chào bạn nhé! Câu bị động (The Passive Voice) là một trong những phần ngữ pháp cốt lõi của chương trình Tiếng Anh THPT. Hãy cùng tôi điểm qua cách hiểu tự nhiên và dễ nhớ nhất nhé:\n\nBản chất: Chúng ta dùng câu bị động khi muốn nhấn mạnh vào người hoặc vật chịu tác động của hành động, hoặc khi người thực hiện hành động là hiển nhiên, không quan trọng, hay chưa rõ.\n\nCấu trúc chung: S + be + V3/V-ed (+ by Agent)\nTrong đó, động từ 'be' được biến đổi linh hoạt theo thì của câu chủ động:\n- Hiện tại đơn: am/is/are + V3/ed (Ví dụ: Thousands of plastic bottles are thrown away every minute).\n- Quá khứ đơn: was/were + V3/ed (Ví dụ: The clean-up project was organized last Sunday).\n- Hiện tại hoàn thành: have/has been + V3/ed (Ví dụ: All classrooms have been cleaned).\n- Tương lai đơn: will be + V3/ed (Ví dụ: The English speaking contest will be held next month).\n- Động từ khuyết thiếu: must/can/should/have to + be + V3/ed (Ví dụ: School rules must be obeyed).\n\nMẹo làm bài: Khi gặp câu hỏi trắc nghiệm, bạn hãy nhìn ngay vào chủ ngữ. Nếu chủ ngữ là đồ vật hoặc không thể tự thực hiện hành động (như "trees", "bottles", "project", "contest"), đáp án gần như chắc chắn là dạng bị động có chứa "be + V3/ed"!`;
    }

    // 4. Ngu phap: Hien tai don vs Hien tai tiep dien
    if (q.includes("hiện tại đơn") || q.includes("hiện tại tiếp diễn") || q.includes("present simple") || q.includes("present continuous")) {
      return `Chào bạn! Phân biệt Thì hiện tại đơn (Present Simple) và Hiện tại tiếp diễn (Present Continuous) rất thú vị và có quy luật rõ ràng:\n\n1. Thì hiện tại đơn (Present Simple):\n- Dùng cho những sự việc mang tính ổn định, thói quen hằng ngày, sự thật hiển nhiên hoặc lịch trình cố định.\n- Dấu hiệu nhận biết: always, usually, often, every day, rarely, on Mondays...\n- Ví dụ: My mother usually does the cooking every evening.\n\n2. Thì hiện tại tiếp diễn (Present Continuous):\n- Dùng cho những hành động đang diễn ra ngay tại lúc nói hoặc những hiện tượng mang tính tạm thời.\n- Dấu hiệu nhận biết: now, right now, at the moment, hoặc các câu cảm thán gây chú ý như Look!, Listen!, Be quiet!...\n- Ví dụ: Listen! Someone is playing the piano in the music room.\n\nLưu ý quan trọng: Các động từ chỉ trạng thái cảm xúc, nhận thức, giác quan và sở hữu (như like, love, understand, know, believe, have) không được dùng ở dạng tiếp diễn. Thay vì nói "I am knowing", bạn luôn phải dùng "I know" nhé!`;
    }

    // 5. Ngu phap: Must vs Have to vs Should
    if (q.includes("must") || q.includes("have to") || q.includes("should") || q.includes("khuyết thiếu")) {
      return `Chào bạn! Nhóm động từ khuyết thiếu chỉ sự bắt buộc (Must, Have to, Should) rất hay xuất hiện trong bài thi khối 11. Đây là cách phân biệt chuẩn xác:\n\n1. Must:\n- Thể hiện sự bắt buộc xuất phát từ cảm xúc hoặc ý chí chủ quan của người nói (Tôi tự thấy mình phải làm điều đó).\n- Ở thể phủ định: "Mustn't" mang nghĩa CẤM ĐOÁN tuyệt đối (không được phép làm).\n- Ví dụ: Students mustn't bring electronic devices into the exam room.\n\n2. Have to:\n- Thể hiện sự bắt buộc do hoàn cảnh khách quan, luật lệ hoặc nội quy trường lớp quy định.\n- Ở thể phủ định: "Don't have to" mang nghĩa KHÔNG CẦN THIẾT PHẢI LÀM (làm hay không tùy bạn, không ai bắt buộc).\n- Ví dụ: Tomorrow is Sunday, so I don't have to wake up early.\n\n3. Should:\n- Dùng để đưa ra lời khuyên hoặc đề xuất nên làm điều gì đó tốt cho bản thân hay tập thể.\n- Ví dụ: Students should spend at least twenty minutes revising vocabulary every day.`;
    }

    // 6. Ngu phap: Qua khu don vs Hien tai hoan thanh
    if (q.includes("quá khứ đơn") || q.includes("hiện tại hoàn thành") || q.includes("past simple") || q.includes("present perfect")) {
      return `Chào bạn! Để không bao giờ bị nhầm lẫn giữa Past Simple (Quá khứ đơn) và Present Perfect (Hiện tại hoàn thành), bạn hãy ghi nhớ ranh giới thời gian này:\n\n1. Past Simple (Quá khứ đơn):\n- Hành động đã xảy ra và ĐÃ CHẤM DỨT HOÀN TOÀN tại một thời điểm xác định trong quá khứ, không còn dính líu đến hiện tại.\n- Dấu hiệu đặc trưng: yesterday, ... ago, last night, last week, in 2020, when I was young.\n- Ví dụ: The teacher visited our class last Friday.\n\n2. Present Perfect (Hiện tại hoàn thành):\n- Hành động xảy ra trong quá khứ nhưng kết quả vẫn còn liên quan hoặc kéo dài đến hiện tại, hoặc hành động vừa mới xảy ra không nói rõ thời điểm.\n- Dấu hiệu đặc trưng: since (kể từ mốc thời gian), for (trong khoảng thời gian), already, yet, just, recently, so far.\n- Ví dụ: My grandfather has practised morning exercise since he retired.\n\nMột mẹo nhỏ: Nếu trong câu có "since + mốc quá khứ", mệnh đề chính luôn luôn chia thì Hiện tại hoàn thành bạn nhé!`;
    }

    // 7. Ngu phap: Menh de quan he (Relative Clauses)
    if (q.includes("mệnh đề quan hệ") || q.includes("who") || q.includes("whom") || q.includes("which") || q.includes("whose") || q.includes("that")) {
      return `Chào bạn! Mệnh đề quan hệ (Relative Clauses) là chuyên đề trọng tâm của khối 12. Bạn chỉ cần áp dụng công thức 2 bước sau là chọn đáp án chính xác 100%:\n\n1. Who: Thay cho danh từ chỉ NGƯỜI, theo sau thường là ĐỘNG TỪ (Ví dụ: The student who won the contest received a scholarship).\n2. Whom: Thay cho danh từ chỉ NGƯỜI làm tân ngữ, theo sau thường là CHỦ NGỮ + ĐỘNG TỪ (Ví dụ: The teacher whom we met yesterday is very kind).\n3. Which: Thay cho danh từ chỉ VẬT hoặc thay cho cả một mệnh đề phía trước (Ví dụ: The book which was recommended by our teacher is very helpful).\n4. Whose: Thay cho tính từ SỞ HỮU của cả người lẫn vật, theo sau luôn luôn là một DANH TỪ không có mạo từ (Ví dụ: The teacher whose students won national awards is honored today).\n5. That: Có thể thay thế cho cả Who và Which trong mệnh đề quan hệ xác định (nhưng tuyệt đối không đứng sau dấu phẩy và không đứng sau giới từ).`;
    }

    // 8. Dieu kien cap chung chi va lanh dao truong
    if (q.includes("chứng chỉ") || q.includes("điều kiện") || q.includes("xác thực") || q.includes("hiệu trưởng") || q.includes("trương quang mẫn") || q.includes("nguyễn hải nam")) {
      return `Chào bạn! Về quy định cấp chứng chỉ Tiếng Anh nội bộ của Trường THPT Số 2 Nguyễn Trường Tộ:\n\n1. Tiêu chuẩn công nhận: Học sinh cần hoàn thành các bài học và đạt điểm bài kiểm tra cuối khóa từ ${this.state.schoolConfig.passScorePercent}% trở lên.\n\n2. Xếp loại tốt nghiệp:\n- Xuất sắc (Distinction): Đạt từ 85% đến 100% điểm thi.\n- Giỏi (Merit): Đạt từ 75% đến 84% điểm thi.\n- Đạt (Pass): Đạt từ 70% đến 74% điểm thi.\n\n3. Tính pháp lý và chữ ký: Giấy chứng nhận được ký duyệt điện tử bởi Thầy Hiệu trưởng Trương Quang Mẫn và Thầy Tổ trưởng Chuyên môn Nguyễn Hải Nam. Mỗi văn bằng đều có Mã định danh (Certificate ID) và mã QR để tra cứu trực tuyến trên cổng đối soát của trường.`;
    }

    // 9. Ky nang luyen nghe tieng Anh
    if (q.includes("nghe") || q.includes("listening") || q.includes("luyện nghe")) {
      return `Chào bạn! Để làm tốt các bài nghe Tiếng Anh trên hệ thống của trường, tôi xin gợi ý lộ trình 3 bước rất hiệu quả sau:\n\n- Bước 1 (Nghe tổng quát): Bấm "Nghe toàn bộ bài" một lượt đầu tiên mà không nhìn phụ đề để nắm bắt bối cảnh chung, nhân vật và chủ đề đối thoại.\n- Bước 2 (Nghe chi tiết): Bấm nghe từng câu bằng nút "Nghe câu", chú ý các từ khóa mang thông tin chính (danh từ, động từ, số liệu) và ngữ điệu lên xuống.\n- Bước 3 (Luyện phản xạ): Trả lời câu hỏi Comprehension Check bằng tiếng Anh. Sau khi chọn, hệ thống sẽ lưu kết quả ngay và khóa lại, do đó hãy suy nghĩ kỹ trước khi chọn đáp án nhé!`;
    }

    // 10. Tu vung
    if (q.includes("từ vựng") || q.includes("nghĩa là gì") || q.includes("vocabulary") || q.includes("breadwinner") || q.includes("carbon footprint") || q.includes("homemaker")) {
      return `Chào bạn! Trong chương trình Tiếng Anh mới của trường, các từ vựng đều gắn liền với đời sống thực tế và xuất hiện trực tiếp trong bài thi:\n\n- Breadwinner (noun): Người trụ cột kinh tế trong gia đình.\n- Homemaker (noun): Người làm nội trợ, chăm sóc tổ ấm.\n- Carbon footprint (noun): Dấu chân carbon (lượng phát thải khí nhà kính cá nhân).\n- Sustainable (adjective): Bền vững, thân thiện với hệ sinh thái lâu dài.\n- Antibiotics (noun): Thuốc kháng sinh điều trị nhiễm khuẩn.\n- Perseverance (noun): Lòng kiên trì, sự bền bỉ theo đuổi mục tiêu học tập.\n\nTrong mỗi bài học, bạn có thể bấm nút "Phát âm US" hoặc "Phát âm UK" để nghe giọng chuẩn bản xứ và rèn luyện kỹ năng nói chuẩn xác nhé!`;
    }

    // 11. Tra loi tu nhien than thien mac dinh
    return `Chào bạn nhé! Tôi rất vui được hỗ trợ bạn trong quá trình học tập môn Tiếng Anh tại Trường THPT Số 2 Nguyễn Trường Tộ.\n\nVề nội dung "${this.escapeHtml(query)}" mà bạn vừa hỏi, bạn có thể xem lại chi tiết bài giảng trong phòng học của khối mình, hoặc hỏi tôi cụ thể hơn về một điểm ngữ pháp nào đó (ví dụ như: câu bị động, các thì hiện tại/quá khứ, động từ khuyết thiếu, mệnh đề quan hệ...), luyện kỹ năng nghe hay quy chế thi cử toàn màn hình của trường. Tôi luôn sẵn sàng giải đáp kỹ lưỡng cho bạn!`;
  }
};

window.addEventListener("DOMContentLoaded", () => app.init());

window.addEventListener("DOMContentLoaded", () => app.init());

