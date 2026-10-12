import type { SocialKey } from "@/lib/socials";
import {
  FacebookIcon,
  GlobeIcon,
  InstagramIcon,
  LinkedInIcon,
  PinterestIcon,
  SpotifyIcon,
  TikTokIcon,
  YouTubeIcon,
} from "@/components/icons";

export const SOCIAL_ICONS: Record<SocialKey, typeof InstagramIcon> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  linkedin: LinkedInIcon,
  tiktok: TikTokIcon,
  youtube: YouTubeIcon,
  pinterest: PinterestIcon,
  spotify: SpotifyIcon,
  website: GlobeIcon,
};
