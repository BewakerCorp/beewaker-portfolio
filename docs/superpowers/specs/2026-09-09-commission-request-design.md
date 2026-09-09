# Commission Page — Design Specification

## Goal

Add a static commission information page to the existing Beewaker portfolio. The page explains prices, accepted subjects, terms, contact, payment, and delivery without collecting or publishing customer data.

The site does not process payments and does not contain an inquiry form. A visitor contacts Beewaker on Discord, and payment happens through Boosty only after the request is accepted and the sketch is ready.

## Visitor flow

1. The landing screen offers `Portfolio`, `Commissions`, and `Social networks`.
2. `Commissions` opens a dedicated section with the price image, scope, rules, and turnaround.
3. The visitor opens the direct Discord profile and includes the code word `MOTH` in the first message.
4. Beewaker decides whether to accept the request and discusses the exact scope, price, and deadline.
5. After the sketch is ready, the client pays through Boosty.
6. The finished artwork is delivered in the same Discord conversation.

## Content

- Prices stay as shown in `public/commission-prices.webp`, in USD and without a Boosty surcharge.
- Supported subjects: original characters, fan art, and simple decorative backgrounds.
- Unsupported subjects: NSFW, mecha or complex machinery, furry characters, and complex backgrounds.
- Beewaker may decline any request that feels uncomfortable.
- Typical turnaround is up to two weeks after payment; the exact timing is agreed individually.
- Personal and avatar use are allowed.
- Public reposting is allowed with credit to Beewaker and with the artist signature intact.
- Resale and other commercial use are prohibited unless agreed in advance.

## Links

- Discord: `https://discord.com/users/338684455348600832` (`beewaker`).
- Boosty: `https://boosty.to/bwkincorp`.
- Telegram remains in the general social network section but is not offered as a commission contact yet.
- The Commissions.gg link remains clickable in the social network section but is visibly crossed out and labelled unavailable for payments.

## Implementation boundaries

- Extend hash navigation with `#commissions`.
- Add a third landing action for the commission page.
- Keep the existing Vite, vanilla JavaScript, and CSS architecture.
- Preserve the portfolio, artwork inspector, social web, and custom cursor behavior.
- Use no backend, form service, customer accounts, or payment integration.

## Responsive behavior and accessibility

- Desktop uses a two-column editorial layout: terms on the left and the price image on the right.
- Mobile stacks the price image, terms, and contact/payment controls in that order.
- Links remain keyboard accessible and large enough for touch input.
- The price image includes complete alternative text with every displayed price.

## Testing

Automated tests cover commission hash navigation, the direct Discord social link, and the unavailable state of Commissions.gg. The full test suite and production build must pass before deployment.
