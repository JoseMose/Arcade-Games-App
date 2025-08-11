import React from "react";
import { Link } from "react-router-dom";

export default function AboutContact() {
  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "auto" }}>
      <h1>About This Website</h1>
      <p>
        This site is a fun arcade-style game platform built for entertainment
        and competition. You can play, compete on the leaderboard, and enjoy
        our games for free.
      </p>

      <h2>Contact Us</h2>
      <p>Email: vecadrop@gmail.com</p>
      <Link to="/" className='game2048-reset-btn'>Back to Home</Link>
    </div>
  );
}