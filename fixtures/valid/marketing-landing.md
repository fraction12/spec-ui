# Spec: Marketing Landing Fixture [surface="marketing" adapter="baseline"]

## Screen: Landing [id="landing" shell="marketing" kind="landing" gap="md"]

### Region: Navbar [id="landing-navbar" type="navbar" gap="md"]
#### Block: Site Navigation [id="site-nav" type="navbar" gap="md"]
- nav-item#nav-features: Features [action="navigate:landing"]
- nav-item#nav-pricing: Pricing [action="navigate:landing"]
- button#nav-signup: Start free [action="navigate:signup"]

### Region: Main [id="landing-main" type="main" gap="md"]
#### Block: Hero [id="hero" type="hero" variant="split" gap="md"]
- headline#hero-headline: Prototype product ideas without production code.
- subhead#hero-subhead: Spec UI turns bounded semantic specs into portable HTML handoff artifacts.
- button#hero-cta: Try the workflow [action="navigate:signup"]
- badge#hero-badge: Browser and Micro Canvas ready

#### Block: Customer Logos [id="customer-logos" type="logo-cloud" gap="md"]
- logo#logo-acme: Acme
- logo#logo-northstar: Northstar
- logo#logo-orbit: Orbit

#### Block: Feature Grid [id="features-section" type="feature-grid" variant="three-column" gap="md"]
- feature#feature-semantics: Semantic source [description="Write intent, not framework markup."]
- feature#feature-determinism: Deterministic output [description="Recompile without surprise drift."]
- feature#feature-handoff: Portable handoff [description="Open HTML anywhere compatible."]

#### Block: Pricing [id="pricing-section" type="pricing" variant="two-tier" gap="md"]
- pricing-tier#tier-team: Team [price="$29/user" featured="true"]
- pricing-tier#tier-business: Business [price="Custom"]

#### Block: Social Proof [id="social-proof" type="testimonial-group" gap="md"]
- testimonial#testimonial-rina: Rina, Head of Product [quote="The team aligned in one review."]

#### Block: FAQ [id="faq" type="faq" gap="md"]
- faq-item#faq-production: Is this production code? [answer="No. It is decision-grade prototype output."]

#### Block: Final CTA [id="final-cta" type="cta" variant="band" gap="md"]
- headline#cta-headline: Start with a spec.
- button#cta-button: Create prototype [action="navigate:signup"]

### Region: Footer [id="landing-footer" type="footer" gap="md"]
#### Block: Footer Links [id="footer-links" type="footer" gap="md"]
- text#footer-product: Spec UI
- nav-item#footer-contact: Contact [action="navigate:contact"]

## Screen: Signup [id="signup" shell="marketing" kind="signup" gap="md"]

### Region: Main [id="signup-main" type="main" gap="md"]
#### Block: Signup Form [id="signup-form" type="signup-form" gap="md"]
- field#signup-email: Work email [placeholder="you@example.com"]
- button#signup-submit: Request access [action="show-state:signup-success"]
##### State: Signup Success [id="signup-success" type="success"]
- success#signup-success-message: Thanks. The request was captured in this prototype.

## Screen: Contact [id="contact" shell="marketing" kind="contact" gap="md"]

### Region: Main [id="contact-main" type="main" gap="md"]
#### Block: Contact Form [id="contact-form" type="contact-form" gap="md"]
- field#contact-name: Name
- field#contact-message: Message
- button#contact-submit: Send [action="show-state:contact-success"]
##### State: Contact Success [id="contact-success" type="success"]
- success#contact-success-message: Message sent in prototype mode.
