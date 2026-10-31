/**
 * Forma Mart Frontend API Service
 *
 * Centralized, reusable client for interacting with the Express/MongoDB backend API.
 * Includes automatic offline/local catalogue fallback when local MongoDB is not configured.
 */

import * as localCatalog from '../data/products.js'

const PRODUCTION_API_URL = 'https://codealpha-e-commerce-77s9.onrender.com/api'

const API_BASE_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.DEV ? '/api' : PRODUCTION_API_URL)
).replace(/\/+$/, '')

/**
 * Custom Error Class for API responses
 */
export class ApiError extends Error {
  constructor(message, status = 500, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

/**
 * Extracts the local product array safely from src/data/products.js
 */
const getLocalProductsList = () => {
  const raw =
    localCatalog.products ||
    localCatalog.PRODUCTS ||
    localCatalog.default ||
    Object.values(localCatalog).find((val) => Array.isArray(val)) ||
    []
  return Array.isArray(raw) ? raw.map(normalizeProduct).filter(Boolean) : []
}

/**
 * Normalizes a product document from the API to guarantee
 * consistent field shapes for all frontend components and CartContext.
 */
export const normalizeProduct = (p) => {
  if (!p || typeof p !== 'object') return null

  let specsObj = p.specs || {}
  if (specsObj instanceof Map) {
    specsObj = Object.fromEntries(specsObj.entries())
  } else if (typeof specsObj !== 'object') {
    specsObj = {}
  }

  return {
    ...p,
    id: p.id || p._id,
    _id: p._id || p.id,
    slug: p.slug || '',
    name: p.name || 'Untitled Product',
    tagline: p.tagline || '',
    category: p.category || 'General',
    price: typeof p.price === 'number' ? p.price : 0,
    originalPrice: typeof p.originalPrice === 'number' ? p.originalPrice : null,
    image: p.image || (Array.isArray(p.images) && p.images[0]) || '',
    description: p.description || '',
    features: Array.isArray(p.features) ? p.features : [],
    specs: specsObj,
    featured: Boolean(p.featured),
    inStock: p.inStock !== false
  }
}

/**
 * Filters, sorts, and paginates local fallback data to match the Express API response shape
 */
const queryLocalProducts = ({ search, category, sort = 'featured', page = 1, limit = 12 } = {}) => {
  let list = [...getLocalProductsList()]

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase()
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    )
  }

  if (category && typeof category === 'string' && category.trim() && category.trim().toLowerCase() !== 'all') {
    const cat = category.trim().toLowerCase()
    list = list.filter((p) => p.category.toLowerCase() === cat)
  }

  const normalizedSort = sort === 'curated' ? 'featured' : sort
  if (normalizedSort === 'price-asc' || normalizedSort === 'price_asc') {
    list.sort((a, b) => a.price - b.price)
  } else if (normalizedSort === 'price-desc' || normalizedSort === 'price_desc') {
    list.sort((a, b) => b.price - a.price)
  } else if (normalizedSort === 'name-asc' || normalizedSort === 'alphabetical' || normalizedSort === 'alpha') {
    list.sort((a, b) => a.name.localeCompare(b.name))
  } else {
    list.sort((a, b) => Number(b.featured) - Number(a.featured))
  }

  const pageNum = Math.max(1, Number(page) || 1)
  const limitNum = Math.max(1, Number(limit) || 12)
  const total = list.length
  const totalPages = Math.max(1, Math.ceil(total / limitNum))
  const start = (pageNum - 1) * limitNum
  const data = list.slice(start, start + limitNum)

  return {
    success: true,
    count: data.length,
    total,
    page: pageNum,
    totalPages,
    limit: limitNum,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
    data
  }
}

/**
 * Fetch products list with automatic fallback to local catalog if local DB is offline
 */
export const fetchProducts = async (
  { search, category, sort = 'featured', page = 1, limit = 12 } = {},
  { signal } = {}
) => {
  const params = new URLSearchParams()

  if (search && typeof search === 'string' && search.trim()) {
    params.set('search', search.trim())
  }

  if (category && typeof category === 'string' && category.trim() && category.trim().toLowerCase() !== 'all') {
    params.set('category', category.trim())
  }

  const normalizedSort = sort === 'curated' ? 'featured' : sort
  if (normalizedSort) {
    params.set('sort', normalizedSort)
  }

  if (page) params.set('page', String(page))
  if (limit) params.set('limit', String(limit))

  const queryString = params.toString()
  const url = `${API_BASE_URL}/products${queryString ? `?${queryString}` : ''}`

  try {
    const response = await fetch(url, { signal })
    const json = await response.json().catch(() => null)

    if (!response.ok) {
      throw new ApiError(json?.message || `Failed to fetch products (HTTP ${response.status})`, response.status, json)
    }

    return {
      success: true,
      count: json?.count || 0,
      total: json?.total || 0,
      page: json?.page || 1,
      totalPages: json?.totalPages || 0,
      limit: json?.limit || limit,
      hasNextPage: Boolean(json?.hasNextPage),
      hasPrevPage: Boolean(json?.hasPrevPage),
      data: Array.isArray(json?.data) ? json.data.map(normalizeProduct).filter(Boolean) : []
    }
  } catch (error) {
    if (error.name === 'AbortError') throw error

    const fallback = queryLocalProducts({ search, category, sort, page, limit })
    if (fallback.total > 0) {
      return fallback
    }

    if (error instanceof ApiError) throw error
    throw new ApiError(error.message || 'Unable to connect to Forma Mart server.', 0)
  }
}

/**
 * Fetch a single product by its URL slug with automatic local fallback
 */
export const fetchProductBySlug = async (slug, { signal } = {}) => {
  if (!slug || typeof slug !== 'string' || !slug.trim()) {
    throw new ApiError('Product slug is required.', 400)
  }

  const cleanSlug = slug.trim()
  const url = `${API_BASE_URL}/products/slug/${encodeURIComponent(cleanSlug)}`

  try {
    const response = await fetch(url, { signal })
    const json = await response.json().catch(() => null)

    if (!response.ok) {
      throw new ApiError(json?.message || `Product not found (HTTP ${response.status})`, response.status, json)
    }

    return {
      success: true,
      data: normalizeProduct(json?.data)
    }
  } catch (error) {
    if (error.name === 'AbortError') throw error

    const localMatch = getLocalProductsList().find((p) => p.slug === cleanSlug)
    if (localMatch) {
      return { success: true, data: localMatch }
    }

    if (error instanceof ApiError) throw error
    throw new ApiError(error.message || 'Unable to connect to Forma Mart server.', 0)
  }
}

/**
 * Fetch a single product by its ID with automatic local fallback
 */
export const fetchProductById = async (id, { signal } = {}) => {
  if (!id) throw new ApiError('Product ID is required.', 400)

  const cleanId = String(id).trim()
  const url = `${API_BASE_URL}/products/${encodeURIComponent(cleanId)}`

  try {
    const response = await fetch(url, { signal })
    const json = await response.json().catch(() => null)

    if (!response.ok) {
      throw new ApiError(json?.message || `Failed to fetch product (HTTP ${response.status})`, response.status, json)
    }

    return {
      success: true,
      data: normalizeProduct(json?.data)
    }
  } catch (error) {
    if (error.name === 'AbortError') throw error

    const localMatch = getLocalProductsList().find(
      (p) => String(p.id) === cleanId || String(p._id) === cleanId
    )
    if (localMatch) {
      return { success: true, data: localMatch }
    }

    if (error instanceof ApiError) throw error
    throw new ApiError(error.message || 'Unable to connect to Forma Mart server.', 0)
  }
}