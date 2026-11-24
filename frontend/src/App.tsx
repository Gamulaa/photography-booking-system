import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./components/admin/AdminLayout";
import { ProtectedRoute } from "./components/admin/ProtectedRoute";
import { PublicLayout } from "./components/PublicLayout";
import { AuthProvider } from "./context/AuthContext";
import { BusinessProvider } from "./context/BusinessContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AdminBookingsPage } from "./pages/admin/AdminBookingsPage";
import { AdminBusinessPage } from "./pages/admin/AdminBusinessPage";
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { AdminOverviewPage } from "./pages/admin/AdminOverviewPage";
import { AdminPortfolioPage } from "./pages/admin/AdminPortfolioPage";
import { AdminServicesPage } from "./pages/admin/AdminServicesPage";
import { AboutPage } from "./pages/public/AboutPage";
import { BookingPage } from "./pages/public/BookingPage";
import { ContactPage } from "./pages/public/ContactPage";
import { HomePage } from "./pages/public/HomePage";
import { PortfolioPage } from "./pages/public/PortfolioPage";
import { ServicesPage } from "./pages/public/ServicesPage";

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <BusinessProvider>
            <Routes>
              {/* Public Website */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/book" element={<BookingPage />} />
              </Route>

              {/* Administrator Login */}
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* Protected Administrator Dashboard */}
              <Route element={<ProtectedRoute />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminOverviewPage />} />
                  <Route path="bookings" element={<AdminBookingsPage />} />
                  <Route path="services" element={<AdminServicesPage />} />
                  <Route path="portfolio" element={<AdminPortfolioPage />} />
                  <Route path="business" element={<AdminBusinessPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BusinessProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
