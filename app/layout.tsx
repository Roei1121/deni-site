import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { isDemo } from "@/lib/data";

export const metadata: Metadata = {
  title: { default: "דני אבדיה — הבוקר שאחרי", template: "%s | דני אבדיה" },
  description: "כל מה שדני אבדיה עשה הלילה: שורת סטטיסטיקה, וידאו, כתבות מישראל ומארה״ב. אתר אוהדים לא רשמי.",
};
export const viewport: Viewport = { themeColor: "#16213e", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <Header />
        {isDemo && <div className="demo">מצב דמו: הנתונים באתר לדוגמה בלבד. חברו Supabase כדי לראות נתונים אמיתיים.</div>}
        {children}
        <footer className="foot">
          <div className="wrap">אתר אוהדים לא רשמי. לא קשור ל-NBA, לפורטלנד טרייל בלייזרס או לדני אבדיה. סרטונים מוטמעים מ-YouTube; כתבות מקושרות למקור.</div>
        </footer>
      </body>
    </html>
  );
}
