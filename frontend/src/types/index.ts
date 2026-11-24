export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "COMPLETED"
  | "CANCELLED";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
}

export interface ServiceImage {
  id: string;
  imageUrl: string;
}

export interface ServiceGalleryImage {
  id: string;
  imageUrl: string;
  projectId: string;
  projectTitle: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  showPrice: boolean;
  duration: string | null;
  includes: string[];
  imageUrl: string;
  isActive: boolean;
  images?: ServiceImage[];
  galleryImages?: ServiceGalleryImage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PortfolioImage {
  id: string;
  imageUrl: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  category: string;
  serviceId: string | null;
  service?: {
    id: string;
    name: string;
  } | null;
  description: string | null;
  projectDate: string | null;
  images: PortfolioImage[];
  createdAt?: string;
}

export interface Booking {
  id: string;
  customerName: string;
  phoneNumber: string;
  serviceId: string;
  service: {
    id: string;
    name: string;
    price: number;
    duration?: string | null;
  };
  bookingDate: string;
  preferredTime: string | null;
  location: string | null;
  message: string | null;
  status: BookingStatus;
  createdAt?: string;
}

export interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  rejected: number;
  cancelled: number;
}

export interface HeroShowcaseSlide {
  id: string;
  imageUrl: string;
}

export interface BusinessInformation {
  id: string;
  businessName: string;
  description: string;
  aboutExperience: string | null;
  aboutImageUrl: string | null;
  heroImageUrl: string | null;
  heroShowcaseImages?: HeroShowcaseSlide[] | null;
  logoUrl: string | null;
  mapEmbedUrl: string | null;
  phoneNumber: string;
  email: string | null;
  location: string | null;
  socialLinks: Record<string, string> | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  stats?: BookingStats;
}
