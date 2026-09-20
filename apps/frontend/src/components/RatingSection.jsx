"use client";

import { useState } from "react";
import { Star, Filter, TrendingUp, ThumbsUp } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/* -----------------------------------------------------
   RATING SECTION
----------------------------------------------------- */
export function RatingSection({ stats, reviews }) {
  const [filterRating, setFilterRating] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const filteredReviews = reviews
    .filter((r) => {
      if (filterRating === "all") return true;
      return r.rating === Number(filterRating);
    })
    .sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.date) - new Date(a.date);
      }
      if (sortBy === "highest") {
        return b.rating - a.rating;
      }
      return (b.helpful_count || 0) - (a.helpful_count || 0);
    });

  return (
    <div className="space-y-6">
      {/* OVERVIEW */}
      <Card className="bg-white rounded-2xl shadow-md border border-slate-100">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">
            Rating & Reviews
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Average */}
            <div className="flex flex-col items-center justify-center border-r border-slate-100">
              <div className="text-6xl font-bold text-slate-800 mb-2">
                {stats.average.toFixed(1)}
              </div>

              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-6 h-6 ${
                      s <= Math.round(stats.average)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-slate-300"
                    }`}
                  />
                ))}
              </div>

              <p className="text-slate-600">Based on {stats.total} reviews</p>
            </div>

            {/* Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((r) => {
                const count = stats.distribution[r] || 0;
                const percent =
                  stats.total > 0 ? (count / stats.total) * 100 : 0;

                return (
                  <div key={r} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-12">
                      <span className="text-sm font-medium">{r}</span>
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </div>

                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#4dd0e1] to-[#26c6da]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <span className="text-sm text-slate-600 w-10 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* REVIEWS */}
      <Card className="bg-white rounded-2xl shadow-md border border-slate-100">
        <div className="p-6">
          <div className="flex flex-wrap justify-between gap-4 mb-6">
            <h3 className="text-lg font-semibold text-slate-800">
              Customer Reviews ({filteredReviews.length})
            </h3>

            <div className="flex gap-3">
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <SelectItem key={r} value={String(r)}>
                      {r} Stars
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="highest">Highest Rated</SelectItem>
                  <SelectItem value="helpful">Most Helpful</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredReviews.length === 0 ? (
              <p className="text-center py-10 text-slate-500">
                No reviews found
              </p>
            ) : (
              filteredReviews.map((r) => <ReviewCard key={r.id} review={r} />)
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

/* -----------------------------------------------------
   REVIEW CARD
----------------------------------------------------- */
function ReviewCard({ review }) {
  const [helpful, setHelpful] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  function timeAgo(date) {
    const d = new Date(date);
    const diff = Math.floor((Date.now() - d) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    return `${Math.floor(diff / 30)} months ago`;
  }

  const photos = review.photos || [];

  return (
    <>
      <div className="p-4 border border-slate-100 rounded-xl hover:shadow-md transition">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4dd0e1] to-[#26c6da] text-white flex items-center justify-center font-semibold">
            {review.customer_avatar ? (
              <img
                src={review.customer_avatar}
                alt=""
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              review.customer_name.charAt(0)
            )}
          </div>

          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <div>
                <p className="font-semibold text-slate-800">
                  {review.customer_name}
                </p>
                <p className="text-sm text-slate-500">{timeAgo(review.date)}</p>
              </div>

              {review.service_type && (
                <Badge variant="secondary">{review.service_type}</Badge>
              )}
            </div>

            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= review.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-slate-300"
                  }`}
                />
              ))}
            </div>

            <p className="text-slate-700 mb-3">{review.comment}</p>

            {photos.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {photos.map((photo) => {
                  const src =
                    photo.full_image_url ||
                    (photo.image_url?.startsWith("http")
                      ? photo.image_url
                      : `${API_BASE_URL}${photo.image_url}`);

                  return (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setSelectedPhoto(src)}
                    >
                      <img
                        src={src}
                        alt="Review photo"
                        className="h-16 w-16 rounded-xl border object-cover hover:opacity-80 transition"
                      />
                    </button>
                  );
                })}
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHelpful(!helpful)}
            >
              <ThumbsUp
                className={`w-4 h-4 mr-1 ${
                  helpful ? "fill-current text-[#26c6da]" : ""
                }`}
              />
              Helpful ({(review.helpful_count || 0) + (helpful ? 1 : 0)})
            </Button>
          </div>
        </div>
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
          <button
            type="button"
            onClick={() => setSelectedPhoto(null)}
            className="absolute right-5 top-5 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-800"
          >
            Close
          </button>

          <img
            src={selectedPhoto}
            alt="Large review photo"
            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
