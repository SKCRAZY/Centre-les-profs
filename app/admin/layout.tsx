import AdminMenu from './AdminMenu';
import PhoneDuplicateGuard from './PhoneDuplicateGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<AdminMenu /><PhoneDuplicateGuard /></>;
}
