Overview
CoTrac Terminal v2.0 is a professional industrial-grade operational suite designed for high-stakes fleet management and security services. It streamlines the intake process through digital customer profiling, subscription renewals, and comprehensive technical service audits. By prioritizing a local-first architecture, the system ensures 100% uptime in low-connectivity environments while maintaining robust cloud synchronization.
Key Features
Persistent Local Storage: Utilizes IndexedDB for indefinite data retention, ensuring records are never lost due to session timeouts or connectivity issues.
Dual-Signature Verification: Integrated signature pads for both Customer and Technical Advisor authentication, critical for service liability protection.
Automated Document Synthesis:
Individual Receipts: Real-time PDF generation for every submission, capturing all field data and inspection check-lists.
Bulk Audit Reports: Administrative capability to export entire database segments into professional PDF or CSV formats.
Cloud Synchronization: Background dispatch system that mirrors local records to Google Sheets via secure Apps Script endpoints.
Role-Based Access Control (RBAC): Distinct interfaces for Administrators (Full Audit/DB), Technicians (Service Checks), and Sales (Intake/Renewals).
Technical Stack
Frontend: React (ESM), Tailwind CSS, FontAwesome.
Persistence: IndexedDB (Browser Database).
PDF Engine: jsPDF & AutoTable.
Integration: Google Apps Script (REST API).
Administrative Security
The system features a Database Vault for administrative tasks. Access to the control center requires secondary verification (dbadmin) to manage the persistent archive, trigger cloud pulls, or perform factory resets of the device storage.
© 2024 CoTrac Satellite Systems Ltd. | Operational Integrity through Technology.
