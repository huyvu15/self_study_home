import { useState, useEffect, useMemo } from 'react';
import { api } from './services/api';
import Auth from './components/Auth';
import CourseDetail from './components/CourseDetail';
import Loading from './components/Loading';
import Profile from './components/Profile';
import Schedule from './components/Schedule';
import './LMSApp.css';

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'A → Z' },
  { value: 'name-desc', label: 'Z → A' },
  { value: 'newest', label: 'Mới nhất' },
];

function LMSApp() {
    const [user, setUser] = useState(null);
    const [isTeacher, setIsTeacher] = useState(false);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentView, setCurrentView] = useState('courses');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('name-asc');
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [roomModal, setRoomModal] = useState(null);
    const [roomForm, setRoomForm] = useState({ room_id: '', room_name: '', meet_link: '', max_cam: 20, type: 'Focus', status: 'open' });
    const [roomSaveLoading, setRoomSaveLoading] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('lms_user');
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                checkTeacherStatus(parsedUser.email);
                loadCourses();
                loadRooms();
            } catch (e) {
                localStorage.removeItem('lms_user');
            }
        }
    }, []);

    const checkTeacherStatus = async (email) => {
        try {
            const result = await api.checkIsTeacher(email);
            setIsTeacher(result === true);
        } catch (error) {
            console.error('Check teacher error:', error);
        }
    };

    const loadCourses = async () => {
        setLoading(true);
        try {
            const data = await api.getHomeData();
            setCourses(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Load courses error:', error);
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    const loadRooms = async () => {
        try {
            const data = await api.getRooms();
            setRooms(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Load rooms error:', error);
            setRooms([]);
        }
    };

    const handleLoginSuccess = (userData) => {
        setUser(userData);
        checkTeacherStatus(userData.email);
        loadCourses();
    };

    const handleProfileUpdated = (updatedProfile) => {
        if (updatedProfile) {
            setUser((prev) => ({ ...prev, ...updatedProfile }));
            const stored = localStorage.getItem('lms_user');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    localStorage.setItem('lms_user', JSON.stringify({ ...parsed, ...updatedProfile }));
                } catch (_) {}
            }
        }
    };

    const handleLogout = () => {
        setUserMenuOpen(false);
        localStorage.removeItem('lms_user');
        setUser(null);
        setIsTeacher(false);
        setCourses([]);
    };

    const handleDeleteCourse = async (courseName) => {
        if (!confirm(`Xóa khóa học "${courseName}"? Tất cả bài học sẽ bị xóa và không thể hoàn tác.`)) return;
        try {
            const result = await api.deleteCourse(courseName);
            if (result.success) {
                loadCourses();
            }
            alert(result.success ? 'Đã xóa.' : result.message);
        } catch (error) {
            alert('Lỗi: ' + error.message);
        }
    };

    const handleViewCourse = (courseName) => {
        setSelectedCourse(courseName);
        setCurrentView('course-detail');
    };

    const handleViewStudyRooms = () => {
        setCurrentView('study-rooms');
        loadRooms();
    };

    const handleBackToCourses = () => {
        setCurrentView('courses');
        setSelectedCourse(null);
    };

    const handleJoinRoom = async (room) => {
        try {
            const currentUser = user?.email ? user : (() => {
                try {
                    const stored = localStorage.getItem('lms_user');
                    return stored ? JSON.parse(stored) : null;
                } catch { return null; }
            })();
            if (!currentUser?.email) {
                alert('Vui lòng đăng nhập lại.');
                return;
            }
            const result = await api.joinRoom(room.room_id, currentUser);
            if (result.success && result.meetLink) {
                window.open(result.meetLink, '_blank');
            } else if (result && !result.success) {
                alert(result.message || 'Không thể tham gia phòng');
            }
        } catch (error) {
            console.error('Join room error:', error);
            alert('Lỗi: ' + (error?.message || error));
        }
    };

    const openAddRoom = () => {
        setRoomForm({ room_id: '', room_name: '', meet_link: 'https://meet.google.com/new', max_cam: 20, type: 'Focus', status: 'open' });
        setRoomModal('add');
    };

    const openEditRoom = (room) => {
        setRoomForm({
            room_id: room.room_id,
            room_name: room.room_name || '',
            meet_link: room.meet_link || '',
            max_cam: room.max_cam ?? 20,
            type: room.type || 'Focus',
            status: room.status || 'open',
        });
        setRoomModal('edit');
    };

    const closeRoomModal = () => {
        setRoomModal(null);
        setRoomSaveLoading(false);
    };

    const handleRoomFormChange = (field, value) => {
        setRoomForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSaveRoom = async (e) => {
        e.preventDefault();
        setRoomSaveLoading(true);
        try {
            if (roomModal === 'add') {
                const payload = {
                    room_name: roomForm.room_name,
                    meet_link: roomForm.meet_link,
                    max_cam: Number(roomForm.max_cam) || 20,
                    type: roomForm.type,
                    status: roomForm.status,
                    email: user?.email,
                };
                if (roomForm.room_id) payload.room_id = roomForm.room_id;
                const res = await api.addRoom(payload);
                if (res.success) {
                    closeRoomModal();
                    loadRooms();
                }
                alert(res.message || (res.success ? 'Đã thêm phòng.' : 'Lỗi'));
            } else {
                const res = await api.updateRoom({
                    roomId: roomForm.room_id,
                    room_name: roomForm.room_name,
                    meet_link: roomForm.meet_link,
                    max_cam: Number(roomForm.max_cam) || 20,
                    type: roomForm.type,
                    status: roomForm.status,
                    email: user?.email,
                });
                if (res.success) {
                    closeRoomModal();
                    loadRooms();
                }
                alert(res.message || (res.success ? 'Đã cập nhật.' : 'Lỗi'));
            }
        } catch (err) {
            alert('Lỗi: ' + (err?.message || err));
        } finally {
            setRoomSaveLoading(false);
        }
    };

    const handleDeleteRoom = async (room) => {
        if (!confirm('Xóa phòng "' + room.room_name + '"? Không thể hoàn tác.')) return;
        try {
            const res = await api.deleteRoom(room.room_id, user?.email);
            if (res.success) loadRooms();
            alert(res.message || (res.success ? 'Đã xóa.' : 'Lỗi'));
        } catch (err) {
            alert('Lỗi: ' + (err?.message || err));
        }
    };

    const filteredAndSortedCourses = useMemo(() => {
        let list = [...courses];
        const q = (searchQuery || '').toLowerCase().trim();
        if (q) {
            list = list.filter((c) =>
                (c.courseName || '').toLowerCase().includes(q) ||
                (c.courseDesc || '').toLowerCase().includes(q)
            );
        }
        if (sortBy === 'name-asc') list.sort((a, b) => (a.courseName || '').localeCompare(b.courseName || '', 'vi'));
        if (sortBy === 'name-desc') list.sort((a, b) => (b.courseName || '').localeCompare(a.courseName || '', 'vi'));
        if (sortBy === 'newest') list.reverse();
        return list;
    }, [courses, searchQuery, sortBy]);

    if (!user) {
        return <Auth onLoginSuccess={handleLoginSuccess} />;
    }

    if (currentView === 'course-detail' && selectedCourse) {
        return <CourseDetail courseName={selectedCourse} onBack={handleBackToCourses} />;
    }

    if (currentView === 'profile') {
        return (
            <Profile
                user={user}
                onBack={() => { setCurrentView('courses'); setUserMenuOpen(false); }}
                onProfileUpdated={handleProfileUpdated}
            />
        );
    }

    if (currentView === 'schedule') {
        return <Schedule onBack={() => setCurrentView('courses')} />;
    }

    const breadcrumb = currentView === 'study-rooms' ? 'Phòng tự học' : currentView === 'schedule' ? 'Lịch học' : 'Trang chủ';

    return (
        <div className="lms-app">
            <header className="lms-header">
                <div className="lms-header-inner">
                    <a href="#" className="lms-logo" onClick={(e) => { e.preventDefault(); handleBackToCourses(); }}>
                        <span className="lms-logo-icon">◉</span>
                        <span className="lms-logo-text">LMS</span>
                    </a>
                    <nav className="lms-nav">
                        <button type="button" className={`lms-nav-item ${currentView === 'courses' ? 'active' : ''}`} onClick={handleBackToCourses}>
                            Khóa học
                        </button>
                        <button type="button" className={`lms-nav-item ${currentView === 'study-rooms' ? 'active' : ''}`} onClick={handleViewStudyRooms}>
                            Phòng học
                        </button>
                        <button type="button" className={`lms-nav-item ${currentView === 'schedule' ? 'active' : ''}`} onClick={() => setCurrentView('schedule')}>
                            Lịch học
                        </button>
                    </nav>
                    <div className="lms-header-right">
                        {isTeacher && currentView === 'courses' && (
                            <span className="lms-badge-teacher">Giáo viên</span>
                        )}
                        <div className="lms-user-wrap">
                            <button type="button" className="lms-user-trigger" onClick={() => setUserMenuOpen(!userMenuOpen)} aria-expanded={userMenuOpen}>
                                <span className="lms-user-avatar">{ (user.name || user.email || '?').charAt(0).toUpperCase() }</span>
                                <span className="lms-user-name">{ user.name || user.email }</span>
                                <span className="lms-user-chevron">▾</span>
                            </button>
                            {userMenuOpen && (
                                <>
                                    <div className="lms-user-backdrop" onClick={() => setUserMenuOpen(false)} aria-hidden="true" />
                                    <div className="lms-user-menu">
                                        <div className="lms-user-menu-head">
                                            <strong>{ user.name || 'User' }</strong>
                                            <span className="lms-user-menu-email">{ user.email }</span>
                                        </div>
                                        <button type="button" className="lms-user-menu-item" onClick={() => { setCurrentView('profile'); setUserMenuOpen(false); }}>
                                            Hồ sơ cá nhân
                                        </button>
                                        <button type="button" className="lms-user-menu-item danger" onClick={handleLogout}>
                                            Đăng xuất
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="lms-main">
                <div className="lms-breadcrumb">
                    <span>{ breadcrumb }</span>
                </div>

                {currentView === 'courses' && (
                    <>
                        <section className="lms-dashboard">
                            <div className="lms-welcome">
                                <h1>Xin chào, { (user.name || user.email || '').split(/[\s@]/)[0] || 'bạn' }</h1>
                                <p>Chọn khóa học hoặc phòng tự học để bắt đầu.</p>
                            </div>
                            <div className="lms-stats">
                                <div className="lms-stat-card">
                                    <span className="lms-stat-value">{ courses.length }</span>
                                    <span className="lms-stat-label">Khóa học</span>
                                </div>
                                <div className="lms-stat-card">
                                    <span className="lms-stat-value">{ rooms.length || 0 }</span>
                                    <span className="lms-stat-label">Phòng học</span>
                                </div>
                            </div>
                        </section>

                        <section className="lms-toolbar">
                            <div className="lms-search-wrap">
                                <span className="lms-search-icon">🔍</span>
                                <input
                                    type="search"
                                    className="lms-search"
                                    placeholder="Tìm khóa học..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="lms-sort-wrap">
                                <label className="lms-sort-label">Sắp xếp:</label>
                                <select className="lms-sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                    {SORT_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                        </section>

                        {loading ? (
                            <div className="lms-loading">
                                <Loading text="Đang tải khóa học..." />
                            </div>
                        ) : courses.length === 0 ? (
                            <div className="lms-empty">
                                <div className="lms-empty-icon">📚</div>
                                <h2>Chưa có khóa học</h2>
                                <p>{ isTeacher ? 'Thêm khóa học đầu tiên để bắt đầu.' : 'Liên hệ giáo viên để được cấp quyền.' }</p>
                            </div>
                        ) : (
                            <div className="lms-course-grid">
                                {filteredAndSortedCourses.map((course) => (
                                    <article
                                        key={course.courseName}
                                        className="lms-course-card"
                                        onClick={() => handleViewCourse(course.courseName)}
                                    >
                                        <div className="lms-course-thumb-wrap">
                                            {course.thumbnailUrl ? (
                                                <img
                                                    src={course.thumbnailUrl.includes('/d/')
                                                        ? `https://drive.google.com/thumbnail?id=${course.thumbnailUrl.match(/\/d\/([^/]+)/)?.[1]}&sz=w400`
                                                        : course.thumbnailUrl
                                                    }
                                                    alt=""
                                                    className="lms-course-thumb"
                                                />
                                            ) : (
                                                <div className="lms-course-thumb-placeholder">📖</div>
                                            )}
                                            {isTeacher && (
                                                <div className="lms-course-actions">
                                                    <button type="button" className="lms-btn-icon" onClick={(e) => { e.stopPropagation(); alert('Chỉnh sửa: ' + course.courseName); }} title="Chỉnh sửa">✏️</button>
                                                    <button type="button" className="lms-btn-icon danger" onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.courseName); }} title="Xóa">🗑️</button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="lms-course-body">
                                            <h3 className="lms-course-title">{ course.courseName }</h3>
                                            <p className="lms-course-desc">{ course.courseDesc || 'Khám phá nội dung khóa học' }</p>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                        {currentView === 'courses' && searchQuery && filteredAndSortedCourses.length === 0 && courses.length > 0 && (
                            <p className="lms-no-results">Không tìm thấy khóa học phù hợp.</p>
                        )}
                    </>
                )}

                {currentView === 'study-rooms' && (
                    <div className="lms-rooms">
                        <div className="lms-rooms-head">
                            <h2 className="lms-section-title">Phòng tự học</h2>
                            {isTeacher && (
                                <button type="button" className="lms-btn-primary" onClick={openAddRoom}>
                                    + Thêm phòng
                                </button>
                            )}
                        </div>
                        {rooms.length === 0 ? (
                            <div className="lms-empty">
                                <div className="lms-empty-icon">🏠</div>
                                <h2>Chưa có phòng</h2>
                                <p>{ isTeacher ? 'Bấm "Thêm phòng" để tạo phòng học.' : 'Liên hệ admin để được mở phòng học.' }</p>
                                {isTeacher && (
                                    <button type="button" className="lms-btn-primary" style={{ marginTop: 16 }} onClick={openAddRoom}>
                                        + Thêm phòng
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="lms-rooms-grid">
                                {rooms.map((room) => (
                                    <div key={room.room_id} className="lms-room-card">
                                        {isTeacher && (
                                            <div className="lms-room-actions">
                                                <button type="button" className="lms-btn-icon" onClick={(e) => { e.stopPropagation(); openEditRoom(room); }} title="Sửa">✏️</button>
                                                <button type="button" className="lms-btn-icon danger" onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room); }} title="Xóa">🗑️</button>
                                            </div>
                                        )}
                                        <div className="lms-room-head">
                                            <h3>{ room.room_name }</h3>
                                            <span className="lms-room-type">{ room.type }</span>
                                        </div>
                                        <div className="lms-room-meta">
                                            <span>👥 { room.count ?? 0 } / { room.max_cam ?? 20 }</span>
                                        </div>
                                        <button
                                            type="button"
                                            className="lms-btn-join"
                                            onClick={() => handleJoinRoom(room)}
                                            disabled={room.count >= (room.max_cam ?? 999)}
                                        >
                                            {room.count >= (room.max_cam ?? 999) ? 'Đã đầy' : 'Tham gia'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {roomModal && (
                    <div className="lms-modal-backdrop" onClick={closeRoomModal}>
                        <div className="lms-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="lms-modal-head">
                                <h3>{ roomModal === 'add' ? 'Thêm phòng' : 'Sửa phòng' }</h3>
                                <button type="button" className="lms-modal-close" onClick={closeRoomModal} aria-label="Đóng">×</button>
                            </div>
                            <form onSubmit={handleSaveRoom} className="lms-modal-body">
                                {roomModal === 'add' && (
                                    <div className="lms-form-group">
                                        <label>Mã phòng (để trống sẽ tự tạo)</label>
                                        <input
                                            type="text"
                                            className="lms-input"
                                            value={roomForm.room_id}
                                            onChange={(e) => handleRoomFormChange('room_id', e.target.value)}
                                            placeholder="VD: R1"
                                        />
                                    </div>
                                )}
                                {roomModal === 'edit' && (
                                    <div className="lms-form-group">
                                        <label>Mã phòng</label>
                                        <input type="text" className="lms-input" value={roomForm.room_id} readOnly disabled />
                                    </div>
                                )}
                                <div className="lms-form-group">
                                    <label>Tên phòng *</label>
                                    <input
                                        type="text"
                                        className="lms-input"
                                        value={roomForm.room_name}
                                        onChange={(e) => handleRoomFormChange('room_name', e.target.value)}
                                        placeholder="VD: Phòng tự học 1"
                                        required
                                    />
                                </div>
                                <div className="lms-form-group">
                                    <label>Link Meet</label>
                                    <input
                                        type="url"
                                        className="lms-input"
                                        value={roomForm.meet_link}
                                        onChange={(e) => handleRoomFormChange('meet_link', e.target.value)}
                                        placeholder="https://meet.google.com/..."
                                    />
                                </div>
                                <div className="lms-form-group">
                                    <label>Số người tối đa</label>
                                    <input
                                        type="number"
                                        className="lms-input"
                                        min={1}
                                        max={100}
                                        value={roomForm.max_cam}
                                        onChange={(e) => handleRoomFormChange('max_cam', e.target.value)}
                                    />
                                </div>
                                <div className="lms-form-group">
                                    <label>Loại phòng</label>
                                    <select
                                        className="lms-input"
                                        value={roomForm.type}
                                        onChange={(e) => handleRoomFormChange('type', e.target.value)}
                                    >
                                        <option value="Focus">Focus</option>
                                        <option value="Timer">Timer</option>
                                        <option value="Relax">Relax</option>
                                        <option value="Collab">Collab</option>
                                    </select>
                                </div>
                                <div className="lms-form-group">
                                    <label>Trạng thái</label>
                                    <select
                                        className="lms-input"
                                        value={roomForm.status}
                                        onChange={(e) => handleRoomFormChange('status', e.target.value)}
                                    >
                                        <option value="open">Mở</option>
                                        <option value="closed">Đóng</option>
                                    </select>
                                </div>
                                <div className="lms-modal-footer">
                                    <button type="button" className="lms-btn-secondary" onClick={closeRoomModal}>Hủy</button>
                                    <button type="submit" className="lms-btn-primary" disabled={roomSaveLoading}>
                                        {roomSaveLoading ? 'Đang lưu...' : (roomModal === 'add' ? 'Thêm' : 'Cập nhật')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>

            <footer className="lms-footer">
                <div className="lms-footer-inner">
                    <span>LMS — Lớp học trực tuyến</span>
                    <span className="lms-footer-dot">·</span>
                    <button type="button" className="lms-footer-link" onClick={() => setCurrentView('schedule')}>Lịch học</button>
                    <span className="lms-footer-dot">·</span>
                    <button type="button" className="lms-footer-link" onClick={() => setCurrentView('profile')}>Hồ sơ</button>
                </div>
            </footer>
        </div>
    );
}

export default LMSApp;
