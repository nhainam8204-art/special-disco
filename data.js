// Du lieu mac dinh cho He thong Hoc Tieng Anh & Cap Chung Chi Noi Bo Truong THPT
window.DEFAULT_SCHOOL_DATA = {
  schoolConfig: {
    schoolName: "TRƯỜNG THPT SỐ 2 NGUYỄN TRƯỜNG TỘ",
    schoolSubtitle: "HỆ THỐNG HỌC TẬP TRỰC TUYẾN VÀ CẤP CHỨNG CHỈ MÔN TIẾNG ANH",
    principalName: "Trương Quang Mẫn",
    headTeacherName: "Thầy Nguyễn Hải Nam",
    passScorePercent: 70,
    academicYear: "2026 - 2027",
    allowSelfRegister: false
  },

  users: [
    {
      id: "GV001",
      username: "admin",
      password: "123",
      fullName: "Thầy Nguyễn Hải Nam",
      role: "admin",
      className: "Tổ Ngoại Ngữ",
      grade: "GV",
      email: "nam.nguyenhai@thptso2nguyentruongto.edu.vn",
      active: true
    }
  ],

  courses: [
    {
      id: "ENG-G10-U1",
      title: "Tiếng Anh Lớp 10: Family Life và Humans and The Environment",
      grade: "10",
      level: "Pre-Intermediate (A2-B1)",
      duration: "12 tiết",
      teacher: "Thầy Nguyễn Hải Nam",
      description: "Củng cố từ vựng, ngữ pháp trọng tâm (Present Simple vs Present Continuous, The Future with Will & Be going to, Passive Voice) và rèn luyện 4 kỹ năng theo chương trình giáo dục phổ thông.",
      badgeColor: "#1e3a8a",
      examDurationMinutes: 15,
      lessons: [
        {
          id: "L10-1",
          title: "Unit 1: Family Life - Chia sẻ công việc gia đình",
          duration: "45 phút",
          theoryHtml: `
            <h4>1. Trọng tâm Ngữ pháp: Present Simple vs. Present Continuous</h4>
            <p>Học sinh cần phân biệt rõ cách dùng Thì hiện tại đơn (thói quen, lịch trình) và Thì hiện tại tiếp diễn (hành động đang diễn ra tại thời điểm nói).</p>
            <div class="grammar-box">
              <p><strong>Present Simple (Hiện tại đơn):</strong> <code>S + V(s/es) + O</code></p>
              <ul>
                <li>Diễn tả thói quen lặp đi lặp lại: <em>My mother <strong>does</strong> the cooking every day.</em></li>
                <li>Dấu hiệu nhận biết: <em>always, usually, often, every day, twice a week...</em></li>
              </ul>
              <hr/>
              <p><strong>Present Continuous (Hiện tại tiếp diễn):</strong> <code>S + am/is/are + V-ing</code></p>
              <ul>
                <li>Diễn tả hành động đang xảy ra: <em>Look! My father <strong>is watering</strong> the plants in the garden.</em></li>
                <li>Dấu hiệu nhận biết: <em>now, right now, at the moment, at present, Look!, Listen!...</em></li>
              </ul>
              <p class="note-warn"><strong>Lưu ý:</strong> Các động từ chỉ trạng thái (stative verbs) như <em>know, believe, like, love, want, belong, need</em> thông thường không chia ở dạng tiếp diễn.</p>
            </div>
            <h4>2. Collocations chủ đề Household Chores</h4>
            <ul>
              <li><strong>do</strong> the cooking / the laundry / the washing-up / the heavy lifting</li>
              <li><strong>take out</strong> the rubbish (đổ rác)</li>
              <li><strong>lay</strong> the table (dọn bàn ăn)</li>
              <li><strong>breadwinner</strong> (n): người trụ cột tài chính trong gia đình</li>
            </ul>
          `,
          vocab: [
            { word: "breadwinner", phonetic: "/ˈbredwɪnə(r)/", pos: "noun", meaning: "Người trụ cột gia đình (thu nhập chính)", example: "In my family, both my parents are breadwinners." },
            { word: "homemaker", phonetic: "/ˈhəʊmmeɪkə(r)/", pos: "noun", meaning: "Người nội trợ", example: "Being a homemaker requires a lot of patience and time management." },
            { word: "heavy lifting", phonetic: "/ˌhevi ˈlɪftɪŋ/", pos: "noun", meaning: "Công việc mang vác nặng", example: "My father and brother usually do the heavy lifting." },
            { word: "groceries", phonetic: "/ˈɡrəʊsəriz/", pos: "noun", meaning: "Hàng hóa thực phẩm, nhu yếu phẩm", example: "She shops for groceries three times a week." },
            { word: "gratitude", phonetic: "/ˈɡrætɪtjuːd/", pos: "noun", meaning: "Lòng biết ơn", example: "Sharing housework helps children learn to show gratitude to their parents." },
            { word: "bond", phonetic: "/bɒnd/", pos: "noun/verb", meaning: "Sự gắn kết, mối quan hệ tình cảm", example: "Doing chores together strengthens family bonds." }
          ],
          listening: {
            title: "Family Talk: Sharing Household Chores",
            context: "Nghe đoạn đối thoại giữa hai học sinh Nam và Lan về việc phân chia công việc trong gia đình.",
            lines: [
              { speaker: "Lan", text: "Hi Nam! You look busy. Where are you going?" },
              { speaker: "Nam", text: "Hi Lan! I am going to the supermarket to buy some groceries for dinner. My mom is working late today." },
              { speaker: "Lan", text: "That is great! Do you often help your parents with the housework?" },
              { speaker: "Nam", text: "Yes, we split the chores equally in my family. I take out the rubbish and do the washing-up every evening." },
              { speaker: "Lan", text: "What about your sister?" },
              { speaker: "Nam", text: "She does the laundry and cleans the living room. My dad does the heavy lifting and fixes things around the house." }
            ],
            checkQuestion: {
              question: "According to the conversation, what chore does Nam do every evening?",
              options: [
                "Do the laundry and clean the living room",
                "Take out the rubbish and do the washing-up",
                "Fix things and do the heavy lifting",
                "Work late at the office"
              ],
              correctIndex: 1
            }
          },
          quiz: [
            {
              question: "Listen! Someone _______ the piano in the music room.",
              options: ["plays", "is playing", "played", "are playing"],
              correctIndex: 1,
              explanation: "The imperative word 'Listen!' indicates an action occurring right at the moment of speaking; therefore, use the Present Continuous tense ('is playing')."
            },
            {
              question: "My brother usually _______ out the rubbish every morning before going to school.",
              options: ["takes", "does", "makes", "puts"],
              correctIndex: 0,
              explanation: "The standard English collocation is 'take out the rubbish' (to empty the garbage)."
            },
            {
              question: "A _______ is a person who manages a home and often raises children instead of earning money from a job.",
              options: ["breadwinner", "homemaker", "grocer", "supporter"],
              correctIndex: 1,
              explanation: "'Homemaker' refers to a person who manages the household full-time."
            }
          ]
        },
        {
          id: "L10-2",
          title: "Unit 2: Humans and The Environment - Lối sống bền vững",
          duration: "45 phút",
          theoryHtml: `
            <h4>1. Trọng tâm Ngữ pháp: Câu bị động (The Passive Voice)</h4>
            <p>Câu bị động được sử dụng nhằm nhấn mạnh đối tượng tiếp nhận tác động của hành động thay vì chủ thể thực hiện hành động.</p>
            <div class="grammar-box">
              <p><strong>Cấu trúc tổng quát:</strong> <code>S + be + V3/ed (+ by O)</code></p>
              <ul>
                <li><strong>Hiện tại đơn:</strong> <code>am/is/are + V3/ed</code><br/><em>Ví dụ: More trees <strong>are planted</strong> in our school yard every spring.</em></li>
                <li><strong>Quá khứ đơn:</strong> <code>was/were + V3/ed</code><br/><em>Ví dụ: The school clean-up campaign <strong>was organized</strong> last Sunday.</em></li>
                <li><strong>Động từ khuyết thiếu:</strong> <code>will / can / should / must + be + V3/ed</code><br/><em>Ví dụ: Single-use plastics <strong>should be replaced</strong> with reusable alternatives.</em></li>
              </ul>
            </div>
            <h4>2. Phân biệt Will và Be going to</h4>
            <ul>
              <li><strong>Will + V:</strong> Quyết định đưa ra tức thời tại thời điểm nói hoặc dự đoán không có bằng chứng cụ thể.</li>
              <li><strong>Be going to + V:</strong> Kế hoạch, dự định đã có từ trước hoặc dự đoán có dấu hiệu rõ ràng ở hiện tại.</li>
            </ul>
          `,
          vocab: [
            { word: "carbon footprint", phonetic: "/ˌkɑːbən ˈfʊtprɪnt/", pos: "noun", meaning: "Dấu chân carbon (lượng khí thải carbon tạo ra)", example: "Riding a bike to school helps reduce our carbon footprint." },
            { word: "eco-friendly", phonetic: "/ˌiːkəʊ ˈfrendli/", pos: "adj", meaning: "Thân thiện với môi trường", example: "Our school canteen now uses eco-friendly paper cups." },
            { word: "sustainable", phonetic: "/səˈsteɪnəb(ə)l/", pos: "adj", meaning: "Bền vững", example: "We need to adopt a more sustainable lifestyle." },
            { word: "organic", phonetic: "/ɔːˈɡænɪk/", pos: "adj", meaning: "Hữu cơ (không dùng hóa chất nhân tạo)", example: "Buying organic food is good for both health and nature." },
            { word: "electrical appliances", phonetic: "/ɪˈlektrɪkl əˈplaɪənsɪz/", pos: "noun", meaning: "Các thiết bị dùng điện", example: "Remember to turn off electrical appliances when leaving the classroom." }
          ],
          listening: {
            title: "Green School Club Announcement",
            context: "Nghe thông báo hoạt động từ Câu lạc bộ Môi trường trường THPT Số 2 Nguyễn Trường Tộ.",
            lines: [
              { speaker: "Club Leader", text: "Good morning everyone! Welcome to our school's Go Green Club meeting." },
              { speaker: "Student", text: "What activities are we going to do this Saturday?" },
              { speaker: "Club Leader", text: "First, over one hundred young trees will be planted around the school stadium." },
              { speaker: "Student", text: "Awesome! What about the plastic recycling project?" },
              { speaker: "Club Leader", text: "Plastic bottles and used paper will be collected from every classroom at 9 AM. Please remind your classmates to sort their waste properly!" }
            ],
            checkQuestion: {
              question: "Which activity will be organized in the school yard this Saturday?",
              options: [
                "Burning collected plastic waste",
                "Planting more than 100 young trees",
                "Repainting subject classrooms",
                "Hosting an inter-school football match"
              ],
              correctIndex: 1
            }
          },
          quiz: [
            {
              question: "Thousands of plastic bottles _______ around the world every minute.",
              options: ["throw away", "are thrown away", "is thrown away", "threw away"],
              correctIndex: 1,
              explanation: "The plural subject 'Thousands of plastic bottles' receives the action in the present; thus the passive voice 'are thrown away' is required."
            },
            {
              question: "Look at those dark clouds! It _______ rain soon.",
              options: ["will", "is going to", "shall", "is"],
              correctIndex: 1,
              explanation: "Predicting an event based on immediate present evidence ('Look at those dark clouds!') requires 'be going to'."
            },
            {
              question: "Turning off unused lights is a simple way to reduce your _______.",
              options: ["carbon footprint", "household chore", "heavy lifting", "breadwinner"],
              correctIndex: 0,
              explanation: "'Carbon footprint' denotes the amount of greenhouse gas emissions generated by human activity."
            }
          ]
        }
      ],
      finalExam: [
        {
          question: "1. My mother usually _______ the cooking, but today my father _______ dinner because she has a meeting.",
          options: [
            "does / is cooking",
            "is doing / cooks",
            "do / cooks",
            "does / cooks"
          ],
          correctIndex: 0
        },
        {
          question: "2. Dividing household chores equally helps strengthen family _______.",
          options: ["footprints", "bonds", "appliances", "groceries"],
          correctIndex: 1
        },
        {
          question: "3. Choosing reusable water bottles instead of single-use plastic ones is an _______ habit.",
          options: ["eco-friendly", "organic", "electrical", "chemical"],
          correctIndex: 0
        },
        {
          question: "4. The school's English Speaking Contest _______ next month by the Foreign Language Department.",
          options: ["will hold", "will be held", "is holding", "held"],
          correctIndex: 1
        },
        {
          question: "5. 'I have already bought the paint.' - 'Really? What colour _______ you _______ paint your room?'",
          options: ["will / to", "are / going to", "do / go to", "were / going to"],
          correctIndex: 1
        },
        {
          question: "6. Who is the main _______ in your family - the person who earns most of the money?",
          options: ["homemaker", "breadwinner", "teenager", "cleaner"],
          correctIndex: 1
        },
        {
          question: "7. All electrical appliances in the computer lab must _______ off before 5:00 PM.",
          options: ["turn", "be turned", "turned", "turning"],
          correctIndex: 1
        },
        {
          question: "8. My sister _______ that sharing housework teaches young people life skills.",
          options: ["is believing", "believes", "was believing", "believe"],
          correctIndex: 1
        },
        {
          question: "9. Which word has the closest meaning to 'rubbish'?",
          options: ["laundry", "garbage", "grocery", "gratitude"],
          correctIndex: 1
        },
        {
          question: "10. Solar energy and wind power are examples of _______ energy sources.",
          options: ["sustainable", "polluted", "harmful", "disposable"],
          correctIndex: 0
        }
      ]
    },

    {
      id: "ENG-G11-U1",
      title: "Tiếng Anh Lớp 11: A Long and Healthy Life và The Generation Gap",
      grade: "11",
      level: "Intermediate (B1)",
      duration: "14 tiết",
      teacher: "Thầy Nguyễn Hải Nam",
      description: "Hệ thống hóa Past Simple vs. Present Perfect, Modal Verbs (must, have to, should) và vốn từ vựng chủ đề Sức khỏe, Khoảng cách thế hệ.",
      badgeColor: "#0f766e",
      examDurationMinutes: 15,
      lessons: [
        {
          id: "L11-1",
          title: "Unit 1: A Long and Healthy Life - Lối sống lành mạnh",
          duration: "45 phút",
          theoryHtml: `
            <h4>1. Phân biệt Past Simple và Present Perfect</h4>
            <div class="grammar-box">
              <p><strong>Past Simple (Quá khứ đơn):</strong> Diễn tả hành động đã xảy ra và chấm dứt tại thời điểm xác định trong quá khứ.</p>
              <ul>
                <li>Dấu hiệu: <em>yesterday, last week, in 2022, two months ago...</em></li>
                <li>Ví dụ: <em>She <strong>started</strong> working out at the gym two months ago.</em></li>
              </ul>
              <hr/>
              <p><strong>Present Perfect (Hiện tại hoàn thành):</strong> Diễn tả hành động bắt đầu trong quá khứ, còn tiếp diễn hoặc để lại kết quả ở hiện tại.</p>
              <ul>
                <li>Dấu hiệu: <em>since, for, already, yet, just, recently, so far...</em></li>
                <li>Ví dụ: <em>She <strong>has worked</strong> out at the gym for two months.</em></li>
              </ul>
            </div>
          `,
          vocab: [
            { word: "life expectancy", phonetic: "/ˈlaɪf ɪkspektənsi/", pos: "noun", meaning: "Tuổi thọ trung bình", example: "Life expectancy has increased significantly thanks to modern medicine." },
            { word: "work out", phonetic: "/wɜːk aʊt/", pos: "phrasal verb", meaning: "Tập luyện thể thao, rèn luyện thể chất", example: "He works out for 30 minutes every morning to stay fit." },
            { word: "balanced diet", phonetic: "/ˌbælənst ˈdaɪət/", pos: "noun", meaning: "Chế độ dinh dưỡng cân bằng", example: "A balanced diet includes plenty of fruits, vegetables, and protein." },
            { word: "antibiotics", phonetic: "/ˌæntibaɪˈɒtɪks/", pos: "noun", meaning: "Thuốc kháng sinh", example: "Antibiotics are used to treat bacterial infections." },
            { word: "give up", phonetic: "/ɡɪv ʌp/", pos: "phrasal verb", meaning: "Từ bỏ thói quen", example: "You should give up staying up late." }
          ],
          listening: {
            title: "Health Advice for High School Students",
            context: "Nghe chuyên gia chia sẻ lời khuyên về thói quen sinh hoạt khoa học cho học sinh phổ thông.",
            lines: [
              { speaker: "Host", text: "Welcome Dr. Minh! Many high school students feel exhausted during exam season. What advice do you have for them?" },
              { speaker: "Dr. Minh", text: "First, never skip breakfast! Your brain needs nutrients and energy to focus in morning classes." },
              { speaker: "Host", text: "What about physical exercise and sleep?" },
              { speaker: "Dr. Minh", text: "Students should work out at least twenty minutes a day and cut down on screen time before bed. Getting seven to eight hours of sleep is essential." }
            ],
            checkQuestion: {
              question: "According to the specialist, what is the recommended sleep duration for students per day?",
              options: ["4 to 5 hours", "5 to 6 hours", "7 to 8 hours", "Over 10 hours"],
              correctIndex: 2
            }
          },
          quiz: [
            {
              question: "My grandfather _______ doing morning exercise since he retired.",
              options: ["practised", "has practised", "practises", "is practising"],
              correctIndex: 1,
              explanation: "With 'since + past time point', the main clause uses the Present Perfect tense ('has practised')."
            },
            {
              question: "Bacterial infections can be treated effectively with _______.",
              options: ["antibiotics", "footprints", "junk food", "workouts"],
              correctIndex: 0,
              explanation: "'Antibiotics' are medical substances used to destroy or inhibit bacterial infections."
            }
          ]
        },
        {
          id: "L11-2",
          title: "Unit 2: The Generation Gap - Động từ khuyết thiếu",
          duration: "45 phút",
          theoryHtml: `
            <h4>1. Phân biệt Must, Have to và Should</h4>
            <div class="grammar-box">
              <ul>
                <li><strong>Must:</strong> Nghĩa vụ bắt buộc xuất phát từ chủ quan người nói (Phủ định <code>mustn't</code>: cấm đoán).</li>
                <li><strong>Have to:</strong> Nghĩa vụ do quy định, hoàn cảnh khách quan (Phủ định <code>don't have to</code>: không cần thiết phải làm).</li>
                <li><strong>Should:</strong> Đưa ra lời khuyên hoặc ý kiến nên làm điều gì.</li>
              </ul>
            </div>
          `,
          vocab: [
            { word: "generation gap", phonetic: "/ˌdʒenəˈreɪʃn ɡæp/", pos: "noun", meaning: "Khoảng cách giữa các thế hệ", example: "Open communication helps bridge the generation gap." },
            { word: "nuclear family", phonetic: "/ˌnjuːkliə ˈfæməli/", pos: "noun", meaning: "Gia đình hạt nhân (hai thế hệ cha mẹ - con cái)", example: "Most people in big cities live in a nuclear family." },
            { word: "extended family", phonetic: "/ɪkˌstendɪd ˈfæməli/", pos: "noun", meaning: "Gia đình nhiều thế hệ (đại gia đình)", example: "Growing up in an extended family teaches respect for elders." },
            { word: "follow in somebody's footsteps", phonetic: "/ˈfɒləʊ ɪn ˈfʊtsteps/", pos: "idiom", meaning: "Nối nghiệp, đi theo bước chân của ai", example: "He decided to follow in his father's footsteps." }
          ],
          listening: {
            title: "Bridging the Generation Gap",
            context: "Nghe chia sẻ về quy tắc giao tiếp và sinh hoạt trong gia đình.",
            lines: [
              { speaker: "Hoang", text: "In my house, we have strict rules about digital devices. We mustn't use our phones at the dinner table." },
              { speaker: "Mai", text: "Do you have to wear formal clothes on family occasions?" },
              { speaker: "Hoang", text: "No, we don't have to wear suits, just neat and polite clothes. My parents always listen to our opinions too." }
            ],
            checkQuestion: {
              question: "What rule is strictly enforced at Hoang's family dinner table?",
              options: [
                "Wearing formal business attire",
                "Digital phone usage is strictly prohibited",
                "The television must always remain on",
                "Students are not allowed to express opinions"
              ],
              correctIndex: 1
            }
          },
          quiz: [
            {
              question: "Students _______ wear school uniforms according to institutional regulations.",
              options: ["have to", "mustn't", "don't have to", "shouldn't"],
              correctIndex: 0,
              explanation: "An objective obligation resulting from institutional rules is expressed with 'have to'."
            },
            {
              question: "Tomorrow is Sunday, so I _______ get up early for classes.",
              options: ["mustn't", "don't have to", "should", "have to"],
              correctIndex: 1,
              explanation: "'Don't have to' signifies that an action is not necessary or obligatory."
            }
          ]
        }
      ],
      finalExam: [
        {
          question: "1. Medical researchers _______ effective treatments for this illness in recent years.",
          options: ["developed", "have developed", "develop", "are developing"],
          correctIndex: 1
        },
        {
          question: "2. Students _______ bring unauthorized electronic devices into the examination room.",
          options: ["don't have to", "mustn't", "should", "have to"],
          correctIndex: 1
        },
        {
          question: "3. An _______ family consists of grandparents, parents, and children living together.",
          options: ["extended", "nuclear", "single", "independent"],
          correctIndex: 0
        },
        {
          question: "4. Regular exercise and a _______ diet are vital components of personal wellness.",
          options: ["balanced", "fast", "heavy", "strict"],
          correctIndex: 0
        },
        {
          question: "5. He _______ unhealthy eating habits several months ago.",
          options: ["has given up", "gave up", "gives up", "was giving up"],
          correctIndex: 1
        }
      ]
    },

    {
      id: "ENG-G12-EXAM",
      title: "Tiếng Anh Lớp 12: Chuyên Đề Ôn Thi Tốt Nghiệp THPT và Đọc Hiểu Nâng Cao",
      grade: "12",
      level: "Upper-Intermediate (B1-B2)",
      duration: "16 tiết",
      teacher: "Thầy Nguyễn Hải Nam",
      description: "Chuyên đề tổng hợp kiến thức trọng tâm Lớp 12 theo cấu trúc đề thi tốt nghiệp THPT: Mệnh đề quan hệ, Câu điều kiện, Thì quá khứ và Kỹ năng phân tích ngữ liệu.",
      badgeColor: "#3730a3",
      examDurationMinutes: 20,
      lessons: [
        {
          id: "L12-1",
          title: "Chuyên đề 1: Phối hợp Thì Quá khứ và Mệnh đề Quan hệ",
          duration: "45 phút",
          theoryHtml: `
            <h4>1. Phối hợp Thì Past Simple và Past Continuous</h4>
            <div class="grammar-box">
              <ul>
                <li>Một hành động đang diễn ra (<code>was/were + V-ing</code>) thì một hành động khác xen vào (<code>V2/ed</code>):<br/>
                <em>While the teacher <strong>was explaining</strong> the grammar concept, a student <strong>asked</strong> a question.</em></li>
                <li>Hai hành động diễn ra song song đồng thời trong quá khứ:<br/>
                <em>While she <strong>was reading</strong> the reference document, her classmate <strong>was taking</strong> notes.</em></li>
              </ul>
            </div>
            <h4>2. Đại từ quan hệ Who, Whom, Which, That, Whose</h4>
            <div class="grammar-box">
              <ul>
                <li><code>Who</code>: thay thế cho danh từ chỉ người làm chủ ngữ.</li>
                <li><code>Whom</code>: thay thế cho danh từ chỉ người làm tân ngữ.</li>
                <li><code>Which</code>: thay thế cho danh từ chỉ sự vật, hiện tượng.</li>
                <li><code>Whose</code>: chỉ sự sở hữu cho cả người và vật.</li>
              </ul>
            </div>
          `,
          vocab: [
            { word: "dedicate", phonetic: "/ˈdedɪkeɪt/", pos: "verb", meaning: "Cống hiến, tận tụy", example: "The teacher dedicated many years to developing educational materials." },
            { word: "achievement", phonetic: "/əˈtʃiːvmənt/", pos: "noun", meaning: "Thành tựu, kết quả đạt được", example: "Passing the national examination is a significant academic achievement." },
            { word: "perseverance", phonetic: "/ˌpɜːsɪˈvɪərəns/", pos: "noun", meaning: "Tính kiên trì, bền bỉ", example: "Mastering a foreign language requires time and perseverance." },
            { word: "academic", phonetic: "/ˌækəˈdemɪk/", pos: "adj", meaning: "Thuộc về học thuật", example: "Students need to develop sound academic study methods." }
          ],
          listening: {
            title: "Study Strategies for Graduation Examination",
            context: "Nghe hướng dẫn phương pháp xây dựng kế hoạch ôn tập môn Tiếng Anh hiệu quả.",
            lines: [
              { speaker: "Speaker", text: "Regular practice and consistent vocabulary revision are critical for high school seniors." },
              { speaker: "Speaker", text: "Dedicate thirty minutes each day to reading comprehension texts and analyzing grammatical structures." }
            ],
            checkQuestion: {
              question: "What primary learning strategy is recommended in the audio passage?",
              options: [
                "Practicing reading comprehension and analyzing grammar daily",
                "Revising only in the final examination week",
                "Memorizing words without completing exercises",
                "Ignoring reading comprehension skills"
              ],
              correctIndex: 0
            }
          },
          quiz: [
            {
              question: "While we _______ for the national examination last evening, the storm interrupted the power supply.",
              options: ["revised", "were revising", "have revised", "are revising"],
              correctIndex: 1,
              explanation: "An ongoing past activity ('were revising') was interrupted by a sudden event ('interrupted')."
            },
            {
              question: "The teacher _______ students won the national awards is honored in the school ceremony.",
              options: ["who", "whom", "whose", "which"],
              correctIndex: 2,
              explanation: "'Whose' is the relative pronoun that indicates possession referring to 'students'."
            }
          ]
        }
      ],
      finalExam: [
        {
          question: "1. While the lecturer _______ the lesson, students were taking comprehensive notes.",
          options: ["explained", "was explaining", "has explained", "explains"],
          correctIndex: 1
        },
        {
          question: "2. Educators _______ their careers to enhancing the learning standards of the school.",
          options: ["dedicated", "inspired", "achieved", "admired"],
          correctIndex: 0
        },
        {
          question: "3. If candidates _______ their time appropriately, they will finish the examination on schedule.",
          options: ["managed", "manage", "had managed", "would manage"],
          correctIndex: 1
        },
        {
          question: "4. The student _______ achieved the highest score in the English contest received a merit scholarship.",
          options: ["whom", "which", "who", "whose"],
          correctIndex: 2
        },
        {
          question: "5. High academic attainment is achieved through consistent diligence and _______.",
          options: ["perseverance", "appliance", "footprint", "hesitation"],
          correctIndex: 0
        }
      ]
    }
  ],

  progress: {},

  certificates: []
};

// Nap danh sach hoc sinh toan truong (tu students.js) - chi co 1 tai khoan admin
if (window.SCHOOL_STUDENTS) {
  window.DEFAULT_SCHOOL_DATA.users = window.DEFAULT_SCHOOL_DATA.users.concat(window.SCHOOL_STUDENTS);
}
window.DEFAULT_SCHOOL_DATA.dataVersion = "2026-roster-1";
