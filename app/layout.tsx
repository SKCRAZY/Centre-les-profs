import "./globals.css";
import "./mobile-fix.css";
export const metadata={title:"Centre Les Profs",description:"Centre de soutien scolaire",icons:{icon:"/logo.svg",apple:"/logo.svg"}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="fr"><body>{children}</body></html>}