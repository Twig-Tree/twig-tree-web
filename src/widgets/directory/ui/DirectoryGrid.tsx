import {
  DirectoryItemCard,
  type DirectoryItem,
} from "@/src/entities/directory";

interface DirectoryGridProps {
  items: DirectoryItem[];
}

export function DirectoryGrid({ items }: DirectoryGridProps) {
  return (
    <section
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      aria-label="Directory items"
    >
      {items.map((item) => (
        <DirectoryItemCard key={item.id} item={item} />
      ))}
    </section>
  );
}
