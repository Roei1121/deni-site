import type { Metadata } from "next";
import { getGames } from "@/lib/data";
import { GameRow } from "@/components/GameRow";

export const revalidate = 300;
export const metadata: Metadata = { title: "לוח משחקים" };

export default async function Games() {
  const games = await getGames();
  const upcoming = games.filter((g) => g.status !== "final").reverse();
  const played = games.filter((g) => g.status === "final");
  return (
    <main className="wrap">
      {!!upcoming.length && (
        <section className="section">
          <div className="section-head"><h2>הבאים בתור</h2></div>
          <p className="lede">כל השעות בשעון ישראל.</p>
          <ul className="games">{upcoming.map((g) => <GameRow key={g.id} g={g} />)}</ul>
        </section>
      )}
      <section className="section">
        <div className="section-head"><h2>שוחקו</h2></div>
        <ul className="games">{played.map((g) => <GameRow key={g.id} g={g} />)}</ul>
      </section>
    </main>
  );
}
