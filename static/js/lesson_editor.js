// lesson_editor.js - JavaScript cho trình biên tập bài học nâng cao

document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo trình soạn thảo WYSIWYG cho nội dung 
    initWysiwygEditor();
    
    // Khởi tạo các sự kiện cho tab điều hướng
    initTabNavigation();
    
    // Khởi tạo các mẫu bài tập
    initExerciseTemplates();
    
    // Xử lý nút lưu bài học
    document.getElementById('save-lesson-btn').addEventListener('click', saveLesson);
    
    // Xử lý nút xem trước bài học
    document.getElementById('preview-lesson-btn').addEventListener('click', previewLesson);
    
    // Tải dữ liệu bài học nếu đang chỉnh sửa bài học có sẵn
    loadLessonData();
});

// Biến lưu trữ dữ liệu bài học hiện tại
let currentLessonData = {
    title: "",
    sections: {
        theory: {
            content: ""
        },
        exercises: {
            exerciseBlocks: []
        },
        summary: {
            content: ""
        }
    }
};

// Khởi tạo trình soạn thảo WYSIWYG
function initWysiwygEditor() {
    // Sử dụng Summernote hoặc TinyMCE
    $('.wysiwyg-editor').summernote({
        height: 300,
        toolbar: [
            ['style', ['style']],
            ['font', ['bold', 'underline', 'clear']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture']],
            ['view', ['fullscreen', 'codeview', 'help']]
        ],
        callbacks: {
            onChange: function(contents) {
                // Cập nhật nội dung vào biến dữ liệu tương ứng
                const editorId = $(this).attr('id');
                if (editorId === 'theory-editor') {
                    currentLessonData.sections.theory.content = contents;
                } else if (editorId === 'summary-editor') {
                    currentLessonData.sections.summary.content = contents;
                }
            }
        }
    });
}

// Khởi tạo điều hướng tab
function initTabNavigation() {
    document.querySelectorAll('.lesson-tab').forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Ẩn tất cả tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Bỏ active tất cả tab
            document.querySelectorAll('.lesson-tab').forEach(t => {
                t.classList.remove('active');
            });
            
            // Hiển thị tab được chọn
            const targetTab = this.getAttribute('data-tab');
            document.getElementById(targetTab).classList.add('active');
            this.classList.add('active');
        });
    });
}

// Khởi tạo các mẫu bài tập
function initExerciseTemplates() {
    // Xử lý sự kiện click vào mẫu bài tập
    document.querySelectorAll('.exercise-template').forEach(template => {
        template.addEventListener('click', function() {
            const exerciseType = this.getAttribute('data-type');
            addExerciseBlock(exerciseType);
        });
    });
    
    // Khởi tạo sự kiện sắp xếp bài tập bằng Sortable.js
    const exerciseContainer = document.getElementById('exercise-blocks-container');
    if (exerciseContainer) {
        new Sortable(exerciseContainer, {
            animation: 150,
            handle: '.drag-handle',
            onEnd: function() {
                // Cập nhật thứ tự bài tập trong dữ liệu
                updateExerciseBlocksOrder();
            }
        });
    }
}

// Hàm thêm khối bài tập mới
function addExerciseBlock(exerciseType) {
    let templateHtml = '';
    let blockTitle = '';
    
    // Tạo mẫu HTML dựa vào loại bài tập
    switch(exerciseType) {
        case 'comparison':
            blockTitle = 'So sánh (>,<,=)';
            templateHtml = createComparisonTemplate();
            break;
        case 'mentalMath':
            blockTitle = 'Tính nhẩm';
            templateHtml = createMentalMathTemplate();
            break;
        case 'trueFalse':
            blockTitle = 'Đúng/Sai (Đ/S)';
            templateHtml = createTrueFalseTemplate();
            break;
        case 'wordProblem':
            blockTitle = 'Bài toán có lời văn';
            templateHtml = createWordProblemTemplate();
            break;
        case 'ordering':
            blockTitle = 'Sắp xếp theo thứ tự';
            templateHtml = createOrderingTemplate();
            break;
    }
    
    // Tạo block ID mới
    const blockId = 'exercise-block-' + Date.now();
    
    // Tạo HTML cho khối bài tập
    const blockHtml = `
        <div class="exercise-block card mb-3" id="${blockId}" data-type="${exerciseType}">
            <div class="card-header d-flex justify-content-between align-items-center">
                <div>
                    <span class="drag-handle me-2"><i class="fas fa-grip-vertical"></i></span>
                    <span class="block-title">${blockTitle}</span>
                </div>
                <div class="block-actions">
                    <button type="button" class="btn btn-sm btn-outline-primary add-problem-btn">
                        <i class="fas fa-plus"></i> Thêm bài
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger delete-block-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="problems-container">
                    ${templateHtml}
                </div>
            </div>
        </div>
    `;
    
    // Thêm vào DOM
    const container = document.getElementById('exercise-blocks-container');
    container.insertAdjacentHTML('beforeend', blockHtml);
    
    // Thêm sự kiện cho các nút trong khối bài tập
    const block = document.getElementById(blockId);
    
    // Nút xóa khối
    block.querySelector('.delete-block-btn').addEventListener('click', function() {
        if (confirm('Bạn có chắc chắn muốn xóa khối bài tập này?')) {
            block.remove();
            updateExerciseData();
        }
    });
    
    // Nút thêm bài tập
    block.querySelector('.add-problem-btn').addEventListener('click', function() {
        addProblem(blockId, exerciseType);
    });
    
    // Cập nhật dữ liệu bài tập
    updateExerciseData();
    
    // Khởi tạo sự kiện xóa bài tập
    initDeleteProblemButtons(block);
}

// Các hàm tạo mẫu HTML cho từng loại bài tập
function createComparisonTemplate() {
    return `
        <div class="problem-item mb-3">
            <div class="row align-items-center">
                <div class="col-auto">
                    <input type="text" class="form-control" placeholder="5 + 3" data-field="leftSide">
                </div>
                <div class="col-auto">
                    <select class="form-select" data-field="correctAnswer">
                        <option value="<">&lt;</option>
                        <option value="=">=</option>
                        <option value=">">&gt;</option>
                    </select>
                </div>
                <div class="col-auto">
                    <input type="text" class="form-control" placeholder="7" data-field="rightSide">
                </div>
                <div class="col-auto">
                    <button type="button" class="btn btn-sm btn-danger delete-problem-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function createMentalMathTemplate() {
    return `
        <div class="problem-item mb-3">
            <div class="row align-items-center">
                <div class="col-auto">
                    <input type="text" class="form-control" placeholder="5 + 3 = ?" data-field="question">
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
}

function createTrueFalseTemplate() {
    return `
        <div class="problem-item mb-3">
            <div class="row align-items-center">
                <div class="col">
                    <input type="text" class="form-control" placeholder="5 + 3 < 9" data-field="statement">
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
}

function createWordProblemTemplate() {
    return `
        <div class="problem-item mb-3">
            <div class="row mb-2">
                <div class="col">
                    <textarea class="form-control" placeholder="Mai có 5 quả táo. Hoa cho Mai thêm 3 quả. Mai có bao nhiêu quả táo?" data-field="text" rows="2"></textarea>
                </div>
            </div>
            <div class="row align-items-center">
                <div class="col-auto">
                    <label>Đáp án:</label>
                </div>
                <div class="col-auto">
                    <input type="text" class="form-control" placeholder="8" data-field="correctAnswer">
                </div>
                <div class="col-auto">
                    <button type="button" class="btn btn-sm btn-danger delete-problem-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function createOrderingTemplate() {
    return `
        <div class="problem-item mb-3">
            <div class="row mb-2">
                <div class="col">
                    <textarea class="form-control" placeholder="An cao 125cm, Bình cao 130cm, Cường cao 120cm. Sắp xếp theo thứ tự tăng dần." data-field="text" rows="2"></textarea>
                </div>
            </div>
            <div class="row align-items-center mb-2">
                <div class="col-auto">Đáp án (mỗi dòng một giá trị):</div>
            </div>
            <div class="row mb-2">
                <div class="col">
                    <textarea class="form-control" placeholder="Cường\nAn\nBình" data-field="correctAnswer" rows="3"></textarea>
                </div>
                <div class="col-auto align-self-center">
                    <button type="button" class="btn btn-sm btn-danger delete-problem-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Thêm bài tập mới vào khối
function addProblem(blockId, exerciseType) {
    const block = document.getElementById(blockId);
    const problemsContainer = block.querySelector('.problems-container');
    
    let templateHtml = '';
    
    // Chọn template phù hợp với loại bài tập
    switch(exerciseType) {
        case 'comparison':
            templateHtml = `
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
            `;
            break;
            
        case 'mentalMath':
            templateHtml = `
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
            `;
            break;
            
        case 'trueFalse':
            templateHtml = `
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
            `;
            break;
            
        case 'wordProblem':
            templateHtml = `
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
            `;
            break;
            
        case 'ordering':
            templateHtml = `
                <div class="problem-item mb-3">
                    <div class="mb-3">
                        <textarea class="form-control" rows="3" placeholder="VD: Sắp xếp các số sau theo thứ tự tăng dần" data-field="text"></textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Các lựa chọn (mỗi dòng một lựa chọn):</label>
                        <textarea class="form-control" rows="3" placeholder="VD:&#10;130&#10;125&#10;120" data-field="options"></textarea>
                    </div>
                    <div class="mb-2">
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
            `;
            break;

        case 'fillInBlanks':
            template = `
                <div class="problem-item mb-3">
                    <div class="mb-3">
                        <label class="form-label">Câu hỏi hoặc bài toán:</label>
                        <textarea class="form-control" rows="2" placeholder="Nhập câu hỏi hoặc bài toán, ví dụ: 363 = 300 + ? + ?" data-field="question"></textarea>
                        <small class="form-text text-muted">Lưu ý: Dấu ? trong câu hỏi không tự động tạo ô điền. Bạn cần xác định rõ các mục cần điền ở dưới.</small>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Các mục cần điền (mỗi dòng một mục):</label>
                        <textarea class="form-control" rows="3" placeholder="Số hạng thứ nhất:&#10;Số hạng thứ hai:" data-field="blanks"></textarea>
                        <small class="form-text text-muted">Mỗi dòng tương ứng với một ô nhập liệu.</small>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Đáp án (mỗi dòng một đáp án, theo thứ tự các mục cần điền):</label>
                        <textarea class="form-control" rows="3" placeholder="60&#10;3" data-field="answers"></textarea>
                        <small class="form-text text-muted">Số lượng đáp án phải khớp với số lượng mục cần điền phía trên.</small>
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
            `;
            break;
        
        case 'imageWordProblemMultiAnswer':
            templateHtml = `
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
            `;
            break;

        case 'imageWordProblemMultiChoice':
            templateHtml = `
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
            `;
            break;
    }
    
    // Thêm bài tập vào container
    problemsContainer.insertAdjacentHTML('beforeend', templateHtml);
    
    // Thêm sự kiện xóa bài tập
    const newProblem = problemsContainer.lastElementChild;
    newProblem.querySelector('.delete-problem-btn').addEventListener('click', function() {
        newProblem.remove();
        updateExerciseData();
    });
    
    // Cập nhật dữ liệu bài tập
    updateExerciseData();
}

// Khởi tạo các nút xóa bài tập
function initDeleteProblemButtons(container) {
    container.querySelectorAll('.delete-problem-btn').forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.problem-item').remove();
            updateExerciseData();
        });
    });
}

// Cập nhật thứ tự các khối bài tập
function updateExerciseBlocksOrder() {
    updateExerciseData();
}

// Cập nhật dữ liệu bài tập từ DOM
function updateExerciseData() {
    // Lấy tất cả các khối bài tập
    const blocks = document.querySelectorAll('.exercise-block');
    const exerciseBlocks = [];
    
    blocks.forEach(block => {
        const blockType = block.getAttribute('data-type');
        const blockTitle = block.querySelector('.custom-block-title')?.value || '';
        const problems = [];
        
        // Lấy tất cả bài tập trong khối
        block.querySelectorAll('.problem-item').forEach(problem => {
            const problemData = {};
            
            // Lấy dữ liệu từ các trường nhập liệu
            problem.querySelectorAll('[data-field]').forEach(input => {
                const fieldName = input.getAttribute('data-field');
                
                if (fieldName === 'correctAnswer' && blockType === 'ordering') {
                    // Xử lý đặc biệt cho bài tập sắp xếp thứ tự
                    const answerLines = input.value.split('\n').filter(line => line.trim() !== '');
                    problemData[fieldName] = answerLines;
                } else if (fieldName === 'options' && blockType === 'ordering') {
                    // Xử lý các lựa chọn cho bài tập sắp xếp
                    const optionLines = input.value.split('\n').filter(line => line.trim() !== '');
                    problemData[fieldName] = optionLines;
                } else if (fieldName === 'blanks' || fieldName === 'answers') {
                    // Xử lý các mục cần điền và đáp án
                    const lines = input.value.split('\n').filter(line => line.trim() !== '');
                    problemData[fieldName] = lines;
                } else if (fieldName === 'correct_answers') {
                    // Xử lý đặc biệt cho danh sách đáp án đúng dưới dạng chuỗi cách nhau bởi dấu phẩy
                    const correctAnswersArray = input.value.split(',').map(item => item.trim());
                    problemData[fieldName] = correctAnswersArray;
                } else if (fieldName === 'questions' && blockType === 'imageWordProblemMultiChoice') {
                    // Xử lý các câu hỏi cho bài tập dropdown
                    const questionLines = input.value.split('\n').filter(line => line.trim() !== '');
                    problemData[fieldName] = questionLines;
                } else if (fieldName === 'options_list' && blockType === 'imageWordProblemMultiChoice') {
                    // Xử lý danh sách lựa chọn cho từng câu hỏi
                    const optionLines = input.value.split('\n').filter(line => line.trim() !== '');
                    // Chuyển đổi mỗi dòng thành một mảng lựa chọn
                    const optionsList = optionLines.map(line => {
                        return line.split(',').map(option => option.trim());
                    });
                    problemData[fieldName] = optionsList;
                } else if (fieldName === 'correct_answers' && blockType === 'imageWordProblemMultiChoice') {
                    // Xử lý các đáp án đúng cho bài tập dropdown
                    const answerLines = input.value.split('\n').filter(line => line.trim() !== '');
                    problemData[fieldName] = answerLines;
                } else if (fieldName === 'blanks' && blockType === 'imageWordProblemMultiAnswer') {
                    // Xử lý các câu hỏi cho bài tập nhiều đáp án
                    const blankLines = input.value.split('\n').filter(line => line.trim() !== '');
                    problemData[fieldName] = blankLines;
                } else if (fieldName === 'answers' && blockType === 'imageWordProblemMultiAnswer') {
                    // Xử lý các đáp án cho bài tập nhiều đáp án
                    const answerLines = input.value.split('\n').filter(line => line.trim() !== '');
                    problemData[fieldName] = answerLines;
                } else {
                    problemData[fieldName] = input.value;
                }
            });
            
            problems.push(problemData);
        });
        
        exerciseBlocks.push({
            type: blockType,
            title: blockTitle, // Thêm trường title cho khối bài tập
            problems: problems
        });
    });
    
    // Cập nhật dữ liệu bài tập
    currentLessonData.sections.exercises.exerciseBlocks = exerciseBlocks;
}

// Tải dữ liệu bài học để chỉnh sửa
function loadLessonData() {
    const classId = document.getElementById('lesson-class').value;
    const subject = document.getElementById('lesson-subject').value;
    const book = document.getElementById('lesson-book').value;
    const lesson = document.getElementById('lesson-number').value;
    
    if (!classId || !subject || !book || !lesson) {
        return;
    }
    
    // Lấy dữ liệu bài học từ server
    fetch(`/api/lesson_content?class_id=${classId}&subject=${subject}&book=${book}&lesson=${lesson}`)
        .then(response => response.json())
        .then(data => {
            if (data.lesson_data) {
                // Cập nhật biến dữ liệu hiện tại
                currentLessonData = data.lesson_data;
                
                // Cập nhật tiêu đề bài học
                document.getElementById('lesson-title').value = currentLessonData.title || `Bài ${lesson}`;
                
                // Cập nhật nội dung lý thuyết
                document.getElementById('theory-editor').summernote('code', currentLessonData.sections.theory.content || '');
                
                // Cập nhật nội dung tóm tắt
                document.getElementById('summary-editor').summernote('code', currentLessonData.sections.summary.content || '');
                
                // Xóa tất cả khối bài tập hiện tại
                document.getElementById('exercise-blocks-container').innerHTML = '';
                
                // Tạo lại các khối bài tập
                const exerciseBlocks = currentLessonData.sections.exercises.exerciseBlocks || [];
                exerciseBlocks.forEach(block => {
                    renderExistingExerciseBlock(block);
                });
            }
        })
        .catch(error => {
            console.error('Error loading lesson data:', error);
            alert('Có lỗi xảy ra khi tải dữ liệu bài học.');
        });
}

// Render khối bài tập có sẵn
function renderExistingExerciseBlock(blockData) {
    const blockType = blockData.type;
    const blockId = 'exercise-block-' + Date.now();
    
    let blockTitle = '';
    switch(blockType) {
        case 'comparison': blockTitle = 'So sánh (>,<,=)'; break;
        case 'mentalMath': blockTitle = 'Tính nhẩm'; break;
        case 'trueFalse': blockTitle = 'Đúng/Sai (Đ/S)'; break;
        case 'wordProblem': blockTitle = 'Bài toán có lời văn'; break;
        case 'ordering': blockTitle = 'Sắp xếp theo thứ tự'; break;
        case 'fillInBlanks': blockTitle = 'Điền vào chỗ trống'; break;
    }
    
    // Tạo container block
    const blockHtml = `
        <div class="exercise-block card mb-3" id="${blockId}" data-type="${blockType}">
            <div class="card-header d-flex justify-content-between align-items-center">
                <div>
                    <span class="drag-handle me-2"><i class="fas fa-grip-vertical"></i></span>
                    <span class="block-title">${blockTitle}</span>
                </div>
                <div class="block-actions">
                    <button type="button" class="btn btn-sm btn-outline-primary add-problem-btn">
                        <i class="fas fa-plus"></i> Thêm bài
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger delete-block-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="problems-container">
                    <!-- Các bài tập sẽ được thêm vào đây -->
                </div>
            </div>
        </div>
    `;
    
    // Thêm vào DOM
    const container = document.getElementById('exercise-blocks-container');
    container.insertAdjacentHTML('beforeend', blockHtml);
    
    // Thêm các bài tập vào khối
    const problemsContainer = document.querySelector(`#${blockId} .problems-container`);
    
    // Thêm từng bài tập
    blockData.problems.forEach(problem => {
        let problemHtml = '';
        
        switch(blockType) {
            case 'comparison':
                problemHtml = `
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
                    </div>
                `;
                break;
                
            case 'mentalMath':
                problemHtml = `
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
                    </div>
                `;
                break;
                
            case 'trueFalse':
                problemHtml = `
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
                    </div>
                `;
                break;
                
            case 'wordProblem':
                problemHtml = `
                    <div class="problem-item mb-3">
                        <div class="row mb-2">
                            <div class="col">
                                <textarea class="form-control" data-field="text" rows="2">${problem.text || ''}</textarea>
                            </div>
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
                    </div>
                `;
                break;
                
            case 'ordering':
                const answerLines = Array.isArray(problem.correctAnswer) ? problem.correctAnswer.join('\n') : '';
                problemHtml = `
                    <div class="problem-item mb-3">
                        <div class="row mb-2">
                            <div class="col">
                                <textarea class="form-control" data-field="text" rows="2">${problem.text || ''}</textarea>
                            </div>
                        </div>
                        <div class="row align-items-center mb-2">
                            <div class="col-auto">Đáp án (mỗi dòng một giá trị):</div>
                        </div>
                        <div class="row mb-2">
                            <div class="col">
                                <textarea class="form-control" data-field="correctAnswer" rows="3">${answerLines}</textarea>
                            </div>
                            <div class="col-auto align-self-center">
                                <button type="button" class="btn btn-sm btn-danger delete-problem-btn">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                break;
            
            case 'fillInBlanks':
                const blanksText = Array.isArray(problem.blanks) ? problem.blanks.join('\n') : '';
                const answersText = Array.isArray(problem.answers) ? problem.answers.join('\n') : '';
                
                problemHtml = `
                    <div class="problem-item mb-3">
                        <div class="mb-3">
                            <label class="form-label">Câu hỏi hoặc bài toán:</label>
                            <textarea class="form-control" rows="2" data-field="question">${problem.question || ''}</textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Các mục cần điền (mỗi dòng một mục):</label>
                            <textarea class="form-control" rows="3" data-field="blanks">${blanksText}</textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Đáp án (mỗi dòng một đáp án, theo thứ tự các mục cần điền):</label>
                            <textarea class="form-control" rows="3" data-field="answers">${answersText}</textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Giải thích:</label>
                            <textarea class="form-control" rows="2" data-field="explanation">${problem.explanation || ''}</textarea>
                        </div>
                        <div class="text-end">
                            <button type="button" class="btn btn-sm btn-danger delete-problem-btn">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                `;
                break;

            case 'imageWordProblemMultiAnswer':
                // Chuyển các mảng thành chuỗi để hiển thị trong textarea
                const blanksText = Array.isArray(problem.blanks) ? problem.blanks.join('\n') : problem.blanks || '';
                const answersText = Array.isArray(problem.answers) ? problem.answers.join('\n') : problem.answers || '';
                
                problemHtml = `
                    <div class="problem-item mb-3">
                        <div class="mb-3">
                            <label class="form-label">Nội dung bài toán:</label>
                            <textarea class="form-control" rows="3" data-field="text">${problem.text || ''}</textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Hình ảnh:</label>
                            <div class="row">
                                <div class="col-md-9">
                                    <input type="text" class="form-control" value="${problem.image_src || ''}" data-field="image_src">
                                </div>
                                <div class="col-md-3">
                                    <div class="form-text mt-0">Lưu hình ảnh vào thư mục /static/images/</div>
                                </div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Các câu hỏi (mỗi dòng một câu):</label>
                            <textarea class="form-control" rows="3" data-field="blanks">${blanksText}</textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Đáp án (mỗi dòng một đáp án, theo thứ tự các câu hỏi):</label>
                            <textarea class="form-control" rows="3" data-field="answers">${answersText}</textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Giải thích:</label>
                            <textarea class="form-control" rows="4" data-field="explanation">${problem.explanation || ''}</textarea>
                        </div>
                        <div class="text-end">
                            <button type="button" class="btn btn-sm btn-danger delete-problem-btn">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                `;
                break;

            case 'imageWordProblemMultiChoice':
                // Chuyển mảng câu hỏi thành chuỗi để hiển thị trong textarea
                const questionsText = Array.isArray(problem.questions) ? problem.questions.join('\n') : problem.questions || '';
                
                // Chuyển mảng danh sách lựa chọn thành chuỗi để hiển thị trong textarea
                let optionsListText = '';
                if (Array.isArray(problem.options_list)) {
                    optionsListText = problem.options_list.map(options => {
                        if (Array.isArray(options)) {
                            return options.join(', ');
                        }
                        return options || '';
                    }).join('\n');
                }
                
                // Chuyển mảng đáp án đúng thành chuỗi để hiển thị trong textarea
                const correctAnswersText = Array.isArray(problem.correct_answers) ? problem.correct_answers.join('\n') : problem.correct_answers || '';
                
                problemHtml = `
                    <div class="problem-item mb-3">
                        <div class="mb-3">
                            <label class="form-label">Nội dung bài toán:</label>
                            <textarea class="form-control" rows="3" data-field="text">${problem.text || ''}</textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Hình ảnh:</label>
                            <div class="row">
                                <div class="col-md-9">
                                    <input type="text" class="form-control" value="${problem.image_src || ''}" data-field="image_src">
                                </div>
                                <div class="col-md-3">
                                    <div class="form-text mt-0">Lưu hình ảnh vào thư mục /static/images/</div>
                                </div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Các câu hỏi (mỗi dòng một câu hỏi):</label>
                            <textarea class="form-control" rows="4" data-field="questions">${questionsText}</textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Danh sách các lựa chọn (mỗi dòng là các lựa chọn cho một câu hỏi, cách nhau bởi dấu phẩy):</label>
                            <textarea class="form-control" rows="4" data-field="options_list">${optionsListText}</textarea>
                            <div class="form-text">Mỗi dòng là danh sách lựa chọn cho một câu hỏi, cách nhau bởi dấu phẩy</div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Đáp án đúng (mỗi dòng là đáp án đúng cho một câu hỏi):</label>
                            <textarea class="form-control" rows="4" data-field="correct_answers">${correctAnswersText}</textarea>
                            <div class="form-text">Nhập chính xác nội dung đáp án (phân biệt chữ hoa, chữ thường)</div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Giải thích:</label>
                            <textarea class="form-control" rows="4" data-field="explanation">${problem.explanation || ''}</textarea>
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
        problemsContainer.insertAdjacentHTML('beforeend', problemHtml);
    });
    
    // Khởi tạo các sự kiện
    const block = document.getElementById(blockId);
    
    // Nút xóa khối
    block.querySelector('.delete-block-btn').addEventListener('click', function() {
        if (confirm('Bạn có chắc chắn muốn xóa khối bài tập này?')) {
            block.remove();
            updateExerciseData();
        }
    });
    
    // Nút thêm bài tập
    block.querySelector('.add-problem-btn').addEventListener('click', function() {
        addProblem(blockId, blockType);
    });
    
    // Khởi tạo sự kiện xóa bài tập
    initDeleteProblemButtons(block);
}

// Hàm lưu bài học
function saveLesson() {
    const classId = document.getElementById('lesson-class').value;
    const subject = document.getElementById('lesson-subject').value;
    const book = document.getElementById('lesson-book').value;
    const lesson = document.getElementById('lesson-number').value;
    
    if (!classId || !subject || !book || !lesson) {
        alert('Vui lòng chọn đầy đủ thông tin bài học.');
        return;
    }
    
    // Cập nhật tiêu đề
    currentLessonData.title = document.getElementById('lesson-title').value || `Bài ${lesson}`;
    
    // Cập nhật dữ liệu bài tập
    updateExerciseData();
    
    // Gửi dữ liệu lên server
    const method = 'PUT'; // Sử dụng PUT để cập nhật bài học có sẵn
    
    fetch('/api/lessons', {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            class_id: classId,
            subject: subject,
            book: book,
            lesson: lesson,
            lesson_data: currentLessonData
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('Lưu bài học thành công!');
        } else {
            alert(result.error || 'Có lỗi xảy ra khi lưu bài học.');
        }
    })
    .catch(error => {
        console.error('Error saving lesson:', error);
        alert('Có lỗi xảy ra khi kết nối với máy chủ.');
    });
}

// Hàm xem trước bài học
function previewLesson() {
    // Cập nhật dữ liệu bài tập
    updateExerciseData();
    
    // Tạo URL cho xem trước
    const classId = document.getElementById('lesson-class').value;
    const subject = document.getElementById('lesson-subject').value;
    const book = document.getElementById('lesson-book').value;
    const lesson = document.getElementById('lesson-number').value;
    
    // Mở cửa sổ xem trước
    fetch('/api/preview_lesson', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            lesson_data: currentLessonData
        })
    })
    .then(response => response.text())
    .then(html => {
        // Tạo cửa sổ xem trước
        const previewWindow = window.open('', '_blank');
        previewWindow.document.write(html);
        previewWindow.document.close();
    })
    .catch(error => {
        console.error('Error generating preview:', error);
        alert('Có lỗi xảy ra khi tạo bản xem trước.');
    });
}