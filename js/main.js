/* ==========================================================================
   Battle of the Bands, INC – Main JavaScript
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- Mobile nav toggle ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      const isOpen = navLinks.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
    });

    /* Close nav when a link is clicked */
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Uploaded logo fallback ---------- */
  document.querySelectorAll('.logo-media').forEach(function (logoMedia) {
    var image = logoMedia.querySelector('.logo-image');
    var placeholder = logoMedia.querySelector('.logo-icon');

    if (!image) { return; }

    function showUploadedLogo() {
      if (image.naturalWidth > 0) {
        logoMedia.classList.add('has-image');
        image.hidden = false;
        if (placeholder) { placeholder.hidden = true; }
      } else {
        keepPlaceholderLogo();
      }
    }

    function keepPlaceholderLogo() {
      logoMedia.classList.remove('has-image');
      image.hidden = true;
      if (placeholder) { placeholder.hidden = false; }
    }

    keepPlaceholderLogo();

    if (image.complete) {
      showUploadedLogo();
    }

    image.addEventListener('load', showUploadedLogo, { once: true });
    image.addEventListener('error', keepPlaceholderLogo, { once: true });
  });

  /* ---------- Mark active nav link ---------- */
  var currentFilename = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    var href = link.getAttribute('href');
    if (href === currentFilename || (currentFilename === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ---------- Gallery filter ---------- */
  var filterBtns = document.querySelectorAll('.filter-btn');
  var galleryItems = document.querySelectorAll('.gallery-item');

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      var filter = btn.dataset.filter;

      galleryItems.forEach(function (item) {
        if (filter === 'all' || item.dataset.category === filter) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  /* ---------- Contact form submit ---------- */
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      /* Basic client-side validation */
      var valid = true;
      contactForm.querySelectorAll('[required]').forEach(function (field) {
        field.style.borderColor = '';
        if (!field.value.trim()) {
          field.style.borderColor = 'var(--color-accent)';
          valid = false;
        }
      });

      var emailField = contactForm.querySelector('[type="email"]');
      if (emailField && emailField.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
        emailField.style.borderColor = 'var(--color-accent)';
        valid = false;
      }

      if (!valid) { return; }

      contactForm.style.display = 'none';
      var success = document.querySelector('.form-success');
      if (success) { success.style.display = 'block'; }
    });
  }

  /* ---------- Smooth reveal on scroll ---------- */
  if ('IntersectionObserver' in window) {
    var revealEls = document.querySelectorAll('.card, .value-card, .board-card, .gallery-item, .impact-item');
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    revealEls.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      revealObserver.observe(el);
    });
  }
}());
