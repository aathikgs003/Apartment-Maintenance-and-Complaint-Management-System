import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const GoogleButton = ({ className }) => {
  const { googleLogin } = useAuth();
  const [ready, setReady] = useState(false);
  const btnRef = useRef(null);

  useEffect(() => {
    const src = 'https://accounts.google.com/gsi/client';
    if (window.google) {
      setReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => setReady(true);
    document.body.appendChild(script);

    return () => { };
  }, []);

  const loginRef = useRef(googleLogin);
  useEffect(() => {
    loginRef.current = googleLogin;
  }, [googleLogin]);

  useEffect(() => {
    if (!ready) return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    console.debug('GSI init - VITE_GOOGLE_CLIENT_ID =', clientId);
    if (!clientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID is not set');
      return;
    }

    // Initialize GSI with callback that receives the ID token
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          // Debug: log returned credential presence
          console.debug('GSI callback response present:', !!response, response && { hasCredential: !!response.credential });
          if (response && response.credential && loginRef.current) {
            await loginRef.current(response.credential);
          }
        },
      });

      // Render Google's official button into our container
      if (btnRef.current) {
        window.google.accounts.id.renderButton(btnRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
        });
      }
    } catch (err) {
      console.error('GSI initialization error', err);
    }
  }, [ready]);

  return (
    <div className={className}>
      <div ref={btnRef} />
      {!ready && (
        <button className="w-full flex items-center justify-center space-x-3 border border-gray-300 py-3 rounded-lg" disabled>
          <span className="bg-white rounded px-2 py-1 text-sm font-semibold">G</span>
          <span className="text-sm font-medium">Continue with Google</span>
        </button>
      )}
    </div>
  );
};



export default GoogleButton;
