import type { Metadata } from "next";
import { NotFoundScene } from "./components/NotFoundScene";

export const metadata: Metadata = {
  title: "Lost in the back hallway",
  description:
    "You've wandered a little far. Find your way back to the floor at Leche Negra.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <NotFoundScene />;
}
