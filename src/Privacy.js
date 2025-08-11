import React from "react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "auto" }}>
      <h1>Privacy Policy</h1>
      <p>
        Your privacy is important to us. This Privacy Policy explains how we
        collect, use, and safeguard your information when you use our website
        and services.
      </p>
      <h2>Information We Collect</h2>
      <p>
        We may collect personal information such as your name, email address,
        and gameplay statistics. We also collect anonymous usage data to help
        improve the website.
      </p>
      <h2>How We Use Your Information</h2>
      <p>
        We use your data to operate and improve our services, provide
        personalized experiences, and comply with legal obligations.
      </p>
      <h2>Third-Party Services</h2>
      <p>
        Our site may display ads served by Google AdSense. These may use
        cookies to personalize ad content.
      </p>
      <h2>Contact</h2>
      <p>
        If you have questions about this Privacy Policy, contact us at:
        support@example.com
      </p>
      <Link to="/" className='game2048-reset-btn'>Back to Home</Link>
    </div>
  );
}