## Flow: Signup Conversion [id="signup-conversion" start="landing"]
- Step: Open Signup [from="landing" action="navigate:signup" to="signup"]
- Step: Submit Signup [from="signup" action="show-state:signup-success" to="signup-success"]
- Step: Return Home [from="signup-success" action="navigate:landing" to="landing"]

## Flow: Pricing Review [id="pricing-review" start="landing"]
- Step: Open Pricing [from="landing" action="navigate:pricing" to="pricing"]
- Step: Start From Pricing [from="pricing" action="navigate:signup" to="signup"]

## Flow: FAQ Reveal [id="faq-reveal" start="landing"]
- Step: Show FAQ Note [from="landing" action="show-state:faq-note" to="faq-note"]

## Flow: Contact Request [id="contact-request" start="landing"]
- Step: Open Contact [from="landing" action="navigate:contact" to="contact"]
- Step: Send Message [from="contact" action="show-state:contact-success" to="contact-success"]
