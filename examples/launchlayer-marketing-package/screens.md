## Screen: Landing [id="landing" shell="marketing" kind="landing" gap="md"]

### Region: Navbar [id="landing-navbar" type="navbar" gap="md"]
#### Block: Navigation [id="landing-navigation" type="navbar" variant="default" gap="sm"]
- nav-item#landing-nav-features: Features [action="navigate:landing"]
- nav-item#landing-nav-pricing: Pricing [action="navigate:pricing"]
- nav-item#landing-nav-faq: FAQ [action="show-state:faq-note"]
- button#landing-nav-start: Start free [action="navigate:signup"]

### Region: Main [id="landing-main" type="main" gap="lg"]
#### Block: Hero [id="landing-hero" type="hero" variant="split" gap="md" content="hero-copy"]
- button#hero-primary: Build a prototype [action="navigate:signup"]
- button#hero-secondary: View pricing [action="navigate:pricing"]

#### Block: Customer Logos [id="customer-logos" type="logo-cloud" variant="compact" gap="sm" content="customer-logo-data"]

#### Block: Feature Overview [id="feature-overview" type="feature-grid" variant="three-column" gap="md" content="feature-cards"]

#### Block: Product Band [id="product-band" type="feature-band" variant="alternating" gap="md" content="product-band-copy"]
- button#band-cta: See adapter stance [action="navigate:adapter"]

#### Block: Pricing Overview [id="pricing-overview" type="pricing" variant="three-tier" gap="md" content="pricing-tiers"]

#### Block: Testimonials [id="testimonials" type="testimonial-group" variant="featured" gap="md" content="testimonial-quotes"]

#### Block: FAQ [id="faq-overview" type="faq" gap="md" content="faq-items"]

##### State: FAQ Note [id="faq-note" type="revealed"]
- text#faq-note-copy: FAQ content is in view. Use Pricing or Start free to navigate to other marketing screens.

#### Block: Final CTA [id="final-cta" type="cta" variant="band" gap="md"]
- headline#final-cta-headline: Start with a bounded spec.
- subhead#final-cta-copy: Compile it into portable HTML for a real product conversation.
- button#final-cta-button: Request access [action="navigate:signup"]

### Region: Footer [id="landing-footer" type="footer" gap="md"]
#### Block: Footer [id="footer" type="footer" variant="dense" gap="sm"]
- text#footer-name: LaunchLayer
- nav-item#footer-contact: Contact [action="navigate:contact"]
- nav-item#footer-adapter: Adapter stance [action="navigate:adapter"]

## Screen: Pricing [id="pricing" shell="marketing" kind="pricing" gap="md"]

### Region: Main [id="pricing-main" type="main" gap="md"]
#### Block: Pricing Detail [id="pricing-detail" type="pricing" variant="three-tier" gap="md" content="pricing-tiers"]
- headline#pricing-headline: Pick the rollout pace.
- button#pricing-start: Start free [action="navigate:signup"]
- button#pricing-home: Back home [action="navigate:landing"]

## Screen: Signup [id="signup" shell="marketing" kind="signup" gap="md"]

### Region: Navbar [id="signup-navbar" type="navbar" gap="md"]
#### Block: Signup Navigation [id="signup-navigation" type="navbar" gap="sm"]
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
- headline#adapter-headline: Bootstrap output, semantic source.
- text#adapter-copy: The adapter translates semantic IR into portable HTML without putting library classes in the package.
- button#adapter-home: Back to landing [action="navigate:landing"]
