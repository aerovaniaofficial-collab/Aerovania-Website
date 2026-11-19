document.addEventListener("DOMContentLoaded", () => {

    /* -----------------------------
       Sticky header
    ------------------------------ */

    const header = document.getElementById("header");

    let scrollTimeout;

    window.addEventListener(
        "scroll",
        () => {
            clearTimeout(scrollTimeout);

            scrollTimeout = setTimeout(() => {
                if (window.scrollY > 50) {
                    header.classList.add("scrolled");
                } else {
                    header.classList.remove("scrolled");
                }
            }, 50);
        },
        { passive: true }
    );

    /* -----------------------------
       Hero carousel
    ------------------------------ */

    const slides = document.querySelectorAll(".aero-slide");
    const dots = document.querySelectorAll(".slide-dot");
    const counter = document.getElementById("slideCounter");

    const SLIDE_DURATION = 12000;

    let current = 0;
    let timer;

    function playSlideVideo(video) {
        if (!video) return;

        video.playbackRate = 0.75;

        video.play().catch(() => {});
    }

    function showSlide(index) {
        slides[current]?.classList.remove("aero-slide--active");
        dots[current]?.classList.remove("slide-dot--active");

        current = index;

        slides[current]?.classList.add("aero-slide--active");
        dots[current]?.classList.add("slide-dot--active");

        if (counter) {
            counter.textContent = `${current + 1} / ${slides.length}`;
        }

        const video = slides[current]?.querySelector("video");

        if (video) {
            playSlideVideo(video);
        }

        if (current === 2) {
            const iframe = document.getElementById("lidar-iframe");

            if (iframe && iframe.src !== iframe.dataset.src) {
                iframe.src = iframe.dataset.src;
            }
        }

        clearTimeout(timer);

        timer = setTimeout(() => {
            showSlide((current + 1) % slides.length);
        }, SLIDE_DURATION);
    }

    if (slides.length) {
        dots.forEach((dot, i) => {
            dot.addEventListener("click", () => {
                showSlide(i);
            });
        });

        showSlide(0);
    }

    /* -----------------------------
       Reveal animation
    ------------------------------ */

    const revealElements = document.querySelectorAll(".reveal");

    const revealObserver = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add("active");
                    }, 250);

                    revealObserver.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.15,
            rootMargin: "0px"
        }
    );

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });

    /* -----------------------------
       Counter animation
    ------------------------------ */

    const counters = document.querySelectorAll(".counter");

    function animateCounter(counter) {
        const target = Number(counter.dataset.target);

        const duration = 5000;

        let start = null;

        function step(timestamp) {
            if (!start) {
                start = timestamp;
            }

            const progress = Math.min(
                (timestamp - start) / duration,
                1
            );

            counter.textContent = Math.floor(
                target * progress
            );

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }

        requestAnimationFrame(step);
    }

    const metricSection = document.querySelector(
        ".metrics-section"
    );

    if (metricSection) {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    counters.forEach(animateCounter);
                    observer.disconnect();
                }
            },
            {
                threshold: 0.5
            }
        );

        observer.observe(metricSection);
    }

    /* -----------------------------
       Smooth scrolling
    ------------------------------ */

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            const targetId = this.getAttribute("href");

            if (targetId === "#") return;

            const target = document.querySelector(targetId);

            if (!target) return;

            e.preventDefault();

            const targetPosition =
                target.offsetTop - header.offsetHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: "smooth"
            });
        });
    });
});