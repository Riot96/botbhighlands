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

    if (!image) {
      if (placeholder) { placeholder.hidden = false; }
      return;
    }

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

    if (image.complete) {
      showUploadedLogo();
    } else {
      keepPlaceholderLogo();
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

  /* ---------- Scroll reveal ---------- */
  var revealObserver;

  function observeRevealElements(elements) {
    if (!('IntersectionObserver' in window)) { return; }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
    }

    elements.forEach(function (el) {
      if (el.dataset.revealReady === 'true') { return; }
      el.dataset.revealReady = 'true';
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      revealObserver.observe(el);
    });
  }

  /* ---------- Auto gallery ---------- */
  var galleryGrid = document.getElementById('galleryGrid');
  var galleryStatus = document.getElementById('galleryStatus');

  function getGalleryCaption(filename) {
    return filename
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function isSupportedGalleryFile(filename) {
    return /\.(avif|gif|jpe?g|png|webp)$/i.test(filename);
  }

  function sortGalleryFiles(files) {
    return files.sort(function (a, b) {
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  function renderGallery(files, sourceUrl) {
    galleryGrid.innerHTML = '';

    files.forEach(function (filename) {
      var imageUrl = new URL(filename, sourceUrl);
      var caption = getGalleryCaption(filename) || 'Gallery Photo';
      var item = document.createElement('a');
      var image = document.createElement('img');
      var captionWrap = document.createElement('div');
      var captionText = document.createElement('span');

      item.className = 'gallery-item';
      item.href = imageUrl.href;
      item.target = '_blank';
      item.rel = 'noopener noreferrer';
      item.setAttribute('aria-label', 'Open ' + caption);

      image.src = imageUrl.href;
      image.alt = caption;
      image.loading = 'lazy';
      image.decoding = 'async';

      captionWrap.className = 'gallery-caption';
      captionText.textContent = caption;
      captionWrap.appendChild(captionText);

      item.appendChild(image);
      item.appendChild(captionWrap);
      galleryGrid.appendChild(item);
    });

    if (galleryStatus) {
      galleryStatus.textContent = files.length ? '' : 'No gallery photos have been added yet.';
    }

    observeRevealElements(galleryGrid.querySelectorAll('.gallery-item'));
  }

  function getFilesFromDirectoryListing(html, sourceUrl) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var folderPath = sourceUrl.pathname;
    var files = [];

    doc.querySelectorAll('a[href]').forEach(function (link) {
      var href = link.getAttribute('href');
      var fileUrl;
      var relativePath;

      if (!href || href === '../' || href === './' || href.charAt(0) === '?') {
        return;
      }

      try {
        fileUrl = new URL(href, sourceUrl);
      } catch (error) {
        return;
      }

      if (fileUrl.pathname.indexOf(folderPath) !== 0) {
        return;
      }

      relativePath = decodeURIComponent(fileUrl.pathname.slice(folderPath.length));
      if (!relativePath || relativePath.indexOf('/') !== -1 || !isSupportedGalleryFile(relativePath)) {
        return;
      }

      files.push(relativePath);
    });

    return sortGalleryFiles(Array.from(new Set(files)));
  }

  function fetchGithubGalleryFiles(owner, repo, path) {
    var apiUrl = 'https://api.github.com/repos/' + encodeURIComponent(owner) + '/' + encodeURIComponent(repo) + '/contents/' + path.split('/').map(encodeURIComponent).join('/');

    return fetch(apiUrl, {
      headers: {
        Accept: 'application/vnd.github+json'
      }
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('GitHub gallery lookup failed');
        }
        return response.json();
      })
      .then(function (entries) {
        return sortGalleryFiles(entries
          .filter(function (entry) {
            return entry && entry.type === 'file' && isSupportedGalleryFile(entry.name);
          })
          .map(function (entry) {
            return entry.name;
          }));
      });
  }

  if (galleryGrid) {
    var source = galleryGrid.dataset.gallerySource || 'images/gallery/';
    var sourceUrl = new URL(source, window.location.href);
    var githubOwner = galleryGrid.dataset.githubOwner;
    var githubRepo = galleryGrid.dataset.githubRepo;
    var githubPath = galleryGrid.dataset.githubPath;

    fetch(sourceUrl.href)
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Directory listing unavailable');
        }
        return response.text();
      })
      .then(function (html) {
        var files = getFilesFromDirectoryListing(html, sourceUrl);

        if (files.length) {
          renderGallery(files, sourceUrl);
          return;
        }

        throw new Error('No files found in directory listing');
      })
      .catch(function () {
        if (!githubOwner || !githubRepo || !githubPath) {
          if (galleryStatus) {
            galleryStatus.textContent = 'Add photos to images/gallery/ to populate this page.';
          }
          return;
        }

        fetchGithubGalleryFiles(githubOwner, githubRepo, githubPath)
          .then(function (files) {
            renderGallery(files, sourceUrl);
          })
          .catch(function () {
            if (galleryStatus) {
              galleryStatus.textContent = 'Add photos to images/gallery/ to populate this page.';
            }
          });
      });
  }

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

  observeRevealElements(document.querySelectorAll('.card, .value-card, .board-card, .gallery-item, .impact-item'));
}());
