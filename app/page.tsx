import { ReviewHomeStudio } from "@/components/review-home-studio";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ verified?: string }> }) {
  const params = await searchParams;
  return <ReviewHomeStudio verified={params.verified === "1"} />;
}
