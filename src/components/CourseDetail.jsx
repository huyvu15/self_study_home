import { useState, useEffect } from 'react';
import './CourseDetail.css';

function CourseDetail({ courseName, onBack }) {
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [courseData, setCourseData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load course data
    useEffect(() => {
        loadCourseData();
    }, [courseName]);

    const loadCourseData = async () => {
        setLoading(true);
        try {
            const { api } = await import('../services/api');
            const data = await api.getCourseData(courseName);
            setCourseData(data);
            if (data.lessons && data.lessons.length > 0) {
                setSelectedLesson(data.lessons[0]);
            }
        } catch (error) {
            console.error('Load course error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">⏳ Đang tải khóa học...</div>;
    }

    if (!courseData) {
        return <div className="error">❌ Không tìm thấy khóa học</div>;
    }

    return (
        <div className="course-detail">
            {/* Header */}
            <div className="course-header">
                <button className="btn-back" onClick={onBack}>
                    ← Quay lại
                </button>
                <div className="course-info">
                    <h1>{courseData.courseName}</h1>
                    <p>{courseData.courseDesc}</p>
                </div>
            </div>

            <div className="course-layout">
                {/* Lesson List Sidebar */}
                <div className="lesson-sidebar">
                    <h3>Danh sách bài học ({courseData.lessons.length})</h3>
                    <div className="lesson-list">
                        {courseData.lessons.map((lesson) => (
                            <div
                                key={lesson.index}
                                className={`lesson-item ${selectedLesson?.index === lesson.index ? 'active' : ''}`}
                                onClick={() => setSelectedLesson(lesson)}
                            >
                                <div className="lesson-number">Bài {lesson.index}</div>
                                <div className="lesson-name">{lesson.lessonName}</div>
                                {selectedLesson?.index === lesson.index && (
                                    <div className="lesson-playing">▶</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Video Player & Materials */}
                <div className="lesson-content">
                    {selectedLesson && (
                        <>
                                <div className="lesson-title">
                                <h2>Bài {selectedLesson.index}. {selectedLesson.lessonName}</h2>
                            </div>

                            {/* Video Player */}
                            {selectedLesson.videoEmbedUrl ? (
                                <div className="video-wrapper">
                                    <iframe
                                        src={selectedLesson.videoEmbedUrl}
                                        className="video-player"
                                        allow="autoplay; encrypted-media"
                                        allowFullScreen
                                        title={selectedLesson.lessonName}
                                    />
                                </div>
                            ) : (
                                <div className="no-video">
                                    Chưa có video cho bài này
                                </div>
                            )}

                            {/* Materials */}
                            {selectedLesson.materialUrl && (
                                <div className="materials">
                                    <h3>Tài liệu học tập</h3>
                                    <a
                                        href={selectedLesson.materialUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-download"
                                    >
                                        Tải tài liệu
                                    </a>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CourseDetail;
