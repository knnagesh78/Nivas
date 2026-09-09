import { useEffect, useRef } from 'react';
import { X, KeyRound } from 'lucide-react';

export default function ResetPasswordDialog({ open, onClose, email, setEmail, onSubmit, loading, message, error }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return <dialog ref={ref} className="nivas-reset" onCancel={onClose} onClose={onClose} aria-labelledby="reset-title">
    <button type="button" className="nivas-dialog-close" onClick={onClose} aria-label="Close password reset"><X size={20} /></button>
    <KeyRound size={30} />
    <h2 id="reset-title">Reset your password</h2>
    <p>Enter your account email to receive a reset link.</p>
    <form onSubmit={onSubmit}>
      <label htmlFor="reset-email">Email address</label>
      <input autoFocus id="reset-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
      {message && <p className="nivas-success" role="status">{message}</p>}
      {error && <p className="nivas-error" role="alert">{error}</p>}
      <button type="submit" className="nivas-submit" disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</button>
    </form>
  </dialog>;
}
