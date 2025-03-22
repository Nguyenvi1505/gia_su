import json
from datetime import datetime, timedelta
import random
from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash
import json
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = 'supersecretkey'  # Khóa bảo mật cho session
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Đọc file JSON lưu tài khoản
def load_users():
    with open('users.json', 'r') as file:
        return json.load(file)

# Lưu dữ liệu người dùng
def save_users(users):
    with open('users.json', 'w') as file:
        json.dump(users, file, indent=4)

def add_user_with_progress(username, password, allowed_classes):
    """
    Thêm người dùng mới và khởi tạo tiến trình học tập
    """
    # Thêm người dùng vào users.json
    try:
        with open('users.json', 'r', encoding='utf-8') as file:
            users = json.load(file)
        
        # Kiểm tra xem tài khoản đã tồn tại chưa
        if username in users:
            return False, "Tên tài khoản đã tồn tại"
        
        # Thêm tài khoản mới
        users[username] = {
            "password": password,
            "allowed_classes": allowed_classes
        }
        
        # Lưu file users.json
        with open('users.json', 'w', encoding='utf-8') as file:
            json.dump(users, file, indent=4, ensure_ascii=False)
        
        # Khởi tạo tiến trình học tập cho người dùng mới
        try:
            with open('learning_progress.json', 'r', encoding='utf-8') as file:
                progress_data = json.load(file)
        except FileNotFoundError:
            progress_data = {}
        
        # Thêm tiến trình mới cho người dùng
        progress_data[username] = {
            "completed_lessons": [],
            "scores": [],
            "study_sessions": []
        }
        
        # Lưu file learning_progress.json
        with open('learning_progress.json', 'w', encoding='utf-8') as file:
            json.dump(progress_data, file, indent=4, ensure_ascii=False)
        
        return True, "Thêm tài khoản thành công"
    
    except Exception as e:
        return False, f"Lỗi: {str(e)}"

def delete_user_with_progress(username):
    """
    Xóa người dùng và tiến trình học tập
    """
    # Xóa người dùng khỏi users.json
    try:
        with open('users.json', 'r', encoding='utf-8') as file:
            users = json.load(file)
        
        # Kiểm tra xem tài khoản có tồn tại không
        if username not in users:
            return False, "Tài khoản không tồn tại"
        
        # Xóa tài khoản
        del users[username]
        
        # Lưu file users.json
        with open('users.json', 'w', encoding='utf-8') as file:
            json.dump(users, file, indent=4, ensure_ascii=False)
        
        # Xóa tiến trình học tập của người dùng
        try:
            with open('learning_progress.json', 'r', encoding='utf-8') as file:
                progress_data = json.load(file)
            
            # Xóa tiến trình nếu có
            if username in progress_data:
                del progress_data[username]
                
                # Lưu file learning_progress.json
                with open('learning_progress.json', 'w', encoding='utf-8') as file:
                    json.dump(progress_data, file, indent=4, ensure_ascii=False)
        except FileNotFoundError:
            pass  # Không có file tiến trình, bỏ qua
        
        return True, "Xóa tài khoản thành công"
    
    except Exception as e:
        return False, f"Lỗi: {str(e)}"

def initialize_lesson_structure():
    """Khởi tạo cấu trúc thư mục bài học và file learning_progress.json nếu chưa tồn tại"""
    # Khởi tạo cấu trúc thư mục bài học (như trong code hiện tại)
    lessons_dir = os.path.join('templates', 'lessons')
    if not os.path.exists(lessons_dir):
        os.makedirs(lessons_dir)
    
    # Tạo thư mục cho các lớp
    for class_id in range(1, 6):  # Lớp 1-5
        class_dir = os.path.join(lessons_dir, f'class_{class_id}')
        if not os.path.exists(class_dir):
            os.makedirs(class_dir)
        
        # Tạo thư mục cho các môn học
        for subject in ['math', 'math_exercises', 'vietnamese']:
            subject_dir = os.path.join(class_dir, subject)
            if not os.path.exists(subject_dir):
                os.makedirs(subject_dir)
            
            # Tạo thư mục cho các tập sách
            for book_id in range(1, 3):  # Tập 1-2
                book_dir = os.path.join(subject_dir, f'book_{book_id}')
                if not os.path.exists(book_dir):
                    os.makedirs(book_dir)
    
    # Khởi tạo file learning_progress.json nếu chưa tồn tại
    if not os.path.exists('learning_progress.json'):
        try:
            # Đọc danh sách người dùng
            with open('users.json', 'r', encoding='utf-8') as file:
                users = json.load(file)
            
            # Tạo tiến trình trống cho mỗi người dùng
            progress_data = {}
            for username in users:
                progress_data[username] = {
                    "completed_lessons": [],
                    "scores": [],
                    "study_sessions": []
                }
            
            # Lưu file learning_progress.json
            with open('learning_progress.json', 'w', encoding='utf-8') as file:
                json.dump(progress_data, file, indent=4, ensure_ascii=False)
            
            print("Đã khởi tạo file learning_progress.json")
        
        except Exception as e:
            print(f"Lỗi khi khởi tạo file learning_progress.json: {str(e)}")

def generate_lesson_html(lesson_data):
    """
    Tạo HTML từ dữ liệu bài học có cấu trúc JSON
    
    Parameters:
    lesson_data (dict): Dữ liệu bài học dạng JSON với cấu trúc:
        {
            "title": "Tiêu đề bài học",
            "sections": {
                "theory": { "content": "Nội dung HTML lý thuyết" },
                "exercises": {
                    "exerciseBlocks": [
                        {
                            "type": "comparison/mentalMath/trueFalse/wordProblem/ordering",
                            "problems": [ ... ]
                        }
                    ]
                },
                "summary": { "content": "Nội dung HTML tóm tắt" }
            }
        }
    
    Returns:
    str: Chuỗi HTML hiển thị bài học
    """
    
    # Lấy thông tin từ dữ liệu bài học
    title = lesson_data.get('title', 'Bài học')
    sections = lesson_data.get('sections', {})
    
    theory_content = sections.get('theory', {}).get('content', '')
    summary_content = sections.get('summary', {}).get('content', '')
    exercise_blocks = sections.get('exercises', {}).get('exerciseBlocks', [])
    
    # Xây dựng HTML với các dấu ngoặc nhọn được escape đúng cách
    html = f"""
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title}</title>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            .lesson-container {{
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }}
            .lesson-section {{
                margin-bottom: 30px;
                background-color: #fff;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }}
            .exercise-container {{
                margin-bottom: 20px;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                padding: 15px;
            }}
            .nav-tabs {{
                margin-bottom: 20px;
            }}
            .answer-input {{
                width: 50px;
                text-align: center;
                display: inline-block;
            }}
            .word-problem {{
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 10px;
            }}
            .problem-item {{
                padding: 10px;
                border-radius: 8px;
                margin-bottom: 15px;
                border: 1px solid #e9ecef;
            }}
            .problem-item.correct {{
                border: 2px solid #28a745;
            }}
            .problem-item.incorrect {{
                border: 2px solid #dc3545;
            }}
            .solution {{
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin-top: 10px;
                display: none;
                border-left: 4px solid #17a2b8;
                white-space: pre-wrap;
            }}
            .submit-answers {{
                margin-top: 20px;
                margin-bottom: 10px;
            }}
            .show-solutions {{
                margin-top: 10px;
                display: none;
            }}
            .explanation-content {{
                margin-left: 0; /* Đảm bảo không có thụt đầu dòng */
                display: inline-block;
                white-space: pre-line; /* Giữ đúng định dạng xuống dòng */
            }}
            .fill-in-blanks-container {{
                margin-bottom: 15px;
            }}
            .fill-in-blank-input.correct {{
                background-color: #d4edda;
                border-color: #28a745;
            }}
            .fill-in-blank-input.incorrect {{
                background-color: #f8d7da;
                border-color: #dc3545;
            }}
            .input-group-text {{
                min-width: 120px;
                display: flex;
                justify-content: flex-start;
            }}
            /* Hiển thị đáp án đúng khi nộp bài */
            .correct-answer {{
                display: none;
                margin-top: 5px;
                font-size: 0.9em;
                color: #28a745;
            }}
            .problem-image {{
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 5px;
                max-width: 100%;
                height: auto;
            }}
            .form-check.correct-choice {{
                background-color: rgba(40, 167, 69, 0.1);
                border-left: 3px solid #28a745;
                padding-left: 10px;
            }}
            .form-check.incorrect-choice {{
                background-color: rgba(220, 53, 69, 0.1);
                border-left: 3px solid #dc3545;
                padding-left: 10px;
            }}
            .multi-choice-options {{
                padding: 10px;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                background-color: #f8f9fa;
            }}
            .multi-choice-options .row {{
                border-bottom: 1px solid #eee;
                padding-bottom: 12px;
                padding-top: 12px;
            }}
            .multi-choice-options .row:nth-child(even) {{
                background-color: rgba(0,0,0,0.02);
            }}
            .custom-dropdown.is-valid {{
                border-color: #28a745;
                background-color: rgba(40, 167, 69, 0.1);
            }}
            .custom-dropdown.is-invalid {{
                border-color: #dc3545;
                background-color: rgba(220, 53, 69, 0.1);
            }}
            .has-success {{
                position: relative;
            }}
            .has-success::after {{
                content: "✓";
                position: absolute;
                right: -20px;
                color: #28a745;
                font-weight: bold;
            }}
            .has-error {{
                position: relative;
            }}
            .has-error::after {{
                content: "✗";
                position: absolute;
                right: -20px;
                color: #dc3545;
                font-weight: bold;
            }}
            .correct-answer {{
                color: #28a745;
                font-size: 0.875rem;
                font-style: italic;
            }}
        </style>
    </head>
    <body>
        <div class="lesson-container">
            <h1 class="text-center mb-4">{title}</h1>
            
            <ul class="nav nav-tabs" id="lessonTabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="theory-tab" data-bs-toggle="tab" data-bs-target="#theory" type="button" role="tab">
                        <i class="fas fa-book-open"></i> Lý thuyết
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="exercises-tab" data-bs-toggle="tab" data-bs-target="#exercises" type="button" role="tab">
                        <i class="fas fa-pencil-alt"></i> Bài tập thực hành
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="summary-tab" data-bs-toggle="tab" data-bs-target="#summary" type="button" role="tab">
                        <i class="fas fa-list-check"></i> Tóm tắt bài học
                    </button>
                </li>
            </ul>
            
            <div class="tab-content" id="lessonTabContent">
                <div class="tab-pane fade show active" id="theory" role="tabpanel">
                    <div class="lesson-section theory-content">
                        {theory_content}
                    </div>
                </div>
                
                <div class="tab-pane fade" id="exercises" role="tabpanel">
                    <div class="lesson-section exercise-content">
    """
    
    # Tạo HTML cho các khối bài tập
    if exercise_blocks:
        # Thêm container cho tất cả bài tập
        html += """
        <div id="all-exercises-container">
        """
        
        for i, block in enumerate(exercise_blocks):
            block_type = block.get('type', '')
            problems = block.get('problems', [])
            
            if block_type == 'comparison':
                html += f"""
                <div class="exercise-block mb-4" id="exercise-block-{i}" data-type="comparison">
                    <h4>{block.get('title', 'Bài tập so sánh: Chọn dấu >, <, = thích hợp')}</h4>
                    <div class="problems-container">
                """
                for j, problem in enumerate(problems):
                    left = problem.get('leftSide', '')
                    right = problem.get('rightSide', '')
                    answer = problem.get('correctAnswer', '')
                    explanation = problem.get('explanation', '')
                    
                    html += f"""
                        <div class="problem-item" data-correct="{answer}" id="problem-{i}-{j}">
                            <div class="row align-items-center">
                                <div class="col-auto">{left}</div>
                                <div class="col-auto">
                                    <select class="form-select answer-select" style="width: auto">
                                        <option value="">Chọn</option>
                                        <option value="<">&lt;</option>
                                        <option value="=">=</option>
                                        <option value=">">&gt;</option>
                                    </select>
                                </div>
                                <div class="col-auto">{right}</div>
                            </div>
                            <div class="solution">
                                <strong>Giải thích:\n</strong> <span class="explanation-content">{explanation if explanation else "Không có giải thích"}</span>
                            </div>
                        </div>
                    """
                html += """
                    </div>
                </div>
                """
            
            elif block_type == 'mentalMath':
                html += f"""
                <div class="exercise-block mb-4" id="exercise-block-{i}" data-type="mentalMath">
                    <h4>{block.get('title', 'Bài tập tính nhẩm')}</h4>
                    <div class="problems-container">
                """
                for j, problem in enumerate(problems):
                    question = problem.get('question', '')
                    answer = problem.get('correctAnswer', '')
                    explanation = problem.get('explanation', '')
                    
                    html += f"""
                        <div class="problem-item" data-correct="{answer}" id="problem-{i}-{j}">
                            <div class="row align-items-center">
                                <div class="col">{question}</div>
                                <div class="col-auto">
                                    <input type="text" class="form-control answer-input" placeholder="Đáp án">
                                </div>
                            </div>
                            <div class="solution">
                                <strong>Giải thích:\n</strong> <span class="explanation-content">{explanation if explanation else "Không có giải thích"}</span>
                            </div>
                        </div>
                    """
                html += """
                    </div>
                </div>
                """
                
            elif block_type == 'trueFalse':
                html += f"""
                <div class="exercise-block mb-4" id="exercise-block-{i}" data-type="trueFalse">
                    <h4>{block.get('title', 'Bài tập Đúng/Sai')}</h4>
                    <div class="problems-container">
                """
                for j, problem in enumerate(problems):
                    statement = problem.get('statement', '')
                    answer = problem.get('correctAnswer', '')
                    explanation = problem.get('explanation', '')
                    
                    html += f"""
                        <div class="problem-item" data-correct="{answer}" id="problem-{i}-{j}">
                            <div class="row align-items-center">
                                <div class="col">{statement}</div>
                                <div class="col-auto">
                                    <select class="form-select answer-select" style="width: auto">
                                        <option value="">Chọn</option>
                                        <option value="Đ">Đúng</option>
                                        <option value="S">Sai</option>
                                    </select>
                                </div>
                            </div>
                            <div class="solution">
                                <strong>Giải thích:\n</strong> <span class="explanation-content">{explanation if explanation else "Không có giải thích"}</span>
                            </div>
                        </div>
                    """
                html += """
                    </div>
                </div>
                """
                
            elif block_type == 'wordProblem':
                html += f"""
                <div class="exercise-block mb-4" id="exercise-block-{i}" data-type="wordProblem">
                    <h4>{block.get('title', 'Bài toán có lời văn')}</h4>
                    <div class="problems-container">
                """
                for j, problem in enumerate(problems):
                    text = problem.get('text', '')
                    answer = problem.get('correctAnswer', '')
                    explanation = problem.get('explanation', '')
                    
                    html += f"""
                        <div class="problem-item" data-correct="{answer}" id="problem-{i}-{j}">
                            <div class="word-problem">{text}</div>
                            <div class="row align-items-center">
                                <div class="col-auto">Đáp số:</div>
                                <div class="col-auto">
                                    <input type="text" class="form-control answer-input" style="width: 100px;">
                                </div>
                            </div>
                            <div class="solution">
                                <strong>Giải thích:\n</strong> <span class="explanation-content">{explanation if explanation else "Không có giải thích"}</span>
                            </div>
                        </div>
                    """
                html += """
                    </div>
                </div>
                """
                
            elif block_type == 'ordering':
                html += f"""
                <div class="exercise-block mb-4" id="exercise-block-{i}" data-type="ordering">
                    <h4>{block.get('title', 'Bài tập sắp xếp thứ tự')}</h4>
                    <div class="problems-container">
                """
                for j, problem in enumerate(problems):
                    text = problem.get('text', '')
                    options = problem.get('options', [])
                    answer = problem.get('correctAnswer', [])
                    explanation = problem.get('explanation', '')
                    answer_json = json.dumps(answer).replace('"', '&quot;')

                    # Nếu options không được cung cấp, sử dụng đáp án làm tùy chọn nhưng đảo thứ tự
                    if not options:
                        options = answer.copy() if isinstance(answer, list) else []
                        import random
                        random.shuffle(options)
                    
                    html += f"""
                        <div class="problem-item" data-correct='{answer_json}' id="problem-{i}-{j}">
                            <div class="word-problem">{text}</div>
                            <div class="ordering-options">
                    """
                    for k in range(len(answer)):
                        html += f"""
                            <div class="row align-items-center mb-2">
                                <div class="col-auto">{k+1}.</div>
                                <div class="col">
                                    <select class="form-select ordering-select">
                                        <option value="">-- Chọn --</option>
                        """
                        # Thêm các tùy chọn từ danh sách
                        for option in options:
                            html += f'<option value="{option}">{option}</option>'
                            
                        html += """
                                    </select>
                                </div>
                            </div>
                        """
                    html += f"""
                            </div>
                            <div class="solution">
                                <strong>Giải thích:\n</strong> <span class="explanation-content">{explanation if explanation else "Không có giải thích"}</span>
                            </div>
                        </div>
                    """
                html += """
                    </div>
                </div>
                """

            elif block_type == 'fillInBlanks':
                html += f"""
                <div class="exercise-block mb-4" id="exercise-block-{i}" data-type="fillInBlanks">
                    <h4>{block.get('title', 'Bài tập điền vào chỗ trống')}</h4>
                    <div class="problems-container">
                """
                for j, problem in enumerate(problems):
                    question = problem.get('question', '')
                    blanks = problem.get('blanks', '').split("\n") if isinstance(problem.get('blanks', ''), str) else problem.get('blanks', [])
                    answers = problem.get('answers', '').split("\n") if isinstance(problem.get('answers', ''), str) else problem.get('answers', [])
                    explanation = problem.get('explanation', '')
                    
                    # Đảm bảo blanks và answers không rỗng
                    if not blanks or not answers:
                        continue
                        
                    # Chuyển đổi đáp án thành chuỗi JSON
                    answers_json = json.dumps(answers).replace('"', '&quot;')
                    
                    html += f"""
                        <div class="problem-item" data-correct='{answers_json}' id="problem-{i}-{j}">
                            <div class="mb-3">
                                <div class="word-problem">{question}</div>
                            </div>
                            <div class="row fill-in-blanks-container">
                    """
                    
                    # Chỉ tạo đúng số ô nhập liệu dựa trên blanks và answers
                    for k, blank in enumerate(blanks):
                        if k < len(answers):  # Đảm bảo chỉ tạo ô nhập cho các phần tử có đáp án
                            correct_answer = answers[k]
                            
                            html += f"""
                                <div class="col-md-6 mb-3">
                                    <div class="input-group">
                                        <span class="input-group-text">{blank}</span>
                                        <input type="text" class="form-control fill-in-blank-input" 
                                            data-index="{k}" placeholder="Đáp án" data-answer="{correct_answer}">
                                    </div>
                                </div>
                            """
                    
                    html += f"""
                            </div>
                            <div class="solution">
                                <strong>Giải thích:\n</strong> <span class="explanation-content">{explanation if explanation else "Không có giải thích"}</span>
                            </div>
                        </div>
                    """
                html += """
                    </div>
                </div>
                """
            
            elif block_type == 'imageWordProblemMultiAnswer':
                html += f"""
                <div class="exercise-block mb-4" id="exercise-block-{i}" data-type="imageWordProblemMultiAnswer">
                    <h4>{block.get('title', 'Bài toán có hình ảnh (nhiều đáp án)')}</h4>
                    <div class="problems-container">
                """
                for j, problem in enumerate(problems):
                    text = problem.get('text', '')
                    image_src = problem.get('image_src', '')
                    blanks = problem.get('blanks', '').split("\n") if isinstance(problem.get('blanks', ''), str) else problem.get('blanks', [])
                    answers = problem.get('answers', '').split("\n") if isinstance(problem.get('answers', ''), str) else problem.get('answers', [])
                    explanation = problem.get('explanation', '')
                    
                    # Chuyển đổi đáp án thành chuỗi JSON để lưu trữ trong data-attribute
                    answers_json = json.dumps(answers).replace('"', '&quot;')
                    
                    html += f"""
                        <div class="problem-item" data-correct='{answers_json}' id="problem-{i}-{j}">
                            <div class="mb-3">
                                <div class="word-problem">{text}</div>
                            </div>
                    """
                    
                    if image_src:
                        html += f"""
                            <div class="mb-3">
                                <div class="text-center">
                                    <img src="/static/images/{image_src}" class="img-fluid problem-image" alt="Hình minh họa" style="max-height: 300px;">
                                </div>
                            </div>
                        """
                    
                    html += f"""
                            <div class="row fill-in-blanks-container">
                    """
                    
                    # Tạo các ô nhập liệu cho các câu hỏi
                    for k, blank in enumerate(blanks):
                        if k < len(answers):
                            html += f"""
                                <div class="col-md-6 mb-3">
                                    <div class="input-group">
                                        <span class="input-group-text">{blank}</span>
                                        <input type="text" class="form-control fill-in-blank-input" 
                                            data-index="{k}" placeholder="Đáp án" data-answer="{answers[k]}">
                                    </div>
                                </div>
                            """
                    
                    html += f"""
                            </div>
                            <div class="solution">
                                <strong>Giải thích:</strong> <span class="explanation-content">{explanation if explanation else "Không có giải thích"}</span>
                            </div>
                        </div>
                    """
                html += """
                    </div>
                </div>
                """

            elif block_type == 'imageWordProblemMultiChoice':
                html += f"""
                <div class="exercise-block mb-4" id="exercise-block-{i}" data-type="imageWordProblemMultiChoice">
                    <h4>{block.get('title', 'Bài toán có hình ảnh (chọn đáp án)')}</h4>
                    <div class="problems-container">
                """
                for j, problem in enumerate(problems):
                    text = problem.get('text', '')
                    image_src = problem.get('image_src', '')
                    questions = problem.get('questions', '').split("\n") if isinstance(problem.get('questions', ''), str) else problem.get('questions', [])
                    options_list = [opt.replace(',', ' ').split() for opt in problem.get('options_list', '').split("\n")] 
                    print(options_list)
                    correct_answers = problem.get('correct_answers', '').split("\n") if isinstance(problem.get('correct_answers', ''), str) else problem.get('correct_answers', [])
                    explanation = problem.get('explanation', '')
                    
                    # Chuyển đổi đáp án đúng thành chuỗi JSON để lưu trữ trong data-attribute
                    correct_answers_json = json.dumps(correct_answers).replace('"', '&quot;')
                    
                    html += f"""
                        <div class="problem-item" data-correct='{correct_answers_json}' id="problem-{i}-{j}">
                            <div class="mb-3">
                                <div class="word-problem">{text}</div>
                            </div>
                    """
                    
                    if image_src:
                        html += f"""
                            <div class="mb-3">
                                <div class="text-center">
                                    <img src="/static/images/{image_src}" class="img-fluid problem-image" alt="Hình minh họa" style="max-height: 300px;">
                                </div>
                            </div>
                        """
                    
                    html += f"""
                            <div class="mb-3 multi-choice-options">
                    """
                    
                    # Tạo dropdown cho từng câu hỏi với các lựa chọn tương ứng
                    for k, question in enumerate(questions):
                        # Đảm bảo có danh sách các lựa chọn cho câu hỏi này
                        if k < len(options_list) and options_list[k]:
                            options = options_list[k]
                            # Đảm bảo có đáp án đúng cho câu hỏi này
                            correct_answer = correct_answers[k] if k < len(correct_answers) else ""
                            
                            html += f"""
                                <div class="row mb-3 align-items-center">
                                    <div class="col-md-7 text-start">{question}</div>
                                    <div class="col-md-5">
                                        <select class="form-select custom-dropdown" data-question="{k}" data-correct="{correct_answer}">
                                            <option value="">-- Chọn đáp án --</option>
                            """
                            
                            # Thêm các tùy chọn cho dropdown
                            for option_idx, option in enumerate(options):
                                html += f"""
                                            <option value="{option}">{option}</option>
                                """
                            
                            html += f"""
                                        </select>
                                    </div>
                                </div>
                            """
                    
                    html += f"""
                            </div>
                            <div class="solution">
                                <strong>Giải thích:</strong> <span class="explanation-content">{explanation if explanation else "Không có giải thích"}</span>
                            </div>
                        </div>
                    """
                html += """
                    </div>
                </div>
                """
        
        # Thêm nút nộp bài và xem đáp án
        html += """
            <div class="text-center">
                <button class="btn btn-primary submit-answers" onclick="submitAllAnswers()">
                    <i class="fas fa-check-circle"></i> Nộp bài
                </button>
                <button class="btn btn-info show-solutions" onclick="showAllSolutions()">
                    <i class="fas fa-lightbulb"></i> Xem tất cả đáp án
                </button>
            </div>
        </div>
        """
    else:
        html += """
        <p class="text-center text-muted">Chưa có bài tập nào.</p>
        """
    
    # Hoàn thành HTML
    html += f"""
                    </div>
                </div>
                
                <div class="tab-pane fade" id="summary" role="tabpanel">
                    <div class="lesson-section summary-content">
                        {summary_content}
                    </div>
                </div>
            </div>
        </div>
        
        <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js"></script>
        <script>
            // Hàm nộp bài
            // Cập nhật hàm submitAllAnswers để sửa lỗi kiểm tra bài tập sắp xếp thứ tự
            function submitAllAnswers() {{
                const problemItems = document.querySelectorAll('.problem-item');
                let correctCount = 0;
                let totalProblems = problemItems.length;

                let answersDetail = [];
                
                problemItems.forEach((item, index) => {{
                    const blockType = item.closest('.exercise-block')?.getAttribute('data-type');
                    let isCorrect = false;
                    let userAnswer = "";
                    
                    if (blockType === 'fillInBlanks') {{
                        // Xử lý bài tập điền vào chỗ trống
                        const inputs = item.querySelectorAll('.fill-in-blank-input');
                        
                        // Kiểm tra từng ô nhập
                        let allInputsCorrect = true;
                        let atLeastOneCorrect = false;
                        let userAnswers = [];
                        
                        inputs.forEach((input) => {{
                            const inputAnswer = input.value.trim();
                            userAnswers.push(inputAnswer);
                            const correctAnswer = input.getAttribute('data-answer') || '';
                            
                            // Kiểm tra đáp án
                            if (inputAnswer.toLowerCase() === correctAnswer.toLowerCase()) {{
                                input.classList.add('correct');
                                atLeastOneCorrect = true;
                            }} else {{
                                input.classList.add('incorrect');
                                allInputsCorrect = false;
                                
                                // Hiển thị đáp án đúng
                                const correctAnswerElement = document.createElement('div');
                                correctAnswerElement.className = 'correct-answer';
                                correctAnswerElement.textContent = `Đáp án đúng: ${{correctAnswer}}`;
                                input.parentNode.appendChild(correctAnswerElement);
                            }}
                        }});
                        
                        isCorrect = allInputsCorrect && inputs.length > 0;
                        userAnswer = userAnswers.join(', ');
                        
                        // Nếu có ít nhất một đáp án đúng, ta đánh dấu bài tập là một phần đúng
                        if (atLeastOneCorrect && !allInputsCorrect) {{
                            item.classList.add('partially-correct');
                        }}
                        
                    }} else if (blockType === 'ordering') {{
                        // Xử lý riêng cho bài tập sắp xếp thứ tự
                        const correctAnswerStr = item.getAttribute('data-correct');
                        const correctAnswers = JSON.parse(correctAnswerStr);
                        const orderingSelects = item.querySelectorAll('.ordering-select');
                        let userSelections = [];
                        
                        // Kiểm tra từng lựa chọn có khớp với đáp án không
                        let allSelectionsCorrect = true;
                        for (let i = 0; i < correctAnswers.length; i++) {{
                            if (i >= orderingSelects.length) {{
                                allSelectionsCorrect = false;
                                break;
                            }}
                            
                            // Lưu lại giá trị người dùng chọn
                            userSelections.push(orderingSelects[i].value);
                            
                            // Chuyển đổi giá trị để so sánh cùng kiểu dữ liệu
                            const userValue = orderingSelects[i].value.toString();
                            const correctValue = correctAnswers[i].toString();
                            
                            if (userValue !== correctValue) {{
                                allSelectionsCorrect = false;
                                break;
                            }}
                        }}
                        
                        isCorrect = allSelectionsCorrect;
                        userAnswer = userSelections.join(', ');
                        
                    }} else if (blockType === 'imageWordProblemMultiAnswer') {{
                        // Xử lý tương tự như bài tập điền vào chỗ trống
                        const inputs = item.querySelectorAll('.fill-in-blank-input');
                        
                        // Kiểm tra từng ô nhập
                        let allInputsCorrect = true;
                        let atLeastOneCorrect = false;
                        let userAnswers = [];
                        
                        inputs.forEach((input) => {{
                            const inputAnswer = input.value.trim();
                            userAnswers.push(inputAnswer);
                            const correctAnswer = input.getAttribute('data-answer') || '';
                            
                            // Kiểm tra đáp án
                            if (inputAnswer.toLowerCase() === correctAnswer.toLowerCase()) {{
                                input.classList.add('correct');
                                atLeastOneCorrect = true;
                            }} else {{
                                input.classList.add('incorrect');
                                allInputsCorrect = false;
                                
                                // Hiển thị đáp án đúng
                                const correctAnswerElement = document.createElement('div');
                                correctAnswerElement.className = 'correct-answer';
                                correctAnswerElement.textContent = `Đáp án đúng: ${{correctAnswer}}`;
                                input.parentNode.appendChild(correctAnswerElement);
                            }}
                        }});
                        
                        isCorrect = allInputsCorrect && inputs.length > 0;
                        userAnswer = userAnswers.join(', ');
                        
                        // Nếu có ít nhất một đáp án đúng, ta đánh dấu bài tập là một phần đúng
                        if (atLeastOneCorrect && !allInputsCorrect) {{
                            item.classList.add('partially-correct');
                        }}
                        
                    }} else if (blockType === 'imageWordProblemMultiChoice') {{
                        // Xử lý bài tập chọn đáp án sử dụng dropdown tùy chỉnh
                        const dropdowns = item.querySelectorAll('.custom-dropdown');
                        
                        // Kiểm tra từng dropdown
                        let allCorrect = true;
                        let userSelections = [];
                        
                        dropdowns.forEach((dropdown) => {{
                            const dropdownValue = dropdown.value;
                            userSelections.push(dropdownValue);
                            const correctAnswer = dropdown.getAttribute('data-correct');
                            
                            if (dropdownValue === correctAnswer) {{
                                dropdown.classList.add('is-valid');
                                dropdown.parentElement.classList.add('has-success');
                            }} else {{
                                dropdown.classList.add('is-invalid');
                                dropdown.parentElement.classList.add('has-error');
                                
                                // Tạo phần tử hiển thị đáp án đúng
                                const correctAnswerElem = document.createElement('div');
                                correctAnswerElem.className = 'correct-answer mt-1';
                                correctAnswerElem.textContent = `Đáp án đúng: ${{correctAnswer}}`;
                                dropdown.parentElement.appendChild(correctAnswerElem);
                                
                                allCorrect = false;
                            }}
                        }});
                        
                        isCorrect = allCorrect && dropdowns.length > 0;
                        userAnswer = userSelections.join(', ');
                        
                    }} else {{
                        // Xử lý các loại bài tập khác (comparison, mentalMath, trueFalse, wordProblem)
                        const correctAnswer = item.getAttribute('data-correct');
                        let userInput = '';
                        
                        const answerInput = item.querySelector('.answer-input');
                        const answerSelect = item.querySelector('.answer-select');
                        
                        if (answerInput) {{
                            userInput = answerInput.value.trim();
                            userAnswer = userInput;
                        }} else if (answerSelect) {{
                            userInput = answerSelect.value;
                            userAnswer = userInput;
                        }}
                        
                        isCorrect = userInput.toString().toLowerCase() === correctAnswer.toString().toLowerCase();
                    }}
                    
                    // Hiển thị kết quả
                    if (isCorrect) {{
                        item.classList.add('correct');
                        correctCount++;
                    }} else {{
                        item.classList.add('incorrect');
                    }}

                    // Lấy thông tin câu hỏi
                    const problemId = item.getAttribute('id');
                    const correctAnswer = item.getAttribute('data-correct');
                    
                    // Xác định nội dung câu hỏi dựa theo loại bài tập
                    let problemText = '';
                    
                    if (blockType === 'comparison') {{
                        // Xử lý đặc biệt cho bài tập so sánh
                        const leftSide = item.querySelector('.row .col-auto:nth-child(1)')?.textContent || '';
                        const rightSide = item.querySelector('.row .col-auto:nth-child(3)')?.textContent || '';
                        problemText = `${{leftSide}} ? ${{rightSide}}`;
                    }} else if (item.querySelector('.word-problem')) {{
                        // Bài toán có lời văn
                        problemText = item.querySelector('.word-problem').textContent;
                    }} else if (item.querySelector('.col')) {{
                        // Bài tập khác có .col (như mentalMath)
                        problemText = item.querySelector('.col').textContent;
                    }} else {{
                        // Fallback nếu không tìm thấy
                        problemText = 'Câu hỏi ' + (index + 1);
                    }}
                    
                    // Thêm thông tin chi tiết câu trả lời
                    answersDetail.push({{
                        problem_id: problemId,
                        problem_type: blockType,
                        problem_text: problemText.substring(0, 100) + (problemText.length > 100 ? '...' : ''),
                        user_answer: userAnswer,
                        correct_answer: correctAnswer,
                        is_correct: isCorrect
                    }});
                }});

                // Tính điểm (thang điểm 10)
                const score = totalProblems > 0 ? (correctCount / totalProblems) * 10 : 0;
                const roundedScore = Math.round(score * 10) / 10; // Làm tròn đến 1 chữ số thập phân
                
                // Gửi điểm về server
                const urlParams = new URLSearchParams(window.location.search);
                const classId = urlParams.get('class');
                const subject = urlParams.get('subject');
                const book = urlParams.get('book');
                const lesson = urlParams.get('lesson');
                
                fetch('/api/submit_exercises', {{
                    method: 'POST',
                    headers: {{
                        'Content-Type': 'application/json',
                    }},
                    body: JSON.stringify({{
                        class_id: classId,
                        subject: subject,
                        book: book,
                        lesson: lesson,
                        score: roundedScore,
                        answers_detail: answersDetail  // Thêm chi tiết câu trả lời
                    }})
                }})
                .then(response => response.json())
                .then(data => {{
                    console.log('Đã gửi điểm:', data);
                }})
                .catch(error => {{
                    console.error('Lỗi khi gửi điểm:', error);
                }});
                
                // Hiển thị nút xem đáp án và các đáp án đúng
                document.querySelector('.show-solutions').style.display = 'inline-block';
                document.querySelectorAll('.correct-answer').forEach(elem => {{
                    elem.style.display = 'block';
                }});
                
                // Thông báo kết quả
                alert(`Bạn đã trả lời đúng ${{correctCount}}/${{totalProblems}} câu hỏi.`);
            }}

            function showAllSolutions() {{
                const solutions = document.querySelectorAll('.solution');
                solutions.forEach(solution => {{
                    solution.style.display = 'block';
                }});
            }}
        </script>
    </body>
    </html>
    """
    
    return html

# Hàm tạo dữ liệu mẫu cho demo
def generate_sample_progress_data(username):
    # Lấy thông tin lớp được phép truy cập của người dùng
    allowed_classes = session.get('allowed_classes', [])
    if not allowed_classes:
        with open('users.json', 'r', encoding='utf-8') as file:
            users = json.load(file)
            if username in users:
                allowed_classes = users[username].get('allowed_classes', [])
    
    # Khởi tạo danh sách bài học đã hoàn thành
    completed_lessons = []
    scores = []
    study_sessions = []
    
    # Giả lập các lớp, môn học và bài học
    subjects = ['math', 'vietnamese', 'math_exercises']
    
    # Tạo dữ liệu ngẫu nhiên cho mỗi lớp được phép
    for class_id in allowed_classes:
        for subject in subjects:
            # Số lượng bài học đã hoàn thành (ngẫu nhiên từ 0-10)
            num_completed = random.randint(0, 10)
            
            for lesson_id in range(1, num_completed + 1):
                # Thêm vào danh sách bài học đã hoàn thành
                completed_lessons.append({
                    "class_id": class_id,
                    "subject": subject,
                    "book": random.randint(1, 2),  # Tập 1 hoặc Tập 2
                    "lesson": lesson_id,
                    "completed_date": (datetime.now() - timedelta(days=random.randint(0, 30))).strftime("%Y-%m-%d")
                })
                
                # Thêm điểm số cho bài học (ngẫu nhiên từ 5-10)
                scores.append({
                    "class_id": class_id,
                    "subject": subject,
                    "book": random.randint(1, 2),
                    "lesson": lesson_id,
                    "score": random.randint(5, 10),
                    "date": (datetime.now() - timedelta(days=random.randint(0, 30))).strftime("%Y-%m-%d")
                })
                
                # Thêm phiên học tập
                study_duration = random.randint(10, 60)  # Thời gian học từ 10-60 phút
                study_sessions.append({
                    "class_id": class_id,
                    "subject": subject,
                    "book": random.randint(1, 2),
                    "lesson": lesson_id,
                    "duration": study_duration,
                    "date": (datetime.now() - timedelta(days=random.randint(0, 30))).strftime("%Y-%m-%d")
                })
    
    return {
        "completed_lessons": completed_lessons,
        "scores": scores,
        "study_sessions": study_sessions
    }

# Hàm đọc dữ liệu tiến trình học tập
def load_learning_progress(username):
    """
    Đọc dữ liệu tiến trình học tập của người dùng
    """
    try:
        # Đọc dữ liệu từ file
        with open('learning_progress.json', 'r', encoding='utf-8') as file:
            all_progress = json.load(file)
            
        # Kiểm tra nếu người dùng đã có dữ liệu
        if username in all_progress:
            print(f"Đã tìm thấy dữ liệu tiến trình cho {username}")
            
            # Kiểm tra xem có trường study_sessions chưa
            if "study_sessions" not in all_progress[username]:
                all_progress[username]["study_sessions"] = []
                # Lưu lại cập nhật
                with open('learning_progress.json', 'w', encoding='utf-8') as file:
                    json.dump(all_progress, file, indent=4, ensure_ascii=False)
            
            return all_progress[username]
        else:
            print(f"Không tìm thấy dữ liệu cho {username}, tạo mới")
    except FileNotFoundError:
        print("File learning_progress.json không tồn tại, tạo mới")
        all_progress = {}
    except json.JSONDecodeError:
        print("Lỗi đọc file JSON, tạo mới")
        all_progress = {}
    
    # Tạo dữ liệu mới cho người dùng
    new_progress = {
        "completed_lessons": [],
        "scores": [],
        "study_sessions": []
    }
    
    # Lưu dữ liệu mới
    all_progress[username] = new_progress
    with open('learning_progress.json', 'w', encoding='utf-8') as file:
        json.dump(all_progress, file, indent=4, ensure_ascii=False)
    
    return new_progress

# Hàm lưu dữ liệu tiến trình học tập
def save_learning_progress(username, progress_data):
    """
    Lưu dữ liệu tiến trình học tập của người dùng
    """
    try:
        # Đọc dữ liệu hiện có
        try:
            with open('learning_progress.json', 'r', encoding='utf-8') as file:
                all_progress = json.load(file)
        except (FileNotFoundError, json.JSONDecodeError):
            print("Không đọc được file hoặc file không tồn tại, tạo mới")
            all_progress = {}
        
        # Đảm bảo trường study_sessions tồn tại
        if "study_sessions" not in progress_data:
            progress_data["study_sessions"] = []
        
        # Cập nhật dữ liệu người dùng
        all_progress[username] = progress_data
        
        # Lưu lại file
        with open('learning_progress.json', 'w', encoding='utf-8') as file:
            json.dump(all_progress, file, indent=4, ensure_ascii=False)
        
        print(f"Đã lưu dữ liệu tiến trình cho {username}")
        return True
    except Exception as e:
        print(f"Lỗi khi lưu tiến trình học tập: {str(e)}")
        return False
    
# Hàm đếm số bài học thực tế trong hệ thống cho một lớp học
def count_lessons_in_system(class_id, subject=None):
    """
    Đếm số lượng bài học thực tế trong hệ thống
    
    Args:
        class_id: ID của lớp học
        subject: Tên môn học, nếu None sẽ đếm tất cả các môn
        
    Returns:
        Số lượng bài học hoặc dict {môn học: số lượng bài học}
    """
    lessons_dir = os.path.join('templates', 'lessons', f'class_{class_id}')
    if not os.path.exists(lessons_dir):
        return 0 if subject else {}
    
    # Nếu chỉ định môn học cụ thể
    if subject:
        subject_dir = os.path.join(lessons_dir, subject)
        if not os.path.exists(subject_dir):
            return 0
        
        # Đếm số bài học trong các tập
        lesson_count = 0
        for book_id in range(1, 3):  # Tập 1 và 2
            book_dir = os.path.join(subject_dir, f'book_{book_id}')
            if os.path.exists(book_dir):
                # Đếm số file json hoặc html bài học
                lesson_files = set()
                for file_name in os.listdir(book_dir):
                    if file_name.startswith('lesson_') and (file_name.endswith('.json') or file_name.endswith('.html')):
                        lesson_number = file_name.split('_')[1].split('.')[0]
                        lesson_files.add(lesson_number)
                
                lesson_count += len(lesson_files)
        
        return lesson_count
    
    # Nếu cần đếm tất cả các môn
    result = {}
    subjects = ['math', 'vietnamese', 'math_exercises']
    
    for subject in subjects:
        result[subject] = count_lessons_in_system(class_id, subject)
    
    return result

# Hàm tính toán thống kê từ dữ liệu tiến trình học tập
def calculate_stats(progress_data, allowed_classes):
    # Tính số bài học đã hoàn thành
    completed_lessons = len(progress_data.get("completed_lessons", []))
    
    # Tính tổng số bài học thực tế trong hệ thống
    total_lessons = 0
    for class_id in allowed_classes:
        # Đếm số bài học mỗi môn trong lớp
        subjects_count = count_lessons_in_system(class_id)
        # Tổng số bài học trong lớp
        total_lessons += sum(subjects_count.values())
    
    # Nếu không có bài học nào, đặt giá trị mặc định
    if total_lessons == 0:
        total_lessons = 1  # Tránh chia cho 0
    
    # Tính điểm trung bình
    scores = progress_data.get("scores", [])
    average_score = sum(item["score"] for item in scores) / len(scores) if scores else 0
    
    # Tính tổng thời gian học (trong tuần này)
    study_sessions = progress_data.get("study_sessions", [])
    current_week_sessions = []
    today = datetime.now()
    start_of_week = today - timedelta(days=today.weekday())
    
    for session in study_sessions:
        session_date = datetime.strptime(session["date"], "%Y-%m-%d")
        if session_date >= start_of_week:
            current_week_sessions.append(session)
    
    # Tổng thời gian học trong tuần (phút)
    total_study_minutes = sum(session["duration"] for session in current_week_sessions)
    # Chuyển từ phút sang giờ
    study_time = total_study_minutes / 60
    
    # Tính số ngày học liên tục
    unique_dates = set(session["date"] for session in study_sessions)
    dates_sorted = sorted(unique_dates, reverse=True)
    
    streak_days = 0
    if dates_sorted:
        # Bắt đầu với ngày học gần nhất
        current_date = datetime.strptime(dates_sorted[0], "%Y-%m-%d")
        streak_days = 1
        
        # Kiểm tra xem ngày học gần nhất có trong khoảng cho phép không
        if (today - current_date).days <= 3:  # Cho phép nghỉ tối đa 3 ngày
            # Lặp qua tất cả các ngày học, từ gần nhất đến xa nhất
            for i in range(1, len(dates_sorted)):
                prev_date = datetime.strptime(dates_sorted[i], "%Y-%m-%d")
                days_diff = (current_date - prev_date).days
                
                # Kiểm tra xem khoảng cách có hợp lệ không
                is_valid_gap = False
                
                # Nếu khoảng cách là 1 ngày (ngày liên tiếp)
                if days_diff == 1:
                    is_valid_gap = True
                # Kiểm tra các trường hợp đặc biệt: cuối tuần
                elif days_diff <= 4:  # Tối đa 4 ngày cho T6 -> T2
                    # Kiểm tra T6 -> T2
                    current_weekday = current_date.weekday()  # 0 = Thứ Hai, 6 = Chủ Nhật
                    prev_weekday = prev_date.weekday()
                    
                    # Nếu ngày hiện tại là thứ 2 (0) và ngày trước đó là thứ 6 (4)
                    if current_weekday == 0 and prev_weekday == 4 and days_diff <= 4:
                        is_valid_gap = True
                    # Kiểm tra các khoảng trống khác, cho phép nghỉ tối đa 3 ngày (không tính T7, CN)
                    elif days_diff <= 3:
                        # Đếm số ngày làm việc trong khoảng
                        work_days = 0
                        for day in range(1, days_diff):
                            check_date = prev_date + timedelta(days=day)
                            # Nếu không phải T7 (5) hoặc CN (6)
                            if check_date.weekday() < 5:  
                                work_days += 1
                        
                        # Cho phép nếu có ít hơn 3 ngày làm việc trong khoảng
                        if work_days <= 3:
                            is_valid_gap = True
                
                if is_valid_gap:
                    streak_days += 1
                    current_date = prev_date
                else:
                    break
    
    return {
        "completed_lessons": completed_lessons,
        "total_lessons": total_lessons,
        "average_score": average_score,
        "study_time": study_time,
        "study_minutes": total_study_minutes,  # Thêm thông tin phút
        "streak_days": streak_days
    }

# Hàm chuẩn bị dữ liệu cho biểu đồ
def prepare_chart_data(progress_data, allowed_classes):
    """
    Tính toán và chuẩn bị dữ liệu cho các biểu đồ tiến trình học tập
    """
    completed_lessons = progress_data.get("completed_lessons", [])
    
    # Tính số bài học đã hoàn thành cho mỗi môn
    completed_by_subject = {
        "math": 0,
        "vietnamese": 0,
        "math_exercises": 0
    }
    
    # Đếm số bài học đã hoàn thành theo môn
    for lesson in completed_lessons:
        subject = lesson.get("subject")
        if subject in completed_by_subject:
            completed_by_subject[subject] += 1
    
    # Đếm tổng số bài học theo môn trong hệ thống
    total_by_subject = {
        "math": 0,
        "vietnamese": 0,
        "math_exercises": 0
    }
    
    for class_id in allowed_classes:
        subjects_count = count_lessons_in_system(class_id)
        for subject, count in subjects_count.items():
            if subject in total_by_subject:
                total_by_subject[subject] += count
    
    # Tính phần trăm hoàn thành cho mỗi môn học
    math_completion = (completed_by_subject["math"] / total_by_subject["math"] * 100) if total_by_subject["math"] > 0 else 0
    vietnamese_completion = (completed_by_subject["vietnamese"] / total_by_subject["vietnamese"] * 100) if total_by_subject["vietnamese"] > 0 else 0
    math_exercises_completion = (completed_by_subject["math_exercises"] / total_by_subject["math_exercises"] * 100) if total_by_subject["math_exercises"] > 0 else 0
    
    # Tính tổng thời gian học cho mỗi môn
    study_sessions = progress_data.get("study_sessions", [])
    
    math_time = sum(session["duration"] for session in study_sessions if session["subject"] == "math")
    vietnamese_time = sum(session["duration"] for session in study_sessions if session["subject"] == "vietnamese")
    math_exercises_time = sum(session["duration"] for session in study_sessions if session["subject"] == "math_exercises")
    
    return {
        "math_completion": math_completion,
        "vietnamese_completion": vietnamese_completion,
        "math_exercises_completion": math_exercises_completion,
        "math_time": math_time,
        "vietnamese_time": vietnamese_time,
        "math_exercises_time": math_exercises_time
    }

# Hàm chuẩn bị dữ liệu lịch sử học tập
def prepare_learning_history(progress_data):
    """
    Chuẩn bị danh sách lịch sử học tập gần đây để hiển thị trong bảng
    """
    history = []
    
    # Lấy dữ liệu từ scores trước (đây là data chính xác nhất)
    for score in progress_data.get("scores", []):
        history.append({
            "date": score.get("date", ""),
            "class_id": score.get("class_id"),
            "subject": score.get("subject", ""),
            "book": score.get("book", 1),
            "lesson": score.get("lesson", 1),
            "lesson_title": f"Lớp {score.get('class_id')} - Bài {score.get('lesson')}",
            "duration": 0,  # Mặc định thời gian là 0 nếu không có session
            "score": score.get("score", 0)
        })
    
    # Nếu không có scores, thử lấy từ completed_lessons
    if not history:
        for lesson in progress_data.get("completed_lessons", []):
            history.append({
                "date": lesson.get("completed_date", ""),
                "class_id": lesson.get("class_id"),
                "subject": lesson.get("subject", ""),
                "book": lesson.get("book", 1),
                "lesson": lesson.get("lesson", 1),
                "lesson_title": f"Lớp {lesson.get('class_id')} - Bài {lesson.get('lesson')}",
                "duration": 0,
                "score": None  # Không có điểm
            })
    
    # Nếu có study_sessions, cập nhật thời gian học
    study_sessions = progress_data.get("study_sessions", [])
    for session in study_sessions:
        session_id = f"{session['class_id']}_{session['subject']}_{session['book']}_{session['lesson']}"
        
        # Tìm bài học tương ứng trong history
        for item in history:
            item_id = f"{item['class_id']}_{item['subject']}_{item['book']}_{item['lesson']}" 
            if item_id == session_id:
                item["duration"] = session.get("duration", 0)
                break
    
    # Sắp xếp lịch sử theo ngày gần nhất
    history.sort(key=lambda x: x.get("date", ""), reverse=True)
    
    # Chỉ trả về 10 mục gần nhất
    return history[:10]

# Hàm theo dõi tiến trình học tập
def track_learning_progress(class_id, subject, book, lesson):
    """
    Ghi lại hoạt động học tập khi người dùng truy cập bài học
    Chỉ ghi lại sự kiện truy cập, không cộng thời gian học
    """
    from flask import session
    
    if 'user' in session:
        username = session['user']
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Thêm vào danh sách bài học đã truy cập (nếu chưa có)
        progress_data = load_learning_progress(username)
        
        # Kiểm tra bài học đã có trong danh sách hoàn thành chưa
        lesson_already_completed = False
        for completed in progress_data.get("completed_lessons", []):
            if (completed["class_id"] == int(class_id) and 
                completed["subject"] == subject and 
                completed["book"] == int(book) and 
                completed["lesson"] == int(lesson)):
                lesson_already_completed = True
                break
        
        # Thêm vào danh sách nếu chưa hoàn thành
        if not lesson_already_completed:
            if "completed_lessons" not in progress_data:
                progress_data["completed_lessons"] = []
            
            progress_data["completed_lessons"].append({
                "class_id": int(class_id),
                "subject": subject,
                "book": int(book),
                "lesson": int(lesson),
                "completed_date": today
            })
            
            # Lưu thay đổi
            save_learning_progress(username, progress_data)

def update_learning_progress_with_detail(username, class_id, subject, book, lesson, score, answers_detail):
    # Đọc dữ liệu tiến trình hiện tại
    progress_data = load_learning_progress(username)
    
    # Tạo ID bài học để xác định duy nhất
    lesson_id = f"{class_id}_{subject}_{book}_{lesson}"
    
    # Khởi tạo mảng scores nếu chưa tồn tại (giữ lại cho tương thích ngược)
    if "scores" not in progress_data:
        progress_data["scores"] = []
    
    # Khởi tạo mảng score_history nếu chưa tồn tại
    if "score_history" not in progress_data:
        progress_data["score_history"] = []
    
    # Kiểm tra bài này đã có điểm chưa (cho tương thích ngược)
    existing_score = None
    for i, item in enumerate(progress_data["scores"]):
        if (item["class_id"] == int(class_id) and 
            item["subject"] == subject and 
            item["book"] == int(book) and 
            item["lesson"] == int(lesson)):
            existing_score = i
            break
    
    # Dữ liệu chi tiết về câu trả lời cho lần làm hiện tại
    now = datetime.now()
    score_detail = {
        "class_id": int(class_id),
        "subject": subject,
        "book": int(book),
        "lesson": int(lesson),
        "score": float(score),
        "answers_detail": answers_detail,  # Chi tiết từng câu trả lời
        "date": now.strftime("%Y-%m-%d"),
        "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
        "attempt_id": now.strftime("%Y%m%d%H%M%S")  # ID duy nhất cho mỗi lần làm bài
    }
    
    # Thêm vào lịch sử làm bài - lưu tất cả các lần làm
    progress_data["score_history"].append(score_detail)
    
    # Cập nhật hoặc thêm mới điểm số gần nhất (cho màn hình tổng quan)
    if existing_score is not None:
        progress_data["scores"][existing_score] = score_detail
    else:
        progress_data["scores"].append(score_detail)
    
    # Lưu dữ liệu tiến trình
    save_learning_progress(username, progress_data)
    
    return score_detail

# Trang đăng nhập
@app.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        users = load_users()
        
        if username in users and users[username]['password'] == password:
            session['user'] = username
            session['allowed_classes'] = users[username]['allowed_classes']
            
            # Phân biệt admin và user thông thường
            if username == 'admin':
                return redirect(url_for('dashboard_admin'))
            else:
                return redirect(url_for('dashboard_users'))
        else:
            return render_template('login.html', error="Sai tài khoản hoặc mật khẩu. Vui lòng thử lại!")
    return render_template('login.html')

# Trang dashboard cho admin
@app.route('/dashboard_admin')
def dashboard_admin():
    if 'user' not in session or session['user'] != 'admin':
        return redirect(url_for('login'))
    
    users = load_users()
    # Loại bỏ admin khỏi danh sách hiển thị
    if 'admin' in users:
        del users['admin']
    
    return render_template('dashboard_admin.html', users=users)

# Trang chọn nội dung học
@app.route('/dashboard_users')
def dashboard_users():
    if 'user' not in session:
        return redirect(url_for('login'))
    return render_template('dashboard_users.html', allowed_classes=session['allowed_classes'])

# API quản lý tài khoản
@app.route('/api/users', methods=['POST', 'DELETE', 'PUT'])
def manage_users():
    if 'user' not in session or session['user'] != 'admin':
        return jsonify({'error': 'Không có quyền truy cập'}), 401
    
    if request.method == 'POST':
        # Thêm tài khoản mới
        data = request.json
        username = data.get('username')
        password = data.get('password')
        allowed_classes = data.get('allowed_classes', [])
        
        if not username or not password:
            return jsonify({'error': 'Thiếu thông tin tài khoản'}), 400
        
        # Sử dụng hàm thêm tài khoản với tiến trình
        success, message = add_user_with_progress(username, password, allowed_classes)
        
        if success:
            return jsonify({'success': True, 'message': message})
        else:
            return jsonify({'error': message}), 400
    
    elif request.method == 'DELETE':
        # Xóa tài khoản
        username = request.args.get('username')
        
        if not username:
            return jsonify({'error': 'Không có tên tài khoản'}), 400
        
        if username == 'admin':
            return jsonify({'error': 'Không thể xóa tài khoản admin'}), 403
        
        # Sử dụng hàm xóa tài khoản với tiến trình
        success, message = delete_user_with_progress(username)
        
        if success:
            return jsonify({'success': True, 'message': message})
        else:
            return jsonify({'error': message}), 400
    
    elif request.method == 'PUT':
        # Cập nhật tài khoản
        data = request.json
        username = data.get('username')
        password = data.get('password')
        allowed_classes = data.get('allowed_classes', [])
        
        if not username:
            return jsonify({'error': 'Không có tên tài khoản'}), 400
        
        try:
            with open('users.json', 'r') as file:
                users = json.load(file)
                
            if username not in users:
                return jsonify({'error': 'Tài khoản không tồn tại'}), 404
            
            if username == 'admin' and 'password' in data:  # Chỉ cho phép thay đổi mật khẩu admin
                users[username]['password'] = password
            elif username != 'admin':  # Cho phép thay đổi mọi thông tin của user khác
                if password:
                    users[username]['password'] = password
                users[username]['allowed_classes'] = allowed_classes
            
            save_users(users)
            return jsonify({'success': True, 'message': 'Tài khoản đã được cập nhật thành công'})
        except Exception as e:
            return jsonify({'error': f'Lỗi: {str(e)}'}), 500

# API quản lý bài học - phiên bản cập nhật
@app.route('/api/lessons', methods=['GET', 'POST', 'PUT', 'DELETE'])
def manage_lessons():
    # Kiểm tra đăng nhập
    if 'user' not in session:
        return jsonify({'error': 'Không có quyền truy cập'}), 401
    
    # Thay đổi để sử dụng thư mục templates/lessons
    lessons_dir = os.path.join('templates', 'lessons')
    
    if request.method == 'GET':
        # Lấy cấu trúc thư mục bài học
        class_id = request.args.get('class_id')
        subject = request.args.get('subject')
        book = request.args.get('book')
        
        # Kiểm tra phân quyền cho người dùng thông thường (không phải admin)
        if session['user'] != 'admin' and class_id and int(class_id) not in session['allowed_classes']:
            return jsonify({'error': 'Không có quyền truy cập vào lớp này'}), 403
        
        if class_id:
            class_path = os.path.join(lessons_dir, f'class_{class_id}')
            if os.path.exists(class_path):
                if subject:
                    subject_path = os.path.join(class_path, subject)
                    if os.path.exists(subject_path):
                        if book:
                            book_path = os.path.join(subject_path, f'book_{book}')
                            if os.path.exists(book_path):
                                # Lấy danh sách file JSON hoặc HTML
                                lessons = []
                                for f in os.listdir(book_path):
                                    # Kiểm tra cả file JSON và HTML
                                    if (f.startswith('lesson_') and 
                                        (f.endswith('.json') or f.endswith('.html'))):
                                        # Lấy số bài học (lesson_{number}.json hoặc .html)
                                        lesson_number = f.split('_')[1].split('.')[0]
                                        if lesson_number not in lessons:
                                            lessons.append(lesson_number)
                                return jsonify({'lessons': sorted(lessons, key=int)})
                            return jsonify({'error': 'Tập sách không tồn tại'}), 404
                        
                        # Lấy danh sách tập sách
                        books = []
                        for item in os.listdir(subject_path):
                            if os.path.isdir(os.path.join(subject_path, item)) and item.startswith('book_'):
                                book_number = item.split('_')[1]
                                books.append(book_number)
                        return jsonify({'books': sorted(books, key=int)})
                    
                    return jsonify({'error': 'Môn học không tồn tại'}), 404
                
                # Lấy danh sách môn học
                subjects = []
                for item in os.listdir(class_path):
                    if os.path.isdir(os.path.join(class_path, item)):
                        subjects.append(item)
                return jsonify({'subjects': subjects})
            
            return jsonify({'error': 'Lớp không tồn tại'}), 404
        
        # Lấy danh sách lớp
        classes = []
        for item in os.listdir(lessons_dir):
            if os.path.isdir(os.path.join(lessons_dir, item)) and item.startswith('class_'):
                class_number = item.split('_')[1]
                classes.append(class_number)
        return jsonify({'classes': sorted(classes, key=int)})
    
    # Các phương thức dưới đây chỉ dành cho admin
    if session['user'] != 'admin':
        return jsonify({'error': 'Không có quyền quản lý bài học'}), 403
    
    if request.method == 'POST':
        # Tạo bài học mới với cấu trúc JSON
        data = request.json
        class_id = data.get('class_id')
        subject = data.get('subject')
        book = data.get('book')
        lesson = data.get('lesson')
        lesson_data = data.get('lesson_data', {})
        
        if not all([class_id, subject, book, lesson]):
            return jsonify({'error': 'Thiếu thông tin bài học'}), 400
        
        # Tạo đường dẫn thư mục nếu chưa tồn tại
        lesson_path = os.path.join(lessons_dir, f'class_{class_id}', subject, f'book_{book}')
        os.makedirs(lesson_path, exist_ok=True)
        
        # Tạo cấu trúc bài học mặc định nếu không được cung cấp
        if not lesson_data:
            lesson_data = {
                "title": f"Bài {lesson}",
                "sections": {
                    "theory": {
                        "content": "<p>Nội dung lý thuyết...</p>"
                    },
                    "exercises": {
                        "exerciseBlocks": []
                    },
                    "summary": {
                        "content": "<p>Tóm tắt bài học...</p>"
                    }
                }
            }
        
        # Lưu dữ liệu bài học dạng JSON
        file_path = os.path.join(lesson_path, f'lesson_{lesson}.json')
        with open(file_path, 'w', encoding='utf-8') as file:
            json.dump(lesson_data, file, ensure_ascii=False, indent=4)
        
        # Tạo file HTML hiển thị cho người dùng
        html_path = os.path.join(lesson_path, f'lesson_{lesson}.html')
        html_content = generate_lesson_html(lesson_data)
        with open(html_path, 'w', encoding='utf-8') as file:
            file.write(html_content)
        
        return jsonify({'success': True, 'message': 'Bài học đã được tạo thành công'})
    
    elif request.method == 'PUT':
        # Cập nhật bài học với dữ liệu JSON
        data = request.json
        class_id = data.get('class_id')
        subject = data.get('subject')
        book = data.get('book')
        lesson = data.get('lesson')
        lesson_data = data.get('lesson_data', {})
        
        if not all([class_id, subject, book, lesson]):
            return jsonify({'error': 'Thiếu thông tin bài học'}), 400
        
        # Tạo đường dẫn thư mục nếu chưa tồn tại
        lesson_dir = os.path.join(lessons_dir, f'class_{class_id}', subject, f'book_{book}')
        os.makedirs(lesson_dir, exist_ok=True)
        
        # Đường dẫn tới file JSON
        json_path = os.path.join(lesson_dir, f'lesson_{lesson}.json')
        
        # Cập nhật dữ liệu bài học
        with open(json_path, 'w', encoding='utf-8') as file:
            json.dump(lesson_data, file, ensure_ascii=False, indent=4)
        
        # Cập nhật file HTML hiển thị
        html_path = os.path.join(lesson_dir, f'lesson_{lesson}.html')
        html_content = generate_lesson_html(lesson_data)
        with open(html_path, 'w', encoding='utf-8') as file:
            file.write(html_content)
        
        return jsonify({'success': True, 'message': 'Bài học đã được cập nhật thành công'})
    
    elif request.method == 'DELETE':
        # Xóa bài học (cả file JSON và HTML)
        class_id = request.args.get('class_id')
        subject = request.args.get('subject')
        book = request.args.get('book')
        lesson = request.args.get('lesson')
        
        if not all([class_id, subject, book, lesson]):
            return jsonify({'error': 'Thiếu thông tin bài học'}), 400
        
        lesson_dir = os.path.join(lessons_dir, f'class_{class_id}', subject, f'book_{book}')
        json_path = os.path.join(lesson_dir, f'lesson_{lesson}.json')
        html_path = os.path.join(lesson_dir, f'lesson_{lesson}.html')
        
        # Kiểm tra file bài học có tồn tại không
        if not (os.path.exists(json_path) or os.path.exists(html_path)):
            return jsonify({'error': 'Bài học không tồn tại'}), 404
        
        # Xóa các file bài học
        if os.path.exists(json_path):
            os.remove(json_path)
        if os.path.exists(html_path):
            os.remove(html_path)
        
        return jsonify({'success': True, 'message': 'Bài học đã được xóa thành công'})
    
# API đọc nội dung bài học từ JSON - đã sửa
@app.route('/api/lesson_content')
def get_lesson_content():
    if 'user' not in session or session['user'] != 'admin':
        return jsonify({'error': 'Không có quyền truy cập'}), 401
    
    class_id = request.args.get('class_id')
    subject = request.args.get('subject')
    book = request.args.get('book')
    lesson = request.args.get('lesson')
    
    if not all([class_id, subject, book, lesson]):
        return jsonify({'error': 'Thiếu thông tin bài học'}), 400
    
    # Đường dẫn đến file JSON của bài học
    # Cập nhật đường dẫn để phù hợp với cấu trúc thư mục
    json_path = os.path.join('templates', 'lessons', f'class_{class_id}', subject, f'book_{book}', f'lesson_{lesson}.json')
    
    # Kiểm tra file bài học có tồn tại không
    if not os.path.exists(json_path):
        # Trả về dữ liệu mặc định nếu bài học chưa tồn tại
        default_data = {
            "title": f"Bài {lesson}",
            "sections": {
                "theory": {
                    "content": "<p>Nội dung lý thuyết...</p>"
                },
                "exercises": {
                    "exerciseBlocks": []
                },
                "summary": {
                    "content": "<p>Tóm tắt bài học...</p>"
                }
            }
        }
        return jsonify({'lesson_data': default_data, 'is_new': True})
    
    # Đọc dữ liệu bài học
    try:
        with open(json_path, 'r', encoding='utf-8') as file:
            lesson_data = json.load(file)
        return jsonify({'lesson_data': lesson_data, 'is_new': False})
    except Exception as e:
        return jsonify({'error': f'Lỗi khi đọc dữ liệu bài học: {str(e)}'}), 500

# API xem trước bài học - đã sửa
@app.route('/api/preview_lesson', methods=['POST'])
def preview_lesson():
    if 'user' not in session or session['user'] != 'admin':
        return jsonify({'error': 'Không có quyền truy cập'}), 401
    
    try:
        data = request.json
        lesson_data = data.get('lesson_data', {})
        
        # Thêm debug để kiểm tra dữ liệu nhận được
        print("Received lesson data for preview:", lesson_data)
        
        # Tạo HTML cho bản xem trước
        html_content = generate_lesson_html(lesson_data)
        
        # Kiểm tra HTML đã tạo
        print("Generated HTML length:", len(html_content))
        
        # Đảm bảo HTML đầy đủ
        if not html_content.strip():
            return "<p>Không có nội dung để hiển thị. Vui lòng thêm nội dung vào bài học.</p>"
        
        return html_content
    except Exception as e:
        import traceback
        traceback.print_exc()
        return f"<p>Có lỗi xảy ra khi tạo bản xem trước: {str(e)}</p>", 500

# API kiểm tra có bài học chưa
@app.route('/api/check_lesson')
def check_lesson():
    if 'user' not in session:
        return jsonify({'error': 'Không có quyền truy cập'}), 401
    
    class_id = request.args.get('class_id')
    subject = request.args.get('subject')
    book = request.args.get('book')
    lesson = request.args.get('lesson')
    
    # Kiểm tra phân quyền
    if int(class_id) not in session['allowed_classes']:
        return jsonify({'allowed': False}), 403
    
    # Kiểm tra file bài học có tồn tại không
    lesson_path = os.path.join('templates', 'lessons', f'class_{class_id}', subject, f'book_{book}', f'lesson_{lesson}.html')
    exists = os.path.exists(lesson_path)
    
    return jsonify({'exists': exists})

# API lấy danh sách bài học cho người dùng
@app.route('/api/lessons_for_user')
def get_lessons_for_user():
    if 'user' not in session:
        return jsonify({'error': 'Không có quyền truy cập'}), 401
    
    class_id = request.args.get('class_id')
    subject = request.args.get('subject')
    book = request.args.get('book')
    
    # Kiểm tra phân quyền
    if int(class_id) not in session['allowed_classes']:
        return jsonify({'allowed': False}), 403
    
    try:
        # Đường dẫn thư mục bài học
        lesson_dir = os.path.join('templates', 'lessons', f'class_{class_id}', subject, f'book_{book}')
        
        # Kiểm tra thư mục có tồn tại không
        if not os.path.exists(lesson_dir):
            return jsonify({'lessons': []})
        
        # Lấy danh sách bài học
        lessons = []
        for file_name in os.listdir(lesson_dir):
            if file_name.startswith('lesson_') and (file_name.endswith('.html') or file_name.endswith('.json')):
                # Trích xuất số bài học từ tên file (lesson_X.html hoặc lesson_X.json)
                lesson_number = file_name.split('_')[1].split('.')[0]
                if lesson_number not in lessons:
                    lessons.append(lesson_number)
        
        return jsonify({'lessons': sorted(lessons, key=int)})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
# Trang học tập với nội dung động từ JSON
@app.route('/learn')
def learn():
    if 'user' not in session:
        return redirect(url_for('login'))
    
    class_id = request.args.get('class', '0')
    subject = request.args.get('subject', '')
    book = request.args.get('book', '')
    lesson = request.args.get('lesson', '')
    
    # Kiểm tra quyền truy cập
    if int(class_id) not in session['allowed_classes']:
        return render_template('error.html', error="Bạn không có quyền truy cập vào nội dung của lớp này")
    
    # Kiểm tra file bài học có tồn tại không
    json_path = os.path.join('templates', 'lessons', f'class_{class_id}', subject, f'book_{book}', f'lesson_{lesson}.json')
    if not os.path.exists(json_path):
        return render_template('error.html', error="Bài học này chưa được tạo")
    
    # Đọc dữ liệu bài học
    try:
        with open(json_path, 'r', encoding='utf-8') as file:
            lesson_data = json.load(file)
        
        # Tạo HTML cho bài học
        html_content = generate_lesson_html(lesson_data)
        
        # Theo dõi tiến trình học tập
        track_learning_progress(class_id, subject, book, lesson)
        
        # Trả về HTML trong template
        return render_template('learn_dynamic.html', 
                              class_id=class_id,
                              subject=subject,
                              book=book,
                              lesson=lesson,
                              lesson_html=html_content)
    except Exception as e:
        return render_template('error.html', error=f"Lỗi khi đọc dữ liệu bài học: {str(e)}")

# API endpoint để lấy tiến trình học tập
@app.route('/api/learning_progress')
def get_learning_progress():
    if 'user' not in session:
        return jsonify({'error': 'Không có quyền truy cập'}), 401
    
    username = session['user']
    
    # Lấy thông tin lớp được phép truy cập
    allowed_classes = session.get('allowed_classes', [])
    
    # Đọc dữ liệu từ file JSON
    progress_data = load_learning_progress(username)
    
    # Tính toán thống kê từ dữ liệu
    stats = calculate_stats(progress_data, allowed_classes)
    
    # Chuẩn bị dữ liệu biểu đồ
    charts = prepare_chart_data(progress_data, allowed_classes)
    
    # Chuẩn bị lịch sử học tập
    history = prepare_learning_history(progress_data)
    
    return jsonify({
        'success': True,
        'stats': stats,
        'charts': charts,
        'history': history
    })

# API endpoint để cập nhật tiến trình học tập
@app.route('/api/update_learning_progress', methods=['POST'])
def update_learning_progress():
    if 'user' not in session:
        return jsonify({'error': 'Không có quyền truy cập'}), 401
    
    username = session['user']
    data = request.json
    
    # Kiểm tra dữ liệu đầu vào
    if not data or not isinstance(data, dict):
        return jsonify({'error': 'Dữ liệu không hợp lệ'}), 400
    
    # Lấy thông tin bài học
    class_id = data.get('class_id')
    subject = data.get('subject')
    book = data.get('book')
    lesson = data.get('lesson')
    duration = data.get('duration', 0)  # Thời gian học (phút)
    score = data.get('score')  # Điểm số (nếu có)
    
    if not all([class_id, subject, book, lesson]):
        return jsonify({'error': 'Thiếu thông tin bài học'}), 400
    
    # Đọc dữ liệu tiến trình hiện tại
    progress_data = load_learning_progress(username)
    
    # Kiểm tra bài học đã có trong danh sách đã hoàn thành chưa
    lesson_id = f"{class_id}_{subject}_{book}_{lesson}"
    existing_lesson = False
    
    for completed in progress_data.get("completed_lessons", []):
        if (completed["class_id"] == class_id and 
            completed["subject"] == subject and 
            completed["book"] == book and 
            completed["lesson"] == lesson):
            existing_lesson = True
            break
    
    # Nếu chưa có, thêm vào danh sách bài học đã hoàn thành
    if not existing_lesson:
        if "completed_lessons" not in progress_data:
            progress_data["completed_lessons"] = []
        
        progress_data["completed_lessons"].append({
            "class_id": class_id,
            "subject": subject,
            "book": book,
            "lesson": lesson,
            "completed_date": datetime.now().strftime("%Y-%m-%d")
        })
    
    # Thêm phiên học tập
    if "study_sessions" not in progress_data:
        progress_data["study_sessions"] = []
    
    progress_data["study_sessions"].append({
        "class_id": class_id,
        "subject": subject,
        "book": book,
        "lesson": lesson,
        "duration": duration,
        "date": datetime.now().strftime("%Y-%m-%d")
    })
    
    # Thêm điểm số nếu có
    if score is not None:
        if "scores" not in progress_data:
            progress_data["scores"] = []
        
        progress_data["scores"].append({
            "class_id": class_id,
            "subject": subject,
            "book": book,
            "lesson": lesson,
            "score": score,
            "date": datetime.now().strftime("%Y-%m-%d")
        })
    
    # Lưu dữ liệu tiến trình
    save_learning_progress(username, progress_data)
    
    return jsonify({'success': True, 'message': 'Cập nhật tiến trình học tập thành công'})

@app.route('/api/submit_exercises', methods=['POST'])
def submit_exercises():
    if 'user' not in session:
        return jsonify({'error': 'Không có quyền truy cập'}), 401
    
    data = request.json
    
    class_id = data.get('class_id')
    subject = data.get('subject')
    book = data.get('book')
    lesson = data.get('lesson')
    score = data.get('score')
    answers_detail = data.get('answers_detail', [])  # Chi tiết câu trả lời
    
    if not all([class_id, subject, book, lesson, score is not None]):
        return jsonify({'error': 'Thiếu thông tin bài tập'}), 400
    
    try:
        # Cập nhật tiến trình học tập với chi tiết câu trả lời
        username = session['user']
        update_learning_progress_with_detail(
            username, class_id, subject, book, lesson, score, answers_detail
        )
        
        return jsonify({'success': True, 'message': 'Đã lưu điểm bài tập'})
    
    except Exception as e:
        return jsonify({'error': f'Lỗi: {str(e)}'}), 500

@app.route('/lesson_detail')
def lesson_detail():
    if 'user' not in session:
        return redirect(url_for('login'))
    
    username = session['user']
    class_id = request.args.get('class')
    subject = request.args.get('subject')
    book = request.args.get('book')
    lesson = request.args.get('lesson')
    attempt_id = request.args.get('attempt_id')  # ID của lần làm bài cụ thể (nếu có)
    
    # Chuyển đổi tên môn học để hiển thị
    subject_name = ""
    if subject == 'math':
        subject_name = 'Toán'
    elif subject == 'math_exercises':
        subject_name = 'Bài tập Toán'
    elif subject == 'vietnamese':
        subject_name = 'Tiếng Việt'
    
    lesson_title = f"Lớp {class_id} - Tập {book} - Bài {lesson}"
    
    # Lấy dữ liệu tiến trình
    progress_data = load_learning_progress(username)
    
    # Lấy toàn bộ lịch sử làm bài cho bài học này
    all_attempts = []
    if "score_history" in progress_data:
        for item in progress_data["score_history"]:
            if (item.get("class_id") == int(class_id) and 
                item.get("subject") == subject and 
                item.get("book") == int(book) and 
                item.get("lesson") == int(lesson)):
                all_attempts.append(item)
        
        # Sắp xếp theo thời gian, mới nhất lên đầu
        all_attempts.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    
    # Nếu có ID lần làm bài cụ thể, hiển thị lần đó
    # Nếu không, hiển thị lần mới nhất
    current_attempt = None
    if attempt_id and all_attempts:
        for attempt in all_attempts:
            if attempt.get("attempt_id") == attempt_id:
                current_attempt = attempt
                break
    
    if not current_attempt and all_attempts:
        current_attempt = all_attempts[0]  # Lần mới nhất
    
    # Lấy thông tin chi tiết để hiển thị
    score = 0
    answers_detail = []
    if current_attempt:
        score = current_attempt.get("score", 0)
        answers_detail = current_attempt.get("answers_detail", [])
    
    return render_template('lesson_detail.html', 
                          username=username,
                          subject_name=subject_name,
                          lesson_title=lesson_title,
                          score=score,
                          answers_detail=answers_detail,
                          all_attempts=all_attempts,
                          current_attempt=current_attempt)

# Thêm API endpoint để đồng bộ dữ liệu tiến trình học tập cho tất cả người dùng
@app.route('/api/sync_learning_progress', methods=['POST'])
def sync_learning_progress():
    if 'user' not in session or session['user'] != 'admin':
        return jsonify({'error': 'Không có quyền truy cập'}), 401
    
    try:
        # Đọc danh sách người dùng
        with open('users.json', 'r', encoding='utf-8') as file:
            users = json.load(file)
        
        # Đọc dữ liệu tiến trình học tập
        try:
            with open('learning_progress.json', 'r', encoding='utf-8') as file:
                progress_data = json.load(file)
        except FileNotFoundError:
            progress_data = {}
        
        # Đồng bộ người dùng
        for username in users:
            if username not in progress_data:
                progress_data[username] = {
                    "completed_lessons": [],
                    "scores": [],
                    "study_sessions": []
                }
        
        # Xóa tiến trình của người dùng không tồn tại
        users_to_remove = []
        for username in progress_data:
            if username not in users:
                users_to_remove.append(username)
        
        for username in users_to_remove:
            del progress_data[username]
        
        # Lưu dữ liệu tiến trình
        with open('learning_progress.json', 'w', encoding='utf-8') as file:
            json.dump(progress_data, file, indent=4, ensure_ascii=False)
        
        return jsonify({
            'success': True, 
            'message': f'Đã đồng bộ dữ liệu tiến trình học tập cho {len(users)} người dùng. Đã xóa {len(users_to_remove)} người dùng không tồn tại.'
        })
    
    except Exception as e:
        return jsonify({'error': f'Lỗi: {str(e)}'}), 500

# Thêm vào file app.py một API endpoint để thêm dữ liệu study_sessions mẫu
@app.route('/api/add_sample_study_time', methods=['GET'])
def add_sample_study_time():
    if 'user' not in session:
        return jsonify({'error': 'Không có quyền truy cập'}), 401
    
    username = session['user']
    
    # Đọc dữ liệu tiến trình hiện tại
    progress_data = load_learning_progress(username)
    
    # Thêm phiên học tập mẫu
    if "study_sessions" not in progress_data:
        progress_data["study_sessions"] = []
    
    # Thêm một phiên học ngày hôm nay (để xuất hiện trong thống kê tuần này)
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Thêm thời gian học cho các bài học đã hoàn thành
    for completed in progress_data.get("completed_lessons", []):
        # Tạo một phiên học mẫu cho mỗi bài học đã hoàn thành
        study_session = {
            "class_id": completed["class_id"],
            "subject": completed["subject"],
            "book": completed["book"],
            "lesson": completed["lesson"],
            "duration": 30,  # 30 phút
            "date": today
        }
        
        progress_data["study_sessions"].append(study_session)
    
    # Lưu dữ liệu tiến trình
    save_learning_progress(username, progress_data)
    
    return jsonify({'success': True, 'message': 'Đã thêm dữ liệu mẫu thời gian học'})
     
@app.route('/api/update_study_time', methods=['POST'])
def update_study_time():
    if 'user' not in session:
        return jsonify({'error': 'Không có quyền truy cập'}), 401
    
    try:
        data = request.json
        username = session['user']
        
        # Debug log
        print(f"Cập nhật thời gian học cho {username}: {data}")
        
        class_id = data.get('class_id')
        subject = data.get('subject')
        book = data.get('book')
        lesson = data.get('lesson')
        duration = data.get('duration', 0)  # Thời gian học tính bằng phút
        
        # Chuyển đổi kiểu dữ liệu
        try:
            class_id = int(class_id)
            book = int(book)
            lesson = int(lesson)
            duration = int(duration)
        except (ValueError, TypeError):
            print(f"Lỗi chuyển đổi dữ liệu: {class_id}, {book}, {lesson}, {duration}")
            return jsonify({'error': 'Dữ liệu không hợp lệ'}), 400
        
        # Kiểm tra dữ liệu đầu vào
        if not all([class_id, subject, book, lesson]):
            return jsonify({'error': 'Thiếu thông tin bài học'}), 400
        
        if duration <= 0:
            print("Thời gian học không hợp lệ hoặc bằng 0")
            return jsonify({'error': 'Thời gian học không hợp lệ'}), 400
        
        # Đọc dữ liệu tiến trình
        progress_data = load_learning_progress(username)
        
        # Kiểm tra phần study_sessions tồn tại
        if "study_sessions" not in progress_data:
            progress_data["study_sessions"] = []
        
        # Kiểm tra có phiên học tập trong ngày không
        today = datetime.now().strftime("%Y-%m-%d")
        current_session = None
        
        for i, session_item in enumerate(progress_data["study_sessions"]):
            if (session_item.get("class_id") == class_id and 
                session_item.get("subject") == subject and 
                session_item.get("book") == book and 
                session_item.get("lesson") == lesson and
                session_item.get("date") == today):
                current_session = session_item
                session_index = i
                break
        
        # Log
        if current_session:
            print(f"Tìm thấy phiên học hiện tại: {current_session}")
            current_session["duration"] += duration
            print(f"Đã cập nhật thời gian: {current_session['duration']} phút")
        else:
            # Tạo phiên học tập mới
            new_session = {
                "class_id": class_id,
                "subject": subject,
                "book": book,
                "lesson": lesson,
                "duration": duration,
                "date": today
            }
            progress_data["study_sessions"].append(new_session)
            print(f"Đã tạo phiên học mới: {new_session}")
        
        # Lưu dữ liệu tiến trình
        save_result = save_learning_progress(username, progress_data)
        
        if save_result:
            return jsonify({'success': True, 'message': 'Đã cập nhật thời gian học'})
        else:
            return jsonify({'error': 'Lỗi khi lưu dữ liệu'}), 500
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Lỗi trong update_study_time: {str(e)}")
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/upload_image', methods=['POST'])
def upload_image():
    if 'user' not in session or session['user'] != 'admin':
        return jsonify({'error': 'Không có quyền truy cập'}), 401
    
    # Kiểm tra có file trong request không
    if 'image' not in request.files:
        return jsonify({'error': 'Không có file được tải lên'}), 400
    
    file = request.files['image']
    
    # Kiểm tra file có tên không
    if file.filename == '':
        return jsonify({'error': 'Không có file được chọn'}), 400
    
    # Kiểm tra file có đuôi hợp lệ không
    if file and allowed_file(file.filename):
        # Lấy đường dẫn thư mục từ request (nếu có)
        subfolder = request.form.get('subfolder', '')
        
        # Đảm bảo tên file an toàn
        filename = secure_filename(file.filename)
        
        # Tạo đường dẫn đầy đủ
        if subfolder:
            # Đảm bảo tên thư mục con an toàn
            subfolder = secure_filename(subfolder)
            upload_folder = os.path.join('static', 'images', subfolder)
            # Tạo thư mục nếu chưa tồn tại
            os.makedirs(upload_folder, exist_ok=True)
            file_path = os.path.join(upload_folder, filename)
            url_path = os.path.join(subfolder, filename)
        else:
            upload_folder = os.path.join('static', 'images')
            # Tạo thư mục nếu chưa tồn tại
            os.makedirs(upload_folder, exist_ok=True)
            file_path = os.path.join(upload_folder, filename)
            url_path = filename
        
        # Lưu file
        file.save(file_path)
        
        # Trả về URL của file đã tải lên
        return jsonify({
            'success': True,
            'message': 'Tải lên thành công',
            'image_url': url_path
        })
    
    return jsonify({'error': 'File không hợp lệ'}), 400

# Lấy thông tin lớp được phép
@app.route('/get_permissions')
def get_permissions():
    if 'user' not in session:
        return jsonify({'error': 'Không có quyền truy cập'}), 401
    return jsonify({'allowed_classes': session['allowed_classes']})

# Kiểm tra quyền truy cập
@app.route('/check_access', methods=['POST'])
def check_access():
    if 'user' not in session:
        return jsonify({'allowed': False}), 401
    
    data = request.json
    class_id = int(data.get('class_id', 0))
    
    if class_id in session['allowed_classes']:
        return jsonify({'allowed': True})
    else:
        return jsonify({'allowed': False})

# Đăng xuất
@app.route('/logout')
def logout():
    session.pop('user', None)
    session.pop('allowed_classes', None)
    return redirect(url_for('login'))

if __name__ == '__main__':
    # Tạo cấu trúc thư mục bài học khi khởi động
    initialize_lesson_structure()

    # Tạo các thư mục cần thiết khi khởi động
    lessons_dir = os.path.join('templates', 'lessons')
    if not os.path.exists(lessons_dir):
        os.makedirs(lessons_dir)
    
    # Tạo thư mục cho các lớp
    for class_id in range(1, 6):  # Lớp 1-5
        class_dir = os.path.join(lessons_dir, f'class_{class_id}')
        if not os.path.exists(class_dir):
            os.makedirs(class_dir)
        
        # Tạo thư mục cho các môn học
        for subject in ['math', 'math_exercises', 'vietnamese']:
            subject_dir = os.path.join(class_dir, subject)
            if not os.path.exists(subject_dir):
                os.makedirs(subject_dir)
            
            # Tạo thư mục cho các tập sách
            for book_id in range(1, 3):  # Tập 1-2
                book_dir = os.path.join(subject_dir, f'book_{book_id}')
                if not os.path.exists(book_dir):
                    os.makedirs(book_dir)
    
    app.run(host='0.0.0.0', port=5000, debug=True)
    