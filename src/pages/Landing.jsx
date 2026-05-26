import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, Search, Users, MessageSquare,
  FolderOpen, GraduationCap, Bell, Menu, X,
  Zap, ChevronRight
} from "lucide-react";

/* ── Color tokens ── */
const C = {
  bg:      "#0A0E1A",
  surface: "#0F1629",
  card:    "#131C2E",
  border:  "rgba(148,163,184,0.10)",
  primary: "#6366F1",
  accent:  "#818CF8",
  glow:    "rgba(99,102,241,0.15)",
  text:    "#F1F5F9",
  sub:     "#94A3B8",
  muted:   "#475569",
};

/* ── Font loader ── */
function useFont() {
  useEffect(() => {
    if (document.querySelector("[data-ss-font]")) return;
    const l = document.createElement("link");
    l.rel  = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap";
    l.setAttribute("data-ss-font", "1");
    document.head.appendChild(l);
  }, []);
}

/* ── Fade-in wrapper ── */
const Reveal = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >{children}</motion.div>
  );
};

/* ── Feature card ── */
const FeatureCard = ({ icon, title, desc, delay = 0 }) => (
  <Reveal delay={delay}>
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: "32px 28px",
      transition: "all 0.3s ease",
      cursor: "default",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = C.primary + "40";
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 20px 60px ${C.glow}`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = C.border;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `linear-gradient(135deg, ${C.primary}20, ${C.accent}10)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 20, color: C.accent,
      }}>{icon}</div>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 10, lineHeight: 1.3 }}>{title}</h3>
      <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.7, margin: 0 }}>{desc}</p>
    </div>
  </Reveal>
);

/* ── Step card ── */
const StepCard = ({ num, title, desc, delay = 0 }) => (
  <Reveal delay={delay}>
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%", margin: "0 auto 20px",
        background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, fontWeight: 800, color: "#fff",
        boxShadow: `0 8px 32px ${C.glow}`,
      }}>{num}</div>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.7, maxWidth: 280, margin: "0 auto" }}>{desc}</p>
    </div>
  </Reveal>
);

/* ═══════════════════════════ MAIN ═══════════════════════════ */
export default function Landing() {
  useFont();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const scrollTo = id => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMenu(false); };
  const go = p => navigate(p);

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "'Inter', sans-serif", overflowX: "hidden" }}>

      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        ::selection{background:${C.primary}40;}
        @keyframes pulse{0%,100%{opacity:.4}50%{opacity:.7}}
        @media(max-width:768px){
          .hero-grid{grid-template-columns:1fr!important;}
          .feat-grid{grid-template-columns:1fr!important;}
          .step-grid{grid-template-columns:1fr!important;}
          .nav-links{display:none!important;}
          .nav-sign{display:none!important;}
          .mob-btn{display:flex!important;}
        }
        @media(min-width:769px){.mob-btn{display:none!important;}.mob-menu{display:none!important;}}
      `}</style>

      {/* ════ NAVBAR ════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, height: 64,
        background: scrolled ? "rgba(10,14,26,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: `1px solid ${scrolled ? C.border : "transparent"}`,
        transition: "all 0.35s ease",
      }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => go("/")}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={17} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px" }}>SkillSync</span>
          </div>

          {/* Links */}
          <div className="nav-links" style={{ display: "flex", gap: 36 }}>
            {[["Features", "features"], ["How it works", "steps"], ["About", "/about"]].map(([label, target]) => (
              <button key={target}
                onClick={() => target.startsWith("/") ? go(target) : scrollTo(target)}
                style={{ background: "none", border: "none", color: C.sub, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "'Inter',sans-serif", transition: "color 0.2s" }}
                onMouseEnter={e => e.target.style.color = C.text}
                onMouseLeave={e => e.target.style.color = C.sub}
              >{label}</button>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="nav-sign" onClick={() => go("/auth")}
              style={{ background: "none", border: "none", color: C.sub, fontSize: 14, fontWeight: 500, cursor: "pointer", padding: "8px 14px", fontFamily: "'Inter',sans-serif", transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = C.text}
              onMouseLeave={e => e.target.style.color = C.sub}
            >Sign in</button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => go("/auth")}
              style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, color: "#fff", border: "none", padding: "9px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}
            >Get Started</motion.button>
            <button className="mob-btn" onClick={() => setMenu(!menu)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "none", alignItems: "center" }}>
              {menu ? <X size={22} color={C.text} /> : <Menu size={22} color={C.sub} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menu && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mob-menu"
            style={{ background: "rgba(10,14,26,0.97)", backdropFilter: "blur(20px)", padding: "16px 24px 24px", borderTop: `1px solid ${C.border}` }}>
            {[["Features", "features"], ["How it works", "steps"], ["About", "/about"]].map(([l, t]) => (
              <button key={t} onClick={() => t.startsWith("/") ? go(t) : scrollTo(t)}
                style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: `1px solid ${C.border}`, color: C.sub, fontSize: 15, padding: "14px 0", cursor: "pointer", fontFamily: "'Inter',sans-serif" }}
              >{l}</button>
            ))}
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button onClick={() => go("/auth")} style={{ background: "none", border: `1px solid ${C.border}`, color: C.sub, padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Sign in</button>
              <button onClick={() => go("/auth")} style={{ background: C.primary, color: "#fff", border: "none", padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>Get Started</button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ════ HERO ════ */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 24px 80px", position: "relative", overflow: "hidden" }}>
        {/* Subtle gradient orbs */}
        <div style={{ position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)", width: 800, height: 500, borderRadius: "50%", background: `radial-gradient(ellipse, ${C.primary}12, transparent 70%)`, animation: "pulse 6s ease-in-out infinite", pointerEvents: "none" }} />

        <div style={{ maxWidth: 720, textAlign: "center", position: "relative", zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "6px 16px", borderRadius: 99, marginBottom: 32,
              background: `${C.primary}12`, border: `1px solid ${C.primary}25`,
              fontSize: 13, fontWeight: 600, color: C.accent,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399", display: "inline-block" }} />
              Student Networking Platform
            </span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontSize: "clamp(36px, 5.5vw, 64px)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-2px", marginBottom: 24 }}>
            Find teammates<br />
            <span style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.accent}, #38BDF8)`, backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              by actual skills.
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            style={{ fontSize: 18, color: C.sub, lineHeight: 1.7, maxWidth: 500, margin: "0 auto 40px" }}>
            Stop asking around in WhatsApp groups. SkillSync matches you with the right students based on skills, not luck.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => go("/auth")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                color: "#fff", border: "none", padding: "15px 32px", borderRadius: 12,
                fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif",
                boxShadow: `0 8px 32px ${C.glow}`,
              }}>
              Get Started Free <ArrowRight size={18} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => scrollTo("features")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "transparent", color: C.sub,
                border: `1.5px solid ${C.border}`, padding: "14px 28px", borderRadius: 12,
                fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary + "50"; e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.sub; }}
            >
              Learn more
            </motion.button>
          </motion.div>

          {/* Trust line */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ fontSize: 13, color: C.muted, marginTop: 32 }}>
            Free to use · No credit card required · Built for college students
          </motion.p>
        </div>
      </section>

      {/* ════ FEATURES ════ */}
      <section id="features" style={{ padding: "100px 24px", background: C.surface }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.accent, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>Features</p>
              <h2 style={{ fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 800, letterSpacing: "-1px", lineHeight: 1.15, marginBottom: 16 }}>
                Everything you need to collaborate.
              </h2>
              <p style={{ fontSize: 16, color: C.sub, maxWidth: 480, margin: "0 auto" }}>
                Built around how students actually find teammates and build projects together.
              </p>
            </div>
          </Reveal>

          <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <FeatureCard delay={0} icon={<Search size={20} />} title="Skill-Based Discovery" desc="Search by exact tech stack — React, Flutter, ML. Find the right person instantly." />
            <FeatureCard delay={0.08} icon={<MessageSquare size={20} />} title="Real-time Messaging" desc="DM your connections instantly. All conversations in one clean place." />
            <FeatureCard delay={0.16} icon={<Users size={20} />} title="Team Formation" desc="Create a project, list required roles, invite people directly from search." />
            <FeatureCard delay={0.24} icon={<FolderOpen size={20} />} title="Project Showcase" desc="Post your work publicly. Attract collaborators excited about what you're building." />
            <FeatureCard delay={0.32} icon={<GraduationCap size={20} />} title="Mentor Connect" desc="Find verified mentors for guidance. Request mentorship directly in the app." />
            <FeatureCard delay={0.4} icon={<Bell size={20} />} title="Smart Notifications" desc="Stay updated on connection requests, team invites, and messages in real-time." />
          </div>
        </div>
      </section>

      {/* ════ HOW IT WORKS ════ */}
      <section id="steps" style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.accent, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>How it works</p>
              <h2 style={{ fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 800, letterSpacing: "-1px" }}>
                Three steps. That's it.
              </h2>
            </div>
          </Reveal>

          <div className="step-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40, position: "relative" }}>
            {/* Connecting line */}
            <div style={{ position: "absolute", top: 28, left: "20%", right: "20%", height: 0, borderTop: `1.5px dashed ${C.border}`, pointerEvents: "none" }} />
            <StepCard delay={0} num="1" title="Build your profile" desc="Add your skills, branch, year, and links. Takes 2 minutes." />
            <StepCard delay={0.12} num="2" title="Discover & connect" desc="Filter by skill, domain, or year. Send connection requests." />
            <StepCard delay={0.24} num="3" title="Build together" desc="Form teams, chat, schedule meetings, and start shipping." />
          </div>
        </div>
      </section>

      {/* ════ CTA ════ */}
      <section style={{ padding: "60px 24px 120px" }}>
        <Reveal>
          <div style={{
            maxWidth: 640, margin: "0 auto", textAlign: "center", padding: "72px 40px",
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24,
            position: "relative", overflow: "hidden",
          }}>
            {/* Glow */}
            <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 400, height: 300, borderRadius: "50%", background: `radial-gradient(ellipse, ${C.primary}18, transparent 70%)`, pointerEvents: "none" }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              <h2 style={{ fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: 800, letterSpacing: "-0.8px", lineHeight: 1.2, marginBottom: 16 }}>
                Ready to find your team?
              </h2>
              <p style={{ fontSize: 16, color: C.sub, maxWidth: 380, margin: "0 auto 32px", lineHeight: 1.7 }}>
                Join students who are already building projects with the right people.
              </p>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => go("/auth")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                  color: "#fff", border: "none", padding: "15px 36px", borderRadius: 12,
                  fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif",
                  boxShadow: `0 8px 32px ${C.glow}`,
                }}>
                Get Started <ArrowRight size={18} />
              </motion.button>
              <p style={{ fontSize: 13, color: C.muted, marginTop: 16 }}>Free forever · No setup required</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ════ FOOTER ════ */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "32px 24px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={14} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, color: C.sub }}>SkillSync</span>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[["Features", "features"], ["How it works", "steps"]].map(([l, id]) => (
              <button key={id} onClick={() => scrollTo(id)}
                style={{ background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif", transition: "color 0.2s" }}
                onMouseEnter={e => e.target.style.color = C.sub}
                onMouseLeave={e => e.target.style.color = C.muted}
              >{l}</button>
            ))}
            <span style={{ fontSize: 13, color: C.muted }}>© 2025 SkillSync</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
