import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import BuyerLayout from "./BuyerLayout";
import { accessSharedMedia, downloadViaShareLink } from "../../../api/API";
import { API_BASE_URL } from "../../../api/apiConfig";
import { placeholderMedium } from "../../../utils/placeholders";
import { getImageUrl, fetchProtectedUrl } from "../../../utils/imageUrl";

const ShareAccess = () => {
  const { token } = useParams();
  const [shareData, setShareData] = useState(null);
  const [mediaUrls, setMediaUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadMessage, setDownloadMessage] = useState(null);

  useEffect(() => {
    const fetchShare = async () => {
      if (!token) {
        setError("Invalid share link.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await accessSharedMedia(token);
        const data = res.data?.data || res.data;
        setShareData(data);

        const items = data?.album?.media || (data?.media ? [data.media] : []);
        const urls = {};
        await Promise.all(
          items.map(async (item) => {
            if (!item) return;
            const raw = getImageUrl(item, null);
            const needsProtected = !raw || raw.includes("/opt/") || raw.startsWith("file://");
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
        setMediaUrls(urls);
      } catch (err) {
        console.error("Share access failed:", err);
        const message = err.response?.data?.message || "Unable to access shared content.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchShare();
  }, [token]);

  const handleDownload = async () => {
    try {
      setDownloadMessage("Starting download...");
      const res = await downloadViaShareLink(token);
      const downloadUrl = res.data?.data?.downloadUrl;
      if (!downloadUrl) {
        throw new Error("Download URL not available.");
      }
      const finalUrl = downloadUrl.startsWith("http") ? downloadUrl : `${API_BASE_URL}${downloadUrl}`;
      window.open(finalUrl, "_blank");
      setDownloadMessage("Download opened in a new tab.");
    } catch (err) {
      console.error("Download failed:", err);
      setDownloadMessage(err.response?.data?.message || "Download failed.");
    }
  };

  const resolveImage = (item) => {
    const mediaId = item._id || item.mediaId;
    return mediaUrls[mediaId] || getImageUrl(item, placeholderMedium) || placeholderMedium;
  };

  return (
    <BuyerLayout>
      <div className="text-white py-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start mb-4 gap-3">
          <div>
            <h2 className="fw-bold mb-1">
              <i className="fas fa-share-alt me-2 text-warning"></i>
              Shared Content Access
            </h2>
            <p className="text-white-50 small mb-0">
              Access private media or albums shared via secure token.
            </p>
          </div>
          <Link to="/explore" className="btn btn-outline-warning">
            <i className="fas fa-compass me-2"></i>Explore Public Media
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" style={{ width: "3rem", height: "3rem" }}></div>
            <p className="text-white-50 mt-3">Loading shared content...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger" role="alert">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
          </div>
        ) : (
          <>
            {shareData?.message && (
              <div className="alert alert-warning" role="alert">
                {shareData.message}
              </div>
            )}

            <div className="card bg-dark border-secondary mb-4">
              <div className="row g-0 align-items-center">
                <div className="col-md-4">
                  <img
                    src={resolveImage(shareData?.media || shareData?.album || {})}
                    alt={shareData?.media?.title || shareData?.album?.name || "Shared content"}
                    className="img-fluid rounded-start h-100 w-100"
                    style={{ objectFit: "cover", minHeight: "220px" }}
                  />
                </div>
                <div className="col-md-8">
                  <div className="card-body">
                    <h4 className="card-title text-white mb-2">
                      {shareData?.shareType === "album"
                        ? shareData?.album?.name || "Shared Album"
                        : shareData?.media?.title || "Shared Media"}
                    </h4>
                    <p className="text-white-50 mb-2">
                      {shareData?.shareType === "album"
                        ? shareData?.album?.description || "A private shared album."
                        : shareData?.media?.description || "A private shared photo/video."}
                    </p>
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                      <span className="badge bg-warning text-dark">
                        {shareData?.shareType?.toUpperCase()}
                      </span>
                      <span className="badge bg-secondary">
                        Expires: {shareData?.expiresAt ? new Date(shareData.expiresAt).toLocaleDateString() : "Never"}
                      </span>
                      <span className="badge bg-success">
                        Accesses: {shareData?.accessCount || 0}
                      </span>
                      {shareData?.shareType === "media" && (
                        <button className="btn btn-sm btn-warning ms-auto" onClick={handleDownload}>
                          <i className="fas fa-download me-2"></i>Download
                        </button>
                      )}
                    </div>
                    {downloadMessage && (
                      <p className="text-white-50 small mt-3">{downloadMessage}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {shareData?.shareType === "album" && shareData?.album?.media && (
              <div className="row g-4">
                {shareData.album.media.map((item) => (
                  <div className="col-xl-3 col-md-4 col-sm-6" key={item._id || item.mediaId || item.title}>
                    <div className="card bg-dark border-secondary h-100">
                      <img
                        src={resolveImage(item)}
                        alt={item.title || "Shared item"}
                        className="card-img-top"
                        style={{ height: "180px", objectFit: "cover" }}
                      />
                      <div className="card-body">
                        <h6 className="fw-bold text-white text-truncate mb-2">
                          {item.title || "Untitled"}
                        </h6>
                        <p className="text-white-50 small mb-2">
                          Price: KES {item.price ?? 0}
                        </p>
                        <p className="text-white-50 small mb-0">
                          {item.photographer?.username || item.photographerName || "Photographer"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </BuyerLayout>
  );
};

export default ShareAccess;
