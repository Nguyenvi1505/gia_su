document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo các biến để lưu trữ các lựa chọn của người dùng
    let selectedClass = null;
    let selectedSubject = null;
    let selectedBook = null;
    let selectedLesson = null;

    // Biến để lưu trữ thông báo lỗi
    const accessError = document.getElementById('access-error');

    // Lấy các phần tử DOM
    const selectionSteps = {
        class: document.getElementById('step-class'),
        subject: document.getElementById('step-subject'),
        book: document.getElementById('step-book'),
        lesson: document.getElementById('step-lesson')
    };

    const selectionDisplays = {
        class: document.getElementById('selected-class'),
        subject: document.getElementById('selected-subject'),
        book: document.getElementById('selected-book'),
        lesson: document.getElementById('selected-lesson')
    };

    const lessonsList = document.getElementById('lessons-list');

    // Hàm hiển thị thông báo lỗi
    function showAccessError(show) {
        if (show) {
            accessError.classList.remove('hidden');
        } else {
            accessError.classList.add('hidden');
        }
    }

    // Hàm kiểm tra quyền truy cập
    function checkAccess(classId) {
        return allowedClasses.includes(parseInt(classId));
    }

    // Hàm tải danh sách bài học từ server
    function loadLessons(classId, subject, bookId) {
        lessonsList.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></div>';

        fetch(`/api/lessons?class_id=${classId}&subject=${subject}&book=${bookId}`)
            .then(response => response.json())
            .then(data => {
                lessonsList.innerHTML = '';
                
                if (data.lessons && data.lessons.length > 0) {
                    // Sắp xếp bài học theo số
                    data.lessons.sort((a, b) => parseInt(a) - parseInt(b));
                    
                    data.lessons.forEach(lessonNumber => {
                        const lessonDiv = document.createElement('div');
                        lessonDiv.className = 'lesson-item';
                        lessonDiv.setAttribute('data-value', lessonNumber);
                        lessonDiv.textContent = 'Bài ' + lessonNumber;
                        
                        lessonDiv.addEventListener('click', function() {
                            // Bỏ chọn các bài học khác
                            document.querySelectorAll('.lesson-item').forEach(li => li.classList.remove('selected'));
                            
                            // Chọn bài học hiện tại
                            this.classList.add('selected');
                            selectedLesson = this.getAttribute('data-value');
                            
                            // Cập nhật hiển thị
                            selectionDisplays.lesson.textContent = 'Bài ' + selectedLesson;
                            
                            // Hiển thị nút bắt đầu học
                            showStartLearningButton();
                        });
                        
                        lessonsList.appendChild(lessonDiv);
                    });
                } else {
                    lessonsList.innerHTML = '<div class="alert alert-info">Chưa có bài học nào cho lựa chọn này.</div>';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                lessonsList.innerHTML = '<div class="alert alert-danger">Không thể tải danh sách bài học. Vui lòng thử lại sau.</div>';
            });
    }

    // Hiển thị nút bắt đầu học
    function showStartLearningButton() {
        // Kiểm tra xem đã có nút hay chưa
        let startBtn = document.querySelector('.start-learning-btn');
        
        if (!startBtn) {
            // Tạo nút nếu chưa có
            startBtn = document.createElement('button');
            startBtn.className = 'btn btn-success start-learning-btn';
            startBtn.innerHTML = '<i class="fas fa-play-circle"></i> Bắt đầu học';
            
            startBtn.addEventListener('click', function() {
                // Xác định tên môn học dễ đọc
                let subjectName;
                let subjectCode = selectedSubject;
                if (selectedSubject === 'math') {
                    subjectName = 'Toán';
                } else if (selectedSubject === 'math_exercises') {
                    subjectName = 'Bài tập Toán';
                } else {
                    subjectName = 'Tiếng Việt';
                }
                
                // Kiểm tra quyền truy cập lần cuối trước khi chuyển hướng
                if (checkAccess(selectedClass)) {
                    // Chuyển hướng đến trang bài học
                    window.location.href = `/learn?class=${selectedClass}&subject=${subjectCode}&book=${selectedBook}&lesson=${selectedLesson}`;
                } else {
                    showAccessError(true);
                }
            });
            
            // Thêm nút vào phần chọn bài học
            selectionSteps.lesson.appendChild(startBtn);
        }
        
        // Hiển thị nút
        startBtn.classList.add('show');
    }

    // Áp dụng phân quyền cho lớp học
    function applyClassPermissions() {
        const classItems = document.querySelectorAll('#step-class .selection-item');
        classItems.forEach(item => {
            const classId = item.getAttribute('data-value');
            
            // Kiểm tra quyền truy cập
            if (!checkAccess(classId)) {
                item.classList.add('disabled');
                item.setAttribute('title', 'Bạn không có quyền truy cập vào lớp này');
                
                // Thêm biểu tượng khóa
                const lockIcon = document.createElement('div');
                lockIcon.className = 'lock-icon';
                lockIcon.innerHTML = '<i class="fas fa-lock"></i>';
                item.appendChild(lockIcon);
            }
        });
    }

    // Thêm sự kiện cho các lựa chọn lớp học
    const classItems = document.querySelectorAll('#step-class .selection-item');
    classItems.forEach(item => {
        item.addEventListener('click', function() {
            // Ẩn thông báo lỗi
            showAccessError(false);
            
            // Kiểm tra nếu đã bị vô hiệu hóa
            if (this.classList.contains('disabled')) {
                showAccessError(true);
                return;
            }
            
            // Bỏ chọn các lớp khác
            classItems.forEach(ci => ci.classList.remove('selected'));
            
            // Chọn lớp hiện tại
            this.classList.add('selected');
            selectedClass = this.getAttribute('data-value');
            
            // Cập nhật hiển thị lựa chọn
            selectionDisplays.class.textContent = 'Lớp ' + selectedClass;
            selectionDisplays.subject.textContent = '--';
            selectionDisplays.book.textContent = '--';
            selectionDisplays.lesson.textContent = '--';
            
            // Reset các lựa chọn tiếp theo
            selectedSubject = null;
            selectedBook = null;
            selectedLesson = null;
            
            // Hiển thị bước tiếp theo và ẩn các bước sau
            selectionSteps.subject.classList.remove('hidden');
            selectionSteps.subject.classList.add('fade-in');
            selectionSteps.book.classList.add('hidden');
            selectionSteps.lesson.classList.add('hidden');
            
            // Loại bỏ nút bắt đầu học nếu có
            const startBtn = document.querySelector('.start-learning-btn');
            if (startBtn) {
                startBtn.classList.remove('show');
            }
        });
    });

    // Thêm sự kiện cho lựa chọn môn học
    const subjectItems = document.querySelectorAll('#step-subject .selection-item');
    subjectItems.forEach(item => {
        item.addEventListener('click', function() {
            // Ẩn thông báo lỗi
            showAccessError(false);
            
            // Bỏ chọn các môn học khác
            subjectItems.forEach(si => si.classList.remove('selected'));
            
            // Chọn môn học hiện tại
            this.classList.add('selected');
            selectedSubject = this.getAttribute('data-value');
            
            // Hiển thị tên môn học dễ đọc
            let subjectName;
            if (selectedSubject === 'math') {
                subjectName = 'Toán';
            } else if (selectedSubject === 'math_exercises') {
                subjectName = 'Bài tập Toán';
            } else {
                subjectName = 'Tiếng Việt';
            }
            selectionDisplays.subject.textContent = subjectName;
            selectionDisplays.book.textContent = '--';
            selectionDisplays.lesson.textContent = '--';
            
            // Reset các lựa chọn tiếp theo
            selectedBook = null;
            selectedLesson = null;
            
            // Hiển thị bước tiếp theo và ẩn các bước sau
            selectionSteps.book.classList.remove('hidden');
            selectionSteps.book.classList.add('fade-in');
            selectionSteps.lesson.classList.add('hidden');
            
            // Loại bỏ nút bắt đầu học nếu có
            const startBtn = document.querySelector('.start-learning-btn');
            if (startBtn) {
                startBtn.classList.remove('show');
            }
        });
    });

    // Thêm sự kiện cho lựa chọn tập sách
    const bookItems = document.querySelectorAll('#step-book .selection-item');
    bookItems.forEach(item => {
        item.addEventListener('click', function() {
            // Ẩn thông báo lỗi
            showAccessError(false);
            
            // Bỏ chọn các tập sách khác
            bookItems.forEach(bi => bi.classList.remove('selected'));
            
            // Chọn tập sách hiện tại
            this.classList.add('selected');
            selectedBook = this.getAttribute('data-value');
            
            // Cập nhật hiển thị
            selectionDisplays.book.textContent = 'Tập ' + selectedBook;
            selectionDisplays.lesson.textContent = '--';
            
            // Reset bài học đã chọn
            selectedLesson = null;
            
            // Hiển thị bước tiếp theo
            selectionSteps.lesson.classList.remove('hidden');
            selectionSteps.lesson.classList.add('fade-in');
            
            // Tải danh sách bài học từ server
            loadLessons(selectedClass, selectedSubject, selectedBook);
            
            // Loại bỏ nút bắt đầu học nếu có
            const startBtn = document.querySelector('.start-learning-btn');
            if (startBtn) {
                startBtn.classList.remove('show');
            }
        });
    });

    // Thêm sự kiện cho các nút quay lại
    const backButtons = document.querySelectorAll('.back-button');
    backButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Ẩn thông báo lỗi
            showAccessError(false);
            
            const targetStep = this.getAttribute('data-step');
            
            // Ẩn tất cả các bước sau bước đích
            if (targetStep === 'class') {
                selectionSteps.subject.classList.add('hidden');
                selectionSteps.book.classList.add('hidden');
                selectionSteps.lesson.classList.add('hidden');
            } else if (targetStep === 'subject') {
                selectionSteps.book.classList.add('hidden');
                selectionSteps.lesson.classList.add('hidden');
            } else if (targetStep === 'book') {
                selectionSteps.lesson.classList.add('hidden');
            }
            
            // Hiển thị bước đích
            selectionSteps[targetStep].classList.remove('hidden');
            
            // Loại bỏ nút bắt đầu học nếu có
            const startBtn = document.querySelector('.start-learning-btn');
            if (startBtn) {
                startBtn.classList.remove('show');
            }
        });
    });

    // CSS cho phần tử bị vô hiệu hóa
    const style = document.createElement('style');
    style.textContent = `
        .selection-item.disabled {
            opacity: 0.5;
            cursor: not-allowed;
            position: relative;
        }
        .lock-icon {
            position: absolute;
            top: 5px;
            right: 5px;
            color: #f00;
            font-size: 18px;
        }
        .hidden {
            display: none;
        }
        #access-error {
            margin-bottom: 20px;
        }
    `;
    document.head.appendChild(style);

    // Áp dụng phân quyền khi trang được tải
    applyClassPermissions();
});