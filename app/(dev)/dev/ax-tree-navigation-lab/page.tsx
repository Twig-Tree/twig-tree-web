import { notFound } from "next/navigation";
import { AxTreeNavigationLab } from "@/src/widgets/ax-tree-navigation-lab";

export default function AxTreeNavigationLabPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <AxTreeNavigationLab />;
}
