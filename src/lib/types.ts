export type Difficulty = "easy" | "moderate" | "hard" | "expert";
export type RouteType = "loop" | "out_and_back" | "point_to_point";
export type PlaceType = "waterfall" | "lake" | "peak" | "village" | "historic" | "park";

export interface Ref {
  slug: string;
  name: string;
}

export interface Region extends Ref {
  hiking_advised: boolean;
  trails_count?: number;
  places_count?: number;
}

export interface Source {
  label: string;
  url: string;
  license: string;
}

export interface Photo {
  url: string;
  author: string | null;
  license: string | null;
  source: string | null;
  caption: string | null;
}

export interface Trail {
  id: number;
  slug: string;
  source: "osm" | "community";
  name: string;
  summary: string | null;
  district: Ref | null;
  region: Ref | null;
  village: string | null;
  difficulty: Difficulty;
  route_type: RouteType;
  distance_km: number;
  segments: number;
  duration_minutes: number;
  ascent_m: number | null;
  max_ele_m: number | null;
  stats_estimated: boolean;
  location: { lat: number; lng: number };
  image: Photo | null;
  features: string[];
  network: string | null;
  is_featured: boolean;
  rating?: number | null;
  reviews_count?: number;
}

export interface Review {
  id: number;
  author_name: string;
  rating: number;
  body: string;
  locale: string;
  created_at: string;
}

export interface TrailDetail extends Trail {
  description: string | null;
  difficulty_basis: "sac_scale" | "effort" | "submitter" | null;
  sac_scale: string | null;
  descent_m: number | null;
  min_ele_m: number | null;
  route: { type: "MultiLineString"; coordinates: [number, number][][] } | null;
  elevation_profile: [number, number][];
  waypoints: string[];
  gallery: string[];
  sources: Source[];
  osm_relation_id: number | null;
  wikidata_id: string | null;
  places: Place[];
  reviews: Review[];
  guides: Guide[];
}

export interface Place {
  id: number;
  slug: string;
  type: PlaceType;
  name: string;
  summary: string | null;
  district: Ref | null;
  region: Ref | null;
  location: { lat: number; lng: number };
  ele_m: number | null;
  ele_source: "mapped" | "srtm" | null;
  image: Photo | null;
  is_featured: boolean;
  rating?: number | null;
  reviews_count?: number;
}

export interface PlaceDetail extends Place {
  description: string | null;
  sources: Source[];
  osm_id: string | null;
  wikidata_id: string | null;
  trails: Trail[];
  reviews: Review[];
}

export interface Labeled {
  value: string;
  label: string;
}

export type ContactChannel = "phone" | "whatsapp" | "email" | "website" | "instagram" | "telegram";

export interface Guide {
  slug: string;
  name: string;
  kind: "guide" | "agency";
  photo: string | null;
  headline: string | null;
  experience_years: number | null;
  specialties: Labeled[];
  languages: { code: string; label: string }[];
  regions: Ref[];
  price_from_azn: number | null;
  price_unit: Labeled | null;
  tours_count?: number;
  rating?: number | null;
  reviews_count?: number;
  contact_channels: ContactChannel[];
  is_verified: boolean;
  is_sample: boolean;
}

export interface GuideTour {
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  duration_value: number;
  duration_unit: "hours" | "days";
  difficulty: Difficulty;
  price_azn: number | null;
  price_unit: Labeled | null;
  group_size_max: number | null;
  months: number[];
  includes: string[];
  meeting_point: string | null;
  trails: Trail[];
}

export interface GuideDetail extends Guide {
  bio: string | null;
  certifications: { name: string; issuer: string | null; year: number | null }[];
  tours: GuideTour[];
  reviews: Review[];
}

export interface GuideContact {
  phone: string | null;
  whatsapp: string | null;
  whatsapp_url: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  instagram_url: string | null;
  telegram: string | null;
  telegram_url: string | null;
  is_sample: boolean;
}

export interface Stats {
  trails: number;
  places: number;
  regions: number;
  total_km: number;
  reviews: number;
  guides: number;
}

export interface Option {
  value: string;
  label: string;
}

export interface Options {
  difficulties: Option[];
  route_types: Option[];
  features: Option[];
  place_types: Option[];
  guide_specialties: Option[];
  guide_languages: Option[];
  price_units: Option[];
}

export interface Paginated<T> {
  data: T[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

export interface TrailFeatureProps {
  kind: "trail";
  slug: string;
  name: string;
  difficulty: Difficulty;
  distance_km: number;
  duration_minutes: number;
  region: string | null;
  lat: number;
  lng: number;
  image: string | null;
}

export interface PlaceFeatureProps {
  kind: "place";
  slug: string;
  name: string;
  type: PlaceType;
  ele_m: number | null;
  region: string | null;
  image: string | null;
}

export interface MapData {
  trails: { type: "FeatureCollection"; features: { type: "Feature"; geometry: { type: "MultiLineString"; coordinates: [number, number][][] }; properties: TrailFeatureProps }[] };
  places: { type: "FeatureCollection"; features: { type: "Feature"; geometry: { type: "Point"; coordinates: [number, number] }; properties: PlaceFeatureProps }[] };
}
