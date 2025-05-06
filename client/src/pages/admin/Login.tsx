import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // 获取用户之前尝试访问的页面
  const from = location.state?.from?.pathname || '/manage/dashboard';
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('用户名和密码不能为空');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // 这里应该是实际的登录API调用
      // 暂时使用模拟数据，假设只有admin/admin可以登录
      if (username === 'admin' && password === 'admin') {
        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // 存储登录状态和管理员权限
        localStorage.setItem('token', 'mock-jwt-token');
        localStorage.setItem('isAdmin', 'true');
        
        // 登录成功后跳转
        navigate(from, { replace: true });
      } else {
        setError('用户名或密码错误');
      }
    } catch (err) {
      setError('登录失败，请稍后再试');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h1 className="text-2xl font-bold">管理员登录</h1>
          <p className="mt-2 text-gray-600">请输入您的凭据以访问管理后台</p>
        </div>
        
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-100 rounded">
            {error}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              用户名
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
              placeholder="请输入用户名"
              disabled={loading}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
              placeholder="请输入密码"
              disabled={loading}
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
