export const getMediaUrl = (media) => {
  if (!media) return "";
  return typeof media === "string" ? media : media.url || "";
};

export const getMediaPublicId = (media) => {
  if (!media || typeof media === "string") return "";
  return media.publicId || "";
};

export const getOptimizedImageUrl = (media, options = {}) => {
  const url = getMediaUrl(media);
  if (!url || !url.includes("/upload/")) return url;

  const width = options.width || 720;
  const quality = options.quality || "auto";
  return url.replace("/upload/", `/upload/f_auto,q_${quality},c_limit,w_${width}/`);
};
