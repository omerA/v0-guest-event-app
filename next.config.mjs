/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "videos.pexels.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "*.uploadthing.com" },
    ],
  },
}

export default nextConfig
