import type { Metadata } from "next";
import { StageScene } from "./_components/StageScene";

export const metadata: Metadata = {
  title: "The Stage",
  description: "Step downstairs. Compose your own soundscape.",
};

export default function StagePage() {
  return <StageScene />;
}
