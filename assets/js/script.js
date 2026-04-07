document.addEventListener('DOMContentLoaded', () => {
    
    // --- Sticky Header ---
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- Hero Carousel ---
    const slides = document.querySelectorAll('.aero-slide');
    const dots   = document.querySelectorAll('.slide-dot');
    const counter = document.getElementById('slideCounter');
    const SLIDE_DURATION = 5000;
    let current = 0;
    let timer;

    function showSlide(index) {
        slides[current].classList.remove('aero-slide--active');
        dots[current].classList.remove('slide-dot--active');
        current = index;
        slides[current].classList.add('aero-slide--active');
        dots[current].classList.add('slide-dot--active');
        if (counter) counter.textContent = (current + 1) + ' / ' + slides.length;
        // restart video from beginning for the active slide
        const activeVideo = slides[current].querySelector('video');
        if (activeVideo) {
            activeVideo.currentTime = 0;
            activeVideo.play().catch(() => {});
        }
        // lazy-load lidar iframe on slide 3, restart every time
        if (current === 2) {
            const iframe = document.getElementById('lidar-iframe');
            if (iframe) {
                const src = iframe.dataset.src;
                iframe.src = '';
                requestAnimationFrame(() => {
                    iframe.src = src;
                });
            }
        }
        clearTimeout(timer);
        timer = setTimeout(() => showSlide((current + 1) % slides.length), SLIDE_DURATION);
    }

    if (slides.length) {
        dots.forEach((dot, i) => dot.addEventListener('click', () => showSlide(i)));
        // restart first slide video on load
        const firstVideo = slides[0].querySelector('video');
        if (firstVideo) { firstVideo.currentTime = 0; firstVideo.play().catch(() => {}); }
        timer = setTimeout(() => showSlide(1), SLIDE_DURATION);
    }

    // --- Scroll Reveal Animations ---
    const revealElements = document.querySelectorAll('.reveal');
    
    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    revealElements.forEach(el => {
        revealOnScroll.observe(el);
    });

    // --- Number Counter Animation ---
    const counters = document.querySelectorAll('.counter');
    let hasCounted = false;

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasCounted) {
                hasCounted = true;
                counters.forEach(counter => {
                    const target = +counter.getAttribute('data-target');
                    const duration = 2000; // ms
                    const increment = target / (duration / 16); // 60fps
                    
                    let current = 0;
                    
                    const updateCounter = () => {
                        current += increment;
                        if (current < target) {
                            counter.innerText = Math.ceil(current);
                            requestAnimationFrame(updateCounter);
                        } else {
                            counter.innerText = target;
                        }
                    };
                    
                    updateCounter();
                });
            }
        });
    }, { threshold: 0.5 });

    const metricsSection = document.querySelector('.metrics-section');
    if (metricsSection) {
        counterObserver.observe(metricsSection);
    }

    // --- Smooth Scrolling for Anchor Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                e.preventDefault();
                // Close mobile menu if open (placeholder for mobile menu logic)
                
                const headerHeight = header.offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

});
