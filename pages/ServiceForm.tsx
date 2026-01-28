
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PRE_CHECK_ITEMS } from '../constants';
import SignaturePad from '../components/SignaturePad';
import { db, submitToGoogleSheets } from '../services/googleSheetsService';

const ServiceForm: React.FC = () => {
  const [formData, setFormData] = useState<any>({
    preCheck: {},
    postCheck: {},
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    security: 'no',
    attendant: '',
    fullName: '',
    phone: '',
    brand: '',
    model: '',
    color: '',
    regNo: '',
    chassis: '',
    engineNo: '',
    mileage: ''
  });
  const [errors, setErrors] = useState<any>({});
  const [signCustomer, setSignCustomer] = useState('');
  const [signAdvisor, setSignAdvisor] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let { name, value } = e.target;
    if (e.target.type !== 'date' && e.target.type !== 'time' && e.target.type !== 'radio') {
      value = value.toUpperCase();
    }
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Added explicit type for file to resolve 'unknown' type issue with FileReader
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheckChange = (type: 'preCheck' | 'postCheck', item: string, status: 'OK' | 'Failure') => {
    setFormData((prev: any) => ({
      ...prev,
      [type]: { ...prev[type], [item]: status }
    }));
  };

  const runValidation = () => {
    const newErrors: any = {};
    if (!formData.attendant) newErrors.attendant = "Attendant name is required";
    if (!formData.fullName) newErrors.fullName = "Customer name is required";
    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (!formData.regNo) newErrors.regNo = "Registration number is required";
    if (!formData.chassis) newErrors.chassis = "Chassis number is required";
    if (!signCustomer) newErrors.signCustomer = "Customer signature required";
    if (!signAdvisor) newErrors.signAdvisor = "Advisor signature required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!runValidation()) return;
    
    setIsSubmitting(true);
    
    const payload = {
      formType: 'service' as const,
      data: { 
        ...formData, 
        customer_signature: signCustomer, 
        advisor_signature: signAdvisor 
      },
      timestamp: new Date().toISOString(),
      signature: "Dual signatures included in data",
      photos
    };

    try {
      const record = await db.save(payload);
      submitToGoogleSheets(payload, record.id).catch(err => console.error(err));
      navigate('/admin');
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const InputError = ({ name }: { name: string }) => (
    errors[name] ? <p className="text-red-500 text-[10px] mt-1 font-black uppercase tracking-widest">{errors[name]}</p> : null
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8 pb-24">
      <div className="bg-[#243b8c] text-white p-8 rounded-3xl flex justify-between items-center shadow-lg">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Pre/Post Service Form</h2>
          <p className="text-blue-200 text-sm mt-1 uppercase font-black tracking-widest">Technical Inspection Report</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest opacity-60">Status</div>
          <div className="text-xl font-black text-[#f7941d] uppercase">Inspection</div>
        </div>
      </div>

      <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">DATE *</label>
          <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 outline-none font-bold" />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">TIME *</label>
          <input type="time" name="time" value={formData.time} onChange={handleInputChange} className="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 outline-none font-bold" />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">ATTENDANT *</label>
          <input name="attendant" value={formData.attendant} onChange={handleInputChange} className={`w-full bg-slate-50 px-4 py-3 rounded-xl border outline-none font-bold ${errors.attendant ? 'border-red-500' : 'border-slate-100'}`} />
          <InputError name="attendant" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">CUSTOMER NAME *</label>
          <input name="fullName" value={formData.fullName} onChange={handleInputChange} className={`w-full bg-slate-50 px-4 py-3 rounded-xl border outline-none font-bold uppercase ${errors.fullName ? 'border-red-500' : 'border-slate-100'}`} />
          <InputError name="fullName" />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">PHONE NO *</label>
          <input name="phone" value={formData.phone} onChange={handleInputChange} className={`w-full bg-slate-50 px-4 py-3 rounded-xl border outline-none font-bold ${errors.phone ? 'border-red-500' : 'border-slate-100'}`} />
          <InputError name="phone" />
        </div>
      </section>

      <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6">
        <div><label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">BRAND</label><input name="brand" value={formData.brand} onChange={handleInputChange} className="w-full bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 font-bold uppercase" /></div>
        <div><label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">MODEL</label><input name="model" value={formData.model} onChange={handleInputChange} className="w-full bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 font-bold uppercase" /></div>
        <div><label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">COLOUR</label><input name="color" value={formData.color} onChange={handleInputChange} className="w-full bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 font-bold uppercase" /></div>
        <div><label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">REG NO *</label><input name="regNo" value={formData.regNo} onChange={handleInputChange} className="w-full bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 font-bold uppercase" /><InputError name="regNo" /></div>
        <div className="md:col-span-2"><label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">CHASSIS NO *</label><input name="chassis" value={formData.chassis} onChange={handleInputChange} className="w-full bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 font-bold uppercase" /><InputError name="chassis" /></div>
        <div><label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">ENGINE NO</label><input name="engineNo" value={formData.engineNo} onChange={handleInputChange} className="w-full bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 font-bold uppercase" /></div>
        <div><label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">MILEAGE</label><input name="mileage" value={formData.mileage} onChange={handleInputChange} className="w-full bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 font-bold uppercase" /></div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-[10px] font-black text-white bg-slate-900 px-4 py-2 rounded-lg inline-block tracking-[0.2em] mb-4">PRE-SERVICE CHECK</h3>
          <div className="space-y-3">
            {PRE_CHECK_ITEMS.map(item => (
              <div key={item} className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-600">{item}</span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleCheckChange('preCheck', item, 'OK')} className={`px-3 py-1 rounded-lg text-[10px] font-black ${formData.preCheck[item] === 'OK' ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>OK</button>
                  <button type="button" onClick={() => handleCheckChange('preCheck', item, 'Failure')} className={`px-3 py-1 rounded-lg text-[10px] font-black ${formData.preCheck[item] === 'Failure' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'}`}>FAIL</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-[10px] font-black text-white bg-[#243b8c] px-4 py-2 rounded-lg inline-block tracking-[0.2em] mb-4">POST-SERVICE CHECK</h3>
          <div className="space-y-3">
            {PRE_CHECK_ITEMS.map(item => (
              <div key={item} className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-600">{item}</span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleCheckChange('postCheck', item, 'OK')} className={`px-3 py-1 rounded-lg text-[10px] font-black ${formData.postCheck[item] === 'OK' ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>OK</button>
                  <button type="button" onClick={() => handleCheckChange('postCheck', item, 'Failure')} className={`px-3 py-1 rounded-lg text-[10px] font-black ${formData.postCheck[item] === 'Failure' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'}`}>FAIL</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-[10px] font-black text-white bg-[#f7941d] px-4 py-2 rounded-lg inline-block tracking-[0.2em] mb-8">PHOTO DOCUMENTATION</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {photos.map((p, i) => (
            <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-100">
              <img src={p} className="w-full h-full object-cover" />
              <button type="button" onClick={() => removePhoto(i)} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"><i className="fa-solid fa-times"></i></button>
            </div>
          ))}
          <label className="aspect-square rounded-2xl border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 hover:border-[#243b8c] hover:text-[#243b8c] cursor-pointer transition-all">
            <i className="fa-solid fa-camera text-3xl mb-2"></i>
            <span className="text-[10px] font-black uppercase">Add Photo</span>
            <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
          </label>
        </div>
      </section>

      <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
        <h3 className="text-[10px] font-black text-white bg-slate-900 px-4 py-2 rounded-lg inline-block tracking-[0.2em]">AUTHORIZATION</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <SignaturePad onSave={setSignCustomer} label="Customer Acknowledgment *" />
          <SignaturePad onSave={setSignAdvisor} label="Advisor/Technician Signature *" />
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full py-6 bg-[#243b8c] text-white rounded-3xl font-black text-2xl shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50">
          {isSubmitting ? <><i className="fa-solid fa-spinner fa-spin mr-3"></i> PROCESSING...</> : 'COMPLETE SERVICE REPORT'}
        </button>
      </section>
    </form>
  );
};

export default ServiceForm;
