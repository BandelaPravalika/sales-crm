import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

const PaymentPortal = () => {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const mode = searchParams.get('mode') || 'sandbox'; // Default to sandbox per user request

  useEffect(() => {
    if (!sessionId) {
      setError('Invalid Session ID');
      return;
    }

    // 1. Load Cashfree v3 SDK Script
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => {
      try {
        // 2. Initialize SDK
        if (!window.Cashfree) {
          setError('Cashfree SDK failed to initialize');
          return;
        }

        const cashfree = new window.Cashfree({
          mode: mode 
        });

        // 3. Initiate Checkout
        cashfree.checkout({
          paymentSessionId: sessionId,
          redirectTarget: '_self'
        });
      } catch (err) {
        console.error('SDK Error:', err);
        setError('Failed to initialize payment gateway');
      }
    };
    script.onerror = () => {
      setError('Failed to load payment script');
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [sessionId, mode]);

  return (
    <div className="min-h-screen grid place-items-center bg-[#0a0f1e] text-white">
      <div className="glass card p-8 text-center animate-fade-in max-w-sm">
        {error ? (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-error/20 p-4 rounded-full">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold">Payment Error</h2>
            <p className="opacity-70 text-sm">{error}</p>
            <button 
              className="btn btn-primary mt-4 w-full" 
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <div className="absolute inset-0 grid place-items-center">
                <span className="text-xl font-bold">₹</span>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Initializing Payment</h2>
              <p className="opacity-60 text-sm">Please wait while we redirect you to the secure Cashfree checkout portal...</p>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-primary animate-progress"></div>
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes progress {
          0% { width: 0; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default PaymentPortal;
