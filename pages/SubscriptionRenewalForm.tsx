
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SignaturePad from '../components/SignaturePad';
import { PACKAGES } from '../constants';
import { db, submitToGoogleSheets } from '../services/googleSheetsService';

const SubscriptionRenewalForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>({
    package: 'COTRAC BASIC - N30,350',
    fullName: '',
    phone: '',
    username: '', 
    address: '',
    plate: '',
    make: '',
    model: '',
    color: '',
    chassis: '',
    salesRep: ''
  });
  const [errors, setErrors] = useState<any>({});
  const [signature, setSignature] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;
    if (name !== 'username' && name !== 'package' && e.target.type !== 'date' && e.target.type !== 'time') {
      value = value.toUpperCase();
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev: any) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const runValidation = () => {
    const newErrors: any = {};
    if (!formData.fullName) newErrors.fullName = "Full name is required";
    if (!formData.address) newErrors.address = "Contact address is required";
    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (!formData.username || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.username)) newErrors.username = "Valid email is required";
    if (!formData.package) newErrors.package = "Please select a renewal package";
    if (!formData.plate) newErrors.plate = "License plate is required";
    if (!formData.make) newErrors.make = "Vehicle make is required";
    if (!formData.model) newErrors.model = "Vehicle model is required";
    if (!formData.color) newErrors.color = "Vehicle color is required";
    if (!formData.chassis) newErrors.chassis = "Chassis number is required";
    if (!formData.salesRep) newErrors.salesRep = "Sales Representative is required";
    if (!signature) newErrors.signature = "Signature is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!runValidation()) return;
    
    setIsSubmitting(true);
    
    const payload = {
      formType: 'renewal' as const,
      data: { ...formData }, // Uses fullName and username to match Profile exactly
      timestamp: new Date().toISOString(),
      signature
    };

    try {
      // Await the promise to resolve before accessing record.id
      const record = await db.save(payload);
      submitToGoogleSheets(payload, record.id).catch(err => console.error(err));
      navigate('/admin');
    } catch (err) {
      alert("Error saving record. Storage might be full.");
      setIsSubmitting(false);
    }
  };

  const InputError = ({ name }: { name: string }) => (
    errors[name] ? <p className="text-red-500 text-[10px] font-black mt-1 uppercase tracking-wider">{errors[name]}</p> : null
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="bg-[#243b8c] text-white p-8 rounded-2xl flex justify-between items-center shadow-lg">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-tighter">Subscription Renewal</h2>
          <p className="text-blue-200 text-sm mt-1 uppercase font-bold tracking-widest">Digital Service Dispatch</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xs font-black text-white bg-[#f7941d] px-4 py-2 rounded-lg inline-block tracking-[0.2em]">01. ACCOUNT DETAILS</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">FULL NAME *</label>
              <input name="fullName" value={formData.fullName} onChange={handleInputChange} className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:border-[#243b8c] outline-none font-bold uppercase ${errors.fullName ? 'border-red-500' : 'border-slate-100'}`} />
              <InputError name="fullName" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">CONTACT PHONE NO *</label>
              <input name="phone" value={formData.phone} onChange={handleInputChange} className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:border-[#243b8c] outline-none font-bold ${errors.phone ? 'border-red-500' : 'border-slate-100'}`} />
              <InputError name="phone" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">E-MAIL ADDRESS *</label>
              <input type="email" name="username" value={formData.username} onChange={handleInputChange} className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:border-[#243b8c] outline-none font-bold ${errors.username ? 'border-red-500' : 'border-slate-100'}`} placeholder="example@domain.com" />
              <InputError name="username" />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">CONTACT ADDRESS *</label>
              <input name="address" value={formData.address} onChange={handleInputChange} className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:border-[#243b8c] outline-none font-bold uppercase ${errors.address ? 'border-red-500' : 'border-slate-100'}`} />
              <InputError name="address" />
            </div>
          </div>
        </section>

        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xs font-black text-white bg-[#243b8c] px-4 py-2 rounded-lg inline-block tracking-[0.2em]">02. RENEWAL OPTIONS</h3>
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">SELECT PACKAGE *</label>
            <select name="package" value={formData.package} onChange={handleInputChange} className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:border-[#243b8c] outline-none font-bold ${errors.package ? 'border-red-500' : 'border-slate-100'}`}>
              <option value="COTRAC BASIC - N30,350">COTRAC BASIC - N30,350</option>
              {PACKAGES.map(p => <option key={p.id} value={`${p.name} - ${p.price}`}>{p.name} - {p.price}</option>)}
            </select>
            <InputError name="package" />
          </div>
        </section>

        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xs font-black text-white bg-[#243b8c] px-4 py-2 rounded-lg inline-block tracking-[0.2em]">03. VEHICLE DETAILS</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">License Plate *</label>
              <input name="plate" value={formData.plate} onChange={handleInputChange} className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:border-[#243b8c] outline-none font-bold uppercase ${errors.plate ? 'border-red-500' : 'border-slate-100'}`} />
              <InputError name="plate" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Vehicle Make *</label>
              <input name="make" value={formData.make} onChange={handleInputChange} className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:border-[#243b8c] outline-none font-bold uppercase ${errors.make ? 'border-red-500' : 'border-slate-100'}`} />
              <InputError name="make" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Vehicle Model *</label>
              <input name="model" value={formData.model} onChange={handleInputChange} className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:border-[#243b8c] outline-none font-bold uppercase ${errors.model ? 'border-red-500' : 'border-slate-100'}`} />
              <InputError name="model" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Vehicle Color *</label>
              <input name="color" value={formData.color} onChange={handleInputChange} className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:border-[#243b8c] outline-none font-bold uppercase ${errors.color ? 'border-red-500' : 'border-slate-100'}`} />
              <InputError name="color" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Chassis Number *</label>
              <input name="chassis" value={formData.chassis} onChange={handleInputChange} className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:border-[#243b8c] outline-none font-bold uppercase ${errors.chassis ? 'border-red-500' : 'border-slate-100'}`} />
              <InputError name="chassis" />
            </div>
          </div>
        </section>

        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xs font-black text-white bg-slate-500 px-4 py-2 rounded-lg inline-block tracking-[0.2em]">04. OFFICE USE</h3>
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Sales Representative *</label>
            <input name="salesRep" value={formData.salesRep} onChange={handleInputChange} className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:border-[#243b8c] outline-none font-bold uppercase ${errors.salesRep ? 'border-red-500' : 'border-slate-100'}`} placeholder="ENTER SALES REP NAME" />
            <InputError name="salesRep" />
          </div>
        </section>

        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xs font-black text-white bg-slate-900 px-4 py-2 rounded-lg inline-block tracking-[0.2em]">05. AUTHORIZATION</h3>
          <SignaturePad onSave={setSignature} label="Customer Signature *" />
          <InputError name="signature" />
          <button type="submit" disabled={isSubmitting} className="w-full mt-8 py-6 bg-[#243b8c] text-white rounded-3xl font-black text-2xl shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50">
            {isSubmitting ? <><i className="fa-solid fa-spinner fa-spin mr-3"></i> PROCESSING...</> : 'CONFIRM RENEWAL'}
          </button>
        </section>
      </form>
    </div>
  );
};

export default SubscriptionRenewalForm;
