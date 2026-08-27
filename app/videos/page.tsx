import type { Metadata } from "next";
import { VideoLibrary } from "@/components/video-library";
import { learningVideos } from "@/lib/video-library";

export const metadata: Metadata = {
  title: "Học qua video",
  description: "Luyện nghe tiếng Trung theo tình huống với Himi Original và video được tuyển chọn theo trình độ.",
};

export default function VideosPage() {
  return <VideoLibrary videos={learningVideos} />;
}
