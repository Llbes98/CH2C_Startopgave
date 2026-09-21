"use client";

import { notFound, useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ArcadeGame from "@/app/components/ArcadeGame";

function GameContent() {
  const params = useParams<{ game: string }>();
  const search = useSearchParams();
  if (!(["tetris", "pacman", "snake"] as string[]).includes(params.game)) notFound();
  return <ArcadeGame game={params.game as "tetris" | "pacman" | "snake"} mobile={search.get("device") === "mobile"} />;
}

export default function GamePage() { return <Suspense><GameContent /></Suspense>; }
