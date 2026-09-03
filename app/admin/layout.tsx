import AdminMenu from './AdminMenu';
import PhoneDuplicateGuard from './PhoneDuplicateGuard';
import NewSeance from './NewSeance';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<AdminMenu /><PhoneDuplicateGuard /><NewSeance /></>;
}