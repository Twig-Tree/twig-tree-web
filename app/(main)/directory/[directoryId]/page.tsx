import { DirectoryGrid, DirectoryHeader } from "@/src/widgets/directory";
import { notFound } from "next/navigation";
import { getDirectoryPageData } from "../_data/mockDirectories";

interface DirectoryDetailPageProps {
  params: Promise<{ directoryId: string }>;
}

export default async function DirectoryPage({
  params,
}: DirectoryDetailPageProps) {
  const { directoryId } = await params;
  const directory = getDirectoryPageData(directoryId);

  if (!directory) {
    notFound();
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50/70 px-6 py-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <DirectoryHeader
          title={directory.title}
          breadcrumbs={directory.breadcrumbs}
        />
        <DirectoryGrid items={directory.items} />
      </div>
    </div>
  );
}
