
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [verification, setVerification] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const session = await authService.login(username, verification);
    if (session) {
      navigate('/');
    } else {
      setError('Invalid identification or verification code.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-3xl border border-slate-200 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-[#243b8c] rounded-2xl flex items-center justify-center text-white font-bold text-4xl mx-auto mb-6 shadow-lg shadow-blue-200">C</div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Terminal Access</h2>
          <p className="text-slate-500 font-medium">Please sign in to your authorized account.</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Identification</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#243b8c] outline-none font-bold transition-all"
                placeholder="Username (e.g. admin)"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Verification Code</label>
              <input
                type="password"
                required
                value={verification}
                onChange={(e) => setVerification(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#243b8c] outline-none font-bold transition-all"
                placeholder="••••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold uppercase tracking-widest text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-5 bg-[#243b8c] text-white rounded-2xl font-black text-lg shadow-xl hover:bg-[#1a2b66] transition-all disabled:opacity-50"
          >
            {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'AUTHENTICATE'}
          </button>
        </form>
        
        <div className="text-center pt-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Authorized Access Only</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
