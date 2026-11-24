import {
  AlertCircle,
  CheckCircle2,
  MapPin,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { apiClient, extractApiError } from "../../api/client";
import { useBusiness } from "../../context/BusinessContext";
import {
  ApiResponse,
  BusinessInformation,
  HeroShowcaseSlide,
} from "../../types";

export function AdminBusinessPage() {
  const { refreshBusiness } = useBusiness();

  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [aboutExperience, setAboutExperience] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [mapEmbedUrl, setMapEmbedUrl] = useState("");

  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);

  const [aboutImageUrl, setAboutImageUrl] = useState("");
  const [aboutImageFile, setAboutImageFile] = useState<File | null>(null);

  // Home Page Hero Right-Side Animated Showcase Photos
  const [heroSlides, setHeroSlides] = useState<HeroShowcaseSlide[]>([]);
  const [heroSlideFiles, setHeroSlideFiles] = useState<File[]>([]);
  const [heroSlideUrlsText, setHeroSlideUrlsText] = useState("");

  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [website, setWebsite] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    async function loadBusiness() {
      try {
        const response =
          await apiClient.get<ApiResponse<BusinessInformation>>("/business");
        if (!active) return;
        const info = response.data.data;
        setBusinessName(info.businessName || "");
        setDescription(info.description || "");
        setAboutExperience(info.aboutExperience || "");
        setPhoneNumber(info.phoneNumber || "");
        setEmail(info.email || "");
        setLocation(info.location || "");
        setMapEmbedUrl(info.mapEmbedUrl || "");
        setLogoUrl(info.logoUrl || "");
        setHeroImageUrl(info.heroImageUrl || "");
        setAboutImageUrl(info.aboutImageUrl || "");
        setHeroSlides(info.heroShowcaseImages || []);
        setInstagram(info.socialLinks?.instagram || "");
        setFacebook(info.socialLinks?.facebook || "");
        setTiktok(info.socialLinks?.tiktok || "");
        setWebsite(info.socialLinks?.website || "");
      } catch (err) {
        if (active)
          setError(
            extractApiError(err, "Failed to load business information."),
          );
      } finally {
        if (active) setLoading(false);
      }
    }
    loadBusiness();
    return () => {
      active = false;
    };
  }, []);

  const handleDeleteHeroSlide = async (slideId: string) => {
    if (!window.confirm("Remove this photo from the Home Page hero showcase?"))
      return;
    setError("");
    setNotice("");
    try {
      const res = await apiClient.delete<ApiResponse<BusinessInformation>>(
        `/business/hero-slides/${slideId}`,
      );
      setHeroSlides(res.data.data.heroShowcaseImages || []);
      await refreshBusiness();
      setNotice("Hero showcase photo removed.");
    } catch (err) {
      setError(extractApiError(err, "Failed to remove hero showcase photo."));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("businessName", businessName.trim());
      formData.append("description", description.trim());
      formData.append("aboutExperience", aboutExperience.trim());
      formData.append("phoneNumber", phoneNumber.trim());
      formData.append("email", email.trim());
      formData.append("location", location.trim());
      formData.append("mapEmbedUrl", mapEmbedUrl.trim());

      const socialLinks: Record<string, string> = {};
      if (instagram.trim()) socialLinks.instagram = instagram.trim();
      if (facebook.trim()) socialLinks.facebook = facebook.trim();
      if (tiktok.trim()) socialLinks.tiktok = tiktok.trim();
      if (website.trim()) socialLinks.website = website.trim();
      formData.append("socialLinks", JSON.stringify(socialLinks));

      if (logoFile) {
        formData.append("logoImage", logoFile);
      } else if (logoUrl.trim()) {
        formData.append("logoUrl", logoUrl.trim());
      }

      if (heroImageFile) {
        formData.append("heroImage", heroImageFile);
      } else if (heroImageUrl.trim()) {
        formData.append("heroImageUrl", heroImageUrl.trim());
      }

      if (aboutImageFile) {
        formData.append("aboutImage", aboutImageFile);
      } else if (aboutImageUrl.trim()) {
        formData.append("aboutImageUrl", aboutImageUrl.trim());
      }

      for (const file of heroSlideFiles) {
        formData.append("heroShowcaseImages", file);
      }
      if (heroSlideUrlsText.trim()) {
        formData.append("heroShowcaseUrls", heroSlideUrlsText.trim());
      }

      const response = await apiClient.put<ApiResponse<BusinessInformation>>(
        "/business",
        formData,
      );
      setLogoUrl(response.data.data.logoUrl || "");
      setHeroImageUrl(response.data.data.heroImageUrl || "");
      setAboutImageUrl(response.data.data.aboutImageUrl || "");
      setMapEmbedUrl(response.data.data.mapEmbedUrl || "");
      setHeroSlides(response.data.data.heroShowcaseImages || []);

      setLogoFile(null);
      setHeroImageFile(null);
      setAboutImageFile(null);
      setHeroSlideFiles([]);
      setHeroSlideUrlsText("");

      await refreshBusiness();
      setNotice(
        "Business information, hero showcase photos, and map settings updated.",
      );
    } catch (err) {
      setError(extractApiError(err, "Failed to update business information."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-sm text-stone-500">
        Loading studio settings...
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-medium text-obsidian">
          Business Information &amp; Brand Images
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Changes here update the header logo, Home Page hero background &amp;
          right-side animated photos, About page, Contact map, and footer
          immediately.
        </p>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Studio Profile */}
        <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-xl font-medium text-obsidian">
            Studio Identity
          </h2>

          <div>
            <label className="block text-sm font-medium text-stone-800">
              Business Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Anaf Picture"
              className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:border-obsidian focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-800">
              Short Business Description <span className="text-red-600">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:border-obsidian focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-800">
              Photography Experience &amp; Approach (About Page)
            </label>
            <textarea
              rows={3}
              value={aboutExperience}
              onChange={(e) => setAboutExperience(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:border-obsidian focus:outline-none"
            />
          </div>
        </section>

        {/* Brand Imagery & Hero Right-Side Animated Showcase */}
        <section className="space-y-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="font-serif text-xl font-medium text-obsidian">
              Brand Images
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              Manage your studio logo, hero background, About photo, and the
              animated right-side hero gallery.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Studio Logo */}
            <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-sm font-semibold text-obsidian">Studio Logo</p>
              <div className="flex aspect-[16/9] items-center justify-center overflow-hidden rounded-lg bg-obsidian p-3">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Current studio logo"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-stone-400">No logo set</span>
                )}
              </div>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-stone-300 bg-white px-3 py-2.5 text-xs font-medium text-stone-700 hover:border-stone-500">
                <Upload className="h-4 w-4 text-accent" />
                <span className="truncate">
                  {logoFile ? logoFile.name : "Upload logo image"}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                />
              </label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="/logo.png or https://..."
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs focus:border-obsidian focus:outline-none"
              />
            </div>

            {/* Hero Background Image */}
            <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-sm font-semibold text-obsidian">
                Home Page Hero Background
              </p>
              {heroImageUrl && (
                <div className="aspect-[16/9] overflow-hidden rounded-lg bg-stone-200">
                  <img
                    src={heroImageUrl}
                    alt="Current hero background"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-stone-300 bg-white px-3 py-2.5 text-xs font-medium text-stone-700 hover:border-stone-500">
                <Upload className="h-4 w-4 text-accent" />
                <span className="truncate">
                  {heroImageFile
                    ? heroImageFile.name
                    : "Upload hero background"}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) =>
                    setHeroImageFile(e.target.files?.[0] || null)
                  }
                />
              </label>
              <input
                type="url"
                value={heroImageUrl}
                onChange={(e) => setHeroImageUrl(e.target.value)}
                placeholder="Or paste Hero image URL"
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs focus:border-obsidian focus:outline-none"
              />
            </div>

            {/* About Page Photographer Image */}
            <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-sm font-semibold text-obsidian">
                About Page Photo
              </p>
              {aboutImageUrl && (
                <div className="aspect-[16/9] overflow-hidden rounded-lg bg-stone-200">
                  <img
                    src={aboutImageUrl}
                    alt="Current about image"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-stone-300 bg-white px-3 py-2.5 text-xs font-medium text-stone-700 hover:border-stone-500">
                <Upload className="h-4 w-4 text-accent" />
                <span className="truncate">
                  {aboutImageFile ? aboutImageFile.name : "Upload About photo"}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) =>
                    setAboutImageFile(e.target.files?.[0] || null)
                  }
                />
              </label>
              <input
                type="url"
                value={aboutImageUrl}
                onChange={(e) => setAboutImageUrl(e.target.value)}
                placeholder="Or paste About image URL"
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs focus:border-obsidian focus:outline-none"
              />
            </div>
          </div>

          {/* Right-Side Hero Animated Showcase Uploader */}
          <div className="space-y-4 rounded-xl border border-stone-200 bg-stone-50 p-5">
            <div>
              <p className="text-sm font-semibold text-obsidian">
                Home Page Hero Right-Side Animated Photos
              </p>
              <p className="mt-0.5 text-xs text-stone-500">
                Upload portrait or editorial photos—they preload synchronously
                and animate inside the floating frame on the right side of the
                Home Page hero.
              </p>
            </div>

            {heroSlides.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {heroSlides.map((slide) => (
                  <div
                    key={slide.id}
                    className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-stone-200"
                  >
                    <img
                      src={slide.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteHeroSlide(slide.id)}
                      className="absolute right-1.5 top-1.5 rounded-full bg-black/75 p-1.5 text-white hover:bg-rose-600"
                      title="Remove slide"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-stone-300 bg-white px-4 py-5 text-center text-xs font-medium text-stone-700 hover:border-stone-500">
              <Upload className="h-5 w-5 text-accent" />
              <span>
                {heroSlideFiles.length > 0
                  ? `${heroSlideFiles.length} hero photo(s) selected`
                  : "Upload multiple Home Hero showcase photos (up to 10)"}
              </span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) =>
                  setHeroSlideFiles(
                    e.target.files ? Array.from(e.target.files) : [],
                  )
                }
              />
            </label>

            <textarea
              rows={2}
              value={heroSlideUrlsText}
              onChange={(e) => setHeroSlideUrlsText(e.target.value)}
              placeholder={
                "Or paste Hero showcase photo URLs (one per line)\nhttps://..."
              }
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs focus:border-obsidian focus:outline-none"
            />
          </div>
        </section>

        {/* Contact, Map & Social Media */}
        <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-xl font-medium text-obsidian">
            Contact, Studio Map &amp; Social Media
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-stone-800">
                Phone Number <span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+251 911 234 567"
                className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:border-obsidian focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-800">
                Email Address{" "}
                <span className="text-xs font-normal text-stone-400">
                  (Optional)
                </span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@anafpicture.com"
                className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:border-obsidian focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-800">
              Business Location{" "}
              <span className="text-xs font-normal text-stone-400">
                (Optional)
              </span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bole, Addis Ababa, Ethiopia"
              className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:border-obsidian focus:outline-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-stone-800">
              <MapPin className="h-4 w-4 text-accent" />
              <span>Google Maps Embed Link / Iframe</span>
              <span className="text-xs font-normal text-stone-400">
                (Optional)
              </span>
            </label>
            <input
              type="text"
              value={mapEmbedUrl}
              onChange={(e) => setMapEmbedUrl(e.target.value)}
              placeholder="Paste Google Maps Share -> Embed a map URL or full <iframe> tag"
              className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:border-obsidian focus:outline-none"
            />
            <p className="mt-1 text-xs text-stone-500">
              Leave blank to automatically pin your Business Location on the
              Contact page map.
            </p>
          </div>

          <div className="grid gap-4 pt-2 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-stone-600">
                Instagram URL
              </label>
              <input
                type="url"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/anafpicture"
                className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-obsidian focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600">
                Facebook URL
              </label>
              <input
                type="url"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/anafpicture"
                className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-obsidian focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600">
                TikTok URL
              </label>
              <input
                type="url"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                placeholder="https://tiktok.com/@anafpicture"
                className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-obsidian focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600">
                Website / Other URL
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-obsidian focus:outline-none"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-obsidian px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent hover:text-obsidian disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            <span>
              {saving ? "Saving Changes..." : "Save Business Information"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
