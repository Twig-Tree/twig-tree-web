import { notFound } from "next/navigation";
import { AnimationLab } from "@/src/widgets/animation-lab";

export default function AnimationLabPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <AnimationLab />;
}
