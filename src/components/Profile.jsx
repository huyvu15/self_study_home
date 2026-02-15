import { useState, useEffect } from 'react';
import { api } from '../services/api';
import './Profile.css';

const GENDER_OPTIONS = [
  { value: '', label: 'Chọn' },
  { value: 'Nam', label: 'Nam' },
  { value: 'Nữ', label: 'Nữ' },
  { value: 'Khác', label: 'Khác' }
];

function Profile({ user, onBack, onProfileUpdated }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [form, setForm] = useState({
    name: '',
    phone: '',
    avatarUrl: '',
    dateOfBirth: '',
    gender: '',
    classGrade: '',
    school: '',
    address: '',
    parentName: '',
    parentPhone: '',
    bio: '',
    studyGoals: ''
  });

  useEffect(() => {
    loadProfile();
  }, [user?.email]);

  const loadProfile = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getProfile(user.email);
      if (data) {
        setProfile(data);
        setForm({
          name: data.name || '',
          phone: data.phone || '',
          avatarUrl: data.avatarUrl || '',
          dateOfBirth: data.dateOfBirth || '',
          gender: data.gender || '',
          classGrade: data.classGrade || '',
          school: data.school || '',
          address: data.address || '',
          parentName: data.parentName || '',
          parentPhone: data.parentPhone || '',
          bio: data.bio || '',
          studyGoals: data.studyGoals || ''
        });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Không tải được hồ sơ' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.updateProfile({
        email: user.email,
        ...form
      });
      if (res?.success) {
        setMessage({ type: 'success', text: res.message || 'Đã lưu hồ sơ' });
        setProfile(res.profile || { ...profile, ...form });
        onProfileUpdated?.(res.profile || { ...profile, ...form });
      } else {
        setMessage({ type: 'error', text: res?.message || 'Lỗi lưu hồ sơ' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Lỗi kết nối' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">Đang tải hồ sơ...</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <button type="button" className="profile-back" onClick={onBack}>
            ← Quay lại
          </button>
          <h1>Hồ sơ cá nhân</h1>
          <p className="profile-email">{user?.email}</p>
        </div>

        {message.text && (
          <div className={`profile-alert profile-alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <section className="profile-section">
            <h2>Ảnh đại diện</h2>
            <div className="profile-avatar-wrap">
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="Avatar" className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {profile?.name?.charAt(0) || user?.name?.charAt(0) || '?'}
                </div>
              )}
              <input
                type="url"
                placeholder="URL ảnh đại diện"
                value={form.avatarUrl}
                onChange={(e) => handleChange('avatarUrl', e.target.value)}
                className="profile-input"
              />
            </div>
          </section>

          <section className="profile-section">
            <h2>Thông tin cơ bản</h2>
            <div className="profile-grid">
              <div className="profile-field">
                <label>Họ và tên</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="profile-input"
                  required
                />
              </div>
              <div className="profile-field">
                <label>Số điện thoại</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="profile-input"
                />
              </div>
              <div className="profile-field">
                <label>Ngày sinh</label>
                <input
                  type="text"
                  placeholder="VD: 01/01/2010"
                  value={form.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  className="profile-input"
                />
              </div>
              <div className="profile-field">
                <label>Giới tính</label>
                <select
                  value={form.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="profile-input"
                >
                  {GENDER_OPTIONS.map((o) => (
                    <option key={o.value || 'empty'} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="profile-section">
            <h2>Trường lớp</h2>
            <div className="profile-grid">
              <div className="profile-field">
                <label>Lớp</label>
                <input
                  type="text"
                  placeholder="VD: 10A1"
                  value={form.classGrade}
                  onChange={(e) => handleChange('classGrade', e.target.value)}
                  className="profile-input"
                />
              </div>
              <div className="profile-field profile-field-full">
                <label>Trường</label>
                <input
                  type="text"
                  placeholder="Tên trường"
                  value={form.school}
                  onChange={(e) => handleChange('school', e.target.value)}
                  className="profile-input"
                />
              </div>
            </div>
          </section>

          <section className="profile-section">
            <h2>Liên hệ &amp; Địa chỉ</h2>
            <div className="profile-grid">
              <div className="profile-field profile-field-full">
                <label>Địa chỉ</label>
                <input
                  type="text"
                  placeholder="Địa chỉ thường trú"
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="profile-input"
                />
              </div>
              <div className="profile-field">
                <label>Tên phụ huynh</label>
                <input
                  type="text"
                  value={form.parentName}
                  onChange={(e) => handleChange('parentName', e.target.value)}
                  className="profile-input"
                />
              </div>
              <div className="profile-field">
                <label>SĐT phụ huynh</label>
                <input
                  type="tel"
                  value={form.parentPhone}
                  onChange={(e) => handleChange('parentPhone', e.target.value)}
                  className="profile-input"
                />
              </div>
            </div>
          </section>

          <section className="profile-section">
            <h2>Giới thiệu &amp; Mục tiêu</h2>
            <div className="profile-field">
              <label>Giới thiệu ngắn</label>
              <textarea
                placeholder="Vài dòng về bản thân..."
                value={form.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                className="profile-input profile-textarea"
                rows={3}
              />
            </div>
            <div className="profile-field">
              <label>Mục tiêu học tập</label>
              <textarea
                placeholder="Mục tiêu trong năm học này..."
                value={form.studyGoals}
                onChange={(e) => handleChange('studyGoals', e.target.value)}
                className="profile-input profile-textarea"
                rows={3}
              />
            </div>
          </section>

          {profile?.lastLogin && (
            <p className="profile-meta">Đăng nhập lần cuối: {profile.lastLogin}</p>
          )}

          <div className="profile-actions">
            <button type="button" className="profile-btn profile-btn-secondary" onClick={onBack}>
              Hủy
            </button>
            <button type="submit" className="profile-btn profile-btn-primary" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu hồ sơ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Profile;
