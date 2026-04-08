import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import BuyerLayout from "./BuyerLayout";
import axios from "axios";
import { API_ENDPOINTS } from "../../../api/apiConfig";
import { placeholderMedium } from "../../../utils/placeholders";
import { getImageUrl, fetchProtectedUrl } from "../../../utils/imageUrl";

const BuyerAlbumAccess = () => {
  const { albumId, token } = useParams();
  const [mediaList, setMediaList] = useState([]);
  const [imageUrls, setImageUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlbumMedia = useCallback(async () => {
    if (!albumId || !token) {
      setError("Invalid access link.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(API_ENDPOINTS.MEDIA.ALBUM_ACCESS_VIEW(albumId, token), {
        timeout: 15000,
      });

      // Handle various response formats
      let items = [];
      if (Array.isArray(res.data)) {
        items = res.data;
      } else if (res.data?.media && Array.isArray(res.data.media)) {
        items = res.data.media;
      } else if (res.data?.items && Array.isArray(res.data.items)) {
        items = res.data.items;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        items = res.data.data;
      }
      setMediaList(Array.isArray(items) ? items : []);

      // Pre-resolve protected URLs to avoid broken /uploads/... paths.
      const urls = {};
      await Promise.all(
        items.map(async (item) => {
          const raw = getImageUrl(item, null);
          const needsProtected =
            !raw ||
            raw.includes("/opt/") ||
            raw.includes("/uploads/") ||
            raw.startsWith("file://");

          if (needsProtected) {
            const mediaId = item._id || item.mediaId;
            if (!mediaId) return;
            const protectedUrl = await fetchProtectedUrl(mediaId);
            if (protectedUrl) {
              urls[mediaId] = protectedUrl;
            }
          }
        })
      );
      setImageUrls(urls);
    } catch (err) {
      console.error("Failed to load album access:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to load album. The access link may be invalid or expired.");
      }
    } finally {
      setLoading(false);
    }
  }, [albumId, token]);

  useEffect(() => {
    fetchAlbumMedia();
  }, [fetchAlbumMedia]);

  const resolveImage = (item) => getImageUrl(item, placeholderMedium);

  return (
    <BuyerLayout>
      <div className="text-white">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold">
              <i className="fas fa-folder-open me-2 text-warning"></i>
              Private Album Access
            </h2>
            {albumId && (
              <p className="text-white-50 small mb-0">
                Viewing shared album <strong>{albumId}</strong>
              </p>
            )}
          </div>
          <Link to="/buyer/explore" className="btn btn-outline-warning">
            <i className="fas fa-compass me-2"></i>
            Explore Photos
          </Link>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : mediaList.length === 0 ? (
          <div className="text-center py-5">
            <i className="fas fa-folder-open fa-4x text-white-50 mb-3"></i>
            <h5 className="mb-3">No photos available</h5>
            <p className="text-white-50">This album is empty or the link has expired.</p>
          </div>
        ) : (
          <div className="row g-4">
            {mediaList.map((item) => {
              const mediaId = item._id || item.mediaId;
              return (
                <div className="col-lg-3 col-md-4 col-6" key={mediaId || item.title}>
                  <div className="card bg-dark border-secondary h-100">
                    <div className="position-relative">
                      <img
                        src={
                          imageUrls[mediaId] ||
                          resolveImage(item) ||
                          placeholderMedium
                        }
                        alt={item.title}
                        className="card-img-top"
                        style={{ height: "180px", objectFit: "contain", backgroundColor: "#1a1a1a" }}
                        loading="lazy"
                        onError={async (e) => {
                          e.target.onerror = null;
                          const protectedUrl = await fetchProtectedUrl(mediaId);
                          if (protectedUrl) {
                            e.target.src = protectedUrl;
                          } else {
                            e.target.src = placeholderMedium;
                          }
                        }}
                      />
                    </div>
                    <div className="card-body">
                      <h6 className="fw-bold text-truncate mb-1">{item.title || "Untitled"}</h6>
                      <small className="text-white-50 d-block mb-2">
                        {item.photographer?.username || item.photographerName || "Anonymous"}
                      </small>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-warning">KES {item.price || 0}</span>
                        <button
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => {
                            const url = `${window.location.origin}/buyer/transactions`;
                            window.location.href = url;
                          }}
                        >
                          View Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BuyerLayout>
  );
};

export default BuyerAlbumAccess;
