import type { Metadata } from "next";
import { SpeakeasyScene } from "./_components/SpeakeasyScene";

export const metadata: Metadata = {
  title: "411 — Leche Negra",
  description: "Behind the painting.",
};

export default function SpeakeasyPage() {
  return <SpeakeasyScene />;
}
