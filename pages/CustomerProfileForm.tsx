
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PACKAGES } from '../constants';
import SignaturePad from '../components/SignaturePad';
import { db, submitToGoogleSheets } from '../services/googleSheetsService';

const CustomerProfileForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(PACKAGES[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>({
    username: '',
    fullName: '',
    homeZone: '',
    address: '',
    dob: '',
    whatsapp: '',
    phone: '',
    referralSource: '',
    plate: '',
    chassis: '',
    make: '',
    model: '',
    color: '',
    salesRep: '',
    installationDate: new Date().toISOString().split('T')[0],
    signName: '',
  });
  const [errors, setErrors] = useState<any>({});
  const [signature, setSignature] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    // Auto-uppercase everything except email (username)
    if (name !== 'username') value = value.toUpperCase();
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
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
    if (!formData.username) newErrors.username = "Email/Username is required";
    if (!formData.fullName) newErrors.fullName = "Full name is required";
    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (!formData.address) newErrors.address = "Home address is required";
    if (!formData.plate) newErrors.plate = "License plate is required";
    if (!formData.make) newErrors.make = "Vehicle make is required";
    if (!formData.model) newErrors.model = "Vehicle model is required";
    if (!formData.color) newErrors.color = "Vehicle color is required";
    if (!formData.chassis) newErrors.chassis = "Chassis number is required";
    if (!formData.salesRep) newErrors.salesRep = "Sales Representative is required";
    if (!formData.signName) newErrors.signName = "Signatory name is required";
    if (!signature) newErrors.signature = "Customer signature is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!runValidation()) return;
    
    setIsSubmitting(true);
    
    const payload = {
      formType: 'profile' as const,
      data: { 
        ...formData, 
        package: PACKAGES.find(p => p.id === selectedPackage)?.name 
      },
      timestamp: new Date().toISOString(),
      signature
    };

    try {
      // 1. SAVE TO LOCAL DATABASE
      // Await the promise to resolve before accessing record.id
      const record = await db.save(payload);

      // 2. DISPATCH TO CLOUD (Background)
      submitToGoogleSheets(payload, record.id).catch(err => console.error("Cloud sync failed:", err));

      // 3. REDIRECT IMMEDIATELY
      navigate('/admin');
    } catch (err) {
      console.error("Save failed:", err);
      alert("Error saving registration. Please check if your device storage is full.");
      setIsSubmitting(false);
    }
  };

  const InputError = ({ name }: { name: string }) => (
    errors[name] ? <p className="text-red-500 text-[10px] font-black mt-1 uppercase tracking-wider">{errors[name]}</p> : null
  );

  if (step === 1) {
    return (
      <div className="space-y-12 max-w-4xl mx-auto py-8">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Select Service Package</h2>
          <p className="text-slate-500 font-medium">Choose a tracking plan to proceed with registration.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PACKAGES.map(pkg => (
            <button 
              key={pkg.id} 
              onClick={() => setSelectedPackage(pkg.id)}
              type="button"
              className={`flex flex-col border-4 rounded-3xl p-8 transition-all text-left ${
                selectedPackage === pkg.id ? 'border-[#f7941d] bg-white shadow-2xl scale-105' : 'border-slate-100 bg-slate-50 opacity-60 grayscale'
              }`}
            >
              <div className="flex justify-between items-center mb-4 w-full">
                 <h3 className="text-2xl font-black text-slate-900">{pkg.name}</h3>
                 {selectedPackage === pkg.id && <i className="fa-solid fa-circle-check text-[#f7941d] text-2xl"></i>}
              </div>
              <div className="text-5xl font-black text-[#243b8c] mb-6">{pkg.price}</div>
              <ul className="space-y-3 mb-8 flex-1">
                {pkg.features.map((f, i) => (
                  <li key={i} className="text-sm font-bold text-slate-600 flex items-center">
                    <i className="fa-solid fa-check text-[#f7941d] mr-2"></i> {f}
                  </li>
                ))}
              </ul>
              <div className={`w-full py-4 rounded-2xl font-black text-center ${selectedPackage === pkg.id ? 'bg-[#f7941d] text-white' : 'bg-slate-200 text-slate-400'}`}>
                {selectedPackage === pkg.id ? 'SELECTED' : 'SELECT PLAN'}
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-center">
          <button onClick={() => setStep(2)} className="px-12 py-5 bg-[#243b8c] text-white rounded-2xl font-black text-xl shadow-xl hover:bg-[#1a2b66] transition-all flex items-center gap-4">
            PROCEED TO FORM <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-10 py-4 pb-24">
      <div className="bg-[#243b8c] text-white p-8 rounded-3xl flex justify-between items-center shadow-xl">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Customer Profile</h2>
          <p className="text-blue-200 text-sm font-bold uppercase tracking-widest mt-1">
            Package: {PACKAGES.find(p => p.id === selectedPackage)?.name}
          </p>
        </div>
        <button type="button" onClick={() => setStep(1)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Change</button>
      </div>

      <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
        <h3 className="text-xs font-black text-white bg-[#f7941d] px-4 py-2 rounded-lg inline-block tracking-[0.2em]">01. CUSTOMER INFORMATION</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Email Address / Username *</label>
            <input name="username" value={formData.username} onChange={handleInputChange} className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl focus:border-[#243b8c] outline-none font-bold ${errors.username ? 'border-red-500' : 'border-slate-100'}`} placeholder="example@domain.com" />
            <InputError name="username" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Full Name (Surname First) *</label>
            <input name="fullName" value={formData.fullName} onChange={handleInputChange} className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl focus:border-[#243b8c] outline-none font-bold uppercase ${errors.fullName ? 'border-red-500' : 'border-slate-100'}`} />
            <InputError name="fullName" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Phone Number *</label>
            <input name="phone" value={formData.phone} onChange={handleInputChange} className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl focus:border-[#243b8c] outline-none font-bold ${errors.phone ? 'border-red-500' : 'border-slate-100'}`} />
            <InputError name="phone" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">WhatsApp Number</label>
            <input name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#243b8c] outline-none font-bold" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">How did you hear about us?</label>
            <select name="referralSource" value={formData.referralSource} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#243b8c] outline-none font-bold">
              <option value="">-- SELECT SOURCE --</option>
              <option value="SOCIAL MEDIA">SOCIAL MEDIA</option>
              <option value="RADIO/TV">RADIO / TV</option>
              <option value="FRIEND/REFERRAL">FRIEND / REFERRAL</option>
              <option value="STREET SIGN">STREET SIGN / FLYER</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Home Address *</label>
            <input name="address" value={formData.address} onChange={handleInputChange} className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl focus:border-[#243b8c] outline-none font-bold uppercase ${errors.address ? 'border-red-500' : 'border-slate-100'}`} />
            <InputError name="address" />
          </div>
        </div>
      </section>

      <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
        <h3 className="text-xs font-black text-white bg-[#243b8c] px-4 py-2 rounded-lg inline-block tracking-[0.2em]">02. VEHICLE DETAILS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">License Plate *</label>
            <input name="plate" value={formData.plate} onChange={handleInputChange} className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl focus:border-[#243b8c] outline-none font-bold ${errors.plate ? 'border-red-500' : 'border-slate-100'}`} />
            <InputError name="plate" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Vehicle Make *</label>
            <input name="make" value={formData.make} onChange={handleInputChange} className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl focus:border-[#243b8c] outline-none font-bold ${errors.make ? 'border-red-500' : 'border-slate-100'}`} placeholder="e.g. TOYOTA" />
            <InputError name="make" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Vehicle Model *</label>
            <input name="model" value={formData.model} onChange={handleInputChange} className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl focus:border-[#243b8c] outline-none font-bold ${errors.model ? 'border-red-500' : 'border-slate-100'}`} placeholder="e.g. CAMRY" />
            <InputError name="model" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Vehicle Color *</label>
            <input name="color" value={formData.color} onChange={handleInputChange} className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl focus:border-[#243b8c] outline-none font-bold ${errors.color ? 'border-red-500' : 'border-slate-100'}`} placeholder="e.g. SILVER" />
            <InputError name="color" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Chassis Number *</label>
            <input name="chassis" value={formData.chassis} onChange={handleInputChange} className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl focus:border-[#243b8c] outline-none font-bold ${errors.chassis ? 'border-red-500' : 'border-slate-100'}`} />
            <InputError name="chassis" />
          </div>
        </div>
      </section>

      <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
        <h3 className="text-xs font-black text-white bg-slate-500 px-4 py-2 rounded-lg inline-block tracking-[0.2em]">03. OFFICE USE</h3>
        <div>
          <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Sales Representative *</label>
          <input name="salesRep" value={formData.salesRep} onChange={handleInputChange} className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl focus:border-[#243b8c] outline-none font-bold uppercase ${errors.salesRep ? 'border-red-500' : 'border-slate-100'}`} placeholder="ENTER SALES REP NAME" />
          <InputError name="salesRep" />
        </div>
      </section>

      <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
        <h3 className="text-xs font-black text-white bg-slate-900 px-4 py-2 rounded-lg inline-block tracking-[0.2em]">04. AUTHORIZATION</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Installation Date *</label>
              <input type="date" name="installationDate" value={formData.installationDate} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Signatory Name *</label>
              <input name="signName" value={formData.signName} onChange={handleInputChange} className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl outline-none font-bold uppercase ${errors.signName ? 'border-red-500' : 'border-slate-100'}`} />
              <InputError name="signName" />
            </div>
          </div>
          <div>
            <SignaturePad onSave={setSignature} label="Customer Signature *" />
            {errors.signature && <p className="text-red-500 text-[10px] font-black mt-2 uppercase tracking-widest">Please provide a signature</p>}
          </div>
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full py-6 bg-[#243b8c] text-white rounded-3xl font-black text-2xl shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50">
          {isSubmitting ? <><i className="fa-solid fa-spinner fa-spin mr-3"></i> PROCESSING...</> : 'SUBMIT REGISTRATION'}
        </button>
      </section>
    </form>
  );
};

export default CustomerProfileForm;
