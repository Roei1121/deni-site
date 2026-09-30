import Link from "next/link";
import { SpoilerToggle } from "./SpoilerToggle";

const LINKS = [
  { href: "/", label: "ראשי" },
  { href: "/games", label: "משחקים" },
  { href: "/stats", label: "סטטיסטיקה" },
  { href: "/videos", label: "וידאו" },
  { href: "/news", label: "חדשות" },
];

export function Header() {
  return (
    <header className="site-head">
      <div className="wrap">
        <Link href="/" className="brand">דני. הבוקר שאחרי</Link>
        <nav className="nav" aria-label="ניווט ראשי">
          {LINKS.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
        </nav>
        <SpoilerToggle />
      </div>
    </header>
  );
}
