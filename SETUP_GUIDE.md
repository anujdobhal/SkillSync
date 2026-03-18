# SkillSync - Modern JavaScript UI Setup Guide

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
# or
bun install
```

This will install the new packages:
- ✓ framer-motion - Animations
- ✓ @react-three/fiber - 3D rendering
- ✓ @react-three/drei - 3D utilities  
- ✓ three - 3D library
- ✓ @tsparticles/react - Particle system
- ✓ react-hot-toast - Toast notifications

### 2. Start Development Server
```bash
npm run dev
# or
bun run dev
```

**Open:** http://localhost:8080

---

## 📁 Project Structure

```
src/
├── lib/
│   ├── animations.jsx          ← Framer Motion utilities
│   ├── utils.js                ← Helper functions
│   ├── init-posts-table.js
│   └── profile-photo.js
├── components/
│   ├── Hero3D.jsx             ← 3D landing hero
│   ├── ParticleNetwork.jsx    ← Particle background
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   ├── chat/                  ← Chat components
│   └── ui/                    ← 46 UI components
├── pages/                     ← 14 page components
├── hooks/
│   ├── use-toast.js
│   └── use-mobile.jsx
├── integrations/
│   └── supabase/              ← Supabase setup
├── index.css                  ← Dark theme + animations
└── App.jsx                    ← Main app with routing
```

---

## 🎨 Styling Guide

### Using Animations

**Simple fade-in:**
```javascript
import { motion } from 'framer-motion';

<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
  Content
</motion.div>
```

**With animation presets:**
```javascript
import { fadeInUp } from "@/lib/animations.jsx";

<motion.div {...fadeInUp}>
  Content
</motion.div>
```

**Hover effects:**
```javascript
<motion.div whileHover={{ y: -8 }} className="glass-card">
  Content
</motion.div>
```

### Glass Cards

```javascript
<Card className="glass-card p-6 rounded-xl border border-white/10">
  {children}
</Card>
```

### Gradient Buttons

```javascript
<Button className="bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-white">
  Click me
</Button>
```

### Skill Badges

```javascript
<span className="skill-badge">React</span>
<span className="skill-badge">TypeScript</span>
```

---

## 🎯 Theme Customization

Edit `src/index.css` `:root` section to change colors:

**Current theme:**
```css
--primary: #7C3AED      /* Violet */
--secondary: #2563EB    /* Blue   */
--accent: #06B6D4       /* Cyan   */
--background: #0F0F1A   /* Dark   */
```

---

## ✨ Key Features

### Landing Page (Index.jsx)
- ✓ 3D particle network background
- ✓ Animated hero section
- ✓ Staggered feature cards
- ✓ Gradient text headings
- ✓ CTA with hover effects

### Global Animations
- ✓ Page transitions
- ✓ Card hover lifts
- ✓ Button ripple effects
- ✓ Glow animations
- ✓ Scroll-triggered reveals

### Dark Theme
- ✓ Modern dark background
- ✓ Glassmorphic cards
- ✓ Smooth gradients
- ✓ High contrast text
- ✓ Accessible colors

---

## 🔧 Available Animation Utilities

Located in `src/lib/animations.jsx`:

```javascript
fadeInUp        // Fade + slide up
fadeIn          // Simple fade
staggerContainer // Sequential animations
scaleIn         // Scale + fade
hoverLift       // Hover lift effect
glowEffect      // Hover glow
pageTransition  // Page transitions
AnimatedContainer // Wrapper component
AnimatedButton  // Button component
```

---

## 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with WebGL support

---

## 📚 Documentation Links

- [Framer Motion Docs](https://www.framer.com/motion/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/ui](https://ui.shadcn.com/)

---

## 🐛 Troubleshooting

**3D background not visible?**
- Check if WebGL is supported in your browser
- Look for Canvas errors in Dev Tools
- Fallback gradient will show instead

**Animations not smooth?**
- Check browser performance
- Reduce particle count in ParticleNetwork.jsx if needed
- Profile with Chrome DevTools Performance tab

**Imports showing as errors?**
- Restart VS Code
- Clear `node_modules` and reinstall
- Check file extensions are `.jsx`/`.js`

---

## ✅ Next Steps

1. Run `npm install` 
2. Start dev server: `npm run dev`
3. View http://localhost:8080
4. Customize remaining pages using the animation patterns
5. Build for production: `npm run build`

**All business logic and Supabase integrations remain intact and fully functional!**
