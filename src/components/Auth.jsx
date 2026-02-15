import { useState } from 'react';
import { api } from '../services/api';
import './Auth.css';

function Auth({ onLoginSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Login state
    const [loginData, setLoginData] = useState({
        credential: '',
        password: ''
    });

    // Register state
    const [registerData, setRegisterData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const result = await api.loginUser(loginData.credential, loginData.password);

            if (result.success) {
                setMessage({ type: 'success', text: result.message });
                localStorage.setItem('lms_user', JSON.stringify(result.user));
                setTimeout(() => onLoginSuccess(result.user), 1000);
            } else {
                setMessage({ type: 'error', text: result.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Lỗi: ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const result = await api.registerUser(registerData);

            if (result.success) {
                setMessage({ type: 'success', text: result.message });
                setTimeout(() => setIsLogin(true), 2000);
            } else {
                setMessage({ type: 'error', text: result.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Lỗi: ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <h1 className="auth-title">
                    {isLogin ? 'Đăng nhập' : 'Đăng ký'}
                </h1>
                <p className="auth-subtitle">
                    {isLogin ? 'Chào bạn quay lại! 👋' : 'Tạo tài khoản để bắt đầu học'}
                </p>

                {message.text && (
                    <div className={`alert alert-${message.type}`}>
                        {message.text}
                    </div>
                )}

                {isLogin ? (
                    <form onSubmit={handleLogin} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">Email hoặc Số điện thoại</label>
                            <input
                                type="text"
                                className="form-input"
                                value={loginData.credential}
                                onChange={(e) => setLoginData({ ...loginData, credential: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Mật khẩu</label>
                            <input
                                type="password"
                                className="form-input"
                                value={loginData.password}
                                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                required
                            />
                        </div>
                        <button type="submit" className="form-btn" disabled={loading}>
                            {loading ? '⏳ Đang đăng nhập...' : 'Đăng nhập'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegister} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">Họ và tên</label>
                            <input
                                type="text"
                                className="form-input"
                                value={registerData.name}
                                onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-input"
                                value={registerData.email}
                                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Số điện thoại</label>
                            <input
                                type="tel"
                                className="form-input"
                                value={registerData.phone}
                                onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Mật khẩu</label>
                            <input
                                type="password"
                                className="form-input"
                                value={registerData.password}
                                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                required
                                minLength={6}
                            />
                        </div>
                        <button type="submit" className="form-btn" disabled={loading}>
                            {loading ? '⏳ Đang xử lý...' : 'Đăng ký'}
                        </button>
                    </form>
                )}

                <div className="form-link">
                    {isLogin ? (
                        <>
                            Chưa có tài khoản?{' '}
                            <a onClick={() => setIsLogin(false)}>Đăng ký ngay</a>
                        </>
                    ) : (
                        <>
                            Đã có tài khoản?{' '}
                            <a onClick={() => setIsLogin(true)}>Đăng nhập</a>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Auth;
