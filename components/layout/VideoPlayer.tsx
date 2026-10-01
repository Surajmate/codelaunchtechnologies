import { useMemo } from "react";
import { Play } from "lucide-react";

function getYouTubeId(url: any) {
  try {
    const parsedUrl = new URL(url);

    // youtube.com/watch?v=VIDEO_ID
    if (parsedUrl.hostname.includes("youtube.com")) {
      const videoId = parsedUrl.searchParams.get("v");

      if (videoId) {
        return videoId;
      }

      // youtube.com/embed/VIDEO_ID
      if (parsedUrl.pathname.startsWith("/embed/")) {
        return parsedUrl.pathname.split("/embed/")[1];
      }

      // youtube.com/shorts/VIDEO_ID
      if (parsedUrl.pathname.startsWith("/shorts/")) {
        return parsedUrl.pathname.split("/shorts/")[1];
      }
    }

    // youtu.be/VIDEO_ID
    if (parsedUrl.hostname === "youtu.be") {
      return parsedUrl.pathname.substring(1);
    }

    return null;
  } catch {
    return null;
  }
}

function getVimeoId(url: any) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("vimeo.com")) {
      const parts = parsedUrl.pathname.split("/").filter(Boolean);

      return parts[parts.length - 1] || null;
    }

    return null;
  } catch {
    return null;
  }
}

function isDirectVideo(url: any) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

export default function VideoPlayer({ videoUrl, title = "Course Video" }: { videoUrl: any; title: string }) {
  const videoType = useMemo(() => {
    if (!videoUrl) {
      return "none";
    }

    if (getYouTubeId(videoUrl)) {
      return "youtube";
    }

    if (getVimeoId(videoUrl)) {
      return "vimeo";
    }

    if (isDirectVideo(videoUrl)) {
      return "video";
    }

    return "external";
  }, [videoUrl]);

  const youtubeId = videoType === "youtube"
    ? getYouTubeId(videoUrl)
    : null;

  const vimeoId = videoType === "vimeo"
    ? getVimeoId(videoUrl)
    : null;

  if (videoType === "none") {
    return (
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
        <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-white/[0.04] to-transparent">
          <div className="text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/10">
              <Play
                size={22}
                className="ml-1"
                fill="currentColor"
              />
            </div>

            <p className="mt-4 text-sm font-medium">
              Lesson Content
            </p>

            <p className="mt-1 text-xs text-white/25">
              Video content will be available here
            </p>

          </div>
        </div>
      </section>
    );
  }

  // YouTube
  if (videoType === "youtube") {
    return (
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-black">
        <div className="aspect-video">

          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />

        </div>
      </section>
    );
  }

  // Vimeo
  if (videoType === "vimeo") {
    return (
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-black">
        <div className="aspect-video">

          <iframe
            className="h-full w-full"
            src={`https://player.vimeo.com/video/${vimeoId}`}
            title={title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />

        </div>
      </section>
    );
  }

  // Direct MP4/WebM/Ogg
  if (videoType === "video") {
    return (
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
        <div className="aspect-video bg-black">

          <video
            className="h-full w-full object-contain"
            controls
            preload="metadata"
          >
            <source src={videoUrl} />

            Your browser does not support video playback.
          </video>

        </div>
      </section>
    );
  }

  // Unknown/external URL
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
      <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-white/[0.04] to-transparent">

        <div className="text-center">

          <p className="text-sm font-medium">
            Video link
          </p>

          <p className="mt-2 text-xs text-white/40">
            This video format cannot be embedded.
          </p>

          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-white/90"
          >
            Open Video
          </a>

        </div>

      </div>
    </section>
  );
}