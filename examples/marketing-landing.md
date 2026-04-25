# Spec: LaunchLayer Marketing Site [surface="marketing" adapter="baseline"]

## Screen: Landing [id="landing" shell="marketing" kind="landing" gap="md"]

### Region: Navbar [id="landing-navbar" type="navbar" gap="md"]
#### Block: Navigation [id="landing-navigation" type="navbar" variant="default" gap="md"]
- nav-item#landing-nav-features: Features [action="navigate:landing"]
- nav-item#landing-nav-pricing: Pricing [action="navigate:pricing"]
- nav-item#landing-nav-faq: FAQ [action="show-state:faq-note"]
- button#landing-nav-start: Start free [action="navigate:signup"]

### Region: Main [id="landing-main" type="main" gap="md"]
#### Block: Hero [id="landing-hero" type="hero" variant="split" gap="md"]
- badge#hero-badge: Portable prototype handoff
- headline#hero-headline: Turn product specs into reviewable HTML.
- subhead#hero-subhead: LaunchLayer helps product teams turn semantic markdown into deterministic browser and Micro Canvas artifacts.
- button#hero-primary: Build a prototype [action="navigate:signup"]
- button#hero-secondary: View pricing [action="navigate:pricing"]

#### Block: Customer Logos [id="customer-logos" type="logo-cloud" variant="compact" gap="md"]
- logo#logo-nova: Nova
- logo#logo-cobalt: Cobalt
- logo#logo-ember: Ember
- logo#logo-northstar: Northstar

#### Block: Feature Overview [id="feature-overview" type="feature-grid" variant="three-column" gap="md"]
- feature#feature-semantic: Semantic authoring [description="Describe product intent with bounded regions, blocks, states, and actions."]
- feature#feature-deterministic: Deterministic compilation [description="Keep regenerated IR and HTML stable for serious review."]
- feature#feature-portable: Portable handoff [description="Open standalone HTML in browsers, Micro Canvas, or compatible viewers."]

#### Block: Product Band [id="product-band" type="feature-band" variant="alternating" gap="md"]
- headline#band-headline: Stay above implementation detail.
- text#band-copy: The source grammar rejects JSX, raw HTML, Tailwind classes, scripts, styles, and arbitrary component selectors.
- button#band-cta: See adapter stance [action="navigate:adapter"]

#### Block: Pricing Overview [id="pricing-overview" type="pricing" variant="three-tier" gap="md"]
- pricing-tier#tier-starter: Starter [price="$19/user" description="For small product teams validating flows."]
- pricing-tier#tier-team: Team [price="$49/user" featured="true" description="For teams shipping multiple prototypes each week."]
- pricing-tier#tier-enterprise: Enterprise [price="Custom" description="For organizations standardizing handoff review."]

#### Block: Testimonials [id="testimonials" type="testimonial-group" variant="featured" gap="md"]
- testimonial#testimonial-maya: Maya, VP Product [quote="We reviewed three product directions before anyone opened a framework."]
- testimonial#testimonial-lee: Lee, Design Systems Lead [quote="The adapter boundary kept the spec clean and portable."]

#### Block: FAQ [id="faq-overview" type="faq" gap="md"]
- faq-item#faq-runtime: Does the artifact need a runtime? [answer="No. The handoff is standalone HTML with inline deterministic behavior."]
- faq-item#faq-production: Is this production frontend code? [answer="No. It is decision-grade prototype output."]
- faq-item#faq-adapters: Can we choose any component library? [answer="Not in this change. Baseline is the only supported adapter target."]

##### State: FAQ Note [id="faq-note" type="revealed"]
- text#faq-note-copy: FAQ content is in view. Use Pricing or Start free to navigate to other marketing screens.

#### Block: Final CTA [id="final-cta" type="cta" variant="band" gap="md"]
- headline#final-cta-headline: Start with a bounded spec.
- subhead#final-cta-copy: Compile it into portable HTML for a real product conversation.
- button#final-cta-button: Request access [action="navigate:signup"]

### Region: Footer [id="landing-footer" type="footer" gap="md"]
#### Block: Footer [id="footer" type="footer" variant="dense" gap="md"]
- text#footer-name: LaunchLayer
- nav-item#footer-contact: Contact [action="navigate:contact"]
- nav-item#footer-adapter: Adapter stance [action="navigate:adapter"]

## Screen: Pricing [id="pricing" shell="marketing" kind="pricing" gap="md"]

### Region: Main [id="pricing-main" type="main" gap="md"]
#### Block: Pricing Detail [id="pricing-detail" type="pricing" variant="three-tier" gap="md"]
- headline#pricing-headline: Pick the rollout pace.
- pricing-tier#pricing-starter: Starter [price="$19/user" description="Prototype one product surface at a time."]
- pricing-tier#pricing-team: Team [price="$49/user" featured="true" description="Coordinate multiple product reviews."]
- pricing-tier#pricing-enterprise: Enterprise [price="Custom" description="Standardize prototype handoff across teams."]
- button#pricing-start: Start free [action="navigate:signup"]
- button#pricing-home: Back home [action="navigate:landing"]

## Screen: Signup [id="signup" shell="marketing" kind="signup" gap="md"]

### Region: Navbar [id="signup-navbar" type="navbar" gap="md"]
#### Block: Signup Navigation [id="signup-navigation" type="navbar" gap="md"]
- nav-item#signup-nav-home: Home [action="navigate:landing"]
- nav-item#signup-nav-contact: Contact [action="navigate:contact"]

### Region: Main [id="signup-main" type="main" gap="md"]
#### Block: Signup Form [id="signup-form" type="signup-form" variant="default" gap="md"]
- headline#signup-headline: Request LaunchLayer access.
- field#signup-name: Name [placeholder="Ada Lovelace"]
- field#signup-email: Work email [placeholder="ada@example.com"]
- field#signup-team: Team size [placeholder="12"]
- button#signup-submit: Request access [action="show-state:signup-success"]

##### State: Signup Success [id="signup-success" type="success"]
- success#signup-success-message: Request received in prototype mode.
- button#signup-return: Return home [action="navigate:landing"]

## Screen: Contact [id="contact" shell="marketing" kind="contact" gap="md"]

### Region: Main [id="contact-main" type="main" gap="md"]
#### Block: Contact Form [id="contact-form" type="contact-form" variant="default" gap="md"]
- headline#contact-headline: Talk with the team.
- field#contact-name: Name
- field#contact-email: Email
- field#contact-message: What are you prototyping?
- button#contact-send: Send message [action="show-state:contact-success"]

##### State: Contact Success [id="contact-success" type="success"]
- success#contact-success-message: Message sent in prototype mode.

## Screen: Adapter Stance [id="adapter" shell="marketing" kind="feature" gap="md"]

### Region: Main [id="adapter-main" type="main" gap="md"]
#### Block: Adapter Feature [id="adapter-feature" type="feature-band" gap="md"]
- headline#adapter-headline: Baseline first, adapters later.
- text#adapter-copy: The vNext grammar records rendering target metadata while keeping source specs free of library-specific markup.
- button#adapter-home: Back to landing [action="navigate:landing"]
