import AdminMenu from './AdminMenu';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<AdminMenu /></>;
}
