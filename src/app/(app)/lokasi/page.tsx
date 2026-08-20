import { LocationExplorer } from "@/components/lokasi/location-explorer";
import { getLocationTree } from "@/lib/locations";

export default async function LokasiPage() {
  const gedungList = await getLocationTree();

  const lantaiCount = gedungList.reduce((sum, g) => sum + g.lantai.length, 0);
  const ruangCount = gedungList.reduce(
    (sum, g) => sum + g.lantai.reduce((lSum, l) => lSum + l.ruang.length, 0),
    0,
  );
  const breadcrumb = `${gedungList.length} gedung · ${lantaiCount} lantai · ${ruangCount} ruang`;

  return <LocationExplorer gedungList={gedungList} breadcrumb={breadcrumb} />;
}
