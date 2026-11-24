import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiClient } from "../api/client";
import { ApiResponse, BusinessInformation } from "../types";

interface BusinessContextValue {
  business: BusinessInformation | null;
  loading: boolean;
  refreshBusiness: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextValue | undefined>(
  undefined,
);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [business, setBusiness] = useState<BusinessInformation | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshBusiness = useCallback(async () => {
    try {
      const response =
        await apiClient.get<ApiResponse<BusinessInformation>>("/business");
      setBusiness(response.data.data);
    } catch {
      // Keep existing state if request fails temporarily
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBusiness();
  }, [refreshBusiness]);

  // Sync browser tab title & favicon with studio branding
  useEffect(() => {
    if (business?.businessName) {
      document.title = `${business.businessName} | Photography Studio`;
    }
    if (!business?.logoUrl) return;

    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = business.logoUrl;
  }, [business?.businessName, business?.logoUrl]);

  return (
    <BusinessContext.Provider value={{ business, loading, refreshBusiness }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) {
    throw new Error("useBusiness must be used inside BusinessProvider");
  }
  return ctx;
}
