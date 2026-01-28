
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const session = authService.getCurrentSession();
  const isAuthenticated = authService.isAuthenticated();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#243b8c] rounded-lg flex items-center justify-center text-white font-bold text-xl">C</div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#243b8c]">COTRAC</h1>
              <p className="text-[10px] uppercase tracking-widest text-[#f7941d] font-bold">Technology • Security • Fleet</p>
            </div>
          </Link>
          
          {isAuthenticated && (
            <nav className="flex items-center gap-4 md:gap-8">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] font-black text-[#243b8c] uppercase tracking-widest">{session?.user.fullName}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{session?.user.role}</span>
              </div>
              <div className="h-8 w-px bg-slate-100 hidden md:block"></div>
              <div className="flex gap-4 md:gap-6">
                <Link to="/" className={`text-xs font-black uppercase tracking-widest hover:text-[#243b8c] transition-colors ${location.pathname === '/' ? 'text-[#f7941d]' : 'text-slate-600'}`}>Home</Link>
                {authService.hasRole(['ADMIN']) && (
                  <Link to="/admin" className={`text-xs font-black uppercase tracking-widest hover:text-[#243b8c] transition-colors ${location.pathname === '/admin' ? 'text-[#f7941d]' : 'text-slate-600'}`}>Database</Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="text-xs font-black uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors"
                >
                  <i className="fa-solid fa-power-off"></i>
                </button>
              </div>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12 px-4 mt-auto">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <h3 className="text-white font-bold mb-4 text-lg">Contact Info</h3>
            <p>No 7, Uyo Crescent, Off Emeka Anyaoku St.</p>
            <p>Area 11, Garki, Abuja.</p>
            <p className="mt-2 font-bold text-white">Tel: 07069689286</p>
          </div>
          <div>
            <h3 className="text-white font-bold mb-4 text-lg">Online</h3>
            <p>customerservice@cotracnigeria.com</p>
            <p>www.cotracnigeria.com</p>
          </div>
          <div>
            <h3 className="text-white font-bold mb-4 text-lg">System</h3>
            <p>Version 2.0.0 (Market Ready)</p>
            <p>© 2024 CoTrac Satellite Systems Ltd.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
