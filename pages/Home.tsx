
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const userRole = authService.getCurrentSession()?.user.role;

  const services = [
    {
      id: 'profile',
      title: 'New Customer Intake',
      desc: 'Complete registration for new vehicle tracking services.',
      icon: 'fa-user-plus',
      color: 'bg-white',
      roles: ['ADMIN', 'SALES'],
      action: () => navigate('/profile')
    },
    {
      id: 'renewal',
      title: 'Subscription Renewal',
      desc: 'Renew existing telematics or security subscriptions.',
      icon: 'fa-sync-alt',
      color: 'bg-white',
      roles: ['ADMIN', 'SALES'],
      action: () => navigate('/renewal')
    },
    {
      id: 'service',
      title: 'Pre/Post Service Check',
      desc: 'Technical inspection and service reporting form.',
      icon: 'fa-tools',
      color: 'bg-white',
      roles: ['ADMIN', 'TECHNICIAN'],
      action: () => navigate('/service')
    },
    {
      id: 'database',
      title: 'Administrative Database',
      desc: 'Full access to audit logs and synchronization status.',
      icon: 'fa-shield-halved',
      color: 'bg-blue-50/50',
      roles: ['ADMIN'],
      action: () => navigate('/admin'),
      isAdminCard: true
    }
  ];

  // Filter based on RBAC
  const visibleServices = services.filter(s => s.roles.includes(userRole as any));

  return (
    <div className="space-y-12 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4">
        <div className="inline-block px-4 py-1.5 bg-[#f7941d]/10 text-[#f7941d] rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-2">
          CoTrac Terminal v2.0
        </div>
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Operational Console</h2>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
          Select an authorized module to begin processing customer requests.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
        {visibleServices.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => s.action()}
            className={`group p-10 border border-slate-200 rounded-[2.5rem] text-left hover:border-[#243b8c] hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${s.color}`}
          >
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-8 transition-all duration-500 ${s.isAdminCard ? 'bg-[#243b8c] text-white shadow-xl shadow-blue-100' : 'bg-slate-50 group-hover:bg-[#243b8c] group-hover:text-white group-hover:shadow-xl group-hover:shadow-blue-100'}`}>
              <i className={`fa-solid ${s.icon} text-3xl`}></i>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-[#243b8c] transition-colors uppercase tracking-tight leading-none">{s.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-semibold">{s.desc}</p>
            <div className="mt-10 flex items-center text-xs font-black uppercase tracking-[0.2em] text-[#f7941d]">
              Launch Module <i className="fa-solid fa-arrow-right-long ml-3 transform group-hover:translate-x-2 transition-transform"></i>
            </div>
          </button>
        ))}
      </div>
      
      {visibleServices.length === 0 && (
        <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
          <i className="fa-solid fa-lock text-6xl text-slate-200 mb-6"></i>
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No modules authorized for your role</p>
        </div>
      )}
    </div>
  );
};

export default Home;
