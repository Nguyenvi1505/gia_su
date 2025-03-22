document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra xem đang ở tab Tiến trình học tập hay không
    const progressTabLink = document.querySelector('.nav-menu li a[href="#progress"]');
    
    if (progressTabLink) {
        progressTabLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Ẩn tất cả các phần nội dung khác
            document.querySelectorAll('.main-content > div').forEach(div => {
                div.style.display = 'none';
            });
            
            // Hiển thị phần tiến trình học tập
            document.querySelector('.learning-progress-section').style.display = 'block';
            
            // Load dữ liệu tiến trình học tập
            loadLearningProgress();
        });
    }
    
    // Khởi tạo Chart.js nếu đang ở tab tiến trình học tập
    if (document.querySelector('.learning-progress-section')) {
        initializeCharts();
    }
});

// Hàm tải dữ liệu tiến trình học tập
function loadLearningProgress() {
    // Lấy username từ session
    const username = document.getElementById('username').textContent;
    
    // Gửi request để lấy dữ liệu tiến trình học tập
    fetch(`/api/learning_progress?username=${username}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateProgressStats(data.stats);
                updateProgressCharts(data.charts);
                updateLearningHistory(data.history);
            } else {
                console.error('Không thể tải dữ liệu tiến trình học tập');
            }
        })
        .catch(error => {
            console.error('Lỗi khi tải dữ liệu tiến trình học tập:', error);
        });
}

// Cập nhật thông tin thống kê
function updateProgressStats(stats) {
    // Cập nhật số bài học đã hoàn thành
    const lessonsCompletedElement = document.getElementById('lessons-completed');
    if (lessonsCompletedElement) {
        lessonsCompletedElement.textContent = `${stats.completed_lessons}/${stats.total_lessons}`;
        const completionPercentage = (stats.completed_lessons / stats.total_lessons) * 100;
        lessonsCompletedElement.closest('.stat-card').querySelector('.progress-bar').style.width = `${completionPercentage}%`;
        lessonsCompletedElement.closest('.stat-card').querySelector('.progress-bar').textContent = `${completionPercentage.toFixed(0)}%`;
        lessonsCompletedElement.closest('.stat-card').querySelector('.progress-bar').setAttribute('aria-valuenow', completionPercentage);
    }
    
    // Cập nhật điểm trung bình
    const averageScoreElement = document.getElementById('average-score');
    if (averageScoreElement) {
        averageScoreElement.textContent = `${stats.average_score.toFixed(1)}/10`;
        const scorePercentage = (stats.average_score / 10) * 100;
        averageScoreElement.closest('.stat-card').querySelector('.progress-bar').style.width = `${scorePercentage}%`;
        averageScoreElement.closest('.stat-card').querySelector('.progress-bar').textContent = `${scorePercentage.toFixed(0)}%`;
        averageScoreElement.closest('.stat-card').querySelector('.progress-bar').setAttribute('aria-valuenow', scorePercentage);
    }
    
    // Cập nhật thời gian học
    const studyTimeElement = document.getElementById('study-time');
    if (studyTimeElement) {
        // Hiển thị thời gian học theo định dạng giờ và phút
        const hours = Math.floor(stats.study_time);
        const minutes = Math.round((stats.study_time - hours) * 60);
        
        let timeDisplay = "";
        if (hours > 0) {
            timeDisplay += `${hours} giờ `;
        }
        if (minutes > 0 || hours === 0) {
            timeDisplay += `${minutes} phút`;
        }
        
        studyTimeElement.textContent = timeDisplay || "0 phút";
    }
    
    // Cập nhật chuỗi ngày học liên tục
    const streakDaysElement = document.getElementById('streak-days');
    if (streakDaysElement) {
        streakDaysElement.textContent = `${stats.streak_days} ngày`;
    }
}

// Khởi tạo biểu đồ
function initializeCharts() {
    // Biểu đồ tiến trình theo môn học
    const subjectProgressCtx = document.getElementById('subjectProgressChart').getContext('2d');
    window.subjectProgressChart = new Chart(subjectProgressCtx, {
        type: 'bar',
        data: {
            labels: ['Toán', 'Tiếng Việt', 'Bài tập Toán'],
            datasets: [{
                label: 'Phần trăm hoàn thành',
                data: [0, 0, 0],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(75, 192, 192, 0.7)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    // Biểu đồ thời gian học theo môn học
    const studyTimeCtx = document.getElementById('studyTimeChart').getContext('2d');
    window.studyTimeChart = new Chart(studyTimeCtx, {
        type: 'doughnut',
        data: {
            labels: ['Toán', 'Tiếng Việt', 'Bài tập Toán'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(75, 192, 192, 0.7)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Cập nhật biểu đồ tiến trình
function updateProgressCharts(chartData) {
    // Cập nhật biểu đồ tiến trình theo môn học
    if (window.subjectProgressChart) {
        window.subjectProgressChart.data.datasets[0].data = [
            chartData.math_completion,
            chartData.vietnamese_completion,
            chartData.math_exercises_completion
        ];
        window.subjectProgressChart.update();
    }
    
    // Cập nhật biểu đồ thời gian học theo môn học
    if (window.studyTimeChart) {
        window.studyTimeChart.data.datasets[0].data = [
            chartData.math_time,
            chartData.vietnamese_time,
            chartData.math_exercises_time
        ];
        window.studyTimeChart.update();
    }
}

// Cập nhật lịch sử học tập
function updateLearningHistory(history) {
    const historyContainer = document.getElementById('learning-history');
    if (historyContainer) {
        if (history.length === 0) {
            historyContainer.innerHTML = '<tr><td colspan="6" class="text-center">Chưa có dữ liệu</td></tr>';
            return;
        }
        
        let html = '';
        history.forEach(entry => {
            // Chuyển đổi tên môn học
            let subjectName = '';
            let subjectCode = entry.subject;
            if (entry.subject === 'math') {
                subjectName = 'Toán';
            } else if (entry.subject === 'vietnamese') {
                subjectName = 'Tiếng Việt';
            } else if (entry.subject === 'math_exercises') {
                subjectName = 'Bài tập Toán';
            }
            
            // Lấy thông tin bài học
            const classId = entry.class_id;
            const bookId = entry.book;
            const lessonId = entry.lesson;
            
            // Định dạng thời gian học
            let durationText = "0 phút";
            if (entry.duration) {
                if (entry.duration >= 60) {
                    const hours = Math.floor(entry.duration / 60);
                    const minutes = entry.duration % 60;
                    durationText = `${hours} giờ ${minutes > 0 ? minutes + ' phút' : ''}`;
                } else {
                    durationText = `${entry.duration} phút`;
                }
            }
            
            html += `
                <tr>
                    <td>${entry.date}</td>
                    <td>${subjectName}</td>
                    <td>${entry.lesson_title}</td>
                    <td>${durationText}</td>
                    <td>
                        ${entry.score !== null ? entry.score + '/10' : 'Chưa làm bài tập'}
                    </td>
                    <td>
                        ${entry.score !== null ? 
                        `<a href="/lesson_detail?class=${classId}&subject=${subjectCode}&book=${bookId}&lesson=${lessonId}" class="btn btn-sm btn-info">
                            <i class="fas fa-eye"></i> Chi tiết
                        </a>` : 
                        ''}
                    </td>
                </tr>
            `;
        });
        
        historyContainer.innerHTML = html;
    }
}