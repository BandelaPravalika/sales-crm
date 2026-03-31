import React from 'react';
import { X, Printer, CheckCircle, Download, CreditCard, ShieldCheck, Share2 } from 'lucide-react';

const InvoiceModal = ({ isOpen, onClose, invoiceData }) => {
  if (!isOpen || !invoiceData) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const text = `Official Payment Receipt from Gyantrix.\nStudent: ${invoiceData.leadName || 'Student'}\nAmount: ₹${invoiceData.amount}\nUID: ${invoiceData.paymentGatewayId || invoiceData.id}\nStatus: PAID`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Official Invoice - Gyantrix',
          text: text
        });
      } else {
        const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
        // Fallback for laptops without native share API - opens WA desktop or web
        window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
      }
    } catch (err) {
      console.log('Error sharing:', err);
    }
  };

  return (
    <div className="modal-overlay d-flex align-items-center justify-content-center px-3" style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1100, backdropFilter: 'blur(8px)' 
    }}>
      <div className="bg-white rounded-5 shadow-2xl overflow-hidden w-100 animate-slide-up" style={{ maxWidth: '850px', color: '#1e293b' }}>
        
        {/* Top Floating Actions - Non-printable */}
        <div className="d-flex justify-content-end align-items-center p-3 d-print-none border-bottom bg-light bg-opacity-50 gap-2">
            <button onClick={handleShare} className="btn btn-outline-success btn-sm d-flex align-items-center gap-2 rounded-3 px-3 fw-bold border-success border-opacity-25 bg-success bg-opacity-10 text-success" title="Share via WhatsApp/Mobile">
              <Share2 size={16} /> Share
            </button>
            <button onClick={handlePrint} className="btn btn-outline-dark btn-sm d-flex align-items-center gap-2 rounded-3 px-3 fw-bold border-secondary border-opacity-25">
              <Printer size={16} /> Print
            </button>
            <button onClick={onClose} className="btn btn-light btn-sm rounded-3 p-2 border">
              <X size={18} />
            </button>
        </div>

        {/* Invoice Container - Printable */}
        <div className="p-0 d-print-bg-white" id="printable-invoice">
          
          <div className="p-5">
            {/* Logo and Branding Header */}
            <div className="d-flex justify-content-between align-items-start mb-5">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-primary rounded-4 d-flex align-items-center justify-content-center text-white fw-black" style={{ width: '48px', height: '48px', fontSize: '24px' }}>G</div>
                <div>
                  <h4 className="fw-black text-dark mb-0 tracking-tighter">GYANTRIX</h4>
                  <p className="text-muted small fw-bold text-uppercase ls-1 mb-0 opacity-50" style={{ fontSize: '10px' }}>Education Management System</p>
                </div>
              </div>
              <div className="text-end">
                <p className="text-muted small fw-bold text-uppercase ls-2 mb-1">Date of Issue</p>
                <h5 className="fw-black text-dark">{new Date(invoiceData.date || invoiceData.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</h5>
              </div>
            </div>

            {/* Headline Section */}
            <div className="mb-5">
               <h1 className="fw-black text-dark tracking-tighter mb-1" style={{ fontSize: '48px' }}>INVOICE</h1>
               <p className="text-muted fw-bold mb-0">#{invoiceData.paymentGatewayId || `INV-${invoiceData.id}`}</p>
            </div>

            {/* Info Grid */}
            <div className="row mb-5 g-4 border-bottom pb-5">
              <div className="col-7">
                <label className="text-muted text-uppercase small fw-bold ls-2 mb-2 d-block opacity-40">Bill To</label>
                <h5 className="fw-black text-dark mb-1">{invoiceData.leadName}</h5>
                <p className="text-muted small mb-1">Student ID: {invoiceData.leadId || 'N/A'}</p>
                <p className="text-muted small mb-0">Enrolled Course: {invoiceData.courseName || 'Professional Course'}</p>
              </div>
              <div className="col-5">
                <label className="text-muted text-uppercase small fw-bold ls-2 mb-2 d-block opacity-40">Payment Info</label>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="small text-muted fw-bold">Method:</span>
                  <span className="small fw-bold text-dark">{invoiceData.paymentMethod || 'UPI / Online Transfer'}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="small text-muted fw-bold">Status:</span>
                  <div className="d-flex align-items-center gap-2 text-success">
                    <CheckCircle size={14} className="fill-success opacity-20" />
                    <span className="small fw-black text-uppercase ls-1">PAID</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="mb-5">
               <div className="row pb-3 border-bottom mb-4">
                  <div className="col-8"><span className="text-muted x-small fw-black text-uppercase ls-2 opacity-50">Description</span></div>
                  <div className="col-4 text-end"><span className="text-muted x-small fw-black text-uppercase ls-2 opacity-50">Amount</span></div>
               </div>
               <div className="row align-items-center mb-4">
                  <div className="col-8">
                     <h6 className="fw-black text-dark mb-1">{invoiceData.paymentType || 'Course Installment'} - #{invoiceData.id}</h6>
                     <p className="text-muted small mb-0 fw-medium">Official enrollment transaction through manual approval.</p>
                  </div>
                  <div className="col-4 text-end">
                     <h5 className="fw-black text-dark mb-0">₹{invoiceData.amount}</h5>
                  </div>
               </div>
            </div>

            {/* Total Footer */}
            <div className="rounded-4 p-4 bg-light bg-opacity-50 d-flex justify-content-between align-items-center mt-5 mb-4">
               <span className="text-muted small fw-black text-uppercase ls-2 opacity-40">Total Paid</span>
               <h2 className="fw-black text-primary mb-0" style={{ fontSize: '32px' }}>₹{invoiceData.amount}</h2>
            </div>
          </div>

          {/* Large Action Button - Non-printable */}
          <div className="p-4 bg-dark bg-opacity-90 d-print-none text-center">
             <button onClick={handlePrint} className="btn w-100 py-3 rounded-3 fw-black text-white text-uppercase tracking-widest d-flex align-items-center justify-content-center gap-3 transition-smooth" style={{ background: 'linear-gradient(to right, #1e293b, #0f172a)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Download size={20} />
                Download Official Receipt (PDF)
             </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .fw-black { font-weight: 900; }
        .ls-1 { letter-spacing: 0.1em; }
        .ls-2 { letter-spacing: 0.2em; }
        .x-small { fontSize: 10px; }
        .bg-surface { background-color: #f8fafc; }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @media print {
          .modal-overlay { background-color: white !important; backdrop-filter: none !important; padding: 0 !important; }
          .d-print-none { display: none !important; }
          .rounded-5 { border-radius: 0 !important; }
          .shadow-2xl { box-shadow: none !important; }
          body { background: white !important; }
          #printable-invoice { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default InvoiceModal;
