import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Calendar, FileText, AlertCircle, Megaphone, User, LogOut, Menu, X, DoorOpen, Users, Settings, ClipboardList, Download, GraduationCap, Package, PackageCheck, ArrowLeft, Sun, Moon, PhoneCall, Pause, Play, ChevronRight, ShieldCheck } from 'lucide-react';
import InstallWizardModal from './InstallWizardModal';
import NotificationCenter from './NotificationCenter';
import PortalDashboardHeader from './PortalDashboardHeader';
import useMotionPreference from '../hooks/useMotionPreference';
import useSurfaceDepth from '../hooks/useSurfaceDepth';

const navigation = {
  student: [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard, color: 'blue' },
    { id: 'lostFound', label: 'Lost & Found', icon: Package, color: 'purple', hint: 'Find belongings and report lost items.' },
    { id: 'calls', label: 'Call Roommates', icon: PhoneCall, color: 'teal', hint: 'Stay in touch with your roommates.' },
    { id: 'attendance', label: 'My Attendance', icon: Calendar, color: 'blue', hint: 'Keep track of your daily attendance.' },
    { id: 'leave', label: 'Leave Requests', shortcut: 'Apply for leave', icon: FileText, color: 'amber', hint: 'Request leave and follow its approval.' },
    { id: 'complaints', label: 'Complaints', icon: AlertCircle, color: 'rose', hint: 'Report an issue and track its progress.' },
    { id: 'profile', label: 'My Profile', icon: User, color: 'teal', hint: 'Your details, room, and account settings.' },
  ],
  warden: [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, color: 'teal' },
    { id: 'handovers', label: 'Lost & Found Handovers', icon: PackageCheck, color: 'purple', hint: 'Verify ownership and return belongings.' },
    { id: 'students', label: 'Students', icon: Users, color: 'blue', hint: 'View students and manage room assignments.' },
    { id: 'attendance', label: 'Attendance', shortcut: 'Mark attendance', icon: ClipboardList, color: 'teal', hint: 'Record attendance and review daily logs.' },
    { id: 'leave', label: 'Leave Approvals', shortcut: 'Review leaves', icon: FileText, color: 'amber', hint: 'Review and respond to leave applications.' },
    { id: 'complaints', label: 'Complaints', icon: AlertCircle, color: 'rose', hint: 'Review student concerns and track resolutions.' },
    { id: 'rooms', label: 'Rooms & Beds', icon: DoorOpen, color: 'blue', hint: 'Check room occupancy and available capacity.' },
    { id: 'notices', label: 'Notice Board', shortcut: 'Post a notice', icon: Megaphone, color: 'purple', hint: 'Share announcements with your hostel.' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'teal', hint: 'Manage your account details.' },
  ],
  admin: [
    { id: 'dashboard', label: 'Control Panel', icon: LayoutDashboard, color: 'amber' },
    { id: 'students', label: 'Student Manager', shortcut: 'Students', icon: GraduationCap, color: 'blue', hint: 'Manage student records and review attendance.' },
    { id: 'wardens', label: 'Warden Manager', shortcut: 'Wardens', icon: ShieldCheck, color: 'purple', hint: 'Create and manage warden accounts.' },
    { id: 'rooms', label: 'Room Configuration', shortcut: 'Rooms & beds', icon: DoorOpen, color: 'teal', hint: 'Configure rooms and hostel capacity.' },
    { id: 'notices', label: 'Hostel Notices', shortcut: 'Notices', icon: Megaphone, color: 'amber', hint: 'Publish and manage hostel announcements.' },
    { id: 'settings', label: 'Admin Settings', icon: Settings, color: 'rose', hint: 'Manage your administrator account.' },
  ],
};
const mobileIds = {
  student: ['dashboard', 'attendance', 'lostFound', 'leave', 'profile'],
  warden: ['dashboard', 'attendance', 'leave', 'notices', 'settings'],
  admin: ['dashboard', 'students', 'wardens', 'rooms', 'settings'],
};
const shortLabels = { dashboard: 'Home', attendance: 'Attendance', lostFound: 'Lost & Found', leave: 'Leave', profile: 'Profile', notices: 'Notices', settings: 'Settings', students: 'Students', wardens: 'Wardens', rooms: 'Rooms' };

export default function Layout({ children, activeTab = 'dashboard', setActiveTab, onSelectNotification, displayName, portalMeta }) {
  const { userData, logout } = useAuth();
  const { motion, toggleMotion } = useMotionPreference();
  const depthEvents = useSurfaceDepth(motion);
  const navigate = useNavigate();
  const role = navigation[userData?.role] ? userData.role : 'student';
  const items = navigation[role];
  const activeItem = items.find(item => item.id === activeTab) || items[0];
  const ActiveIcon = activeItem.icon;
  const mobileItems = mobileIds[role].map(id => items.find(item => item.id === id));
  const name = displayName || userData?.name || '';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [canInstall, setCanInstall] = useState(() => !!window.deferredPrompt);
  const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || !!window.navigator.standalone;
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('app_theme') || 'light'; } catch { return 'light'; }
  });
  const drawer = useRef(null);
  const scrollArea = useRef(null);
  useEffect(() => {
    try { localStorage.setItem('app_theme', theme); } catch { /* Theme still works locally. */ }
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  useEffect(() => {
    const element = drawer.current;
    if (mobileMenuOpen && !element.open) element.showModal();
    if (!mobileMenuOpen && element.open) element.close();
  }, [mobileMenuOpen]);
  useEffect(() => { if (scrollArea.current) scrollArea.current.scrollTop = 0; }, [activeTab]);
  useEffect(() => {
    const handleInstallable = () => setCanInstall(true);
    const handleInstalled = () => { setCanInstall(false); setWizardOpen(false); };
    const handleBeforeInstallPrompt = event => { event.preventDefault(); window.deferredPrompt = event; setCanInstall(true); };
    window.addEventListener('pwa:installable', handleInstallable);
    window.addEventListener('pwa:installed', handleInstalled);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('pwa:installable', handleInstallable);
      window.removeEventListener('pwa:installed', handleInstalled);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  const handleLogout = async () => { try { await logout(); navigate('/login'); } catch (error) { console.error('Failed to log out:', error); } };
  const openActivity = id => { setActiveTab?.(id); setMobileMenuOpen(false); };
  const toggleTheme = () => setTheme(value => value === 'light' ? 'dark' : 'light');
  const renderNavigation = () => items.map(item => {
    const Icon = item.icon;
    return <button key={item.id} type="button" className="nv-nav-item" data-color={item.color} aria-current={activeTab === item.id ? 'page' : undefined} onClick={() => openActivity(item.id)}>
      <span className="nv-nav-icon"><Icon size={19} /></span><span>{item.label}</span><ChevronRight size={15} className="nv-nav-chevron" />
    </button>;
  });
  const brand = <div className="nv-brand"><img src="/logo.svg" alt="" /><div><strong>nivas<span>.</span></strong><small>HOSTEL WORKSPACE</small></div></div>;
  return <div className="nivas-app nv-shell" data-portal={role} data-theme={theme}>
    <a className="nv-skip-link" href="#nivas-main">Skip to content</a>
    <aside className="nv-sidebar" aria-label="Main navigation">
      {brand}
      <div className="nv-role-tag"><span>{role} portal</span></div>
      <nav className="nv-navigation" aria-label="Activities">{renderNavigation()}</nav>
      <div className="nv-sidebar-account">
        <div className="nv-account-avatar">{(name || userData?.email || role).slice(0, 1).toUpperCase()}</div>
        <div><strong>{name || `${role[0].toUpperCase()}${role.slice(1)} account`}</strong><span>{userData?.email}</span></div>
      </div>
      <button type="button" className="nv-signout" onClick={handleLogout}><LogOut size={17} />Sign out</button>
    </aside>
    <div className="nv-workspace">
      <header className="nv-toolbar">
        <div className="nv-toolbar-title"><button type="button" className="nv-icon-button nv-menu-trigger" onClick={() => setMobileMenuOpen(true)} aria-label="Open activities menu"><Menu size={21} /></button><div><span className="nv-toolbar-role">{role} workspace</span><strong>{activeItem.label}</strong></div></div>
        <div className="nv-toolbar-actions">
          {canInstall && !isStandaloneMode && <button type="button" className="nv-download-button" onClick={() => setWizardOpen(true)}><Download size={16} /><span>Install app</span></button>}
          <button type="button" className="nv-icon-button" onClick={toggleMotion} aria-pressed={motion} aria-label={motion ? 'Pause animations' : 'Enable animations'} title={motion ? 'Pause animations' : 'Enable animations'}>{motion ? <Pause size={17} /> : <Play size={17} />}</button>
          <button type="button" className="nv-icon-button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} title={theme === 'dark' ? 'Light theme' : 'Dark theme'}>{theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button>
          <div className="nv-notifications"><NotificationCenter onSelectNotification={onSelectNotification} /></div>
        </div>
      </header>
      <main ref={scrollArea} id="nivas-main" className="nv-main" tabIndex={-1}>
        <div className="nivas-content nv-content" {...depthEvents}>
          {activeTab === 'dashboard' ? <PortalDashboardHeader role={role} name={name} meta={portalMeta} items={items} onNavigate={openActivity} motion={motion} /> : <section className="nv-activity-heading" data-color={activeItem.color}>
            <div className="nv-activity-heading-copy"><button type="button" className="nv-back-button" onClick={() => openActivity('dashboard')}><ArrowLeft size={16} />Back to home</button><h1>{activeItem.label}</h1><p>{activeItem.hint}</p></div>
            <span className="nv-activity-emblem" aria-hidden="true"><ActiveIcon size={43} strokeWidth={1.6} /></span>
          </section>}
          <div className="nv-activity-body">{children}</div>
        </div>
      </main>
    </div>
    <nav className="nv-bottom-nav" aria-label="Quick navigation">
      {mobileItems.map(item => {
        const Icon = item.icon;
        return <button key={item.id} type="button" data-color={item.color} aria-current={activeTab === item.id ? 'page' : undefined} onClick={() => openActivity(item.id)}><span><Icon size={21} /></span><small>{shortLabels[item.id]}</small></button>;
      })}
    </nav>
    <dialog ref={drawer} className="nv-drawer" onCancel={() => setMobileMenuOpen(false)} onClose={() => setMobileMenuOpen(false)} onClick={event => { if (event.target === event.currentTarget) setMobileMenuOpen(false); }} aria-labelledby="nv-drawer-title">
      <div className="nv-drawer-header"><h2 id="nv-drawer-title">Your activities</h2><button type="button" autoFocus className="nv-icon-button" aria-label="Close activities menu" onClick={() => setMobileMenuOpen(false)}><X size={20} /></button></div>
      <nav aria-label="All activities" className="nv-navigation">{renderNavigation()}</nav>
      <button type="button" className="nv-signout" onClick={handleLogout}><LogOut size={18} />Sign out</button>
    </dialog>
    <InstallWizardModal isOpen={wizardOpen} onClose={() => setWizardOpen(false)} onInstalled={() => { setCanInstall(false); setWizardOpen(false); }} />
  </div>;
}
