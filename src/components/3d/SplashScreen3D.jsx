import { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import Hostel3DCanvas from './Hostel3DCanvas';

export default function SplashScreen3D({ onComplete, motion = true }) {
  const button = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    button.current?.focus();
    const timer = setTimeout(onComplete, motion ? 2000 : 250);
    const escape = event => { if (event.key === 'Escape') onComplete(); };
    document.addEventListener('keydown', escape);
    return () => { clearTimeout(timer); document.removeEventListener('keydown', escape); previous?.focus?.(); };
  }, [onComplete, motion]);
  return <div className="nivas-splash" role="dialog" aria-modal="true" aria-label="Welcome to Nivas" onKeyDown={event => { if (event.key === 'Tab') { event.preventDefault(); button.current?.focus(); } }}>
    <div className="nivas-splash-brand"><img src="/logo.svg" alt="" /><span>nivas.</span></div>
    <div className="nivas-splash-scene"><Hostel3DCanvas activeRole="admin" motion={motion} /></div>
    <p>Welcome to your hostel.</p>
    <button ref={button} type="button" onClick={onComplete}>Continue to login <ArrowRight size={18} /></button>
    <div className="nivas-splash-progress" aria-hidden="true"><span /></div>
  </div>;
}
