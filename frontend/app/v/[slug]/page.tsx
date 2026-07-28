import { VenuePublicView } from "@/features/venue-public/components/VenuePublicView";

export default async function VenuePublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return <VenuePublicView slug={slug} />;
}
