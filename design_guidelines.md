# Kousossou AI - Professional Design Guidelines

## Design Approach
**Hybrid Strategy**: Foundation from Fluent Design (professional, data-focused) + inspiration from ChatGPT's conversational clarity and Linear's refined typography. Goal: Establish trust through restraint, clarity through hierarchy, and innovation through thoughtful interaction design.

**Core Principles**:
- Clarity over decoration
- Information hierarchy that guides attention
- Trustworthy professionalism without sterility
- Subtle sophistication in micro-details

## Typography

**Font Stack**:
- Primary: Inter (via Google Fonts) - Headings, UI elements, chat metadata
- Secondary: Source Serif Pro - Long-form AI responses for readability

**Hierarchy**:
- Hero Headline: Inter 700, 3.5rem (desktop) / 2.25rem (mobile)
- Section Headers: Inter 600, 2rem
- Chat Username/Timestamp: Inter 500, 0.875rem, opacity-70
- Response Introduction: Source Serif Pro 600, 1.125rem
- Main Response Text: Source Serif Pro 400, 1rem, line-height 1.75
- Empathy Indicators: Inter 500, 0.8125rem, italic
- CTA Buttons: Inter 600, 1rem

## Layout System

**Spacing Primitives**: Tailwind units of 1, 2, 3, 4, 6, 8, 12, 16, 24
- Micro spacing (badges, icons): 1-2
- Component internal: 3-4
- Between components: 6-8
- Section padding: 12-16 (mobile) / 16-24 (desktop)
- Major section breaks: 24

**Container Strategy**:
- Marketing sections: max-w-7xl, px-6
- Chat interface: max-w-4xl, centered
- Response cards: full width within chat container

## Component Library

**Hero Section**:
- Full-width image backdrop (darkened overlay, opacity-60)
- Centered content with headline + subheading + dual CTA buttons
- Buttons with backdrop-blur-md, bg-white/20 treatment
- Floating trust indicator badge (e.g., "Trusted by 50,000+ professionals")

**Chat Interface**:
- Message bubbles with distinct user/AI styling
- User messages: Aligned right, compact, subtle background
- AI responses: Full-width cards with structured sections

**Enriched Response Card**:
Three distinct zones within single card:
1. Introduction banner (subtle background treatment, 0.875rem text, pb-3 border-b)
2. Main answer area (generous padding-6, serif typography)
3. Discussion prompt footer (lighter background, rounded bottom corners, p-4)

**Empathy/Tone Indicators**:
- Floating pill badges above response cards
- Icon + text combination (e.g., 🎯 Professional Tone, 💡 Thoughtful Response)
- Semi-transparent background with subtle border

**Navigation**:
- Fixed header with logo left, navigation center, CTA right
- Transparent on hero, solid white with shadow on scroll
- Mobile: Hamburger menu with slide-in drawer

**Feature Showcase** (Marketing page):
- 2-column layout (lg:grid-cols-2) with alternating image/text positioning
- Feature cards in 3-column grid (lg:grid-cols-3)
- Each card: Icon top, title, description, micro-interaction on hover (subtle lift)

**Footer**:
- 4-column layout: Product, Company, Resources, Newsletter signup
- Social icons row
- Trust badges (security certifications, privacy compliance)

**Forms** (Contact/Signup):
- Floating labels
- Focus states with subtle ring-2 treatment
- Inline validation with smooth transitions

## Images

**Hero Image**:
- Location: Full-width hero section background
- Description: Professional workspace scene showing person using AI interface on laptop, modern office environment, warm natural lighting, slightly desaturated for sophistication. Alternative: Abstract geometric pattern representing AI connections/neural networks in subtle gradients.

**Feature Section Images**:
- Location: Alternating left/right in 2-column feature showcase
- Description 1: Close-up of enriched response interface showing structured introduction, main answer, discussion sections
- Description 2: Dashboard mockup displaying empathy indicators and tone awareness features
- Description 3: Team collaboration scene showing professionals discussing AI-generated insights

**Testimonial Section**:
- Location: Above testimonial quotes in 3-column grid
- Description: Professional headshots of diverse users, circular crops, subtle shadow treatment

**Trust Section**:
- Location: Logo cloud area
- Description: Company logos of notable clients/partners, monochrome treatment for visual consistency

All images should maintain consistent saturation levels and subtle vignette effects to match the professional, refined aesthetic.