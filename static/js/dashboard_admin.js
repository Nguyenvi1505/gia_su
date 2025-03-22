document.addEventListener('DOMContentLoaded', function() {
    // Tab Navigation
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all tabs
            tabLinks.forEach(tab => tab.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to current tab
            this.classList.add('active');
            
            const tabId = this.getAttribute('data-tab');
            const tabContent = document.getElementById(tabId);
            
            if (tabContent) {
                tabContent.classList.add('active');
            } else {
                console.error(`Tab content with ID '${tabId}' not found.`);
            }
        });
    });
    
    // User Management
    initUserManagement();
    
    // Lesson Management
    initLessonManagement();

    initImageUpload();
});

// User Management Functions
function initUserManagement() {
    // Add new user
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', addUser);
    }
    
    // Setup edit user buttons
    setupEditUserButtons();
    
    // Setup delete user buttons
    setupDeleteUserButtons();
}

function addUser() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const allowedClasses = [];
    
    // Get selected classes
    for (let i = 1; i <= 5; i++) {
        if (document.getElementById(`class${i}`).checked) {
            allowedClasses.push(i);
        }
    }
    
    // Validate inputs
    if (!username || !password) {
        showAlert('error', 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
        return;
    }
    
    if (allowedClasses.length === 0) {
        showAlert('error', 'Vui lòng chọn ít nhất một lớp được phép truy cập.');
        return;
    }
    
    // Send request to server
    fetch('/api/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            password: password,
            allowed_classes: allowedClasses
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Add user to table
            const tableBody = document.getElementById('users-table');
            const newRow = document.createElement('tr');
            
            // Create badges for allowed classes
            const badgesHtml = allowedClasses.map(classId => 
                `<span class="badge bg-primary">Lớp ${classId}</span>`
            ).join(' ');
            
            newRow.innerHTML = `
                <td>${username}</td>
                <td>${password}</td>
                <td>${badgesHtml}</td>
                <td>
                    <button class="btn btn-sm btn-info edit-user" data-username="${username}">
                        <i class="fas fa-edit"></i> Sửa
                    </button>
                    <button class="btn btn-sm btn-danger delete-user" data-username="${username}">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                </td>
            `;
            
            tableBody.appendChild(newRow);
            
            // Reset form
            document.getElementById('add-user-form').reset();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
            modal.hide();
            
            // Show success message
            showAlert('success', 'Thêm tài khoản mới thành công!');
            
            // Re-setup buttons
            setupEditUserButtons();
            setupDeleteUserButtons();
        } else {
            showAlert('error', data.error || 'Có lỗi xảy ra khi thêm tài khoản.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('error', 'Có lỗi xảy ra khi kết nối với máy chủ.');
    });
}

function setupEditUserButtons() {
    const editButtons = document.querySelectorAll('.edit-user');
    
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const username = this.getAttribute('data-username');
            const row = this.closest('tr');
            const password = row.cells[1].textContent;
            
            // Get class badges
            const classBadges = row.cells[2].querySelectorAll('.badge');
            const allowedClasses = Array.from(classBadges).map(badge => {
                return parseInt(badge.textContent.replace('Lớp ', ''));
            });
            
            // Fill the edit form
            document.getElementById('edit-username').value = username;
            document.getElementById('edit-username-display').value = username;
            document.getElementById('edit-password').value = '';
            document.getElementById('edit-password').placeholder = 'Để trống nếu không thay đổi';
            
            // Reset checkboxes
            for (let i = 1; i <= 5; i++) {
                document.getElementById(`edit-class${i}`).checked = allowedClasses.includes(i);
            }
            
            // Show modal
            const editModal = new bootstrap.Modal(document.getElementById('editUserModal'));
            editModal.show();
        });
    });
    
    // Setup update user button
    const updateUserBtn = document.getElementById('update-user-btn');
    if (updateUserBtn) {
        updateUserBtn.addEventListener('click', updateUser);
    }
}

function updateUser() {
    const username = document.getElementById('edit-username').value;
    const password = document.getElementById('edit-password').value;
    const allowedClasses = [];
    
    // Get selected classes
    for (let i = 1; i <= 5; i++) {
        if (document.getElementById(`edit-class${i}`).checked) {
            allowedClasses.push(i);
        }
    }
    
    // Validate inputs
    if (!username) {
        showAlert('error', 'Tên người dùng không hợp lệ.');
        return;
    }
    
    if (allowedClasses.length === 0) {
        showAlert('error', 'Vui lòng chọn ít nhất một lớp được phép truy cập.');
        return;
    }
    
    // Send request to server
    fetch('/api/users', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            password: password,
            allowed_classes: allowedClasses
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update user in table
            const rows = document.querySelectorAll('#users-table tr');
            
            for (const row of rows) {
                if (row.cells[0].textContent === username) {
                    // Only update password if provided
                    if (password) {
                        row.cells[1].textContent = password;
                    }
                    
                    // Update allowed classes
                    const badgesHtml = allowedClasses.map(classId => 
                        `<span class="badge bg-primary">Lớp ${classId}</span>`
                    ).join(' ');
                    
                    row.cells[2].innerHTML = badgesHtml;
                    break;
                }
            }
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
            modal.hide();
            
            // Show success message
            showAlert('success', 'Cập nhật tài khoản thành công!');
        } else {
            showAlert('error', data.error || 'Có lỗi xảy ra khi cập nhật tài khoản.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('error', 'Có lỗi xảy ra khi kết nối với máy chủ.');
    });
}

function setupDeleteUserButtons() {
    const deleteButtons = document.querySelectorAll('.delete-user');
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const username = this.getAttribute('data-username');
            
            if (confirm(`Bạn có chắc chắn muốn xóa tài khoản "${username}" không?`)) {
                deleteUser(username, this.closest('tr'));
            }
        });
    });
}

function deleteUser(username, row) {
    fetch(`/api/users?username=${encodeURIComponent(username)}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Remove row from table
            row.remove();
            
            // Show success message
            showAlert('success', 'Xóa tài khoản thành công!');
        } else {
            showAlert('error', data.error || 'Có lỗi xảy ra khi xóa tài khoản.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('error', 'Có lỗi xảy ra khi kết nối với máy chủ.');
    });
}

function setupLessonTabs() {
    console.log('Setting up lesson tabs');
    const lessonTabs = document.querySelectorAll('.lesson-tab');
    
    lessonTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Tab clicked:', this.getAttribute('data-tab'));
            
            // Remove active class from all tabs
            lessonTabs.forEach(t => t.classList.remove('active'));
            
            // Hide all tab contents within lesson-editor-tab-content container
            const tabContentContainer = document.getElementById('lesson-editor-tab-content');
            if (tabContentContainer) {
                tabContentContainer.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
            }
            
            // Add active class to current tab
            this.classList.add('active');
            
            // Show current tab content
            const tabId = this.getAttribute('data-tab');
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
                console.log('Activated tab content:', tabId);
            } else {
                console.error('Tab content not found:', tabId);
            }
        });
    });
}

function loadClasses() {
    fetch('/api/lessons')
        .then(response => response.json())
        .then(data => {
            if (data.classes) {
                const classSelect = document.getElementById('lesson-class');
                if (classSelect) {
                    // Clear options except the first one
                    while (classSelect.options.length > 1) {
                        classSelect.remove(1);
                    }
                    
                    // Add class options
                    data.classes.forEach(classId => {
                        const option = new Option(`Lớp ${classId}`, classId);
                        classSelect.add(option);
                    });
                }
            }
        })
        .catch(error => {
            console.error('Error loading classes:', error);
            showAlert('error', 'Có lỗi xảy ra khi tải danh sách lớp.');
        });
}

function loadSubjects(classId) {
    // Log để debug
    console.log('Loading subjects for class:', classId);
    
    fetch(`/api/lessons?class_id=${classId}`)
        .then(response => {
            console.log('API response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('API data received:', data);
            
            if (data.subjects && Array.isArray(data.subjects)) {
                const subjectSelect = document.getElementById('lesson-subject');
                if (subjectSelect) {
                    // Clear existing options
                    while (subjectSelect.options.length > 1) {
                        subjectSelect.remove(1);
                    }
                    
                    // Add new options
                    data.subjects.forEach(subject => {
                        let subjectName = subject;
                        if (subject === 'math') {
                            subjectName = 'Toán';
                        } else if (subject === 'math_exercises') {
                            subjectName = 'Bài tập Toán';
                        } else if (subject === 'vietnamese') {
                            subjectName = 'Tiếng Việt';
                        }
                        
                        const option = new Option(subjectName, subject);
                        subjectSelect.add(option);
                    });
                    
                    // Enable the select
                    subjectSelect.disabled = false;
                } else {
                    console.error('Subject select element not found');
                }
            } else {
                console.error('No subjects found in API response:', data);
            }
        })
        .catch(error => {
            console.error('Error loading subjects:', error);
            alert('Có lỗi xảy ra khi tải danh sách môn học. Xem console để biết thêm chi tiết.');
        });
}

function loadBooks(classId, subject) {
    console.log('Loading books for class:', classId, 'subject:', subject);
    
    fetch(`/api/lessons?class_id=${classId}&subject=${subject}`)
        .then(response => {
            console.log('API response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Books data received:', data);
            
            if (data.books && Array.isArray(data.books)) {
                const bookSelect = document.getElementById('lesson-book');
                if (bookSelect) {
                    // Clear existing options except first placeholder
                    while (bookSelect.options.length > 1) {
                        bookSelect.remove(1);
                    }
                    
                    // Add new options
                    data.books.forEach(book => {
                        const option = new Option(`Tập ${book}`, book);
                        bookSelect.add(option);
                    });
                    
                    // Enable select
                    bookSelect.disabled = false;
                } else {
                    console.error('Book select element not found');
                }
            } else {
                // Thêm mặc định 2 tập nếu API không trả về
                console.log('No books found in API, adding default books');
                const bookSelect = document.getElementById('lesson-book');
                if (bookSelect) {
                    // Clear existing options except first placeholder
                    while (bookSelect.options.length > 1) {
                        bookSelect.remove(1);
                    }
                    
                    // Add default books
                    const option1 = new Option('Tập 1', '1');
                    const option2 = new Option('Tập 2', '2');
                    bookSelect.add(option1);
                    bookSelect.add(option2);
                    
                    // Enable select
                    bookSelect.disabled = false;
                }
            }
        })
        .catch(error => {
            console.error('Error loading books:', error);
            
            // Thêm mặc định 2 tập nếu có lỗi
            const bookSelect = document.getElementById('lesson-book');
            if (bookSelect) {
                // Clear existing options except first placeholder
                while (bookSelect.options.length > 1) {
                    bookSelect.remove(1);
                }
                
                // Add default books
                const option1 = new Option('Tập 1', '1');
                const option2 = new Option('Tập 2', '2');
                bookSelect.add(option1);
                bookSelect.add(option2);
                
                // Enable select
                bookSelect.disabled = false;
            }
        });
}

function loadLessons(classId, subject, book) {
    console.log('Loading lessons for class:', classId, 'subject:', subject, 'book:', book);
    
    fetch(`/api/lessons?class_id=${classId}&subject=${subject}&book=${book}`)
        .then(response => {
            console.log('API response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Lessons data received:', data);
            
            const lessonSelect = document.getElementById('lesson-number');
            if (lessonSelect) {
                // Clear existing options except first placeholder
                while (lessonSelect.options.length > 1) {
                    lessonSelect.remove(1);
                }
                
                // Add option to create new lesson
                const createNewOption = new Option("+ Tạo bài mới", "new");
                lessonSelect.add(createNewOption);
                
                // Add existing lessons if available
                if (data.lessons && Array.isArray(data.lessons) && data.lessons.length > 0) {
                    data.lessons.forEach(lesson => {
                        const option = new Option(`Bài ${lesson}`, lesson);
                        lessonSelect.add(option);
                    });
                }
                
                // Enable select
                lessonSelect.disabled = false;
            } else {
                console.error('Lesson select element not found');
            }
        })
        .catch(error => {
            console.error('Error loading lessons:', error);
            
            // Add only the create new option if there's an error
            const lessonSelect = document.getElementById('lesson-number');
            if (lessonSelect) {
                // Clear existing options except first placeholder
                while (lessonSelect.options.length > 1) {
                    lessonSelect.remove(1);
                }
                
                // Add option to create new lesson
                const createNewOption = new Option("+ Tạo bài mới", "new");
                lessonSelect.add(createNewOption);
                
                // Enable select
                lessonSelect.disabled = false;
            }
        });
}

function handleLessonSelection() {
    const lessonSelect = document.getElementById('lesson-number');
    if (lessonSelect) {
        lessonSelect.addEventListener('change', function() {
            const selectedValue = this.value;
            
            if (selectedValue === 'new') {
                // Người dùng muốn tạo bài mới
                createNewLesson();
            } else if (selectedValue) {
                // Người dùng chọn bài đã có
                loadLessonContent(selectedValue);
                
                // Enable buttons
                const saveLessonBtn = document.getElementById('save-lesson-btn');
                const previewLessonBtn = document.getElementById('preview-lesson-btn');
                const deleteLessonBtn = document.getElementById('delete-lesson-btn');
                
                if (saveLessonBtn) saveLessonBtn.disabled = false;
                if (previewLessonBtn) previewLessonBtn.disabled = false;
                if (deleteLessonBtn) deleteLessonBtn.disabled = false;
            }
        });
    }
}

function createNewLesson() {
    const newLessonNumber = prompt('Nhập số bài học mới:');
    if (!newLessonNumber || isNaN(parseInt(newLessonNumber))) {
        alert('Số bài học không hợp lệ.');
        
        // Reset selection
        const lessonSelect = document.getElementById('lesson-number');
        if (lessonSelect && lessonSelect.options.length > 0) {
            lessonSelect.selectedIndex = 0;
        }
        return;
    }
    
    // Set lesson title
    const lessonTitleInput = document.getElementById('lesson-title');
    if (lessonTitleInput) {
        lessonTitleInput.value = `Bài ${newLessonNumber}`;
    }
    
    // Clear editors
    clearEditors();
    
    // Add default content to theory and summary
    const theoryEditor = document.getElementById('theory-editor');
    if (theoryEditor) {
        theoryEditor.value = '<p>Nội dung lý thuyết...</p>';
        // If using TinyMCE
        if (typeof tinymce !== 'undefined' && tinymce.get('theory-editor')) {
            tinymce.get('theory-editor').setContent('<p>Nội dung lý thuyết...</p>');
        }
    }
    
    const summaryEditor = document.getElementById('summary-editor');
    if (summaryEditor) {
        summaryEditor.value = '<p>Tóm tắt bài học...</p>';
        // If using TinyMCE
        if (typeof tinymce !== 'undefined' && tinymce.get('summary-editor')) {
            tinymce.get('summary-editor').setContent('<p>Tóm tắt bài học...</p>');
        }
    }
    
    // Enable all buttons
    const saveLessonBtn = document.getElementById('save-lesson-btn');
    const previewLessonBtn = document.getElementById('preview-lesson-btn');
    const deleteLessonBtn = document.getElementById('delete-lesson-btn');
    
    if (saveLessonBtn) saveLessonBtn.disabled = false;
    if (previewLessonBtn) previewLessonBtn.disabled = false;
    if (deleteLessonBtn) deleteLessonBtn.disabled = true; // Cannot delete a new lesson
    
    // Add the option for the new lesson to the select
    const lessonSelect = document.getElementById('lesson-number');
    if (lessonSelect) {
        // Check if this lesson number already exists
        let exists = false;
        for (let i = 0; i < lessonSelect.options.length; i++) {
            if (lessonSelect.options[i].value === newLessonNumber) {
                exists = true;
                lessonSelect.selectedIndex = i;
                break;
            }
        }
        
        if (!exists) {
            // Add new option
            const newOption = new Option(`Bài ${newLessonNumber}`, newLessonNumber);
            
            // Insert after the "Create new" option
            if (lessonSelect.options.length > 1) {
                const createNewOption = lessonSelect.options[1];
                lessonSelect.insertBefore(newOption, createNewOption.nextSibling);
            } else {
                lessonSelect.add(newOption);
            }
            
            // Select the new option
            newOption.selected = true;
        }
    }
}

function setupDeleteLessonButton() {
    const deleteLessonBtn = document.getElementById('delete-lesson-btn');
    if (deleteLessonBtn) {
        deleteLessonBtn.addEventListener('click', function() {
            deleteLesson();
        });
    }
}

function deleteLesson() {
    const classId = document.getElementById('lesson-class')?.value;
    const subject = document.getElementById('lesson-subject')?.value;
    const book = document.getElementById('lesson-book')?.value;
    const lesson = document.getElementById('lesson-number')?.value;
    
    if (!classId || !subject || !book || !lesson || lesson === 'new') {
        alert('Vui lòng chọn bài học cần xóa.');
        return;
    }
    
    if (confirm(`Bạn có chắc chắn muốn xóa Bài ${lesson} không? Hành động này không thể hoàn tác.`)) {
        fetch(`/api/lessons?class_id=${classId}&subject=${subject}&book=${book}&lesson=${lesson}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Remove lesson from dropdown
                const lessonSelect = document.getElementById('lesson-number');
                if (lessonSelect) {
                    for (let i = 0; i < lessonSelect.options.length; i++) {
                        if (lessonSelect.options[i].value === lesson) {
                            lessonSelect.remove(i);
                            break;
                        }
                    }
                    
                    // Reset selection
                    lessonSelect.selectedIndex = 0;
                }
                
                // Clear content area
                clearEditors();
                
                // Disable buttons
                const saveLessonBtn = document.getElementById('save-lesson-btn');
                const previewLessonBtn = document.getElementById('preview-lesson-btn');
                const deleteLessonBtn = document.getElementById('delete-lesson-btn');
                
                if (saveLessonBtn) saveLessonBtn.disabled = true;
                if (previewLessonBtn) previewLessonBtn.disabled = true;
                if (deleteLessonBtn) deleteLessonBtn.disabled = true;
                
                alert('Xóa bài học thành công!');
            } else {
                alert(data.error || 'Có lỗi xảy ra khi xóa bài học.');
            }
        })
        .catch(error => {
            console.error('Error deleting lesson:', error);
            alert('Có lỗi xảy ra khi kết nối với máy chủ.');
        });
    }
}

function initLessonManagement() {
    // Load classes for lesson management
    loadClasses();

    initEditors();
    initExerciseTemplates();
    setupLessonTabs();
    
    // Enable lesson-class select
    const classSelect = document.getElementById('lesson-class');
    if (classSelect) {
        classSelect.disabled = false;
    }
    
    // Setup event listeners
    const lessonClassSelect = document.getElementById('lesson-class');
    if (lessonClassSelect) {
        lessonClassSelect.addEventListener('change', function() {
            const classId = this.value;
            if (classId) {
                loadSubjects(classId);
                const subjectSelect = document.getElementById('lesson-subject');
                if (subjectSelect) {
                    subjectSelect.disabled = false;
                }
            } else {
                resetSelectElement('lesson-subject');
                resetSelectElement('lesson-book');
                resetSelectElement('lesson-number');
                
                const subjectSelect = document.getElementById('lesson-subject');
                const bookSelect = document.getElementById('lesson-book');
                const lessonSelect = document.getElementById('lesson-number');
                
                if (subjectSelect) subjectSelect.disabled = true;
                if (bookSelect) bookSelect.disabled = true;
                if (lessonSelect) lessonSelect.disabled = true;
            }
        });
    }
    
    const lessonSubjectSelect = document.getElementById('lesson-subject');
    if (lessonSubjectSelect) {
        lessonSubjectSelect.addEventListener('change', function() {
            const classId = document.getElementById('lesson-class')?.value;
            const subject = this.value;
            
            if (subject) {
                loadBooks(classId, subject);
                const bookSelect = document.getElementById('lesson-book');
                if (bookSelect) {
                    bookSelect.disabled = false;
                }
            } else {
                resetSelectElement('lesson-book');
                resetSelectElement('lesson-number');
                
                const bookSelect = document.getElementById('lesson-book');
                const lessonSelect = document.getElementById('lesson-number');
                
                if (bookSelect) bookSelect.disabled = true;
                if (lessonSelect) lessonSelect.disabled = true;
            }
        });
    }
    
    const lessonBookSelect = document.getElementById('lesson-book');
    if (lessonBookSelect) {
        lessonBookSelect.addEventListener('change', function() {
            const classId = document.getElementById('lesson-class')?.value;
            const subject = document.getElementById('lesson-subject')?.value;
            const book = this.value;
            
            if (book) {
                loadLessons(classId, subject, book);
                const lessonSelect = document.getElementById('lesson-number');
                if (lessonSelect) {
                    lessonSelect.disabled = false;
                }
            } else {
                resetSelectElement('lesson-number');
                const lessonSelect = document.getElementById('lesson-number');
                if (lessonSelect) {
                    lessonSelect.disabled = true;
                }
            }
        });
    }
    
    // Setup lesson selection handler
    handleLessonSelection();
    
    // Setup save button
    const saveLessonBtn = document.getElementById('save-lesson-btn');
    if (saveLessonBtn) {
        saveLessonBtn.addEventListener('click', saveLesson);
    }
    
    // Setup preview button
    const previewLessonBtn = document.getElementById('preview-lesson-btn');
    if (previewLessonBtn) {
        previewLessonBtn.addEventListener('click', previewLesson);
    }
    
    // Setup delete button
    setupDeleteLessonButton();
}

function loadLessonContent(lesson) {
    const classId = document.getElementById('lesson-class')?.value;
    const subject = document.getElementById('lesson-subject')?.value;
    const book = document.getElementById('lesson-book')?.value;
    
    if (!classId || !subject || !book || !lesson) {
        return;
    }
    
    fetch(`/api/lesson_content?class_id=${classId}&subject=${subject}&book=${book}&lesson=${lesson}`)
        .then(response => response.json())
        .then(data => {
            if (data.lesson_data) {
                // Cập nhật tiêu đề bài học
                const lessonTitleInput = document.getElementById('lesson-title');
                if (lessonTitleInput) {
                    lessonTitleInput.value = data.lesson_data.title || `Bài ${lesson}`;
                }
                
                // Cập nhật nội dung lý thuyết
                if (typeof tinymce !== 'undefined' && tinymce.get('theory-editor')) {
                    tinymce.get('theory-editor').setContent(data.lesson_data.sections?.theory?.content || '');
                } else {
                    const theoryEditor = document.getElementById('theory-editor');
                    if (theoryEditor) {
                        theoryEditor.value = data.lesson_data.sections?.theory?.content || '';
                    }
                }
                
                // Cập nhật nội dung tóm tắt
                if (typeof tinymce !== 'undefined' && tinymce.get('summary-editor')) {
                    tinymce.get('summary-editor').setContent(data.lesson_data.sections?.summary?.content || '');
                } else {
                    const summaryEditor = document.getElementById('summary-editor');
                    if (summaryEditor) {
                        summaryEditor.value = data.lesson_data.sections?.summary?.content || '';
                    }
                }
                
                // Xóa tất cả bài tập hiện tại
                const exerciseBlocksContainer = document.getElementById('exercise-blocks-container');
                if (exerciseBlocksContainer) {
                    exerciseBlocksContainer.innerHTML = '';
                    
                    // Hiển thị các khối bài tập từ dữ liệu
                    const exerciseBlocks = data.lesson_data.sections?.exercises?.exerciseBlocks || [];
                    
                    if (exerciseBlocks.length > 0) {
                        // Ẩn thông báo "chưa có bài tập"
                        const emptyMessage = document.querySelector('.empty-exercises-message');
                        if (emptyMessage) {
                            emptyMessage.style.display = 'none';
                        }
                        
                        // Hiển thị từng khối bài tập
                        exerciseBlocks.forEach(block => {
                            // Tạo khối mới từ loại bài tập
                            const template = createExerciseTemplate(block.type);
                            exerciseBlocksContainer.insertAdjacentHTML('beforeend', template);
                            
                            // Lấy khối vừa thêm
                            const newBlock = exerciseBlocksContainer.lastElementChild;
                            
                            // Cập nhật tiêu đề tùy chỉnh nếu có
                            const blockTitleInput = newBlock.querySelector('.custom-block-title');
                            if (blockTitleInput && block.title) {
                                blockTitleInput.value = block.title;
                            }
                            
                            // Xóa bài tập mẫu mặc định
                            const problemsContainer = newBlock.querySelector('.problems-container');
                            problemsContainer.innerHTML = '';
                            
                            // Thêm các bài tập từ dữ liệu
                            block.problems.forEach(problem => {
                                let problemTemplate = '';
                                
                                switch(block.type) {
                                    case 'comparison':
                                        problemTemplate = `
                                            <div class="problem-item mb-3">
                                                <div class="row align-items-center">
                                                    <div class="col-auto">
                                                        <input type="text" class="form-control" value="${problem.leftSide || ''}" data-field="leftSide">
                                                    </div>
                                                    <div class="col-auto">
                                                        <select class="form-select" data-field="correctAnswer">
                                                            <option value="<" ${problem.correctAnswer === '<' ? 'selected' : ''}>&lt;</option>
                                                            <option value="=" ${problem.correctAnswer === '=' ? 'selected' : ''}>=</option>
                                                            <option value=">" ${problem.correctAnswer === '>' ? 'selected' : ''}>&gt;</option>
                                                        </select>
                                                    </div>
                                                    <div class="col-auto">
                                                        <input type="text" class="form-control" value="${problem.rightSide || ''}" data-field="rightSide">
                                                    </div>
                                                    <div class="col-auto">
                                                        <button type="button" class="btn btn-sm btn-danger delete-problem-btn">
                                                            <i class="fas fa-times"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div class="row mt-2">
                                                    <div class="col">
                                                        <label>Giải thích:</label>
                                                        <textarea class="form-control" placeholder="Giải thích cho đáp án này" data-field="explanation" rows="2">${problem.explanation || ''}</textarea>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                        break;
                                        
                                    case 'mentalMath':
                                        problemTemplate = `
                                            <div class="problem-item mb-3">
                                                <div class="row align-items-center">
                                                    <div class="col-auto">
                                                        <input type="text" class="form-control" value="${problem.question || ''}" data-field="question">
                                                    </div>
                                                    <div class="col-auto">
                                                        <input type="text" class="form-control" value="${problem.correctAnswer || ''}" data-field="correctAnswer">
                                                    </div>
                                                    <div class="col-auto">
                                                        <button type="button" class="btn btn-sm btn-danger delete-problem-btn">
                                                            <i class="fas fa-times"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div class="row mt-2">
                                                    <div class="col">
                                                        <label>Giải thích:</label>
                                                        <textarea class="form-control" placeholder="Giải thích cho đáp án này" data-field="explanation" rows="2">${problem.explanation || ''}</textarea>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                        break;
                                        
                                    case 'trueFalse':
                                        problemTemplate = `
                                            <div class="problem-item mb-3">
                                                <div class="row align-items-center">
                                                    <div class="col">
                                                        <input type="text" class="form-control" value="${problem.statement || ''}" data-field="statement">
                                                    </div>
                                                    <div class="col-auto">
                                                        <select class="form-select" data-field="correctAnswer">
                                                            <option value="Đ" ${problem.correctAnswer === 'Đ' ? 'selected' : ''}>Đúng</option>
                                                            <option value="S" ${problem.correctAnswer === 'S' ? 'selected' : ''}>Sai</option>
                                                        </select>
                                                    </div>
                                                    <div class="col-auto">
                                                        <button type="button" class="btn btn-sm btn-danger delete-problem-btn">
                                                            <i class="fas fa-times"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div class="row mt-2">
                                                    <div class="col">
                                                        <label>Giải thích:</label>
                                                        <textarea class="form-control" placeholder="Giải thích cho đáp án này" data-field="explanation" rows="2">${problem.explanation || ''}</textarea>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                        break;
                                        
                                    case 'wordProblem':
                                        problemTemplate = `
                                            <div class="problem-item mb-3">
                                                <div class="mb-3">
                                                    <textarea class="form-control" rows="3" data-field="text">${problem.text || ''}</textarea>
                                                </div>
                                                <div class="row align-items-center">
                                                    <div class="col-auto">
                                                        <label>Đáp án:</label>
                                                    </div>
                                                    <div class="col-auto">
                                                        <input type="text" class="form-control" value="${problem.correctAnswer || ''}" data-field="correctAnswer">
                                                    </div>
                                                    <div class="col-auto">
                                                        <button type="button" class="btn btn-sm btn-danger delete-problem-btn">
                                                            <i class="fas fa-times"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div class="row mt-2">
                                                    <div class="col">
                                                        <label>Giải thích:</label>
                                                        <textarea class="form-control" placeholder="Giải thích chi tiết cách giải bài toán" data-field="explanation" rows="2">${problem.explanation || ''}</textarea>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                        break;
                                        
                                    case 'ordering':
                                        const answerLines = Array.isArray(problem.correctAnswer) ? problem.correctAnswer.join('\n') : '';
                                        const optionLines = Array.isArray(problem.options) ? problem.options.join('\n') : '';
                                        problemTemplate = `
                                            <div class="problem-item mb-3">
                                                <div class="mb-3">
                                                    <textarea class="form-control" rows="3" data-field="text">${problem.text || ''}</textarea>
                                                </div>
                                                <div class="mb-3">
                                                    <label class="form-label">Các lựa chọn (mỗi dòng một lựa chọn):</label>
                                                    <textarea class="form-control" rows="3" data-field="options">${optionLines}</textarea>
                                                </div>
                                                <div class="mb-2">
                                                    <label class="form-label">Đáp án theo thứ tự đúng (mỗi dòng một giá trị):</label>
                                                    <textarea class="form-control" rows="3" data-field="correctAnswer">${answerLines}</textarea>
                                                    <small class="form-text text-muted">Thứ tự đáp án phải khớp với các lựa chọn đã nhập ở trên</small>
                                                </div>
                                                <div class="row mt-2">
                                                    <div class="col">
                                                        <label>Giải thích:</label>
                                                        <textarea class="form-control" placeholder="Giải thích cho thứ tự sắp xếp" data-field="explanation" rows="2">${problem.explanation || ''}</textarea>
                                                    </div>
                                                </div>
                                                <div class="text-end mt-2">
                                                    <button type="button" class="btn btn-sm btn-danger delete-problem-btn">
                                                        <i class="fas fa-times"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        `;
                                        break;
                                }
                                
                                // Thêm bài tập vào container
                                problemsContainer.insertAdjacentHTML('beforeend', problemTemplate);
                            });
                            
                            // Khởi tạo sự kiện cho khối bài tập
                            initExerciseBlockEvents(newBlock);
                        });
                    } else {
                        // Hiển thị thông báo "chưa có bài tập"
                        const emptyMessage = document.querySelector('.empty-exercises-message');
                        if (emptyMessage) {
                            emptyMessage.style.display = 'block';
                        }
                    }
                }
            } else {
                // Nếu là bài học mới
                clearEditors();
                
                const lessonTitleInput = document.getElementById('lesson-title');
                if (lessonTitleInput) {
                    lessonTitleInput.value = `Bài ${lesson}`;
                }
            }
        })
        .catch(error => {
            console.error('Error loading lesson content:', error);
            alert('Có lỗi xảy ra khi tải nội dung bài học.');
        });
}

function initEditors() {
    if (typeof tinymce !== 'undefined') {
        tinymce.init({
            selector: '#theory-editor, #summary-editor',
            plugins: 'lists link image table code help wordcount',
            toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | link image | table | code',
            height: 400,
            content_style: 'body { font-family: Arial, sans-serif; font-size: 14px; }',
            language: 'vi',
            setup: function(editor) {
                editor.on('change', function() {
                    editor.save(); // Lưu nội dung vào textarea
                });
            }
        });
    }
}

function clearEditors() {
    // Clear title
    const lessonTitleInput = document.getElementById('lesson-title');
    if (lessonTitleInput) {
        lessonTitleInput.value = '';
    }
    
    // Clear theory editor
    const theoryEditor = document.getElementById('theory-editor');
    if (theoryEditor) {
        theoryEditor.value = '';
        // If editor is initialized
        if (typeof tinymce !== 'undefined' && tinymce.get('theory-editor')) {
            tinymce.get('theory-editor').setContent('');
        }
    }
    
    // Clear summary editor
    const summaryEditor = document.getElementById('summary-editor');
    if (summaryEditor) {
        summaryEditor.value = '';
        // If editor is initialized
        if (typeof tinymce !== 'undefined' && tinymce.get('summary-editor')) {
            tinymce.get('summary-editor').setContent('');
        }
    }
    
    // Clear exercise blocks
    const exerciseBlocksContainer = document.getElementById('exercise-blocks-container');
    if (exerciseBlocksContainer) {
        exerciseBlocksContainer.innerHTML = '';
        
        // Show the empty message
        const emptyExercisesMessage = document.querySelector('.empty-exercises-message');
        if (emptyExercisesMessage) {
            emptyExercisesMessage.style.display = 'block';
        }
    }
}

// Hàm tạo mẫu HTML cho từng loại bài tập
function createExerciseTemplate(type) {
    let template = '';
    let blockTitle = '';
    
    switch(type) {
        case 'comparison': // Bài tập so sánh (>,<,=)
            blockTitle = 'So sánh (>,<,=)';
            template = `
                <div class="card mb-3 exercise-block" data-type="comparison">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-arrows-alt-h me-2"></i>
                            <input type="text" class="form-control custom-block-title" placeholder="${blockTitle}" value="${blockTitle}" style="width: 250px; margin-right: 10px;">
                        </div>
                        <div>
                            <button type="button" class="btn btn-sm btn-primary add-problem-btn">
                                <i class="fas fa-plus"></i> Thêm bài
                            </button>
                            <button type="button" class="btn btn-sm btn-danger delete-block-btn">
                                <i class="fas fa-trash"></i> Xóa khối
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="problems-container">
                            <div class="problem-item mb-3">
                                <div class="row align-items-center">
                                    <div class="col-auto">
                                        <input type="text" class="form-control" placeholder="VD: 5 + 3" data-field="leftSide">
                                    </div>
                                    <div class="col-auto">
                                        <select class="form-select" data-field="correctAnswer">
                                            <option value="<">&lt;</option>
                                            <option value="=">=</option>
                                            <option value=">">&gt;</option>
                                        </select>
                                    </div>
                                    <div class="col-auto">
                                        <input type="text" class="form-control" placeholder="VD: 7" data-field="rightSide">
                                    </div>
                                    <div class="col-auto">
                                        <button type="button" class="btn btn-sm btn-danger delete-problem-btn">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="row mt-2">
                                    <div class="col">
                                        <label>Giải thích:</label>
                                        <textarea class="form-control" placeholder="Giải thích cho đáp án này" data-field="explanation" rows="2"></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'mentalMath': // Bài tập tính nhẩm
            blockTitle = 'Tính nhẩm';
            template = `
                <div class="card mb-3 exercise-block" data-type="mentalMath">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-calculator me-2"></i>
                            <input type="text" class="form-control custom-block-title" placeholder="${blockTitle}" value="${blockTitle}" style="width: 250px; margin-right: 10px;">
                        </div>
                        <div>
                            <button type="button" class="btn btn-sm btn-primary add-problem-btn">
                                <i class="fas fa-plus"></i> Thêm bài
                            </button>
                            <button type="button" class="btn btn-sm btn-danger delete-block-btn">
                                <i class="fas fa-trash"></i> Xóa khối
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="problems-container">
                            <div class="problem-item mb-3">
                                <div class="row align-items-center">
                                    <div class="col-auto">
                                        <input type="text" class="form-control" placeholder="VD: 5 + 3 = ?" data-field="question">
                                    </div>
                                    <div class="col-auto">
                                        <input type="text" class="form-control" placeholder="Đáp án" data-field="correctAnswer">
                                    </div>
                                    <div class="col-auto">
                                        <button type="button" class="btn btn-sm btn-danger delete-problem-btn">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="row mt-2">
                                    <div class="col">
                                        <label>Giải thích:</label>
                                        <textarea class="form-control" placeholder="Giải thích cho đáp án này" data-field="explanation" rows="2"></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'trueFalse': // Bài tập đúng/sai
            blockTitle = 'Đúng/Sai (Đ/S)';
            template = `
                <div class="card mb-3 exercise-block" data-type="trueFalse">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-check-circle me-2"></i>
                            <input type="text" class="form-control custom-block-title" placeholder="${blockTitle}" value="${blockTitle}" style="width: 250px; margin-right: 10px;">
                        </div>
                        <div>
                            <button type="button" class="btn btn-sm btn-primary add-problem-btn">
                                <i class="fas fa-plus"></i> Thêm bài
                            </button>
                            <button type="button" class="btn btn-sm btn-danger delete-block-btn">
                                <i class="fas fa-trash"></i> Xóa khối
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="problems-container">
                            <div class="problem-item mb-3">
                                <div class="row align-items-center">
                                    <div class="col">
                                        <input type="text" class="form-control" placeholder="VD: 5 + 3 < 9" data-field="statement">
                                    </div>
                                    <div class="col-auto">
                                        <select class="form-select" data-field="correctAnswer">
                                            <option value="Đ">Đúng</option>
                                            <option value="S">Sai</option>
                                        </select>
                                    </div>
                                    <div class="col-auto">
                                        <button type="button" class="btn btn-sm btn-danger delete-problem-btn">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="row mt-2">
                                    <div class="col">
                                        <label>Giải thích:</label>
                                        <textarea class="form-control" placeholder="Giải thích cho đáp án này" data-field="explanation" rows="2"></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'wordProblem': // Bài toán có lời văn
            blockTitle = 'Bài toán có lời văn';
            template = `
                <div class="card mb-3 exercise-block" data-type="wordProblem">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-align-left me-2"></i>
                            <input type="text" class="form-control custom-block-title" placeholder="${blockTitle}" value="${blockTitle}" style="width: 250px; margin-right: 10px;">
                        </div>
                        <div>
                            <button type="button" class="btn btn-sm btn-primary add-problem-btn">
                                <i class="fas fa-plus"></i> Thêm bài
                            </button>
                            <button type="button" class="btn btn-sm btn-danger delete-block-btn">
                                <i class="fas fa-trash"></i> Xóa khối
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="problems-container">
                            <div class="problem-item mb-3">
                                <div class="mb-3">
                                    <textarea class="form-control" rows="3" placeholder="VD: Mai có 5 quả táo. Hoa cho Mai thêm 3 quả. Mai có bao nhiêu quả táo?" data-field="text"></textarea>
                                </div>
                                <div class="row align-items-center">
                                    <div class="col-auto">
                                        <label>Đáp án:</label>
                                    </div>
                                    <div class="col-auto">
                                        <input type="text" class="form-control" placeholder="VD: 8" data-field="correctAnswer">
                                    </div>
                                    <div class="col-auto">
                                        <button type="button" class="btn btn-sm btn-danger delete-problem-btn">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="row mt-2">
                                    <div class="col">
                                        <label>Giải thích:</label>
                                        <textarea class="form-control" placeholder="Giải thích chi tiết cách giải bài toán" data-field="explanation" rows="2"></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'ordering': // Bài tập sắp xếp theo thứ tự
            blockTitle = 'Sắp xếp theo thứ tự';
            template = `
                <div class="card mb-3 exercise-block" data-type="ordering">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-sort me-2"></i>
                            <input type="text" class="form-control custom-block-title" placeholder="${blockTitle}" value="${blockTitle}" style="width: 250px; margin-right: 10px;">
                        </div>
                        <div>
                            <button type="button" class="btn btn-sm btn-primary add-problem-btn">
                                <i class="fas fa-plus"></i> Thêm bài
                            </button>
                            <button type="button" class="btn btn-sm btn-danger delete-block-btn">
                                <i class="fas fa-trash"></i> Xóa khối
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="problems-container">
                            <div class="problem-item mb-3">
                                <div class="mb-3">
                                    <label class="form-label">Đề bài:</label>
                                    <textarea class="form-control" rows="3" placeholder="VD: Sắp xếp các số sau theo thứ tự tăng dần" data-field="text"></textarea>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Các lựa chọn (mỗi dòng một lựa chọn):</label>
                                    <textarea class="form-control" rows="3" placeholder="VD:&#10;130&#10;125&#10;120" data-field="options"></textarea>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Đáp án theo thứ tự đúng (mỗi dòng một giá trị):</label>
                                    <textarea class="form-control" rows="3" placeholder="VD:&#10;120&#10;125&#10;130" data-field="correctAnswer"></textarea>
                                    <small class="form-text text-muted">Thứ tự đáp án phải khớp với các lựa chọn đã nhập ở trên</small>
                                </div>
                                <div class="row mt-2">
                                    <div class="col">
                                        <label>Giải thích:</label>
                                        <textarea class="form-control" placeholder="Giải thích cho thứ tự sắp xếp" data-field="explanation" rows="2"></textarea>
                                    </div>
                                </div>
                                <div class="text-end mt-2">
                                    <button type="button" class="btn btn-sm btn-danger delete-problem-btn">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'fillInBlanks':
            blockTitle = 'Điền vào chỗ trống';
            template = `
                <div class="card mb-3 exercise-block" data-type="fillInBlanks">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-edit me-2"></i>
                            <input type="text" class="form-control custom-block-title" placeholder="${blockTitle}" value="${blockTitle}" style="width: 250px; margin-right: 10px;">
                        </div>
                        <div>
                            <button type="button" class="btn btn-sm btn-primary add-problem-btn">
                                <i class="fas fa-plus"></i> Thêm bài
                            </button>
                            <button type="button" class="btn btn-sm btn-danger delete-block-btn">
                                <i class="fas fa-trash"></i> Xóa khối
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="problems-container">
                            <div class="problem-item mb-3">
                                <div class="mb-3">
                                    <label class="form-label">Câu hỏi hoặc bài toán:</label>
                                    <textarea class="form-control" rows="2" placeholder="Nhập câu hỏi hoặc bài toán" data-field="question"></textarea>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Các mục cần điền (mỗi dòng một mục):</label>
                                    <textarea class="form-control" rows="3" placeholder="Tổng của hai số là:&#10;Hiệu của hai số là:&#10;Tích của hai số là:" data-field="blanks"></textarea>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Đáp án (mỗi dòng một đáp án, theo thứ tự các mục cần điền):</label>
                                    <textarea class="form-control" rows="3" placeholder="10&#10;2&#10;24" data-field="answers"></textarea>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Giải thích:</label>
                                    <textarea class="form-control" rows="2" placeholder="Giải thích đáp án" data-field="explanation"></textarea>
                                </div>
                                <div class="text-end">
                                    <button type="button" class="btn btn-sm btn-danger delete-problem-btn">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
        
        case 'imageWordProblemMultiAnswer':
            blockTitle = 'Bài toán có hình ảnh (nhiều đáp án)';
            template = `
                <div class="card mb-3 exercise-block" data-type="imageWordProblemMultiAnswer">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-image me-2"></i>
                            <input type="text" class="form-control custom-block-title" placeholder="${blockTitle}" value="${blockTitle}" style="width: 250px; margin-right: 10px;">
                        </div>
                        <div>
                            <button type="button" class="btn btn-sm btn-primary add-problem-btn">
                                <i class="fas fa-plus"></i> Thêm bài
                            </button>
                            <button type="button" class="btn btn-sm btn-danger delete-block-btn">
                                <i class="fas fa-trash"></i> Xóa khối
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="problems-container">
                            <div class="problem-item mb-3">
                                <div class="mb-3">
                                    <label class="form-label">Nội dung bài toán:</label>
                                    <textarea class="form-control" rows="3" placeholder="VD: Hãy quan sát hình và trả lời các câu hỏi sau:" data-field="text"></textarea>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Hình ảnh:</label>
                                    <div class="row">
                                        <div class="col-md-9">
                                            <input type="text" class="form-control" placeholder="Tên file hình ảnh (VD: math/triangle.jpg)" data-field="image_src">
                                        </div>
                                        <div class="col-md-3">
                                            <div class="form-text mt-0">Lưu hình ảnh vào thư mục /static/images/</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Các câu hỏi (mỗi dòng một câu):</label>
                                    <textarea class="form-control" rows="3" placeholder="VD:&#10;Chu vi hình tam giác là:&#10;Diện tích hình tam giác là:" data-field="blanks"></textarea>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Đáp án (mỗi dòng một đáp án, theo thứ tự các câu hỏi):</label>
                                    <textarea class="form-control" rows="3" placeholder="VD:&#10;36 cm&#10;54 cm²" data-field="answers"></textarea>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Giải thích:</label>
                                    <textarea class="form-control" rows="4" placeholder="Giải thích chi tiết cách giải bài toán" data-field="explanation"></textarea>
                                </div>
                                <div class="text-end">
                                    <button type="button" class="btn btn-sm btn-danger delete-problem-btn">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;

        // Case mới cho loại bài tập hình ảnh với nhiều lựa chọn
        case 'imageWordProblemMultiChoice':
            blockTitle = 'Bài toán có hình ảnh (chọn đáp án)';
            template = `
                <div class="card mb-3 exercise-block" data-type="imageWordProblemMultiChoice">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-check-square me-2"></i>
                            <input type="text" class="form-control custom-block-title" placeholder="${blockTitle}" value="${blockTitle}" style="width: 250px; margin-right: 10px;">
                        </div>
                        <div>
                            <button type="button" class="btn btn-sm btn-primary add-problem-btn">
                                <i class="fas fa-plus"></i> Thêm bài
                            </button>
                            <button type="button" class="btn btn-sm btn-danger delete-block-btn">
                                <i class="fas fa-trash"></i> Xóa khối
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="problems-container">
                            <div class="problem-item mb-3">
                                <div class="mb-3">
                                    <label class="form-label">Nội dung bài toán:</label>
                                    <textarea class="form-control" rows="3" placeholder="VD: Hãy quan sát hình và chọn đáp án phù hợp:" data-field="text"></textarea>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Hình ảnh:</label>
                                    <div class="row">
                                        <div class="col-md-9">
                                            <input type="text" class="form-control" placeholder="Tên file hình ảnh (VD: math/square.jpg)" data-field="image_src">
                                        </div>
                                        <div class="col-md-3">
                                            <div class="form-text mt-0">Lưu hình ảnh vào thư mục /static/images/</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Các câu hỏi (mỗi dòng một câu hỏi):</label>
                                    <textarea class="form-control" rows="4" placeholder="VD:&#10;Loại hình nào có diện tích lớn nhất?&#10;Số đỉnh của hình lục giác là:&#10;Đơn vị đo góc là:" data-field="questions"></textarea>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Danh sách các lựa chọn (mỗi dòng là các lựa chọn cho một câu hỏi, cách nhau bởi dấu phẩy):</label>
                                    <textarea class="form-control" rows="4" placeholder="VD:&#10;Hình vuông, Hình tròn, Hình tam giác, Hình chữ nhật&#10;4, 5, 6, 8&#10;Độ, Radian, Mét, Centimet" data-field="options_list"></textarea>
                                    <div class="form-text">Mỗi dòng là danh sách lựa chọn cho một câu hỏi, cách nhau bởi dấu phẩy</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Đáp án đúng (mỗi dòng là đáp án đúng cho một câu hỏi):</label>
                                    <textarea class="form-control" rows="4" placeholder="VD:&#10;Hình tròn&#10;6&#10;Độ" data-field="correct_answers"></textarea>
                                    <div class="form-text">Nhập chính xác nội dung đáp án (phân biệt chữ hoa, chữ thường)</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Giải thích:</label>
                                    <textarea class="form-control" rows="4" placeholder="Giải thích chi tiết lý do tại sao các đáp án được chọn là đúng" data-field="explanation"></textarea>
                                </div>
                                <div class="text-end">
                                    <button type="button" class="btn btn-sm btn-danger delete-problem-btn">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
    }
    
    return template;
}

// Khởi tạo sự kiện thêm bài tập
function initExerciseTemplates() {
    const exerciseTemplates = document.querySelectorAll('.exercise-template');
    if (exerciseTemplates.length > 0) {
        exerciseTemplates.forEach(template => {
            template.addEventListener('click', function() {
                const exerciseType = this.getAttribute('data-type');
                const template = createExerciseTemplate(exerciseType);
                const container = document.getElementById('exercise-blocks-container');
                
                // Thêm template vào container
                container.insertAdjacentHTML('beforeend', template);
                
                // Ẩn thông báo "chưa có bài tập"
                const emptyMessage = document.querySelector('.empty-exercises-message');
                if (emptyMessage) {
                    emptyMessage.style.display = 'none';
                }
                
                // Khởi tạo sự kiện
                initExerciseBlockEvents(container.lastElementChild);
            });
        });
    }
}

// Khởi tạo sự kiện cho khối bài tập
function initExerciseBlockEvents(block) {
    // Nút xóa khối
    const deleteBlockBtn = block.querySelector('.delete-block-btn');
    if (deleteBlockBtn) {
        deleteBlockBtn.addEventListener('click', function() {
            if (confirm('Bạn có chắc chắn muốn xóa khối bài tập này?')) {
                block.remove();
                
                // Hiển thị lại thông báo nếu không còn bài tập nào
                const container = document.getElementById('exercise-blocks-container');
                if (container && container.children.length === 0) {
                    const emptyMessage = document.querySelector('.empty-exercises-message');
                    if (emptyMessage) {
                        emptyMessage.style.display = 'block';
                    }
                }
            }
        });
    }
    
    // Nút thêm bài tập
    const addProblemBtn = block.querySelector('.add-problem-btn');
    if (addProblemBtn) {
        addProblemBtn.addEventListener('click', function() {
            const type = block.getAttribute('data-type');
            const problemsContainer = block.querySelector('.problems-container');
            let template = '';
            
            // Tạo template tương ứng với loại bài tập
            switch(type) {
                case 'comparison':
                    template = `
                        <div class="problem-item mb-3">
                            <div class="row align-items-center">
                                <div class="col-auto">
                                    <input type="text" class="form-control" placeholder="VD: 5 + 3" data-field="leftSide">
                                </div>
                                <div class="col-auto">
                                    <select class="form-select" data-field="correctAnswer">
                                        <option value="<">&lt;</option>
                                        <option value="=">=</option>
                                        <option value=">">&gt;</option>
                                    </select>
                                </div>
                                <div class="col-auto">
                                    <input type="text" class="form-control" placeholder="VD: 7" data-field="rightSide">
                                </div>
                                <div class="col-auto">
                                    <button type="button" class="btn btn-sm btn-danger delete-problem-btn">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'mentalMath':
                    template = `
                        <div class="problem-item mb-3">
                            <div class="row align-items-center">
                                <div class="col-auto">
                                    <input type="text" class="form-control" placeholder="VD: 5 + 3 = ?" data-field="question">
                                </div>
                                <div class="col-auto">
                                    <input type="text" class="form-control" placeholder="Đáp án" data-field="correctAnswer">
                                </div>
                                <div class="col-auto">
                                    <button type="button" class="btn btn-sm btn-danger delete-problem-btn">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'trueFalse':
                    template = `
                        <div class="problem-item mb-3">
                            <div class="row align-items-center">
                                <div class="col">
                                    <input type="text" class="form-control" placeholder="VD: 5 + 3 < 9" data-field="statement">
                                </div>
                                <div class="col-auto">
                                    <select class="form-select" data-field="correctAnswer">
                                        <option value="Đ">Đúng</option>
                                        <option value="S">Sai</option>
                                    </select>
                                </div>
                                <div class="col-auto">
                                    <button type="button" class="btn btn-sm btn-danger delete-problem-btn">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'wordProblem':
                    template = `
                        <div class="problem-item mb-3">
                            <div class="mb-3">
                                <textarea class="form-control" rows="3" placeholder="VD: Mai có 5 quả táo. Hoa cho Mai thêm 3 quả. Mai có bao nhiêu quả táo?" data-field="text"></textarea>
                            </div>
                            <div class="row align-items-center">
                                <div class="col-auto">
                                    <label>Đáp án:</label>
                                </div>
                                <div class="col-auto">
                                    <input type="text" class="form-control" placeholder="VD: 8" data-field="correctAnswer">
                                </div>
                                <div class="col-auto">
                                    <button type="button" class="btn btn-sm btn-danger delete-problem-btn">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'ordering':
                    template = `
                        <div class="problem-item mb-3">
                            <div class="mb-3">
                                <textarea class="form-control" rows="3" placeholder="VD: An cao 125cm, Bình cao 130cm, Cường cao 120cm. Sắp xếp theo thứ tự tăng dần." data-field="text"></textarea>
                            </div>
                            <div class="mb-2">
                                <label>Đáp án (mỗi dòng một giá trị):</label>
                                <textarea class="form-control" rows="3" placeholder="VD:&#10;Cường&#10;An&#10;Bình" data-field="correctAnswer"></textarea>
                            </div>
                            <div class="text-end">
                                <button type="button" class="btn btn-sm btn-danger delete-problem-btn">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    `;
                    break;
            }
            
            // Thêm bài tập vào container
            problemsContainer.insertAdjacentHTML('beforeend', template);
            
            // Khởi tạo nút xóa bài tập
            const deleteProblemBtn = problemsContainer.lastElementChild.querySelector('.delete-problem-btn');
            if (deleteProblemBtn) {
                deleteProblemBtn.addEventListener('click', function() {
                    this.closest('.problem-item').remove();
                });
            }
        });
    }
    
    // Khởi tạo các nút xóa bài tập có sẵn
    const deleteProblemBtns = block.querySelectorAll('.delete-problem-btn');
    if (deleteProblemBtns.length > 0) {
        deleteProblemBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                this.closest('.problem-item').remove();
            });
        });
    }
}

function saveLesson() {
    const classId = document.getElementById('lesson-class')?.value;
    const subject = document.getElementById('lesson-subject')?.value;
    const book = document.getElementById('lesson-book')?.value;
    const lesson = document.getElementById('lesson-number')?.value;
    const title = document.getElementById('lesson-title')?.value || `Bài ${lesson}`;
    
    if (!classId || !subject || !book || !lesson) {
        alert('Vui lòng chọn đầy đủ thông tin bài học.');
        return;
    }
    
    // Thu thập dữ liệu bài học
    const lessonData = {
        title: title,
        sections: {
            theory: {
                content: ''
            },
            exercises: {
                exerciseBlocks: []
            },
            summary: {
                content: ''
            }
        }
    };
    
    // Thu thập nội dung lý thuyết
    if (typeof tinymce !== 'undefined' && tinymce.get('theory-editor')) {
        lessonData.sections.theory.content = tinymce.get('theory-editor').getContent();
    } else {
        const theoryEditor = document.getElementById('theory-editor');
        if (theoryEditor) {
            lessonData.sections.theory.content = theoryEditor.value;
        }
    }
    
    // Thu thập nội dung tóm tắt
    if (typeof tinymce !== 'undefined' && tinymce.get('summary-editor')) {
        lessonData.sections.summary.content = tinymce.get('summary-editor').getContent();
    } else {
        const summaryEditor = document.getElementById('summary-editor');
        if (summaryEditor) {
            lessonData.sections.summary.content = summaryEditor.value;
        }
    }
    
    // Thu thập các khối bài tập
    const exerciseBlocks = document.querySelectorAll('.exercise-block');
    if (exerciseBlocks.length > 0) {
        exerciseBlocks.forEach(block => {
            const blockType = block.getAttribute('data-type');
            const blockTitle = block.querySelector('.custom-block-title')?.value || '';
            const problems = [];
            
            // Thu thập các bài tập trong khối
            const problemItems = block.querySelectorAll('.problem-item');
            problemItems.forEach(item => {
                const problemData = {};
                
                // Thu thập các trường dữ liệu
                const fields = item.querySelectorAll('[data-field]');
                fields.forEach(field => {
                    const fieldName = field.getAttribute('data-field');
                    
                    if (fieldName === 'correctAnswer' && blockType === 'ordering') {
                        // Xử lý đặc biệt cho bài tập sắp xếp
                        const answers = field.value.split('\n').filter(line => line.trim() !== '');
                        problemData[fieldName] = answers;
                    } else {
                        problemData[fieldName] = field.value;
                    }
                });
                
                problems.push(problemData);
            });
            
            // Thêm khối bài tập vào dữ liệu
            lessonData.sections.exercises.exerciseBlocks.push({
                type: blockType,
                title: blockTitle, // Thêm trường title vào đây
                problems: problems
            });
        });
    }
    
    // Gửi dữ liệu lên server
    fetch('/api/lessons', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            class_id: classId,
            subject: subject,
            book: book,
            lesson: lesson,
            lesson_data: lessonData
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Lưu bài học thành công!');
        } else {
            alert(data.error || 'Có lỗi xảy ra khi lưu bài học.');
        }
    })
    .catch(error => {
        console.error('Error saving lesson:', error);
        alert('Có lỗi xảy ra khi kết nối với máy chủ.');
    });
}

function previewLesson() {
    console.log('Preview button clicked');
    
    const classId = document.getElementById('lesson-class')?.value;
    const subject = document.getElementById('lesson-subject')?.value;
    const book = document.getElementById('lesson-book')?.value;
    const lesson = document.getElementById('lesson-number')?.value;
    const title = document.getElementById('lesson-title')?.value || `Bài ${lesson}`;
    
    if (!classId || !subject || !book || !lesson) {
        alert('Vui lòng chọn đầy đủ thông tin bài học.');
        return;
    }
    
    // Collect lesson data
    const lessonData = {
        title: title,
        sections: {
            theory: {
                content: ''
            },
            exercises: {
                exerciseBlocks: []
            },
            summary: {
                content: ''
            }
        }
    };
    
    // Get theory content
    const theoryEditor = document.getElementById('theory-editor');
    if (theoryEditor) {
        lessonData.sections.theory.content = theoryEditor.value;
    }
    
    // Get summary content
    const summaryEditor = document.getElementById('summary-editor');
    if (summaryEditor) {
        lessonData.sections.summary.content = summaryEditor.value;
    }
    
    // Collect exercise blocks data
    const exerciseBlocksContainer = document.getElementById('exercise-blocks-container');
    if (exerciseBlocksContainer) {
        const blocks = exerciseBlocksContainer.querySelectorAll('.exercise-block');
        
        blocks.forEach(block => {
            const blockType = block.getAttribute('data-type');
            const blockTitle = block.querySelector('.custom-block-title')?.value || '';
            const problems = [];
            
            // Collect problems data
            block.querySelectorAll('.problem-item').forEach(problem => {
                const problemData = {};
                
                problem.querySelectorAll('[data-field]').forEach(field => {
                    const fieldName = field.getAttribute('data-field');
                    
                    if (fieldName === 'correctAnswer' && blockType === 'ordering') {
                        // Special handling for ordering exercises
                        const answerLines = field.value.split('\n').filter(line => line.trim() !== '');
                        problemData[fieldName] = answerLines;
                    } else {
                        problemData[fieldName] = field.value;
                    }
                });
                
                problems.push(problemData);
            });
            
            lessonData.sections.exercises.exerciseBlocks.push({
                type: blockType,
                title: blockTitle, // Thêm trường title vào đây
                problems: problems
            });
        });
    }
    
    console.log('Sending preview data:', lessonData);
    
    // Sử dụng iframe để hiển thị nội dung
    fetch('/api/preview_lesson', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            lesson_data: lessonData
        })
    })
    .then(response => {
        console.log('Preview response status:', response.status);
        return response.text();
    })
    .then(html => {
        console.log('Preview HTML received, length:', html.length);
        
        // Hiển thị xem trước trong modal bằng iframe
        const previewContent = document.getElementById('preview-content');
        if (previewContent) {
            // Xóa nội dung cũ
            previewContent.innerHTML = '';
            
            // Tạo iframe
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '600px';
            iframe.style.border = 'none';
            
            // Thêm iframe vào container
            previewContent.appendChild(iframe);
            
            // Tạo modal
            const previewModal = document.getElementById('previewModal');
            const bsModal = new bootstrap.Modal(previewModal);
            
            // Hiển thị modal
            bsModal.show();
            
            // Đặt HTML vào iframe sau khi modal đã hiển thị
            setTimeout(() => {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                iframeDoc.open();
                iframeDoc.write(html);
                iframeDoc.close();
            }, 300);
        } else {
            // Nếu không tìm thấy modal, mở trong cửa sổ mới
            alert('Container xem trước không tồn tại, mở trong cửa sổ mới');
            const previewWindow = window.open('', '_blank');
            previewWindow.document.write(html);
            previewWindow.document.close();
        }
    })
    .catch(error => {
        console.error('Error generating preview:', error);
        alert('Có lỗi xảy ra khi tạo bản xem trước: ' + error.message);
    });
}

function initImageUpload() {
    // Xử lý xem trước hình ảnh
    const imageInput = document.getElementById('image-file');
    const previewContainer = document.getElementById('image-preview-container');
    const previewImage = document.getElementById('image-preview');
    
    if (imageInput) {
        imageInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    previewImage.src = e.target.result;
                    previewContainer.style.display = 'block';
                }
                
                reader.readAsDataURL(file);
                
                // Ẩn các thông báo trước đó
                document.getElementById('image-upload-success').style.display = 'none';
                document.getElementById('image-upload-error').style.display = 'none';
            }
        });
    }
    
    // Xử lý nút tải lên
    const uploadButton = document.getElementById('upload-image-btn');
    if (uploadButton) {
        uploadButton.addEventListener('click', function() {
            const form = document.getElementById('image-upload-form');
            const formData = new FormData(form);
            
            // Kiểm tra xem có file không
            if (!imageInput.files || imageInput.files.length === 0) {
                document.getElementById('image-error-message').textContent = 'Vui lòng chọn một hình ảnh';
                document.getElementById('image-upload-error').style.display = 'block';
                return;
            }
            
            // Thay đổi nút tải lên thành trạng thái đang tải
            uploadButton.disabled = true;
            uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tải...';
            
            // Gửi request
            fetch('/api/upload_image', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // Khôi phục nút tải lên
                uploadButton.disabled = false;
                uploadButton.innerHTML = '<i class="fas fa-upload"></i> Tải lên';
                
                if (data.success) {
                    // Hiển thị thông báo thành công
                    document.getElementById('image-path').textContent = data.image_url;
                    document.getElementById('image-upload-success').style.display = 'block';
                    document.getElementById('image-upload-error').style.display = 'none';
                    
                    // Sao chép đường dẫn vào clipboard
                    navigator.clipboard.writeText(data.image_url).then(() => {
                        console.log('Đã sao chép đường dẫn hình ảnh vào clipboard');
                    }).catch(err => {
                        console.error('Không thể sao chép: ', err);
                    });
                } else {
                    // Hiển thị thông báo lỗi
                    document.getElementById('image-error-message').textContent = data.error || 'Có lỗi xảy ra khi tải lên';
                    document.getElementById('image-upload-error').style.display = 'block';
                    document.getElementById('image-upload-success').style.display = 'none';
                }
            })
            .catch(error => {
                // Khôi phục nút tải lên
                uploadButton.disabled = false;
                uploadButton.innerHTML = '<i class="fas fa-upload"></i> Tải lên';
                
                // Hiển thị thông báo lỗi
                document.getElementById('image-error-message').textContent = 'Có lỗi xảy ra khi kết nối với máy chủ';
                document.getElementById('image-upload-error').style.display = 'block';
                document.getElementById('image-upload-success').style.display = 'none';
                
                console.error('Error:', error);
            });
        });
    }
}