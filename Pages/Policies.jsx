import React, { useState, useMemo } from "react";
import { createPageUrl } from "@/utils";

const tabs = [
  { id: "terms", label: "Terms of Use", updated: "January 2025" },
  { id: "privacy", label: "Privacy Policy", updated: "January 2025" },
  { id: "guidelines", label: "Community Guidelines" },
  { id: "disclaimer", label: "Food Safety Disclaimer" },
];

const sections = {
  terms: [
    { id: "terms-about", label: "1. About SharePlate" },
    { id: "terms-eligibility", label: "2. Eligibility" },
    { id: "terms-resp", label: "3. User Responsibilities" },
    { id: "terms-warranties", label: "4. No Warranties" },
    { id: "terms-liability", label: "5. Limitation of Liability" },
    { id: "terms-content", label: "6. User Content" },
    { id: "terms-prohibited", label: "7. Prohibited Activities" },
    { id: "terms-privacy", label: "8. Privacy" },
    { id: "terms-modifications", label: "9. Modifications" },
    { id: "terms-contact", label: "10. Contact" },
  ],
  privacy: [
    { id: "privacy-collect", label: "1. Information We Collect" },
    { id: "privacy-use", label: "2. How We Use Your Information" },
    { id: "privacy-sharing", label: "3. Information Sharing" },
    { id: "privacy-security", label: "4. Data Security" },
    { id: "privacy-choices", label: "5. Your Choices" },
    { id: "privacy-children", label: "6. Children’s Privacy" },
    { id: "privacy-updates", label: "7. Updates" },
  ],
  guidelines: [
    { id: "guidelines-1", label: "1. Share food for free only" },
    { id: "guidelines-2", label: "2. Be respectful and kind" },
    { id: "guidelines-3", label: "3. Share responsibly" },
    { id: "guidelines-4", label: "4. Pick up safely" },
    { id: "guidelines-5", label: "5. No commercial activity" },
    { id: "guidelines-6", label: "6. Follow the law" },
    { id: "guidelines-7", label: "7. Be honest" },
  ],
  disclaimer: [{ id: "disclaimer-body", label: "Food Safety Disclaimer" }],
};

export default function Policies() {
  const [active, setActive] = useState("terms");

  const tabMeta = useMemo(() => tabs.find((t) => t.id === active), [active]);

  const handleTab = (id) => {
    setActive(id);
    // scroll to top of content on tab change
    const main = document.getElementById("policy-root");
    if (main) main.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div id="policy-root" className="min-h-screen bg-[#f7f7f7] text-[#222]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 sticky top-0 bg-[#f7f7f7] z-10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTab(tab.id)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                active === tab.id
                  ? "bg-[#222] text-white border-[#222]"
                  : "bg-white text-[#222] border-[#ddd]"
              }`}
              aria-selected={active === tab.id}
              aria-controls={tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <main className="mt-4 space-y-8">
          {/* Terms */}
          <article
            id="terms"
            className={`${
              active === "terms" ? "block" : "hidden"
            } bg-white border border-[#ddd] rounded-2xl shadow-sm p-5 sm:p-7`}
          >
            <header className="mb-3">
              <h1 className="text-2xl font-bold">Terms of Use</h1>
              <p className="text-sm text-[#666]">Last Updated: January 2025</p>
            </header>
            <TableOfContents items={sections.terms} />
            <div className="prose-sm leading-relaxed space-y-4 text-[#222]">
              <p>
                <strong>Terms of Use</strong>
                <br />
                Last Updated: January 2025
              </p>
              <p>
                Welcome to SharePlate, a community platform for free, voluntary food sharing. By accessing or using
                SharePlate, you agree to these Terms of Use (“Terms”). If you do not agree, please do not use the
                platform.
              </p>

              <Section id="terms-about" title="1. About SharePlate">
                <p>
                  SharePlate is a social community platform that allows users to share homemade or surplus food for free.
                  <br />
                  SharePlate does <strong>not</strong> sell, prepare, store, package, inspect, or deliver food.
                  <br />
                  SharePlate does <strong>not</strong> verify the safety, ingredients, allergens, origin, or quality of any food shared by
                  users.
                  <br />
                  All sharing is peer-to-peer and voluntary.
                </p>
              </Section>

              <Section id="terms-eligibility" title="2. Eligibility">
                <p>You must be at least 18 years old to use SharePlate. By using the platform, you confirm that you:</p>
                <ul className="list-disc ml-5">
                  <li>Are legally able to participate</li>
                  <li>Understand that food sharing involves personal risk</li>
                </ul>
              </Section>

              <Section id="terms-resp" title="3. User Responsibilities">
                <p>You agree that:</p>
                <ul className="list-disc ml-5">
                  <li>You will share food for <strong>free only</strong></li>
                  <li>You will not request or accept payment of any kind for food</li>
                  <li>You will describe food accurately and honestly</li>
                  <li>You will comply with all local laws and regulations</li>
                  <li>You assume full responsibility for preparing, sharing, receiving, and consuming food</li>
                </ul>
                <p>SharePlate is not liable for:</p>
                <ul className="list-disc ml-5">
                  <li>Foodborne illness</li>
                  <li>Allergic reactions</li>
                  <li>Mislabeling or missing ingredient info</li>
                  <li>Improper food storage</li>
                  <li>Misconduct or behavior of other users</li>
                </ul>
              </Section>

              <Section id="terms-warranties" title="4. No Warranties">
                <p>
                  SharePlate is provided “as is” and “as available.”
                  <br />
                  We do not guarantee the accuracy, safety, quality, availability, or reliability of any content or food
                  shared on the platform.
                </p>
              </Section>

              <Section id="terms-liability" title="5. Limitation of Liability">
                <p>To the maximum extent permitted by law, SharePlate and its team are not responsible for any injury, illness, harm, loss, or damage resulting from:</p>
                <ul className="list-disc ml-5">
                  <li>Consuming shared food</li>
                  <li>Meeting or interacting with users</li>
                  <li>Miscommunication or disputes</li>
                  <li>Misuse of the platform</li>
                </ul>
                <p>Your participation is at your own risk.</p>
              </Section>

              <Section id="terms-content" title="6. User Content">
                <p>
                  You are responsible for all content you post.
                  <br />
                  SharePlate may remove content that is unsafe, offensive, misleading, illegal, or violates community guidelines.
                </p>
              </Section>

              <Section id="terms-prohibited" title="7. Prohibited Activities">
                <p>Users may not:</p>
                <ul className="list-disc ml-5">
                  <li>Sell food</li>
                  <li>Advertise commercial food services</li>
                  <li>Offer delivery or paid services</li>
                  <li>Harass, threaten, or harm others</li>
                  <li>Post illegal, unsafe, or misleading items</li>
                  <li>Use SharePlate for commercial gain</li>
                </ul>
              </Section>

              <Section id="terms-privacy" title="8. Privacy">
                <p>Your privacy is important. Please review our Privacy Policy for details.</p>
              </Section>

              <Section id="terms-modifications" title="9. Modifications">
                <p>SharePlate may update these Terms at any time. Continued use indicates acceptance of updated Terms.</p>
              </Section>

              <Section id="terms-contact" title="10. Contact">
                <p>For questions, contact us at: [your email].</p>
              </Section>
            </div>
          </article>

          {/* Privacy */}
          <article
            id="privacy"
            className={`${
              active === "privacy" ? "block" : "hidden"
            } bg-white border border-[#ddd] rounded-2xl shadow-sm p-5 sm:p-7`}
          >
            <header className="mb-3">
              <h1 className="text-2xl font-bold">Privacy Policy</h1>
              <p className="text-sm text-[#666]">Last Updated: January 2025</p>
            </header>
            <TableOfContents items={sections.privacy} />
            <div className="prose-sm leading-relaxed space-y-4 text-[#222]">
              <p>
                <strong>Privacy Policy</strong>
                <br />
                Last Updated: January 2025
              </p>
              <p>
                SharePlate (“we,” “us,” or “our”) respects your privacy. This policy explains how we collect, use, and
                protect your information.
              </p>

              <Section id="privacy-collect" title="1. Information We Collect">
                <p>We may collect:<br /><strong>Information you provide:</strong></p>
                <ul className="list-disc ml-5">
                  <li>Name</li>
                  <li>Email</li>
                  <li>Profile details</li>
                  <li>Photos</li>
                  <li>Messages</li>
                  <li>Food descriptions</li>
                </ul>
                <p><strong>Automatic information:</strong></p>
                <ul className="list-disc ml-5">
                  <li>Device details</li>
                  <li>IP address</li>
                  <li>Usage analytics</li>
                </ul>
                <p>We do <strong>not</strong> collect payment information because no payments occur on the platform.</p>
              </Section>

              <Section id="privacy-use" title="2. How We Use Your Information">
                <p>We use your information to:</p>
                <ul className="list-disc ml-5">
                  <li>Operate and improve the platform</li>
                  <li>Facilitate user-to-user communication</li>
                  <li>Enhance safety and community experience</li>
                  <li>Analyze usage patterns</li>
                  <li>Provide support</li>
                </ul>
                <p>We do <strong>not</strong> sell your personal information.</p>
              </Section>

              <Section id="privacy-sharing" title="3. Information Sharing">
                <p>We may share limited information with:</p>
                <ul className="list-disc ml-5">
                  <li>Service providers (hosting, analytics, etc.)</li>
                  <li>Law enforcement if legally required</li>
                </ul>
                <p>We never sell or rent personal data to advertisers.</p>
              </Section>

              <Section id="privacy-security" title="4. Data Security">
                <p>
                  We use reasonable security measures, but no system is 100% secure.
                  <br />
                  Your use of SharePlate is at your own risk.
                </p>
              </Section>

              <Section id="privacy-choices" title="5. Your Choices">
                <p>You may:</p>
                <ul className="list-disc ml-5">
                  <li>Edit your profile</li>
                  <li>Delete your account</li>
                  <li>Request account deletion</li>
                </ul>
                <p>Contact us to exercise these rights.</p>
              </Section>

              <Section id="privacy-children" title="6. Children’s Privacy">
                <p>SharePlate is not intended for anyone under age 18.</p>
              </Section>

              <Section id="privacy-updates" title="7. Updates">
                <p>We may update this Privacy Policy periodically. Continued use constitutes acceptance.</p>
              </Section>
            </div>
          </article>

          {/* Community Guidelines */}
          <article
            id="guidelines"
            className={`${
              active === "guidelines" ? "block" : "hidden"
            } bg-white border border-[#ddd] rounded-2xl shadow-sm p-5 sm:p-7`}
          >
            <header className="mb-3">
              <h1 className="text-2xl font-bold">Community Guidelines</h1>
            </header>
            <TableOfContents items={sections.guidelines} />
            <div className="prose-sm leading-relaxed space-y-4 text-[#222]">
              <p>
                <strong>Community Guidelines</strong>
              </p>
              <p>To keep SharePlate safe, respectful, and welcoming, all users agree to:</p>

              <Section id="guidelines-1" title="1. Share food for free only">
                <p>No payments, tips, exchanges, or trades.</p>
              </Section>

              <Section id="guidelines-2" title="2. Be respectful and kind">
                <p>No harassment, discrimination, or abusive behavior.</p>
              </Section>

              <Section id="guidelines-3" title="3. Share responsibly">
                <ul className="list-disc ml-5">
                  <li>Use clean containers</li>
                  <li>Avoid spoiled food</li>
                  <li>Include allergen information when possible</li>
                </ul>
              </Section>

              <Section id="guidelines-4" title="4. Pick up safely">
                <p>Meet in public places or outside your home when possible.</p>
              </Section>

              <Section id="guidelines-5" title="5. No commercial activity">
                <p>SharePlate is not a food business, delivery service, or marketplace.</p>
              </Section>

              <Section id="guidelines-6" title="6. Follow the law">
                <p>Illegal activities or violations may result in removal.</p>
              </Section>

              <Section id="guidelines-7" title="7. Be honest">
                <p>Represent food, ingredients, and conditions truthfully.</p>
              </Section>

              <p>Users who violate these guidelines may be suspended or removed.</p>
            </div>
          </article>

          {/* Food Safety Disclaimer */}
          <article
            id="disclaimer"
            className={`${
              active === "disclaimer" ? "block" : "hidden"
            } bg-white border border-[#ddd] rounded-2xl shadow-sm p-5 sm:p-7`}
          >
            <header className="mb-3">
              <h1 className="text-2xl font-bold">Food Safety Disclaimer</h1>
            </header>
            <TableOfContents items={sections.disclaimer} />
            <div className="prose-sm leading-relaxed space-y-4 text-[#222]">
              <Section id="disclaimer-body" title="Food Safety Disclaimer">
                <p>
                  SharePlate is a peer-to-peer community platform for voluntary, free food sharing.
                  <br />
                  SharePlate does <strong>not</strong> inspect, prepare, store, or verify any food.
                </p>
                <p>By using this platform, you acknowledge and agree that:</p>
                <ul className="list-disc ml-5">
                  <li>Food shared on SharePlate is <strong>not</strong> inspected or approved by any authority.</li>
                  <li>SharePlate does not guarantee food quality, safety, freshness, or allergen accuracy.</li>
                  <li>You consume or accept food <strong>at your own risk</strong>.</li>
                  <li>You are responsible for asking questions and exercising personal judgment.</li>
                  <li>SharePlate is not liable for illness, allergic reactions, injury, or harm arising from shared food.</li>
                </ul>
                <p>If you have any concerns about food safety, you should not participate.</p>
              </Section>
            </div>
          </article>
        </main>

        <footer className="text-center text-sm text-[#666] mt-6">
          SharePlate™ is a free community food-sharing platform. Participation is voluntary and at your own risk. © 2025 SharePlate™.
        </footer>
      </div>
    </div>
  );
}

function TableOfContents({ items }) {
  if (!items || !items.length) return null;
  return (
    <div className="bg-[#e6e6e6] border border-[#ddd] rounded-xl p-3 mb-5">
      <strong className="block mb-2 text-sm">On this page</strong>
      <div className="space-y-1 text-sm">
        {items.map((item) => (
          <a key={item.id} href={`#${item.id}`} className="block text-[#222] hover:underline">
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function Section({ id, title, children }) {
  return (
    <section id={id} className="space-y-2">
      <h2 className="text-lg font-semibold text-[#222]">{title}</h2>
      {children}
    </section>
  );
}
