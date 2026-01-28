
import React, { useState, useEffect } from 'react';
import { backendService } from '../services/backendService';
import { db, fetchFromGoogleSheets } from '../services/googleSheetsService';
import { StoredSubmission } from '../types';
import jsPDF from 'https://esm.sh/jspdf@2.5.1';
import autoTable from 'https://esm.sh/jspdf-autotable@3.8.2';

const History: React.FC = () => {
  // Authentication State for the Database Section
  const [isVerified, setIsVerified] = useState(false);
  const [dbUsername, setDbUsername] = useState('');
  const [dbPassword, setDbPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Data State
  const [records, setRecords] = useState<StoredSubmission[]>([]);
  const [filter, setFilter] = useState('all');
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<StoredSubmission | null>(null);
  const [editingRecord, setEditingRecord] = useState<StoredSubmission | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  const handleDbLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setLoginError('');

    // Verification Logic for dbadmin
    setTimeout(() => {
      if (dbUsername === 'dbadmin' && dbPassword === 'dbadmin01234#') {
        setIsVerified(true);
      } else {
        setLoginError('Invalid Database Credentials. Access Denied.');
      }
      setIsVerifying(false);
    }, 800);
  };

  const loadData = async () => {
    if (!isVerified) return;
    // Automatic purge is disabled. Records persist until manual "Factory Reset".
    const data = await backendService.getLocalRecords();
    setRecords(data);
  };

  useEffect(() => {
    if (isVerified) {
      loadData();
      const interval = setInterval(loadData, 30000); // UI Refresh interval
      return () => clearInterval(interval);
    }
  }, [isVerified]);

  const stats = {
    total: records.length,
    synced: records.filter(r => r.synced).length,
    pending: records.filter(r => !r.synced).length
  };

  const handleExportCSV = () => {
    if (records.length === 0) return;
    const headers = ["ID", "Type", "Timestamp", "Synced", "Identifier", "Reference"];
    const rows = records.map(r => [
      r.id,
      r.formType.toUpperCase(),
      new Date(r.timestamp).toLocaleString(),
      r.synced ? "YES" : "NO",
      `"${r.data.fullName || r.data.customerName || r.data.signName || "N/A"}"`,
      `"${r.data.plate || r.data.regNo || ""}"`
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `CoTrac_Audit_Log_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleExportAllPDF = () => {
    if (filteredRecords.length === 0) return;
    
    const doc = new jsPDF('l', 'mm', 'a4');
    const blue: [number, number, number] = [36, 59, 140];
    
    // Header
    doc.setFillColor(...blue);
    doc.rect(0, 0, 297, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("COTRAC SATELLITE SYSTEMS - BULK AUDIT REPORT", 15, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(`Generated: ${new Date().toLocaleString()} | Filter: ${filter.toUpperCase()} | Total Records: ${filteredRecords.length}`, 15, 26);

    const tableData = filteredRecords.map(r => [
      r.id,
      r.formType.toUpperCase(),
      new Date(r.timestamp).toLocaleString(),
      r.data.fullName || r.data.customerName || r.data.signName || "N/A",
      r.data.plate || r.data.regNo || "N/A",
      r.synced ? "CLOUD SECURED" : "LOCAL BUFFER"
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['RECORD ID', 'FORM TYPE', 'TIMESTAMP', 'CLIENT IDENTITY', 'VEHICLE REF', 'STORAGE STATUS']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: blue, fontSize: 9, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 4 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    doc.save(`CoTrac_Audit_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handlePullFromCloud = async () => {
    if (!window.confirm("RESTORE DATA: This will pull all records from Google Sheets and merge them into your local storage. Proceed?")) return;
    
    setIsPulling(true);
    setSyncStatus("Contacting Cloud...");
    
    try {
      const types: ('profile' | 'renewal' | 'service')[] = ['profile', 'renewal', 'service'];
      let totalPulled = 0;
      
      for (const type of types) {
        setSyncStatus(`Syncing ${type} records...`);
        const cloudRecords = await fetchFromGoogleSheets(type);
        for (const record of cloudRecords) {
          await db.save(record);
          totalPulled++;
        }
      }
      
      await loadData();
      alert(`Recovery Success: ${totalPulled} cloud records have been synced locally.`);
    } catch (error) {
      console.error("Cloud pull failed:", error);
      alert("Failed to reach cloud database. Ensure your Apps Script supports GET requests.");
    } finally {
      setIsPulling(false);
      setSyncStatus(null);
    }
  };

  const handleClear = async () => {
    if (window.confirm("CRITICAL: Wipe all local device data? This cannot be undone.")) {
      try {
        await backendService.clearLocalData();
        setRecords([]); 
        alert("Local database has been successfully purged.");
      } catch (error) {
        console.error("Purge failed:", error);
        alert("Failed to clear local database.");
      }
    }
  };

  const generateReceipt = (record: StoredSubmission) => {
    const doc = new jsPDF();
    const blue: [number, number, number] = [36, 59, 140];
    const orange: [number, number, number] = [247, 148, 29];

    // Banner Header
    doc.setFillColor(...blue);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("COTRAC SATELLITE SYSTEMS", 20, 25);
    doc.setFontSize(10);
    doc.text("OFFICIAL DIGITAL SERVICE RECEIPT", 20, 32);

    // Metadata Section
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(14);
    doc.text(`${record.formType.toUpperCase()} SUBMISSION SUMMARY`, 20, 55);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Transaction ID: ${record.id}`, 20, 61);
    doc.text(`Audit Timestamp: ${new Date(record.timestamp).toLocaleString()}`, 20, 65);

    // Primary Client/Vehicle Data Table
    const mainDataRows = Object.entries(record.data)
      .filter(([key]) => 
        !key.toLowerCase().includes('signature') && 
        key !== 'preCheck' && 
        key !== 'postCheck' &&
        typeof record.data[key] !== 'object'
      )
      .map(([key, value]) => [key.toUpperCase().replace(/([A-Z])/g, ' $1').trim(), String(value)]);

    autoTable(doc, {
      startY: 75,
      head: [['DATA FIELD', 'VERIFIED VALUE']],
      body: mainDataRows,
      theme: 'striped',
      headStyles: { fillColor: blue },
      styles: { fontSize: 8, cellPadding: 3 }
    });

    let currentY = (doc as any).lastAutoTable?.finalY || 150;

    // Detailed Inspection Checklist (if Service Report)
    if (record.formType === 'service' && (record.data.preCheck || record.data.postCheck)) {
      if (currentY > 230) { doc.addPage(); currentY = 20; }
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...blue);
      doc.text("TECHNICAL INSPECTION CHECKLIST", 20, currentY + 15);
      
      const checkItems = Array.from(new Set([
        ...Object.keys(record.data.preCheck || {}),
        ...Object.keys(record.data.postCheck || {})
      ]));

      const checkRows = checkItems.map(item => [
        item.toUpperCase(),
        record.data.preCheck?.[item] || 'NOT CHECKED',
        record.data.postCheck?.[item] || 'NOT CHECKED'
      ]);

      autoTable(doc, {
        startY: currentY + 20,
        head: [['INSPECTION ITEM', 'PRE-SERVICE STATUS', 'POST-SERVICE STATUS']],
        body: checkRows,
        theme: 'grid',
        headStyles: { fillColor: [100, 116, 139] },
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: {
          1: { fontStyle: 'bold' },
          2: { fontStyle: 'bold' }
        }
      });
      
      currentY = (doc as any).lastAutoTable?.finalY || currentY + 40;
    }

    // Signature Verification Section
    if (currentY > 240) { doc.addPage(); currentY = 20; }
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    
    if (record.formType === 'service') {
      // Dual Signatures for Service Work
      if (record.data.customer_signature && record.data.customer_signature.startsWith('data:image')) {
        doc.text("Customer Approval Signature:", 20, currentY + 15);
        doc.addImage(record.data.customer_signature, 'JPEG', 20, currentY + 18, 50, 18);
      }
      if (record.data.advisor_signature && record.data.advisor_signature.startsWith('data:image')) {
        doc.text("Technical Advisor Signature:", 120, currentY + 15);
        doc.addImage(record.data.advisor_signature, 'JPEG', 120, currentY + 18, 50, 18);
      }
    } else if (record.signature && record.signature.startsWith('data:image')) {
      // Single signature for Profile/Renewal
      doc.text("Authorized Client Signature:", 20, currentY + 15);
      doc.addImage(record.signature, 'JPEG', 20, currentY + 18, 60, 20);
    }

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text("This is an electronically generated document. CoTrac Satellite Systems Ltd.", 105, 285, { align: 'center' });

    doc.save(`CoTrac_Receipt_${record.formType}_${record.id}.pdf`);
  };

  const handleSyncAllPending = async () => {
    const pending = records.filter(r => !r.synced);
    if (pending.length === 0) {
      alert("No pending records to dispatch.");
      return;
    }

    setIsSyncingAll(true);
    let successCount = 0;

    for (const record of pending) {
      setSyncStatus(`Syncing: ${record.id}`);
      const success = await backendService.syncToCloud(record);
      if (success) successCount++;
    }

    setIsSyncingAll(false);
    setSyncStatus(null);
    loadData();
    alert(`Dispatch Complete: ${successCount} records successfully synced to Google Sheets.`);
  };

  const startEditing = (record: StoredSubmission) => {
    setEditingRecord(record);
    setEditFormData({ ...record.data });
  };

  const handleEditChange = (key: string, value: string) => {
    setEditFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const saveEdit = async () => {
    if (!editingRecord) return;
    try {
      await backendService.updateRecord(editingRecord.id, editFormData);
      setEditingRecord(null);
      loadData();
      alert("Record updated successfully. Status reset to 'Local Buffer' for cloud re-sync.");
    } catch (err) {
      alert("Failed to update record.");
    }
  };

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.formType === filter);

  // GATED ACCESS VIEW
  if (!isVerified) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12 px-4 animate-in fade-in zoom-in duration-500">
        <div className="w-full max-w-md bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl space-y-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center text-white mx-auto shadow-xl shadow-slate-100 mb-6">
              <i className="fa-solid fa-shield-halved text-4xl"></i>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Database Vault</h2>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Administrative Verification Required</p>
          </div>

          <form onSubmit={handleDbLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">DB Identifier</label>
              <input 
                type="text" 
                value={dbUsername}
                onChange={(e) => setDbUsername(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-900 outline-none focus:border-[#243b8c] transition-all"
                placeholder="Database Admin ID"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Verification Key</label>
              <input 
                type="password" 
                value={dbPassword}
                onChange={(e) => setDbPassword(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-900 outline-none focus:border-[#243b8c] transition-all"
                placeholder="••••••••••••"
              />
            </div>
            
            {loginError && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-center">
                <i className="fa-solid fa-triangle-exclamation mr-2"></i> {loginError}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isVerifying}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-[#243b8c] transition-all disabled:opacity-50"
            >
              {isVerifying ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Decrypt Access'}
            </button>
          </form>

          <div className="text-center">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Encrypted Session Endpoint</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-6 animate-in fade-in duration-500">
      {/* Header & Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2 flex flex-col justify-center bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Control Center</h2>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Persistent Local Storage (Manual Purge Only)</p>
            </div>
            <button onClick={() => setIsVerified(false)} className="text-[10px] font-black text-slate-300 hover:text-red-500 uppercase tracking-widest transition-colors">
              <i className="fa-solid fa-lock mr-2"></i> Lock Vault
            </button>
          </div>
          <div className="flex flex-wrap gap-4 mt-6">
            <button onClick={handleSyncAllPending} disabled={isSyncingAll || isPulling} className="px-6 py-3 bg-[#243b8c] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 disabled:opacity-50 transition-all">
              {isSyncingAll ? <i className="fa-solid fa-sync fa-spin mr-2"></i> : <i className="fa-solid fa-cloud-arrow-up mr-2"></i>}
              Dispatch All
            </button>
            <button onClick={handlePullFromCloud} disabled={isSyncingAll || isPulling} className="px-6 py-3 bg-[#f7941d] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-orange-600 disabled:opacity-50 transition-all">
              {isPulling ? <i className="fa-solid fa-satellite-dish fa-spin mr-2"></i> : <i className="fa-solid fa-cloud-arrow-down mr-2"></i>}
              Pull Cloud
            </button>
            <div className="flex gap-2">
              <button onClick={handleExportCSV} className="px-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                <i className="fa-solid fa-file-csv mr-2"></i> Export CSV
              </button>
              <button onClick={handleExportAllPDF} className="px-4 py-3 bg-white text-red-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-red-50 transition-all">
                <i className="fa-solid fa-file-pdf mr-2"></i> Export PDF Report
              </button>
            </div>
          </div>
        </div>
        <div className="bg-[#243b8c] text-white p-8 rounded-[2rem] shadow-xl flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Database Archive</span>
          <span className="text-5xl font-black">{stats.total}</span>
        </div>
        <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Buffer Queue</span>
          <span className="text-5xl font-black">{stats.pending}</span>
        </div>
      </div>

      {syncStatus && (
        <div className="bg-[#243b8c] text-white p-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-lg animate-pulse">
           <i className="fa-solid fa-satellite-dish text-lg"></i> {syncStatus}
        </div>
      )}

      {/* Filtering */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar">
        {['all', 'profile', 'renewal', 'service'].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 ${
              filter === type ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black tracking-[0.2em] border-b border-slate-100">
                <th className="px-10 py-6">ID / Timestamp</th>
                <th className="px-10 py-6">Identity / Reference</th>
                <th className="px-10 py-6">Storage Tier</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-10 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-10">
                      <i className="fa-solid fa-database text-8xl"></i>
                      <p className="font-black uppercase tracking-widest">No persistent records found</p>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.map((record) => (
                <tr key={record.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                  <td className="px-10 py-8">
                    <div className="text-[10px] font-black text-slate-400 mb-1">#{record.id}</div>
                    <div className="text-xs font-bold text-slate-900">{new Date(record.timestamp).toLocaleString()}</div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      {record.data.fullName || record.data.customerName || record.data.signName || "N/A"}
                    </div>
                    <div className="flex gap-2 mt-2">
                       <span className="text-[9px] font-black text-slate-400 border border-slate-200 px-2 py-0.5 rounded uppercase">{record.formType}</span>
                       <span className="text-[9px] font-black text-slate-400 border border-slate-200 px-2 py-0.5 rounded uppercase">{record.data.plate || record.data.regNo || "REF-NONE"}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    {record.synced ? (
                      <span className="inline-flex items-center gap-2 text-green-600 text-[10px] font-black uppercase tracking-widest bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                        <i className="fa-solid fa-cloud-check"></i> Persistent Cloud
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-orange-500 text-[10px] font-black uppercase tracking-widest bg-orange-50 px-4 py-2 rounded-xl border border-orange-100">
                        <i className="fa-solid fa-clock"></i> Local Buffer
                      </span>
                    )}
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setSelectedRecord(record)} className="p-3 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                        <i className="fa-solid fa-eye"></i>
                      </button>
                      <button onClick={() => startEditing(record)} className="p-3 rounded-xl bg-slate-100 text-slate-500 hover:bg-orange-500 hover:text-white transition-all shadow-sm">
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button onClick={() => generateReceipt(record)} className="p-3 rounded-xl bg-slate-100 text-slate-500 hover:bg-[#243b8c] hover:text-white transition-all shadow-sm">
                        <i className="fa-solid fa-file-pdf"></i>
                      </button>
                      <button 
                        disabled={record.synced}
                        onClick={async () => {
                          setSyncStatus(`Syncing: ${record.id}`);
                          const success = await backendService.syncToCloud(record);
                          setSyncStatus(null);
                          if (success) loadData();
                          else alert("Manual dispatch failed.");
                        }} 
                        className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${record.synced ? 'bg-slate-50 text-slate-300' : 'bg-slate-900 text-white shadow-md hover:bg-[#243b8c]'}`}
                      >
                        {record.synced ? 'Secured' : 'Push Cloud'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center pt-8">
        <button onClick={handleClear} className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors">
          <i className="fa-solid fa-triangle-exclamation mr-2"></i> Factory Reset Local Device Storage (Purge All)
        </button>
      </div>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-[#243b8c] p-10 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Record Verification</h3>
                <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mt-1">ID: #{selectedRecord.id}</p>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition-all">
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 gap-8">
                {Object.entries(selectedRecord.data).map(([key, value]) => {
                  if (key.toLowerCase().includes('signature') || key === 'preCheck' || key === 'postCheck') return null;
                  return (
                    <div key={key} className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <p className="text-sm font-bold text-slate-800 break-words">{String(value)}</p>
                    </div>
                  );
                })}
              </div>

              {selectedRecord.signature && (
                <div className="pt-8 border-t border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-4">Captured Signature</span>
                  <div className="p-4 bg-slate-50 rounded-2xl inline-block border border-slate-100">
                    <img src={selectedRecord.signature} className="h-20 grayscale brightness-90" alt="Signature" />
                  </div>
                </div>
              )}
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              <button onClick={() => setSelectedRecord(null)} className="px-8 py-3 bg-white text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200">Close</button>
              <button onClick={() => { generateReceipt(selectedRecord); setSelectedRecord(null); }} className="px-8 py-3 bg-[#243b8c] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Download PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
            <div className="bg-orange-500 p-10 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Edit Submission</h3>
                <p className="text-orange-100 text-xs font-bold uppercase tracking-widest mt-1">Refining record data for #{editingRecord.id}</p>
              </div>
              <button onClick={() => setEditingRecord(null)} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition-all">
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.entries(editingRecord.data).map(([key, value]) => {
                  if (key.toLowerCase().includes('signature') || key === 'preCheck' || key === 'postCheck' || key === 'package') return null;
                  return (
                    <div key={key}>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                      <input 
                        type="text" 
                        value={String(editFormData[key] || '')}
                        onChange={(e) => handleEditChange(key, e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-900 outline-none focus:border-orange-500 transition-all"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-4">
                 <i className="fa-solid fa-circle-info text-orange-400 mt-1"></i>
                 <p className="text-xs font-semibold text-orange-700 leading-relaxed">
                   Saving edits will reset status to 'Local Buffer'. You must 'Push Cloud' to update the permanent Google Sheets record.
                 </p>
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              <button onClick={() => setEditingRecord(null)} className="px-8 py-3 bg-white text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200">Cancel</button>
              <button onClick={saveEdit} className="px-8 py-3 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-orange-600 transition-all">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
