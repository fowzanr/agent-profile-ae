import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy — agentprofile.ae",
  description: "How agentprofile.ae handles information from agents and the people who visit their profiles.",
};

const LAST_UPDATED = "14 October 2026";

export default function PrivacyPage() {
  const contactEmail = process.env.CONTACT_EMAIL;

  return (
    <div className="legal-shell">
      <article className="legal">
        <Link href="/" className="legal-brand">
          agentprofile<b>.ae</b>
        </Link>
        <h1>Privacy</h1>
        <p className="legal-updated">Last updated {LAST_UPDATED}</p>

        <p>
          agentprofile.ae gives UAE real estate agents a single page for their credentials, contact details, and
          work. This notice explains what information we handle, why, and the choices you have.
        </p>

        <h2>Information agents give us</h2>
        <ul>
          <li>Account details: name, login email, and password (stored only as a secure hash, never in plain text).</li>
          <li>
            Profile content: photo and cover image, bio, role and agency, RERA BRN and DED licence, contact numbers
            and email, social links, featured links, client testimonials, and booking hours.
          </li>
          <li>Verification: our team records when a licence and social profiles were checked before approval.</li>
        </ul>
        <p>
          Everything on an approved profile is public by design. Your login email and password are never shown on
          your profile.
        </p>

        <h2>Information from people who visit a profile</h2>
        <ul>
          <li>
            <b>Booking requests</b> — your name, phone or email, preferred time, and note. These go to the agent you
            chose by email so they can confirm your viewing, and stored so our team can help if something goes
            wrong.
          </li>
          <li>
            <b>Reports</b> — the reason, any details, and contact information if you choose to give it. Reports go to
            the agentprofile.ae team only, never to the agent.
          </li>
          <li>
            <b>Usage counts</b> — we count profile views and taps on buttons like WhatsApp, call, email, book, and
            share so agents can see what&apos;s working. These counts are tied to the profile, not to you.
          </li>
          <li>
            <b>Security</b> — your IP address is used briefly to stop spam and abuse (for example, too many forms in a
            short time). It isn&apos;t stored with your requests.
          </li>
        </ul>

        <h2>Cookies and similar storage</h2>
        <ul>
          <li>
            <b>Essential</b> — a sign-in cookie keeps agents and our review team logged in. It&apos;s only set when you
            sign in.
          </li>
          <li>
            <b>Your choices</b> — if you change Cookie choices, that choice is saved in your browser.
          </li>
          <li>
            <b>Embedded media</b> — videos and podcasts on a profile come from YouTube, Spotify, Apple Podcasts, or
            SoundCloud. They only load when you tap play or allow them in Cookie choices, and those services may then
            set their own cookies under their own policies.
          </li>
        </ul>
        <p>We don&apos;t use advertising or cross-site tracking cookies, and we don&apos;t sell personal information.</p>

        <h2>Who we share information with</h2>
        <ul>
          <li>The agent you contact, for booking requests you send them.</li>
          <li>
            Service providers that run the site for us: Vercel (hosting and image storage), Neon (database), and Resend
            (email). They process data on our behalf and may store it outside the UAE.
          </li>
          <li>Authorities, if the law requires it.</li>
        </ul>

        <h2>How long we keep it</h2>
        <p>
          Agent accounts and profiles are kept while the account is active. Booking requests, reports, and usage counts
          are kept so agents and our team can follow up and spot problems. Ask us and we&apos;ll delete an account and
          its data, unless we need to keep something by law.
        </p>

        <h2>Your rights</h2>
        <p>
          You can ask to see, correct, or delete information about you. Agents can update most of their information
          themselves from the dashboard.{" "}
          {contactEmail ? (
            <>
              To make a request, email <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
            </>
          ) : (
            <>To make a request, use the Report link on any profile and tell us what you need.</>
          )}
        </p>

        <h2>Changes</h2>
        <p>If we change how we handle information, we&apos;ll update this page and the date above.</p>

        <p className="legal-back">
          <Link href="/">← Back to agentprofile.ae</Link>
        </p>
      </article>
    </div>
  );
}
