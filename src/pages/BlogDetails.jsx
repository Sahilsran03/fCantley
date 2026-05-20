import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SEO from "../components/SEO.jsx";
import api from "../services/api.js";
import { getOptimizedImageUrl } from "../utils/media.js";
import { sanitizeHtml } from "../utils/sanitizeHtml.js";

const BlogDetails = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/blog/${slug}`)
      .then((response) => {
        setPost(response.data.post);
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load story."));
  }, [slug]);

  if (error) return <section className="admin-page"><div className="form-alert">{error}</div><Link className="button-link" to="/blog">Back to blog</Link></section>;
  if (!post) return <div className="analytics-skeleton">Loading story...</div>;

  return (
    <article className="editorial-detail">
      <SEO title={post.metaTitle || post.title} description={post.metaDescription || post.excerpt} image={getOptimizedImageUrl(post.coverImage, { width: 1200 })} canonical={`/blog/${post.slug}`} type="article" />
      <div className="editorial-hero">
        <p className="eyebrow">{post.category}</p>
        <h1>{post.title}</h1>
        <p>{post.excerpt}</p>
        <span>{post.author || "Cantley"} | {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "Draft"} | {Number(post.views || 0).toLocaleString("en-IN")} views</span>
      </div>
      <img className="editorial-cover" src={getOptimizedImageUrl(post.coverImage, { width: 1400 }) || "https://placehold.co/1200x720/f1f5f9/334155?text=Cantley"} alt={post.title} />
      <div className="cms-content editorial-body" dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />
      {post.tags?.length ? <div className="file-list">{post.tags.map((tag) => <Link key={tag} to={`/blog?tag=${encodeURIComponent(tag)}`}>{tag}</Link>)}</div> : null}
    </article>
  );
};

export default BlogDetails;
