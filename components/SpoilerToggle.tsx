"use client";
import { useEffect, useState } from "react";

export function SpoilerToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    try { setOn(localStorage.getItem("no-spoilers") === "1"); } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("no-spoilers", on);
    try { localStorage.setItem("no-spoilers", on ? "1" : "0"); } catch {}
  }, [on]);
  return (
    <button className="spoiler-toggle" aria-pressed={on} onClick={() => setOn(!on)}>
      {on ? "תוצאות מוסתרות" : "הסתר תוצאות"}
    </button>
  );
}
