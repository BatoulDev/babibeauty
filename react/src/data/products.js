// src/data/products.js
import { fetchJson } from "../utils/api";

export const productKey = (id) => ['product', Number(id)];
export const fetchProduct = async (id) => {
  const res = await fetchJson(`/api/products/${id}`); // server should ETag/Cache-Control
  return res;
};
export const fetchProductReviews = async (id) => {
  return fetchJson(`/api/products/${id}/reviews`); // split endpoint (see §3)
};
