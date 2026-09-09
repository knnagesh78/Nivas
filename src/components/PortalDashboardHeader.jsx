import { ArrowUpRight, CalendarDays, DoorOpen, ShieldCheck, GraduationCap, ClipboardList } from 'lucide-react';
import InteractiveLoginWorld from './3d/login/InteractiveLoginWorld';

const roleDetails = {
  student: { label: 'Student portal', icon: GraduationCap, title: 'Your hostel, your space.', description: 'Keep up with your attendance, requests, and room life.', actions: ['attendance', 'leave', 'complaints', 'lostFound'] },
  warden: { label: 'Warden portal', icon: ClipboardList, title: 'Everything for the day ahead.', description: 'Manage attendance, review requests, and support your students.', actions: ['attendance', 'leave', 'complaints', 'notices'] },
  admin: { label: 'Admin portal', icon: ShieldCheck, title: 'Your hostel at a glance.', description: 'Bring your people, rooms, and hostel operations together.', actions: ['students', 'wardens', 'rooms', 'notices'] },
};

export default function PortalDashboardHeader({ role, name, meta, items, onNavigate, motion }) {
  const details = roleDetails[role] || roleDetails.student;
  const RoleIcon = details.icon;
  const actions = details.actions.map(id => items.find(item => item.id === id)).filter(Boolean);
  return <div className="nv-dashboard-welcome">
    <section className="nv-welcome">
      <div className="nv-welcome-copy">
        <span className="nv-welcome-label"><RoleIcon size={16} />{details.label}</span>
        <h1>{name ? <>Welcome back,<br /><strong>{name}.</strong></> : details.title}</h1>
        <p>{details.description}</p>
        {meta?.roomNumber ? <span className="nv-welcome-meta"><DoorOpen size={15} />Room {meta.roomNumber}{meta.course ? ` · ${meta.course}` : ''}</span> : <span className="nv-welcome-meta"><CalendarDays size={15} />{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>}
      </div>
      <div className="nv-welcome-scene"><InteractiveLoginWorld role={role} motion={motion} /></div>
    </section>
    <div className="nv-shortcuts" aria-label="Quick activities">
      {actions.map(item => {
        const Icon = item.icon;
        return <button key={item.id} type="button" className="nv-shortcut" data-depth data-color={item.color} onClick={() => onNavigate(item.id)}>
          <span className="nv-shortcut-icon"><Icon size={23} strokeWidth={1.8} /></span>
          <span className="nv-shortcut-label">{item.shortcut || item.label}</span>
          <ArrowUpRight className="nv-shortcut-arrow" size={17} />
        </button>;
      })}
    </div>
  </div>;
}
