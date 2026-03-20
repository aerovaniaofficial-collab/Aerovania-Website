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
    const pbs    = document.querySelectorAll('.aero-pb');
    const SLIDE_DURATION = 7000;
    let current = 0;
    let timer;

    function showSlide(index) {
        slides[current].classList.remove('aero-slide--active');
        pbs[current].classList.remove('aero-pb--active');
        // reset fill animation
        const oldFill = pbs[current].querySelector('.aero-pb__fill');
        oldFill.style.animation = 'none';
        void oldFill.offsetWidth; // reflow
        oldFill.style.animation = '';

        current = index;
        slides[current].classList.add('aero-slide--active');
        pbs[current].classList.add('aero-pb--active');

        clearTimeout(timer);
        timer = setTimeout(() => showSlide((current + 1) % slides.length), SLIDE_DURATION);
    }

    if (slides.length) {
        pbs.forEach((pb, i) => pb.addEventListener('click', () => showSlide(i)));
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
