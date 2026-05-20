import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminNav from "../components/AdminNav.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";

const AdminBlog = () => {
  const { showToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [filters, setFilters] = useState({ search: "", category: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPosts = () => {
    setIsLoading(true);
    api
      .get("/admin/blog", { params: filters })
      .then((response) => {
        setPosts(response.data.posts || []);
        setError("");
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load blog posts."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadPosts();
  }, [filters]);

  const togglePublish = async (post) => {
    try {
      const response = await api.put(`/admin/blog/${post._id}/publish`, { isPublished: !post.isPublished });
      setPosts((current) => current.map((item) => (item._id === post._id ? response.data.post : item)));
      showToast(response.data.post.isPublished ? "Post published." : "Post unpublished.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update post.");
    }
  };

  const deletePost = async (postId) => {
    if (!window.confirm("Delete this blog post?")) return;
    try {
      await api.delete(`/admin/blog/${postId}`);
      setPosts((current) => current.filter((post) => post._id !== postId));
      showToast("Blog post deleted.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete post.");
    }
  };

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading row-heading">
        <div>
          <p className="eyebrow">Content Marketing</p>
          <h1>Blog Management</h1>
        </div>
        <Link className="button-link" to="/admin/blog/new">Add blog post</Link>
      </div>
      <div className="filter-bar">
        <input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search posts" />
        <input value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))} placeholder="Category" />
      </div>
      {isLoading ? <div className="analytics-skeleton">Loading blog posts...</div> : null}
      {error ? <div className="form-alert">{error}</div> : null}
      {!isLoading && !posts.length && !error ? (
        <div className="empty-state"><h2>No blog posts yet</h2><p>Create Cantley SEO and inspiration content.</p></div>
      ) : (
        <div className="admin-table">
          {posts.map((post) => (
            <div className="admin-row content-admin-row" key={post._id}>
              <div>
                <strong>{post.title}</strong>
                <span>{post.category} | {Number(post.views || 0).toLocaleString("en-IN")} views</span>
              </div>
              <span className={`status-badge ${post.isPublished ? "status-approved" : "status-pending"}`}>{post.isPublished ? "Published" : "Draft"}</span>
              <Link to={`/admin/blog/${post._id}/edit`}>Edit</Link>
              <button type="button" onClick={() => togglePublish(post)}>{post.isPublished ? "Unpublish" : "Publish"}</button>
              <button type="button" onClick={() => deletePost(post._id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminBlog;
