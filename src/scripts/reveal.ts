const TARGETS = [
	'.featured-card',
	'.news-card',
	'.topic',
	'.mission',
	'.section-head',
	'.year-section',
	'.prose img',
	'.prose table',
	'.prose pre',
].join(',');

const STAGGER_MS = 70;
const MAX_STAGGER = 5;

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				entry.target.classList.add('is-visible');
				observer.unobserve(entry.target);
			}
		},
		{ rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
	);

	document.querySelectorAll<HTMLElement>(TARGETS).forEach((el) => {
		// Stagger siblings so grids cascade instead of popping in together.
		const index = Array.prototype.indexOf.call(el.parentElement?.children ?? [], el);
		el.style.setProperty('--reveal-delay', `${(index % MAX_STAGGER) * STAGGER_MS}ms`);
		el.classList.add('reveal');
		observer.observe(el);
	});
}
