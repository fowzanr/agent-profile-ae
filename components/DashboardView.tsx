"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import type { AgentLink, Property, Testimonial } from "@prisma/client";
import type { SafeAgent } from "@/lib/prisma";
import { formatAED, rentalLabel, rentalSuffix } from "@/lib/format";
import { BIO_MAX_LENGTH, EMIRATES, LANGUAGES, LISTINGS_ENABLED } from "@/lib/constants";
import { isValidSlug } from "@/lib/validation";
import { ChipMultiSelect } from "@/components/ChipMultiSelect";
import { TagSelect } from "@/components/TagSelect";
import { ComboInput } from "@/components/ComboInput";
import { SOCIAL_PLATFORMS, hasAnySocial, socialUrlsOf } from "@/lib/socials";
import { DAY_NAMES, SLOT_LENGTHS, fromMinutes, parseBookingDays, slotTimes } from "@/lib/booking";
import { SLUG_LOCK_DAYS, formatUnlockDate, slugUnlocksAt } from "@/lib/slugLock";
import { LINK_KINDS, LINK_KIND_LABELS, detectKind, embedFor, kindOf, type LinkKind } from "@/lib/featuredLinks";
import { ImageCropper, downscaleImage, uploadImageBlob } from "@/components/ImageCropper";
import { PropertyForm, emptyPropertyForm, propertyToFormState, type PropertyFormState } from "@/components/PropertyForm";
import {
  BriefcaseIcon,
  PhoneIcon,
  InstagramIcon,
  CheckIcon,
  ClockIcon,
  AreaIcon,
  RefreshIcon,
  TrendingUpIcon,
  EyeIcon,
  LockIcon,
  CrownIcon,
  SparkleIcon,
  LinkIcon,
  StarIcon,
  QrCodeIcon,
  WhatsAppIcon,
  MailIcon,
  CalendarIcon,
  MenuIcon,
  CloseIcon,
} from "@/components/icons";

type AgentWithProperties = SafeAgent & { properties: Property[]; links: AgentLink[]; testimonials: Testimonial[] };

type ProfileTab = "identity" | "contact" | "social" | "about" | "expertise" | "testimonials";

function LivePreviewPanel({ slug, refreshKey, onRefresh }: { slug: string; refreshKey: number; onRefresh: () => void }) {
  return (
    <aside className="dash-preview-panel">
      <div className="preview-label-row">
        <div className="preview-label">
          <span className="live-dot" />
          Live Preview
        </div>
        <button type="button" className="preview-refresh-btn" onClick={onRefresh} aria-label="Refresh preview" title="Refresh preview">
          <RefreshIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="preview-browser">
        <div className="preview-browser-bar">
          <span className="preview-browser-dots">
            <span />
            <span />
            <span />
          </span>
          <span className="preview-browser-url">agentprofile.ae/{slug}</span>
        </div>
        <iframe key={refreshKey} src={`/${slug}`} className="preview-iframe" title="Full profile preview" />
        <div className="preview-scroll-hint">
          <span>Scroll to see more</span>
        </div>
      </div>

      <Link className="preview-cta" href={`/${slug}`} target="_blank">
        Open Full Preview
      </Link>
      <p className="preview-tip">
        This is your published profile at agentprofile.ae/{slug} — refreshes automatically after you save.
      </p>
    </aside>
  );
}

type AnalyticsData = {
  totals: { profileViews: number; listingViews: number; leads: number; shares: number };
  last30: { profileViews: number; listingViews: number; leads: number };
  daily: { date: string; profileViews: number; listingViews: number; leads: number }[];
  leadsByChannel: { whatsapp: number; call: number; email: number; book: number };
  topListings: { id: string; title: string; views: number; leads: number }[];
};

const CHANNEL_META: Record<
  keyof AnalyticsData["leadsByChannel"],
  { label: string; icon: (props: { className?: string }) => React.ReactElement; tone: "primary" | "gold" | "accent3" }
> = {
  whatsapp: { label: "WhatsApp", icon: WhatsAppIcon, tone: "accent3" },
  call: { label: "Call", icon: PhoneIcon, tone: "primary" },
  email: { label: "Email", icon: MailIcon, tone: "gold" },
  book: { label: "Book a Viewing", icon: CalendarIcon, tone: "primary" },
};

function AnalyticsPanels({ data }: { data: AnalyticsData }) {
  const maxDaily = Math.max(1, ...data.daily.map((d) => d.profileViews));
  const conversion = data.last30.profileViews > 0 ? Math.round((data.last30.leads / data.last30.profileViews) * 100) : null;
  const channelEntries = Object.entries(data.leadsByChannel) as [keyof AnalyticsData["leadsByChannel"], number][];
  const totalChannelLeads = channelEntries.reduce((sum, [, count]) => sum + count, 0);
  const hasChannelData = totalChannelLeads > 0;

  return (
    <>
      <div className="analytics-stats">
        <div className="dash-card analytics-stat">
          <div className="analytics-stat-icon">
            <EyeIcon className="w-4 h-4" />
          </div>
          <div className="analytics-stat-value">{data.last30.profileViews}</div>
          <div className="analytics-stat-label">
            Views <span>· 30 days</span>
          </div>
        </div>
        <div className="dash-card analytics-stat">
          <div className="analytics-stat-icon">
            <TrendingUpIcon className="w-4 h-4" />
          </div>
          <div className="analytics-stat-value">{data.last30.leads}</div>
          <div className="analytics-stat-label">
            Leads <span>· 30 days</span>
          </div>
        </div>
        <div className="dash-card analytics-stat">
          <div className="analytics-stat-icon">
            <TrendingUpIcon className="w-4 h-4" />
          </div>
          <div className="analytics-stat-value">{conversion === null ? "—" : `${conversion}%`}</div>
          <div className="analytics-stat-label">
            Conversion <span>· leads / views</span>
          </div>
        </div>
        <div className="dash-card analytics-stat">
          <div className="analytics-stat-icon">
            <RefreshIcon className="w-4 h-4" />
          </div>
          <div className="analytics-stat-value">{data.totals.shares}</div>
          <div className="analytics-stat-label">
            Shares <span>· all time</span>
          </div>
        </div>
      </div>

      <div className="dash-card">
        <SectionHeader
          tone="primary"
          icon={<TrendingUpIcon className="w-4 h-4" />}
          title="Activity — last 30 days"
          sub="Profile views per day."
        />
        {maxDaily <= 1 && data.daily.every((d) => d.profileViews === 0) ? (
          <p className="dash-page-sub">No views yet — activity will show up here once visitors find your page.</p>
        ) : (
          <>
            <div className="activity-total">
              <span className="activity-total-value">{data.last30.profileViews}</span>
              <span className="activity-total-label">views in the last 30 days</span>
            </div>
            <div className="analytics-chart">
              {data.daily.map((d) => {
                const h = d.profileViews === 0 ? 2 : Math.max(4, Math.round((d.profileViews / maxDaily) * 100));
                return (
                  <div className="analytics-bar" key={d.date} title={`${d.date} — ${d.profileViews} views, ${d.leads} leads`}>
                    <div className="analytics-bar-fill" style={{ height: `${h}%` }} />
                  </div>
                );
              })}
            </div>
            <div className="analytics-chart-foot">
              <span>{data.daily[0]?.date}</span>
              <span>{data.daily[data.daily.length - 1]?.date}</span>
            </div>
          </>
        )}
      </div>

      <div className="dash-card">
        <SectionHeader
          tone="accent3"
          icon={<TrendingUpIcon className="w-4 h-4" />}
          title="Leads by channel"
          sub="Which contact buttons visitors use — all time."
        />
        {hasChannelData ? (
          <div className="channel-list">
            {channelEntries.map(([key, count]) => {
              const meta = CHANNEL_META[key];
              const Icon = meta.icon;
              const pct = totalChannelLeads > 0 ? Math.round((count / totalChannelLeads) * 100) : 0;
              return (
                <div className="channel-row" key={key}>
                  <div className={`channel-icon tone-${meta.tone}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="channel-info">
                    <div className="channel-top">
                      <span className="channel-label">{meta.label}</span>
                      <span className="channel-count">
                        {count} <span className="channel-pct">({pct}%)</span>
                      </span>
                    </div>
                    <span className="channel-track">
                      <span className="channel-fill" style={{ width: `${pct}%` }} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="dash-page-sub">No leads yet — WhatsApp, call, email, and booking clicks will show up here.</p>
        )}
      </div>
    </>
  );
}

function ApprovalStatusBanner({
  submittedForReview,
  isApproved,
  listingCount,
  slug,
}: {
  submittedForReview: boolean;
  isApproved: boolean;
  listingCount: number;
  slug: string;
}) {
  const hasListing = !LISTINGS_ENABLED || listingCount > 0;
  const isLive = isApproved && hasListing;

  if (isLive) {
    return (
      <div className="status-banner tone-live">
        <CheckIcon className="w-4 h-4" />
        <div>
          <div className="status-banner-title">Your profile is live</div>
          <div className="status-banner-sub">
            Visitors can find you at{" "}
            <Link href={`/${slug}`} target="_blank">
              agentprofile.ae/{slug}
            </Link>
            .
          </div>
        </div>
      </div>
    );
  }

  if (isApproved && !hasListing) {
    return (
      <div className="status-banner tone-pending">
        <ClockIcon className="w-4 h-4" />
        <div>
          <div className="status-banner-title">Approved — add a listing to go live</div>
          <div className="status-banner-sub">Your profile is approved, but it stays hidden until you add at least one listing.</div>
        </div>
      </div>
    );
  }

  if (submittedForReview) {
    return (
      <div className="status-banner tone-pending">
        <ClockIcon className="w-4 h-4" />
        <div>
          <div className="status-banner-title">Pending team approval</div>
          <div className="status-banner-sub">
            {hasListing
              ? "We're reviewing your profile — it'll go live as soon as it's approved."
              : "We're reviewing your profile. You'll also need at least one listing before it can go live."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="status-banner tone-neutral">
      <LockIcon className="w-4 h-4" />
      <div>
        <div className="status-banner-title">Your profile isn&apos;t public yet</div>
        <div className="status-banner-sub">
          Finish your details on the Profile tab, then submit for team approval.
          {LISTINGS_ENABLED && " At least one live listing is required to go live."}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  tone,
  icon,
  title,
  sub,
}: {
  tone: "primary" | "gold" | "accent3";
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div className="section-header">
      <div className={`section-icon tone-${tone}`}>{icon}</div>
      <div>
        <div className="section-title">{title}</div>
        <div className="section-sub">{sub}</div>
      </div>
    </div>
  );
}

// Booking hours offered in the dashboard, every 30 minutes from 06:00 to 23:00.
const HOUR_OPTIONS = Array.from({ length: 35 }, (_, i) => fromMinutes(6 * 60 + i * 30));

type ProfileImageField = "photoUrl" | "coverUrl";
type ProfileImageSourceField = "photoSourceUrl" | "coverSourceUrl";

export function DashboardView({ agent }: { agent: AgentWithProperties }) {
  const [form, setForm] = useState({
    name: agent.name,
    agency: agent.agency,
    role: agent.role,
    brn: agent.brn,
    dedLicensed: agent.dedLicensed,
    bio: agent.bio,
    photoUrl: agent.photoUrl ?? "",
    photoSourceUrl: agent.photoSourceUrl ?? "",
    coverUrl: agent.coverUrl ?? "",
    coverSourceUrl: agent.coverSourceUrl ?? "",
    yearsExperience: agent.yearsExperience,
    whatsapp: agent.whatsapp,
    phone: agent.phone,
    contactEmail: agent.contactEmail,
    ...socialUrlsOf(agent),
    bookingMode: (agent.bookingMode === "link" ? "link" : "form") as "form" | "link",
    bookingUrl: agent.bookingUrl ?? "",
    bookingDays: agent.bookingDays,
    bookingStartTime: agent.bookingStartTime,
    bookingEndTime: agent.bookingEndTime,
    bookingSlotMinutes: agent.bookingSlotMinutes,
    specialities: agent.specialities,
    areas: agent.areas,
    languages: agent.languages,
    availabilityStatus: agent.availabilityStatus as "available" | "busy",
    manualForSaleCount: agent.manualForSaleCount,
    manualForRentCount: agent.manualForRentCount,
    transactedVolume: agent.transactedVolume != null ? String(agent.transactedVolume) : "",
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [generatingBio, setGeneratingBio] = useState(false);
  const [links, setLinks] = useState(agent.links);
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkKind, setNewLinkKind] = useState<LinkKind | "">("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [addingLink, setAddingLink] = useState(false);
  const [profileTab, setProfileTab] = useState<ProfileTab>("identity");
  const [copyLabel, setCopyLabel] = useState("Copy");
  const [agencyOptions, setAgencyOptions] = useState<string[]>([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    fetch("/api/agencies")
      .then((res) => res.json())
      .then((data) => setAgencyOptions(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const [section, setSection] = useState<"overview" | "profile" | "properties" | "analytics" | "settings">(
    "overview",
  );
  const [properties, setProperties] = useState(agent.properties);
  const [propertiesView, setPropertiesView] = useState<"all" | "add" | "edit">("all");
  const [propForm, setPropForm] = useState(emptyPropertyForm);
  const [propError, setPropError] = useState<string | null>(null);
  const [addingProperty, setAddingProperty] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PropertyFormState>(emptyPropertyForm);
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<1 | 2 | 3 | null>(null);
  const bookingSlotCount = slotTimes({
    start: form.bookingStartTime,
    end: form.bookingEndTime,
    slotMinutes: form.bookingSlotMinutes,
  }).length;
  const [uploadingImage, setUploadingImage] = useState<ProfileImageField | null>(null);
  const [cropTarget, setCropTarget] = useState<{ field: ProfileImageField; src: string; file?: File } | null>(null);
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const refreshPreview = () => setPreviewRefreshKey((k) => k + 1);

  const [testimonials, setTestimonials] = useState(agent.testimonials);
  const [newQuote, setNewQuote] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [testimonialError, setTestimonialError] = useState<string | null>(null);
  const [addingTestimonial, setAddingTestimonial] = useState(false);
  const [slug, setSlug] = useState(agent.slug);
  const [slugInput, setSlugInput] = useState(agent.slug);
  const [slugSaving, setSlugSaving] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugMsg, setSlugMsg] = useState<string | null>(null);
  const [slugUnlockDate, setSlugUnlockDate] = useState(() => slugUnlocksAt(agent));
  const slugLocked = slugUnlockDate.getTime() > Date.now();
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [submittedForReview, setSubmittedForReview] = useState(agent.submittedForReview);
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "sent">("idle");
  const isApproved = agent.isApproved;
  // Only ever rendered inside the Profile tab, which isn't the default view — always past hydration by then.
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const [submitting, setSubmitting] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  async function loadAnalytics() {
    setAnalyticsLoading(true);
    try {
      const res = await fetch("/api/analytics");
      const data = await res.json();
      setAnalyticsData(data);
    } catch {
      // best-effort — the panel just stays in a loading/empty state
    }
    setAnalyticsLoading(false);
  }

  function openAnalytics() {
    setSection("analytics");
    setMobileNavOpen(false);
    if (!analyticsData && !analyticsLoading) loadAnalytics();
  }

  function openOverview() {
    setSection("overview");
    setMobileNavOpen(false);
    if (!analyticsData && !analyticsLoading) loadAnalytics();
  }

  function openProperties() {
    setSection("properties");
    setPropertiesView("all");
    setMobileNavOpen(false);
  }

  function goToProfileTab(tab: ProfileTab) {
    setSection("profile");
    setProfileTab(tab);
  }

  async function copyProfileLink() {
    const url = `${window.location.origin}/${slug}`;
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(url);
    } catch {
      // clipboard unavailable — ignore
    }
    setCopyLabel("Copied");
    setTimeout(() => setCopyLabel("Copy"), 1800);
  }

  async function updateSlug() {
    setSlugError(null);
    setSlugMsg(null);

    const next = slugInput.trim().toLowerCase();
    if (!isValidSlug(next)) {
      setSlugError("Use lowercase letters, numbers, and hyphens only — 3 to 40 characters.");
      return;
    }
    if (next === slug) {
      setSlugMsg("That's already your URL");
      return;
    }

    setSlugSaving(true);
    const res = await fetch("/api/agent", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: next }),
    });
    const data = await res.json();
    setSlugSaving(false);

    if (!res.ok) {
      setSlugError(data.error ?? "Couldn't update your URL");
      return;
    }

    setSlug(next);
    setSlugInput(next);
    setSlugUnlockDate(slugUnlocksAt({ slugChangedAt: new Date(), createdAt: agent.createdAt }));
    setSlugMsg("Updated");
    refreshPreview();
    setTimeout(() => setSlugMsg(null), 2500);
  }

  async function saveAvailability(next: "available" | "busy") {
    update("availabilityStatus", next);
    setSavingAvailability(true);
    await fetch("/api/agent", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availabilityStatus: next }),
    });
    setSavingAvailability(false);
    refreshPreview();
  }

  async function saveProfileImages(patch: Partial<Pick<typeof form, ProfileImageField | ProfileImageSourceField>>) {
    const res = await fetch("/api/agent", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Couldn't save image");
    }
    setForm((f) => ({ ...f, ...patch }));
    refreshPreview();
  }

  function pickProfileImage(field: ProfileImageField, file: File | undefined) {
    if (!file) return;
    setProfileError(null);
    setCropTarget({ field, src: URL.createObjectURL(file), file });
  }

  function adjustProfileImage(field: ProfileImageField) {
    const src = field === "photoUrl" ? form.photoSourceUrl || form.photoUrl : form.coverSourceUrl || form.coverUrl;
    if (src) setCropTarget({ field, src });
  }

  function closeCropper() {
    if (cropTarget?.file) URL.revokeObjectURL(cropTarget.src);
    setCropTarget(null);
  }

  async function applyCrop(cropped: Blob) {
    const target = cropTarget;
    if (!target) return;
    const sourceField: ProfileImageSourceField = target.field === "photoUrl" ? "photoSourceUrl" : "coverSourceUrl";
    setUploadingImage(target.field);
    setProfileError(null);
    closeCropper();
    try {
      const [croppedUrl, sourceUrl] = await Promise.all([
        uploadImageBlob(cropped),
        target.file ? downscaleImage(target.file).then(uploadImageBlob) : Promise.resolve(null),
      ]);
      await saveProfileImages(sourceUrl ? { [target.field]: croppedUrl, [sourceField]: sourceUrl } : { [target.field]: croppedUrl });
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Couldn't upload image");
    } finally {
      setUploadingImage(null);
    }
  }

  async function removeProfileImage(field: ProfileImageField) {
    const sourceField: ProfileImageSourceField = field === "photoUrl" ? "photoSourceUrl" : "coverSourceUrl";
    setUploadingImage(field);
    setProfileError(null);
    try {
      await saveProfileImages({ [field]: "", [sourceField]: "" });
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Couldn't remove image");
    } finally {
      setUploadingImage(null);
    }
  }

  async function handleImageSelect(slot: 1 | 2 | 3, file: File | undefined) {
    if (!file) return;
    setUploadingSlot(slot);
    setPropError(null);

    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body });
    const data = await res.json();

    setUploadingSlot(null);
    if (!res.ok) {
      setPropError(data.error ?? "Couldn't upload image");
      return;
    }
    const key = `image${slot}` as "image1" | "image2" | "image3";
    if (propertiesView === "edit") setEditForm((f) => ({ ...f, [key]: data.url }));
    else setPropForm((f) => ({ ...f, [key]: data.url }));
  }

  function removeImage(slot: 1 | 2 | 3) {
    const key = `image${slot}` as "image1" | "image2" | "image3";
    if (propertiesView === "edit") setEditForm((f) => ({ ...f, [key]: null }));
    else setPropForm((f) => ({ ...f, [key]: null }));
  }

  function updateProp<K extends keyof PropertyFormState>(key: K, value: PropertyFormState[K]) {
    setPropForm((f) => ({ ...f, [key]: value }));
  }

  function updateEdit<K extends keyof PropertyFormState>(key: K, value: PropertyFormState[K]) {
    setEditForm((f) => ({ ...f, [key]: value }));
  }

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setSaveMsg(null);

    if (form.bookingMode === "form") {
      if (parseBookingDays(form.bookingDays).length === 0) {
        setProfileTab("contact");
        setProfileError("Pick at least one day you take viewings.");
        return;
      }
      if (bookingSlotCount === 0) {
        setProfileTab("contact");
        setProfileError("Your viewing hours need to end after they start, with room for at least one viewing.");
        return;
      }
    }

    if (form.bookingMode === "link" && !/^https?:\/\/\S+\.\S+/.test(form.bookingUrl.trim())) {
      setProfileTab("contact");
      setProfileError("Add your booking link (starting with https://), or switch Book back to the booking form.");
      return;
    }

    if (form.bio.length > BIO_MAX_LENGTH) {
      setProfileError(`Your bio is ${form.bio.length} characters. Shorten it to ${BIO_MAX_LENGTH} or fewer to save.`);
      return;
    }

    const hasContact = form.whatsapp.trim() || form.phone.trim() || form.contactEmail.trim();
    if (!hasContact) {
      setProfileError("Add at least one way for clients to reach you — WhatsApp, phone, or email.");
      return;
    }

    setSaving(true);

    const res = await fetch("/api/agent", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setProfileError(data.error ?? "Couldn't save changes");
      setSaving(false);
      return;
    }

    setSaveMsg("Saved");
    setSaving(false);
    refreshPreview();
    setTimeout(() => setSaveMsg(null), 2500);
  }

  async function submitForApproval() {
    setProfileError(null);

    const hasContact = form.whatsapp.trim() || form.phone.trim() || form.contactEmail.trim();
    if (!hasContact) {
      setProfileError("Add at least one way for clients to reach you — WhatsApp, phone, or email.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/agent", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, submittedForReview: true }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setProfileError(data.error ?? "Couldn't submit for review");
      return;
    }

    setSubmittedForReview(true);
    refreshPreview();
  }

  async function resendVerification() {
    setResendStatus("loading");
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: agent.email }),
    }).catch(() => {});
    setResendStatus("sent");
  }

  async function generateBioText() {
    setGeneratingBio(true);
    try {
      const res = await fetch("/api/generate-bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          role: form.role,
          agency: form.agency,
          yearsExperience: form.yearsExperience,
          specialities: form.specialities,
          areas: form.areas,
          languages: form.languages,
        }),
      });
      const data = await res.json();
      if (res.ok) update("bio", data.bio);
    } catch {
      // best-effort — the field just stays as-is
    }
    setGeneratingBio(false);
  }

  async function addLink() {
    setLinkError(null);
    if (newLinkLabel.trim().length < 1) {
      setLinkError("Give the link a short label");
      return;
    }
    if (newLinkUrl.trim().length < 1) {
      setLinkError("Add a URL for that link");
      return;
    }

    setAddingLink(true);
    const res = await fetch("/api/agent-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newLinkLabel.trim(), url: newLinkUrl.trim(), kind: newLinkKind || null }),
    });
    const data = await res.json();
    setAddingLink(false);

    if (!res.ok) {
      setLinkError(data.error ?? "Couldn't add that link");
      return;
    }
    setLinks((prev) => [...prev, data]);
    setNewLinkLabel("");
    setNewLinkUrl("");
    setNewLinkKind("");
    refreshPreview();
  }

  async function updateLink(id: string, patch: { pinned?: boolean; kind?: LinkKind | null }) {
    setLinks((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, ...patch } : patch.pinned ? { ...l, pinned: false } : l,
      ),
    );
    const res = await fetch(`/api/agent-links/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) setLinkError("Couldn't update that link. Refresh and try again.");
    refreshPreview();
  }

  async function removeLink(id: string) {
    setLinks((prev) => prev.filter((l) => l.id !== id));
    await fetch(`/api/agent-links/${id}`, { method: "DELETE" });
    refreshPreview();
  }

  async function addTestimonial() {
    setTestimonialError(null);
    if (newQuote.trim().length < 1) {
      setTestimonialError("Add the client's quote");
      return;
    }
    if (newAuthor.trim().length < 1) {
      setTestimonialError("Add the client's name");
      return;
    }

    setAddingTestimonial(true);
    const res = await fetch("/api/testimonials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote: newQuote.trim(), author: newAuthor.trim(), rating: newRating }),
    });
    const data = await res.json();
    setAddingTestimonial(false);

    if (!res.ok) {
      setTestimonialError(data.error ?? "Couldn't add testimonial");
      return;
    }
    setTestimonials((prev) => [data, ...prev]);
    setNewQuote("");
    setNewAuthor("");
    setNewRating(5);
    refreshPreview();
  }

  async function removeTestimonial(id: string) {
    setTestimonials((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/testimonials/${id}`, { method: "DELETE" });
    refreshPreview();
  }

  async function addProperty(e: React.FormEvent) {
    e.preventDefault();
    setAddingProperty(true);
    setPropError(null);

    const res = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(propForm),
    });
    const data = await res.json();

    if (!res.ok) {
      setPropError(data.error ?? "Couldn't add property");
      setAddingProperty(false);
      return;
    }

    setProperties((prev) => [data, ...prev]);
    setPropForm(emptyPropertyForm);
    setAddingProperty(false);
    setPropertiesView("all");
    refreshPreview();
  }

  async function deleteProperty(id: string) {
    setProperties((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/properties/${id}`, { method: "DELETE" });
    refreshPreview();
  }

  function startEdit(property: Property) {
    setEditForm(propertyToFormState(property));
    setEditingId(property.id);
    setEditError(null);
    setPropertiesView("edit");
  }

  function cancelEdit() {
    setPropertiesView("all");
    setEditingId(null);
    setEditError(null);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSavingEdit(true);
    setEditError(null);

    const res = await fetch(`/api/properties/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    setSavingEdit(false);

    if (!res.ok) {
      setEditError(data.error ?? "Couldn't save changes");
      return;
    }

    setProperties((prev) => prev.map((p) => (p.id === editingId ? data : p)));
    setPropertiesView("all");
    setEditingId(null);
    refreshPreview();
  }

  async function toggleFeatured(id: string, next: boolean) {
    setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, isFeatured: next } : p)));
    await fetch(`/api/properties/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: next }),
    });
    refreshPreview();
  }

  return (
    <div className="dash-app">
      <aside className="dash-sidebar">
        <div className="dash-sidebar-head">
          <div className="dash-brand">
            agentprofile<b>.ae</b>
          </div>
          <button
            type="button"
            className="dash-hamburger"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? <CloseIcon className="w-4 h-4" /> : <MenuIcon className="w-4 h-4" />}
          </button>
        </div>

        <div className="dash-agent-card">
          {form.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.photoUrl} alt={agent.name} className="dash-agent-avatar avatar-photo" />
          ) : (
            <div className="dash-agent-avatar">{agent.avatarInitials}</div>
          )}
          <div>
            <div className="dash-agent-name">{agent.name}</div>
            <div className="dash-agent-slug">/{slug}</div>
          </div>
        </div>

        <div className={`dash-nav-wrap${mobileNavOpen ? " open" : ""}`}>
          <nav className="dash-nav-list">
            <button
              className={`dash-nav-item${section === "overview" ? " active" : ""}`}
              onClick={openOverview}
            >
              Overview
            </button>
            <button
              className={`dash-nav-item${section === "profile" ? " active" : ""}`}
              onClick={() => {
                setSection("profile");
                setMobileNavOpen(false);
              }}
            >
              My Profile
            </button>
            <button
              className={`dash-nav-item${section === "properties" ? " active" : ""}`}
              onClick={openProperties}
            >
              Properties
              {LISTINGS_ENABLED ? (
                <span className="dash-nav-count">{properties.length}</span>
              ) : (
                <span className="dash-nav-soon">SOON</span>
              )}
            </button>
            <button
              className={`dash-nav-item${section === "analytics" ? " active" : ""}`}
              onClick={openAnalytics}
            >
              Analytics
            </button>
            <div className="dash-nav-divider" />
            <button
              className={`dash-nav-item${section === "settings" ? " active" : ""}`}
              onClick={() => {
                setSection("settings");
                setMobileNavOpen(false);
              }}
            >
              Settings
            </button>
          </nav>

          <div className="dash-sidebar-foot">
            <Link className="dash-link" href={`/${slug}`} target="_blank">
              View live profile
            </Link>
            <button
              className="dash-link"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Log out
            </button>
          </div>
        </div>
      </aside>

      <main className="dash-main">
        <div className="dash-content-grid">
        <div className="dash-main-inner">
          {section === "overview" && (
            <>
              <div className="dash-page-head">
                <div>
                  <div className="dash-page-title">Welcome back, {agent.name.split(" ")[0]}</div>
                  <div className="dash-page-sub">Here&apos;s where things stand today.</div>
                </div>
                <Link className="dash-page-cta" href={`/${slug}`} target="_blank">
                  View live profile
                </Link>
              </div>

              <ApprovalStatusBanner
                submittedForReview={submittedForReview}
                isApproved={isApproved}
                listingCount={properties.length}
                slug={slug}
              />

              <div className="overview-stats">
                <button type="button" className="dash-card overview-stat" onClick={openProperties}>
                  <span className="overview-stat-label">Properties</span>
                  {LISTINGS_ENABLED ? (
                    <span className="overview-stat-value">{properties.length}</span>
                  ) : (
                    <span className="overview-stat-locked">Coming soon</span>
                  )}
                </button>
                <button type="button" className="dash-card overview-stat" onClick={openAnalytics}>
                  <span className="overview-stat-label">
                    Profile Views <span className="overview-stat-window">· 30d</span>
                  </span>
                  {analyticsData ? (
                    <span className="overview-stat-value">{analyticsData.last30.profileViews}</span>
                  ) : (
                    <span className="overview-stat-cta">View Analytics →</span>
                  )}
                </button>
                <button type="button" className="dash-card overview-stat" onClick={() => goToProfileTab("testimonials")}>
                  <span className="overview-stat-label">Testimonials</span>
                  <span className="overview-stat-value">{testimonials.length}</span>
                </button>
              </div>

              {(() => {
                const checks = [
                  { label: "Bio written", done: form.bio.trim().length > 0, tab: "about" as ProfileTab },
                  {
                    label: "Contact method added",
                    done: Boolean(form.whatsapp.trim() || form.phone.trim() || form.contactEmail.trim()),
                    tab: "contact" as ProfileTab,
                  },
                  {
                    label: "Social or extra link added",
                    done: hasAnySocial(form) || links.length > 0,
                    tab: "social" as ProfileTab,
                  },
                  {
                    label: "Specialities & areas listed",
                    done: Boolean(form.specialities.trim() && form.areas.trim()),
                    tab: "expertise" as ProfileTab,
                  },
                ];
                const doneCount = checks.filter((c) => c.done).length;
                const pct = Math.round((doneCount / checks.length) * 100);
                return (
                  <div className="dash-card completion-card">
                    <div className="completion-head">
                      <span className="section-title">Profile strength</span>
                      <span className="completion-pct">{pct}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="completion-list">
                      {checks.map((c) => (
                        <div className={`completion-item${c.done ? " done" : ""}`} key={c.label}>
                          <span className="dot">{c.done && <CheckIcon className="w-3 h-3" />}</span>
                          {c.label}
                          {!c.done && (
                            <button
                              type="button"
                              className="completion-item-action"
                              onClick={() => goToProfileTab(c.tab)}
                            >
                              Add
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="dash-card">
                <SectionHeader
                  tone="primary"
                  icon={<LinkIcon className="w-4 h-4" />}
                  title="Your profile link"
                  sub="Share this wherever clients might look for you."
                />
                <div className="slug-edit-row">
                  <span className="slug-prefix">agentprofile.ae/</span>
                  <input value={slug} readOnly />
                  <button type="button" className="btn-secondary" onClick={copyProfileLink}>
                    {copyLabel}
                  </button>
                </div>
              </div>
            </>
          )}

          {section === "profile" && (
            <>
              <div>
                <div className="dash-page-title">My Profile</div>
                <div className="dash-page-sub">
                  Your personal and contact details — most agents only touch this occasionally.
                </div>
              </div>

              <div className="sub-nav-pills" style={{ flexWrap: "wrap" }}>
                <button
                  type="button"
                  className={`sub-nav-pill${profileTab === "identity" ? " active" : ""}`}
                  onClick={() => setProfileTab("identity")}
                >
                  Identity
                </button>
                <button
                  type="button"
                  className={`sub-nav-pill${profileTab === "contact" ? " active" : ""}`}
                  onClick={() => setProfileTab("contact")}
                >
                  Contact
                </button>
                <button
                  type="button"
                  className={`sub-nav-pill${profileTab === "social" ? " active" : ""}`}
                  onClick={() => setProfileTab("social")}
                >
                  Social &amp; Links
                </button>
                <button
                  type="button"
                  className={`sub-nav-pill${profileTab === "about" ? " active" : ""}`}
                  onClick={() => setProfileTab("about")}
                >
                  About You
                </button>
                <button
                  type="button"
                  className={`sub-nav-pill${profileTab === "expertise" ? " active" : ""}`}
                  onClick={() => setProfileTab("expertise")}
                >
                  Expertise
                </button>
                <button
                  type="button"
                  className={`sub-nav-pill${profileTab === "testimonials" ? " active" : ""}`}
                  onClick={() => setProfileTab("testimonials")}
                >
                  Testimonials
                </button>
              </div>

              {profileTab !== "testimonials" && (
              <form className="dash-card" onSubmit={saveProfile}>
                {profileError && (
                  <div className="form-error">{profileError}</div>
                )}

                {profileTab === "identity" && (
                <div className="form-section">
                  <SectionHeader
                    tone="primary"
                    icon={<BriefcaseIcon className="w-4 h-4" />}
                    title="Identity"
                    sub="Your name, agency, and license."
                  />
                  <div className="field profile-media-field">
                    <label>Profile photo</label>
                    <div className="photo-upload">
                      {form.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={form.photoUrl} alt="Profile photo" className="photo-upload-img" />
                      ) : (
                        <div className="photo-upload-img photo-upload-empty">{agent.avatarInitials}</div>
                      )}
                      <div className="photo-upload-side">
                        <div className="cover-upload-actions" style={{ marginTop: 0 }}>
                          <label className="btn-ghost-sm">
                            {uploadingImage === "photoUrl" ? "Saving…" : form.photoUrl ? "Change" : "Upload photo"}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              style={{ display: "none" }}
                              disabled={uploadingImage !== null}
                              onChange={(e) => {
                                pickProfileImage("photoUrl", e.target.files?.[0]);
                                e.target.value = "";
                              }}
                            />
                          </label>
                          {form.photoUrl && (
                            <>
                              <button type="button" className="btn-ghost-sm" onClick={() => adjustProfileImage("photoUrl")} disabled={uploadingImage !== null}>
                                Adjust
                              </button>
                              <button type="button" className="btn-ghost-sm" onClick={() => removeProfileImage("photoUrl")} disabled={uploadingImage !== null}>
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                        <span className="cover-upload-hint">A clear headshot. JPG, PNG or WEBP — you can crop it after choosing.</span>
                      </div>
                    </div>
                  </div>
                  <div className="field profile-media-field">
                    <label>Cover image</label>
                    <div className="cover-upload">
                      {form.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={form.coverUrl} alt="Cover" className="cover-upload-img" />
                      ) : (
                        <div className="cover-upload-empty">
                          A wide banner across the top of your profile — a skyline, your office, or your best listing.
                        </div>
                      )}
                    </div>
                    <div className="cover-upload-actions">
                      <label className="btn-ghost-sm">
                        {uploadingImage === "coverUrl" ? "Saving…" : form.coverUrl ? "Change" : "Upload cover"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          style={{ display: "none" }}
                          disabled={uploadingImage !== null}
                          onChange={(e) => {
                            pickProfileImage("coverUrl", e.target.files?.[0]);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      {form.coverUrl && (
                        <>
                          <button type="button" className="btn-ghost-sm" onClick={() => adjustProfileImage("coverUrl")} disabled={uploadingImage !== null}>
                            Adjust
                          </button>
                          <button type="button" className="btn-ghost-sm" onClick={() => removeProfileImage("coverUrl")} disabled={uploadingImage !== null}>
                            Remove
                          </button>
                        </>
                      )}
                      <span className="cover-upload-hint">A wide photo works best — you can crop it after choosing.</span>
                    </div>
                  </div>
                  {cropTarget && (
                    <ImageCropper
                      key={cropTarget.src}
                      src={cropTarget.src}
                      aspect={cropTarget.field === "photoUrl" ? 1 : 3}
                      round={cropTarget.field === "photoUrl"}
                      outputWidth={cropTarget.field === "photoUrl" ? 600 : 1500}
                      title={cropTarget.field === "photoUrl" ? "Crop profile photo" : "Crop cover image"}
                      onCancel={closeCropper}
                      onConfirm={applyCrop}
                    />
                  )}
                  <div className="field-grid">
                    <div className="field">
                      <label>Full name</label>
                      <input
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                        required
                      />
                    </div>
                    <div className="field">
                      <label>Brokerage / Agency (optional)</label>
                      <ComboInput
                        value={form.agency}
                        onChange={(v) => update("agency", v)}
                        options={agencyOptions}
                        placeholder="Vantage Real Estate"
                      />
                      <p className="field-hint">
                        Shown on your public profile exactly as entered — it isn&apos;t verified by the brokerage.
                        Start typing to match an existing entry, or enter a new one. Clear the field to remove it.
                      </p>
                    </div>
                    <div className="field">
                      <label>Role / Tagline</label>
                      <input
                        value={form.role}
                        onChange={(e) => update("role", e.target.value)}
                        placeholder="Luxury & Off-Plan Specialist"
                      />
                    </div>
                    <div className="field">
                      <label>RERA BRN</label>
                      <input
                        value={form.brn}
                        onChange={(e) => update("brn", e.target.value)}
                        placeholder="41527"
                        inputMode="numeric"
                        pattern="\d{3,7}"
                        title="Numbers only, 3–7 digits"
                        required
                      />
                    </div>
                  </div>
                </div>
                )}

                {profileTab === "contact" && (
                <div className="form-section">
                  <SectionHeader
                    tone="accent3"
                    icon={<PhoneIcon className="w-4 h-4" />}
                    title="Contact"
                    sub="How clients reach you — at least one method is required."
                  />
                  <div className="field-grid">
                    <div className="field">
                      <label>WhatsApp number (intl format)</label>
                      <input
                        value={form.whatsapp}
                        onChange={(e) => update("whatsapp", e.target.value)}
                        placeholder="971501234567"
                      />
                    </div>
                    <div className="field">
                      <label>Phone (for Call button)</label>
                      <input
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        placeholder="971501234567"
                      />
                    </div>
                    <div className="field" style={{ gridColumn: "1 / -1" }}>
                      <label>Public contact email</label>
                      <input
                        type="email"
                        value={form.contactEmail}
                        onChange={(e) => update("contactEmail", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="sub-block">
                    <div className="sub-block-head">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <div>
                        <div className="sub-block-title">Book button</div>
                        <div className="sub-block-sub">Choose what happens when a client taps Book on your profile.</div>
                      </div>
                    </div>
                    <div className="booking-mode-options" role="radiogroup" aria-label="Book button">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={form.bookingMode === "form"}
                        className={`booking-mode-option${form.bookingMode === "form" ? " active" : ""}`}
                        onClick={() => update("bookingMode", "form")}
                      >
                        <span className="booking-mode-title">Booking form</span>
                        <span className="booking-mode-desc">
                          Clients pick a date and time on your page. Requests are emailed to{" "}
                          <b>{form.contactEmail.trim() || agent.email}</b>.
                        </span>
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={form.bookingMode === "link"}
                        className={`booking-mode-option${form.bookingMode === "link" ? " active" : ""}`}
                        onClick={() => update("bookingMode", "link")}
                      >
                        <span className="booking-mode-title">My booking link</span>
                        <span className="booking-mode-desc">Send clients to Calendly, Cal.com, or any other booking page.</span>
                      </button>
                    </div>
                    {form.bookingMode === "form" && (
                      <div className="booking-hours">
                        <div className="field">
                          <label>Days you take viewings</label>
                          <div className="booking-hours-days" role="group" aria-label="Days you take viewings">
                            {DAY_NAMES.map((name, day) => {
                              const days = parseBookingDays(form.bookingDays);
                              const on = days.includes(day);
                              return (
                                <button
                                  key={name}
                                  type="button"
                                  aria-pressed={on}
                                  className={`booking-hours-day${on ? " active" : ""}`}
                                  onClick={() =>
                                    update(
                                      "bookingDays",
                                      (on ? days.filter((d) => d !== day) : [...days, day]).sort((a, b) => a - b).join(","),
                                    )
                                  }
                                >
                                  {name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="booking-hours-row">
                          <div className="field">
                            <label>From</label>
                            <select value={form.bookingStartTime} onChange={(e) => update("bookingStartTime", e.target.value)}>
                              {HOUR_OPTIONS.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="field">
                            <label>Until</label>
                            <select value={form.bookingEndTime} onChange={(e) => update("bookingEndTime", e.target.value)}>
                              {HOUR_OPTIONS.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="field">
                            <label>Each viewing</label>
                            <select
                              value={form.bookingSlotMinutes}
                              onChange={(e) => update("bookingSlotMinutes", Number(e.target.value))}
                            >
                              {SLOT_LENGTHS.map((m) => (
                                <option key={m} value={m}>
                                  {m === 60 ? "1 hour" : `${m} min`}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <p className="field-hint">
                          Clients see open times for the next two weeks, in Dubai time
                          {bookingSlotCount > 0 ? ` — ${bookingSlotCount} slots a day.` : "."}
                        </p>
                      </div>
                    )}
                    {form.bookingMode === "link" && (
                      <div className="field" style={{ marginTop: 14 }}>
                        <label>Booking link</label>
                        <input
                          type="url"
                          value={form.bookingUrl}
                          onChange={(e) => update("bookingUrl", e.target.value)}
                          placeholder="https://calendly.com/you"
                        />
                      </div>
                    )}
                  </div>
                </div>
                )}

                {profileTab === "social" && (
                <div className="form-section">
                  <SectionHeader
                    tone="gold"
                    icon={<InstagramIcon className="w-4 h-4" />}
                    title="Social Links"
                    sub="Optional — shown as icons on your page."
                  />
                  <div className="field-grid">
                    {SOCIAL_PLATFORMS.map(({ field, name, placeholder }) => (
                      <div className="field" key={field}>
                        <label>{name} URL</label>
                        <input value={form[field]} onChange={(e) => update(field, e.target.value)} placeholder={placeholder} />
                      </div>
                    ))}
                  </div>

                  <div className="sub-block">
                    <div className="sub-block-head">
                      <LinkIcon className="w-3.5 h-3.5" />
                      <div>
                        <div className="sub-block-title">Featured &amp; links</div>
                        <div className="sub-block-sub">
                          Pin a YouTube video, add your podcast, a course, or a community. Videos and podcasts play right on your
                          profile.
                        </div>
                      </div>
                    </div>

                    {links.length > 0 && (
                      <div className="link-list" style={{ marginBottom: 12 }}>
                        {[...links]
                          .sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.order - b.order)
                          .map((l) => {
                            const kind = kindOf(l);
                            return (
                              <div className={`link-row featured-row${l.pinned ? " pinned" : ""}`} key={l.id}>
                                <div className="featured-row-main">
                                  <span className="link-row-label">
                                    {l.pinned && <span className="feat-pin">Pinned</span>}
                                    {l.label}
                                  </span>
                                  <span className="link-row-url">
                                    {embedFor(l.url) ? "Plays on your profile · " : ""}
                                    {l.url}
                                  </span>
                                </div>
                                <div className="featured-row-actions">
                                  <select
                                    className="featured-kind-select"
                                    value={kind}
                                    aria-label={`Type for ${l.label}`}
                                    onChange={(e) => updateLink(l.id, { kind: e.target.value as LinkKind })}
                                  >
                                    {LINK_KINDS.map((k) => (
                                      <option key={k} value={k}>
                                        {LINK_KIND_LABELS[k]}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    className={`btn-ghost-sm${l.pinned ? " active" : ""}`}
                                    aria-pressed={l.pinned}
                                    onClick={() => updateLink(l.id, { pinned: !l.pinned })}
                                  >
                                    {l.pinned ? "Unpin" : "Pin"}
                                  </button>
                                  <button type="button" className="btn-ghost-sm" onClick={() => removeLink(l.id)}>
                                    Remove
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}

                    {linkError && (
                      <div className="form-error" style={{ marginBottom: 10 }}>
                        {linkError}
                      </div>
                    )}

                    <div className="add-link-row">
                      <input
                        value={newLinkLabel}
                        onChange={(e) => setNewLinkLabel(e.target.value)}
                        placeholder="Label, e.g. My market update video"
                      />
                      <input
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        placeholder="https://youtube.com/…, open.spotify.com/…, or any link"
                        type="url"
                      />
                      <select
                        className="featured-kind-select"
                        value={newLinkKind}
                        aria-label="Link type"
                        onChange={(e) => setNewLinkKind(e.target.value as LinkKind | "")}
                      >
                        <option value="">
                          {newLinkUrl.trim() ? `Auto: ${LINK_KIND_LABELS[detectKind(newLinkUrl.trim())]}` : "Auto-detect type"}
                        </option>
                        {LINK_KINDS.map((k) => (
                          <option key={k} value={k}>
                            {LINK_KIND_LABELS[k]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={addingLink}
                        style={{ flex: "0 0 auto", padding: "0 16px" }}
                        onClick={addLink}
                      >
                        {addingLink ? "Adding…" : "Add"}
                      </button>
                    </div>
                  </div>
                </div>
                )}

                {profileTab === "about" && (
                <div className="form-section">
                  <SectionHeader
                    tone="primary"
                    icon={<ClockIcon className="w-4 h-4" />}
                    title="About You"
                    sub="Your track record, in your own words."
                  />
                  <div className="field-grid">
                    <div className="field">
                      <label>Years experience</label>
                      <input
                        type="number"
                        min={0}
                        value={form.yearsExperience}
                        onChange={(e) =>
                          update("yearsExperience", Number(e.target.value))
                        }
                      />
                    </div>
                    {!LISTINGS_ENABLED && (
                      <>
                        <div className="field">
                          <label>Listings for sale</label>
                          <input
                            type="number"
                            min={0}
                            value={form.manualForSaleCount}
                            onChange={(e) => update("manualForSaleCount", Number(e.target.value))}
                          />
                        </div>
                        <div className="field">
                          <label>Listings for rent</label>
                          <input
                            type="number"
                            min={0}
                            value={form.manualForRentCount}
                            onChange={(e) => update("manualForRentCount", Number(e.target.value))}
                          />
                        </div>
                      </>
                    )}
                    <div className="field">
                      <label>Total transacted (AED)</label>
                      <input
                        type="number"
                        min={0}
                        value={form.transactedVolume}
                        onChange={(e) => update("transactedVolume", e.target.value)}
                        placeholder="e.g. 45000000"
                      />
                    </div>
                  </div>
                  {!LISTINGS_ENABLED && (
                    <p className="field-hint">
                      Shown as your &quot;For Sale&quot; / &quot;For Rent&quot; counts on your public profile until
                      listings are open — set these to whatever reflects your current portfolio.
                    </p>
                  )}
                  <p className="field-hint">
                    Optional — shown as a stat on your public profile (e.g. &quot;AED 45M&quot;). Leave blank to hide it.
                  </p>
                  <div className="field">
                    <div className="field-label-row">
                      <label>Bio</label>
                      <button
                        type="button"
                        className="ai-generate-btn"
                        onClick={generateBioText}
                        disabled={generatingBio}
                      >
                        <SparkleIcon className="w-3 h-3" />
                        {generatingBio ? "Generating…" : form.bio.trim() ? "Regenerate with AI" : "Generate with AI"}
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={form.bio}
                      onChange={(e) => update("bio", e.target.value)}
                      placeholder="Luxury Specialist at Vantage Real Estate&#10;Off-plan & villas · Dubai Marina, JVC"
                    />
                    <span className={`bio-count${form.bio.length > BIO_MAX_LENGTH ? " over" : ""}`}>
                      {form.bio.length}/{BIO_MAX_LENGTH}
                    </span>
                  </div>
                </div>
                )}

                {profileTab === "expertise" && (
                <div className="form-section">
                  <SectionHeader
                    tone="accent3"
                    icon={<AreaIcon className="w-4 h-4" />}
                    title="Expertise"
                    sub="Shown as chips on your page."
                  />
                  <div className="field-grid">
                    <div className="field">
                      <label>Specialities</label>
                      <input
                        value={form.specialities}
                        onChange={(e) => update("specialities", e.target.value)}
                        placeholder="Residential Sales, Off-Plan Sales"
                      />
                    </div>
                    <div className="field" style={{ gridColumn: "1 / -1" }}>
                      <label>Areas you cover</label>
                      <ChipMultiSelect options={EMIRATES} value={form.areas} onChange={(v) => update("areas", v)} />
                    </div>
                    <div className="field" style={{ gridColumn: "1 / -1" }}>
                      <label>Languages</label>
                      <TagSelect
                        options={LANGUAGES}
                        value={form.languages}
                        onChange={(v) => update("languages", v)}
                        placeholder="Type to add a language…"
                      />
                    </div>
                  </div>
                </div>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginTop: 4,
                  }}
                >
                  <button
                    className="btn-primary"
                    type="submit"
                    disabled={saving}
                    style={{ minWidth: 140 }}
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                  {saveMsg && <span className="save-msg">{saveMsg}</span>}
                </div>
              </form>
              )}

              {profileTab === "testimonials" && (
              <div className="dash-card">
                  <SectionHeader
                    tone="gold"
                    icon={<StarIcon className="w-4 h-4" />}
                    title="Client Testimonials"
                    sub="Shown on your public profile as a carousel."
                  />

                  {testimonials.length > 0 && (
                    <div className="testimonial-list">
                      {testimonials.map((t) => (
                        <div className="testimonial-row" key={t.id}>
                          <div className="testimonial-row-stars">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <StarIcon key={n} className="w-3 h-3" filled={n <= t.rating} />
                            ))}
                          </div>
                          <p className="testimonial-row-quote">&quot;{t.quote}&quot;</p>
                          <div className="testimonial-row-foot">
                            <span className="testimonial-row-author">{t.author}</span>
                            <button className="btn-ghost-sm" onClick={() => removeTestimonial(t.id)}>
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {testimonialError && <div className="form-error">{testimonialError}</div>}

                  <div className="field">
                    <label>Quote</label>
                    <textarea
                      rows={3}
                      value={newQuote}
                      onChange={(e) => setNewQuote(e.target.value)}
                      placeholder="Ahmed made buying our first home effortless..."
                    />
                  </div>
                  <div className="field-grid">
                    <div className="field">
                      <label>Client name</label>
                      <input value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} placeholder="Fatima R." />
                    </div>
                    <div className="field">
                      <label>Rating</label>
                      <div className="rating-picker">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            type="button"
                            key={n}
                            aria-label={`${n} star${n === 1 ? "" : "s"}`}
                            onClick={() => setNewRating(n)}
                          >
                            <StarIcon className="w-4 h-4" filled={n <= newRating} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ alignSelf: "flex-start", padding: "0 20px" }}
                    onClick={addTestimonial}
                    disabled={addingTestimonial}
                  >
                    {addingTestimonial ? "Adding…" : "Add Testimonial"}
                  </button>
                </div>
              )}

            </>
          )}

          {section === "properties" && (
            <>
              <div className="dash-page-head">
                <div>
                  <div className="dash-page-title">Properties</div>
                  <div className="dash-page-sub">
                    {LISTINGS_ENABLED
                      ? `${properties.length} ${properties.length === 1 ? "property" : "properties"} live on your profile.`
                      : "This part of the dashboard is on its way."}
                  </div>
                </div>
                <Link className="dash-page-cta" href={`/${slug}`} target="_blank">
                  View live profile
                </Link>
              </div>

              {!LISTINGS_ENABLED && (
                <div className="dash-card coming-soon-card">
                  <div className="coming-soon-icon">
                    <BriefcaseIcon className="w-5 h-5" />
                  </div>
                  <div className="coming-soon-title">Properties — coming soon</div>
                  <p className="coming-soon-sub">
                    Adding and managing listings isn&apos;t open yet. We&apos;ll let you know the moment it&apos;s
                    ready — your profile can go live without any in the meantime.
                  </p>
                </div>
              )}

              {LISTINGS_ENABLED && (
              <>
              <div className="sub-nav-pills">
                <button
                  type="button"
                  className={`sub-nav-pill${propertiesView === "all" ? " active" : ""}`}
                  onClick={() => setPropertiesView("all")}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`sub-nav-pill${propertiesView === "add" ? " active" : ""}`}
                  onClick={() => {
                    setPropForm(emptyPropertyForm);
                    setPropError(null);
                    setPropertiesView("add");
                  }}
                >
                  Add Property
                </button>
              </div>

              {propertiesView === "all" && (
                <div className="dash-card">
                  {properties.length === 0 ? (
                    <p className="dash-page-sub">No listings yet — add your first one to get started.</p>
                  ) : (
                    <div>
                      {properties.map((p) => (
                        <div className="prop-row" key={p.id}>
                          <div className="prop-row-main">
                            <span className="prop-row-title">
                              {p.title}
                              {p.isFeatured && (
                                <span className="prop-row-featured">
                                  <StarIcon className="w-3 h-3" />
                                  Featured
                                </span>
                              )}
                            </span>
                            <span className="prop-row-meta">
                              {p.propertyType} · {formatAED(p.price)}
                              {p.listingType === "rent"
                                ? ` ${rentalSuffix(p.rentalPeriod)}`
                                : ""}{" "}
                              · {p.beds} bd · {p.baths} ba ·{" "}
                              {p.listingType === "sale"
                                ? p.status === "ready"
                                  ? "Ready"
                                  : "Off-Plan"
                                : rentalLabel(p.rentalPeriod ?? "yearly")}
                            </span>
                          </div>
                          <div className="prop-row-actions">
                            <button className="btn-ghost-sm" onClick={() => toggleFeatured(p.id, !p.isFeatured)}>
                              {p.isFeatured ? "Unfeature" : "Feature"}
                            </button>
                            <button className="btn-ghost-sm" onClick={() => startEdit(p)}>
                              Edit
                            </button>
                            <button
                              className="btn-ghost-sm"
                              onClick={() => deleteProperty(p.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {propertiesView === "add" && (
                <form className="dash-card" onSubmit={addProperty} style={{ gap: 4 }}>
                  {propError && (
                    <div className="form-error" style={{ marginBottom: 14 }}>
                      {propError}
                    </div>
                  )}
                  <PropertyForm
                    form={propForm}
                    onFieldChange={updateProp}
                    uploadingSlot={uploadingSlot}
                    onImageSelect={handleImageSelect}
                    onRemoveImage={removeImage}
                    noTopBorder
                  />
                  <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                    <button
                      className="btn-primary"
                      type="submit"
                      disabled={addingProperty}
                      style={{ alignSelf: "flex-start", minWidth: 140 }}
                    >
                      {addingProperty ? "Adding…" : "Add property"}
                    </button>
                    <button type="button" className="btn-ghost-sm" onClick={() => setPropertiesView("all")}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {propertiesView === "edit" && (
                <form className="dash-card" onSubmit={saveEdit} style={{ gap: 4 }}>
                  {editError && (
                    <div className="form-error" style={{ marginBottom: 14 }}>
                      {editError}
                    </div>
                  )}
                  <PropertyForm
                    form={editForm}
                    onFieldChange={updateEdit}
                    uploadingSlot={uploadingSlot}
                    onImageSelect={handleImageSelect}
                    onRemoveImage={removeImage}
                    noTopBorder
                  />
                  <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                    <button
                      className="btn-primary"
                      type="submit"
                      disabled={savingEdit}
                      style={{ alignSelf: "flex-start", minWidth: 140 }}
                    >
                      {savingEdit ? "Saving…" : "Save changes"}
                    </button>
                    <button type="button" className="btn-ghost-sm" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              </>
              )}
            </>
          )}

          {section === "analytics" && (
            <>
              <div className="dash-page-head">
                <div>
                  <div className="dash-page-title">Analytics</div>
                  <div className="dash-page-sub">Track profile views and leads.</div>
                </div>
                {analyticsData && (
                  <button type="button" className="dash-page-cta" onClick={loadAnalytics} disabled={analyticsLoading}>
                    {analyticsLoading ? "Refreshing…" : "Refresh"}
                  </button>
                )}
              </div>

              {analyticsLoading && !analyticsData && (
                <div className="dash-card">
                  <p className="dash-page-sub">Loading analytics…</p>
                </div>
              )}

              {analyticsData && <AnalyticsPanels data={analyticsData} />}
            </>
          )}
          {section === "settings" && (
            <>
              <div>
                <div className="dash-page-title">Settings</div>
                <div className="dash-page-sub">Account-level controls and publishing status.</div>
              </div>

              <div className="dash-card">
                  <SectionHeader
                    tone="gold"
                    icon={<CrownIcon className="w-4 h-4" />}
                    title="Profile Tools"
                    sub="Extra tools for a standout profile."
                  />

                  <div className="field">
                    <label>Custom URL</label>
                    <div className="slug-edit-row">
                      <span className="slug-prefix">agentprofile.ae/</span>
                      <input
                        value={slugInput}
                        onChange={(e) => setSlugInput(e.target.value)}
                        readOnly={slugLocked}
                        aria-describedby="slug-lock-hint"
                      />
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={updateSlug}
                        disabled={slugSaving || slugLocked}
                      >
                        {slugSaving ? "Saving…" : "Update"}
                      </button>
                    </div>
                    <p className="field-hint" id="slug-lock-hint">
                      {slugLocked
                        ? `Links can be changed once every ${SLUG_LOCK_DAYS} days. You can change yours again on ${formatUnlockDate(slugUnlockDate)}.`
                        : `Once you change it, it stays locked for ${SLUG_LOCK_DAYS} days — your old link stops working, so update anywhere you've shared it.`}
                    </p>
                    {slugError && (
                      <div className="form-error" style={{ marginTop: 8 }}>
                        {slugError}
                      </div>
                    )}
                    {slugMsg && <span className="save-msg">{slugMsg}</span>}
                  </div>

                  <div className="field">
                    <label>Availability</label>
                    <div className="availability-toggle">
                      <button
                        type="button"
                        className={`availability-toggle-btn available${form.availabilityStatus === "available" ? " active" : ""}`}
                        onClick={() => saveAvailability("available")}
                        disabled={savingAvailability}
                      >
                        Available
                      </button>
                      <button
                        type="button"
                        className={`availability-toggle-btn busy${form.availabilityStatus === "busy" ? " active" : ""}`}
                        onClick={() => saveAvailability("busy")}
                        disabled={savingAvailability}
                      >
                        Busy
                      </button>
                    </div>
                    <p className="field-hint">Shown as a badge next to your name. Saves immediately.</p>
                  </div>

                  <div className="field">
                    <label>Verification badge</label>
                    {agent.isVerified && agent.isPro ? (
                      <div className="status-banner tone-live">
                        <CheckIcon className="w-4 h-4" />
                        <div>
                          <div className="status-banner-title">Verified by our team</div>
                          <div className="status-banner-sub">Your badge is shown on your public profile.</div>
                        </div>
                      </div>
                    ) : agent.isVerified ? (
                      <div className="status-banner tone-neutral">
                        <CheckIcon className="w-4 h-4" />
                        <div>
                          <div className="status-banner-title">Verified by our team</div>
                          <div className="status-banner-sub">Your badge will show on your public profile once you&apos;re on Pro.</div>
                        </div>
                      </div>
                    ) : (
                      <div className="status-banner tone-neutral">
                        <ClockIcon className="w-4 h-4" />
                        <div>
                          <div className="status-banner-title">Not yet verified</div>
                          <div className="status-banner-sub">Our team reviews verification after your profile is approved.</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="field">
                    <label>QR Code</label>
                    <div className="qr-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/qr?text=${encodeURIComponent(`${origin}/${slug}`)}`}
                        alt="QR code linking to your profile"
                        className="qr-image"
                      />
                      <div className="qr-block-info">
                        <p className="field-hint">Scan to open your profile — great for business cards and signage.</p>
                        <a
                          className="btn-secondary"
                          href={`/api/qr?text=${encodeURIComponent(`${origin}/${slug}`)}`}
                          download={`${slug}-qr.png`}
                        >
                          <QrCodeIcon className="w-4 h-4" />
                          Download PNG
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

              {!submittedForReview ? (
                <div className="dash-card">
                  {!agent.emailVerifiedAt ? (
                    <>
                      <SectionHeader
                        tone="gold"
                        icon={<MailIcon className="w-4 h-4" />}
                        title="Confirm your email first"
                        sub="We need to know your email actually reaches you before your profile can go live."
                      />
                      {resendStatus === "sent" ? (
                        <div className="status-banner tone-live">
                          <CheckIcon className="w-4 h-4" />
                          <div>
                            <div className="status-banner-title">Check your inbox</div>
                            <div className="status-banner-sub">We sent a confirmation link to {agent.email}.</div>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="btn-primary"
                          onClick={resendVerification}
                          disabled={resendStatus === "loading"}
                          style={{ alignSelf: "flex-start", minWidth: 180 }}
                        >
                          {resendStatus === "loading" ? "Sending…" : "Send confirmation link"}
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <SectionHeader
                        tone="gold"
                        icon={<ClockIcon className="w-4 h-4" />}
                        title="Ready to go live?"
                        sub={
                          LISTINGS_ENABLED
                            ? "Our team reviews new profiles before they go public. You'll also need at least one listing."
                            : "Our team reviews new profiles before they go public."
                        }
                      />
                      <button
                        className="btn-primary"
                        onClick={submitForApproval}
                        disabled={submitting}
                        style={{ alignSelf: "flex-start", minWidth: 180 }}
                      >
                        {submitting ? "Submitting…" : "Submit for Approval"}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                !isApproved && (
                  <div className="dash-card">
                    <div className="completion-done-banner" style={{ color: "var(--gold)" }}>
                      <ClockIcon className="w-4 h-4" />
                      Submitted — waiting on team approval.
                    </div>
                  </div>
                )
              )}

            </>
          )}
        </div>

        <LivePreviewPanel slug={slug} refreshKey={previewRefreshKey} onRefresh={refreshPreview} />
        </div>
      </main>
    </div>
  );
}
