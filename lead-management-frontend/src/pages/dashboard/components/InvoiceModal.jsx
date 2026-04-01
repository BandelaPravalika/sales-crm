import React from 'react';
import { X } from 'lucide-react';

const InvoiceModal = ({ isOpen, onClose, invoiceData }) => {
   if (!isOpen || !invoiceData) return null;

   const handlePrint = () => {
      window.print();
   };

   const handleShare = async () => {
      const text = `Receipt\nName: ${invoiceData.leadName}\nAmount: ₹${invoiceData.amount}\nRef: ${invoiceData.paymentGatewayId || invoiceData.id}`;
      try {
         if (navigator.share) {
            await navigator.share({ title: 'Receipt', text });
         } else {
            window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`);
         }
      } catch (err) { }
   };

   return (
      <div
         style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(6px)',
            zIndex: 12000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
         }}
      >
         <div
            style={{
               width: '100%',
               maxWidth: '700px',
               maxHeight: '90vh',
               background: '#fff',
               borderRadius: '12px',
               display: 'flex',
               flexDirection: 'column',
               overflow: 'hidden'
            }}
         >
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
               <strong>Payment Receipt</strong>
               <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-dark" onClick={handleShare}>
                     Share
                  </button>
                  <button className="btn btn-sm btn-primary" onClick={handlePrint}>
                     Print
                  </button>
                  <button className="btn btn-sm btn-light" onClick={onClose}>
                     <X size={14} />
                  </button>
               </div>
            </div>

            {/* Body */}
            <div id="printable-invoice" style={{ padding: '20px', overflowY: 'auto' }}>

               {/* Title */}
               <div className="mb-4">
                  <h4 className="mb-1">NEXUS CRM</h4>
                  <small className="text-muted">Official Receipt</small>
               </div>

               {/* Meta */}
               <div className="mb-4 d-flex justify-content-between">
                  <div>
                     <div><strong>Name:</strong> {invoiceData.leadName}</div>
                     <div><strong>Mobile:</strong> {invoiceData.mobile}</div>
                  </div>

                  <div className="text-end">
                     <div>
                        <strong>Date:</strong>{' '}
                        {new Date(invoiceData.date || invoiceData.createdAt).toLocaleDateString()}
                     </div>
                     <div>
                        <strong>Ref:</strong> #{invoiceData.paymentGatewayId || invoiceData.id}
                     </div>
                  </div>
               </div>

               {/* Table */}
               <div className="border rounded mb-4">
                  <div className="d-flex justify-content-between p-2 border-bottom bg-light">
                     <strong>Description</strong>
                     <strong>Amount</strong>
                  </div>

                  <div className="d-flex justify-content-between p-3">
                     <span>{invoiceData.paymentType || 'Fee Payment'}</span>
                     <strong>₹{invoiceData.amount}</strong>
                  </div>

                  <div className="d-flex justify-content-between p-3 border-top bg-light">
                     <strong>Total</strong>
                     <strong>₹{invoiceData.amount}</strong>
                  </div>
               </div>

               {/* Status */}
               <div className="text-success fw-bold mb-3">
                  Payment Successful
               </div>

               {/* Footer note */}
               <div className="text-muted small">
                  This is a system-generated receipt.
               </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-top">
               <button className="btn btn-primary w-100" onClick={handlePrint}>
                  Download PDF
               </button>
            </div>
         </div>

         {/* Print CSS */}
         <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
      </div>
   );
};

export default InvoiceModal;