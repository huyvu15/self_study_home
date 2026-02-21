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
    const [roomForm, setRoomForm] = useState({ room_id: '', room_name: '', meet_link: '', max_cam: 20, type: 'Focus', status: 'open', thumbnail_url: '', description: '', tagline: '', category: '' });
    const [roomSaveLoading, setRoomSaveLoading] = useState(false);
    const [roomSearch, setRoomSearch] = useState('');
    const [roomFilter, setRoomFilter] = useState('all'); // all | basic | advanced | indepth
    const [featuredRoomIndex, setFeaturedRoomIndex] = useState(0);

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
        setRoomForm({ room_id: '', room_name: '', meet_link: 'https://meet.google.com/new', max_cam: 20, type: 'Focus', status: 'open', thumbnail_url: '', description: '', tagline: '', category: '' });
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
            thumbnail_url: room.thumbnail_url || '',
            description: room.description || '',
            tagline: room.tagline || '',
            category: room.category || '',
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
                    thumbnail_url: roomForm.thumbnail_url || '',
                    description: roomForm.description || '',
                    tagline: roomForm.tagline || '',
                    category: roomForm.category || '',
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
                    thumbnail_url: roomForm.thumbnail_url != null ? roomForm.thumbnail_url : undefined,
                    description: roomForm.description != null ? roomForm.description : undefined,
                    tagline: roomForm.tagline != null ? roomForm.tagline : undefined,
                    category: roomForm.category != null ? roomForm.category : undefined,
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

    const roomTypeToCategory = (type) => {
        const t = (type || '').toLowerCase();
        if (t === 'timer') return 'advanced';
        if (t === 'relax') return 'indepth';
        return 'basic';
    };
    const filteredRooms = useMemo(() => {
        let list = [...rooms];
        const q = (roomSearch || '').toLowerCase().trim();
        if (q) {
            list = list.filter((r) =>
                (r.room_name || '').toLowerCase().includes(q) ||
                (r.room_id || '').toLowerCase().includes(q) ||
                (r.type || '').toLowerCase().includes(q)
            );
        }
        if (roomFilter !== 'all') {
            list = list.filter((r) => roomTypeToCategory(r.type) === roomFilter);
        }
        return list;
    }, [rooms, roomSearch, roomFilter]);

    useEffect(() => {
        if (currentView === 'study-rooms' && filteredRooms.length > 0 && featuredRoomIndex >= filteredRooms.length) {
            setFeaturedRoomIndex(0);
        }
    }, [currentView, filteredRooms.length, featuredRoomIndex]);

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

    const breadcrumb = currentView === 'study-rooms' ? '' : currentView === 'schedule' ? 'Lịch học' : 'Trang chủ';

    return (
        <div className="lms-app">
            <header className="lms-header">
                <div className="lms-header-inner">
                    <a href="#" className="lms-logo" onClick={(e) => { e.preventDefault(); handleBackToCourses(); }}>
                        <img src="/logo.png" alt="Adine" className="lms-logo-img" onError={(e) => { e.target.style.display = 'none'; if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'inline'; }} />
                        <span className="lms-logo-fallback" style={{ display: 'none' }}>Adine</span>
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
                    <div className="lms-rooms lms-rooms-ui">
                        <div className="lms-rooms-header-strip">
                            <div className="lms-rooms-header-left">
                                <div className="lms-rooms-search-wrap">
                                    <span className="lms-rooms-search-icon">🔍</span>
                                    <input
                                        type="search"
                                        className="lms-rooms-search"
                                        placeholder="Tìm phòng học..."
                                        value={roomSearch}
                                        onChange={(e) => setRoomSearch(e.target.value)}
                                    />
                                    <button type="button" className="lms-rooms-search-btn" title="Tìm kiếm">✓</button>
                                    <button type="button" className="lms-rooms-filter-btn" title="Bộ lọc">☰</button>
                                </div>
                            </div>
                        </div>

                        <div className="lms-rooms-filters">
                            <span className="lms-rooms-filters-label">Lọc phòng:</span>
                            {[
                                { id: 'all', label: 'Tất cả' },
                                { id: 'basic', label: 'Cơ bản' },
                                { id: 'advanced', label: 'Nâng cao' },
                                { id: 'indepth', label: 'Chuyên sâu' },
                            ].map((f) => (
                                <button
                                    key={f.id}
                                    type="button"
                                    className={`lms-rooms-filter-tab ${roomFilter === f.id ? 'active' : ''}`}
                                    onClick={() => setRoomFilter(f.id)}
                                >
                                    {f.label}
                                </button>
                            ))}
                            {isTeacher && (
                                <button type="button" className="lms-btn-primary lms-rooms-add-btn" onClick={openAddRoom}>
                                    + Thêm phòng
                                </button>
                            )}
                        </div>

                        {filteredRooms.length === 0 ? (
                            <div className="lms-empty">
                                <div className="lms-empty-icon">🏠</div>
                                <h2>Chưa có phòng</h2>
                                <p>{ isTeacher ? 'Bấm "Thêm phòng" để tạo phòng học.' : 'Liên hệ admin để được mở phòng học.' }</p>
                                {isTeacher && (
                                    <button type="button" className="lms-btn-primary" style={{ marginTop: 16 }} onClick={openAddRoom}>+ Thêm phòng</button>
                                )}
                            </div>
                        ) : (
                            <>
                                <section className="lms-rooms-featured">
                                    <div className="lms-rooms-carousel">
                                        <button
                                            type="button"
                                            className="lms-carousel-arrow prev"
                                            onClick={() => setFeaturedRoomIndex((i) => (i - 1 + filteredRooms.length) % filteredRooms.length)}
                                            aria-label="Trước"
                                        >
                                            ‹
                                        </button>
                                        <div className="lms-carousel-inner">
                                            {(() => {
                                                const feat = filteredRooms[featuredRoomIndex];
                                                if (!feat) return null;
                                                const catLabel = roomFilter === 'all' ? (feat.type === 'Timer' ? 'NÂNG CAO' : feat.type === 'Relax' ? 'CHUYÊN SÂU' : 'CƠ BẢN') : (roomFilter === 'basic' ? 'CƠ BẢN' : roomFilter === 'advanced' ? 'NÂNG CAO' : 'CHUYÊN SÂU');
                                                return (
                                                    <>
                                                        <div className="lms-carousel-bg" style={feat.thumbnail_url ? { backgroundImage: `url(${feat.thumbnail_url})`, backgroundSize: 'cover', opacity: 0.5 } : {}} />
                                                        <div className="lms-carousel-content">
                                                            <div className="lms-carousel-left">
                                                                <span className="lms-carousel-tag">{ catLabel }</span>
                                                                <h3 className="lms-carousel-title">{ feat.room_name }</h3>
                                                                <p className="lms-carousel-tagline">{ feat.tagline || (feat.meet_link ? 'Tham gia phòng học trực tuyến.' : 'Đợi đỗ đại học rồi mới được nghỉ ngơi.') }</p>
                                                                <p className="lms-carousel-stats">{ feat.count ?? 0 } thành viên · { feat.count ?? 0 } đang học</p>
                                                                <div className="lms-carousel-btns">
                                                                    <button type="button" className="lms-btn-join-carousel" onClick={() => handleJoinRoom(feat)} disabled={feat.count >= (feat.max_cam ?? 999)}>
                                                                        Tham gia ngay
                                                                    </button>
                                                                    <button type="button" className="lms-btn-detail-carousel" onClick={() => handleJoinRoom(feat)}>
                                                                        Xem chi tiết
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="lms-carousel-avatars">
                                                                <div className="lms-carousel-av lms-carousel-av-logo">
                                                                    <img src="/logo.png" alt="Adine" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling?.classList.add('show'); }} />
                                                                    <span className="lms-carousel-av-fallback">A</span>
                                                                </div>
                                                                <div className="lms-carousel-av lms-carousel-av-logo">
                                                                    <img src="/logo.png" alt="" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling?.classList.add('show'); }} />
                                                                    <span className="lms-carousel-av-fallback">A</span>
                                                                </div>
                                                                <div className="lms-carousel-av lms-carousel-av-logo">
                                                                    <img src="/logo.png" alt="" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling?.classList.add('show'); }} />
                                                                    <span className="lms-carousel-av-fallback">A</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                        <button
                                            type="button"
                                            className="lms-carousel-arrow next"
                                            onClick={() => setFeaturedRoomIndex((i) => (i + 1) % filteredRooms.length)}
                                            aria-label="Sau"
                                        >
                                            ›
                                        </button>
                                    </div>
                                </section>

                                <h2 className="lms-rooms-list-title">Danh sách tất cả phòng trong khu vực này</h2>
                                <div className="lms-rooms-grid lms-rooms-grid-cards">
                                    {filteredRooms.map((room) => (
                                        <article key={room.room_id} className="lms-room-card lms-room-card-new">
                                            <div className="lms-room-card-thumb">
                                                {room.thumbnail_url ? (
                                                    <img src={room.thumbnail_url} alt="" className="lms-room-card-thumb-img" />
                                                ) : (
                                                    <div className="lms-room-card-thumb-placeholder" />
                                                )}
                                            </div>
                                            <div className="lms-room-card-body">
                                                {isTeacher && (
                                                    <div className="lms-room-actions">
                                                        <button type="button" className="lms-btn-icon" onClick={(e) => { e.stopPropagation(); openEditRoom(room); }} title="Sửa">✏️</button>
                                                        <button type="button" className="lms-btn-icon danger" onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room); }} title="Xóa">🗑️</button>
                                                    </div>
                                                )}
                                                <h3>{ room.room_name }</h3>
                                                <p className="lms-room-card-desc">{ room.description || room.tagline || (room.meet_link ? 'Tham gia Meet để học cùng nhau.' : 'Phòng tự học.') }</p>
                                                <p className="lms-room-card-stats">{ room.count ?? 0 } thành viên · { room.count ?? 0 } đang học</p>
                                                <span className="lms-room-card-tag">{ (room.category && room.category.toUpperCase()) || (room.type === 'Timer' ? 'NÂNG CAO' : room.type === 'Relax' ? 'CHUYÊN SÂU' : 'CƠ BẢN') }</span>
                                            </div>
                                            <button
                                                type="button"
                                                className="lms-btn-join lms-btn-join-card"
                                                onClick={() => handleJoinRoom(room)}
                                                disabled={room.count >= (room.max_cam ?? 999)}
                                            >
                                                {room.count >= (room.max_cam ?? 999) ? 'Đã đầy' : 'Tham gia ngay'}
                                            </button>
                                        </article>
                                    ))}
                                </div>
                            </>
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
                                    <label>Ảnh phòng (URL)</label>
                                    <input
                                        type="url"
                                        className="lms-input"
                                        value={roomForm.thumbnail_url}
                                        onChange={(e) => handleRoomFormChange('thumbnail_url', e.target.value)}
                                        placeholder="https://... hoặc link Drive ảnh"
                                    />
                                </div>
                                <div className="lms-form-group">
                                    <label>Mô tả</label>
                                    <textarea
                                        className="lms-input"
                                        rows={2}
                                        value={roomForm.description}
                                        onChange={(e) => handleRoomFormChange('description', e.target.value)}
                                        placeholder="Mô tả ngắn về phòng học"
                                    />
                                </div>
                                <div className="lms-form-group">
                                    <label>Tagline</label>
                                    <input
                                        type="text"
                                        className="lms-input"
                                        value={roomForm.tagline}
                                        onChange={(e) => handleRoomFormChange('tagline', e.target.value)}
                                        placeholder="VD: Đợi đỗ đại học rồi mới được nghỉ ngơi."
                                    />
                                </div>
                                <div className="lms-form-group">
                                    <label>Danh mục (Cơ bản / Nâng cao / Chuyên sâu)</label>
                                    <input
                                        type="text"
                                        className="lms-input"
                                        value={roomForm.category}
                                        onChange={(e) => handleRoomFormChange('category', e.target.value)}
                                        placeholder="VD: Cơ bản"
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
                    <span>Adine — Lớp học trực tuyến</span>
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
