document.addEventListener('DOMContentLoaded', function() {
  initFAQ();
  loadGoogleReviews();
  loadBeforeAfterImages();

  // ===== MENU MOBILE =====
  const toggle = document.getElementById('mobile-toggle');
  const header = document.querySelector('.site-header');

  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('mobile-nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');

      let drawer = document.getElementById('temp-mobile-drawer');
      if (open && !drawer) {
        drawer = document.createElement('div');
        drawer.id = 'temp-mobile-drawer';
        drawer.style.cssText = 'position:fixed;left:0;right:0;top:86px;bottom:0;background:#fff;z-index:99;padding:20px;';
        drawer.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <strong style="color:var(--brand-navy);font-size:18px;">Menu</strong>
            <button id="close-drawer" style="background:none;border:none;font-size:24px;cursor:pointer;">✕</button>
          </div>
          <nav style="display:flex;flex-direction:column;gap:12px;">
            <a href="index.html" style="color:var(--brand-navy);text-decoration:none;font-weight:600;padding:12px;border-radius:8px;background:#f5f5f5;">Home</a>
            <a href="#contatti" onclick="event.preventDefault(); scrollToContact();" style="color:#fff;background:var(--brand-orange);text-decoration:none;font-weight:700;padding:12px;border-radius:8px;text-align:center;margin-top:12px;">Richiedi preventivo</a>
          </nav>
        `;
        document.body.appendChild(drawer);

        const closeBtn = drawer.querySelector('#close-drawer');
        closeBtn.addEventListener('click', () => {
          drawer.remove();
          document.body.classList.remove('mobile-nav-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      } else if (!open && drawer) {
        drawer.remove();
      }
    });
  }

  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 60) header.classList.add('shrink');
      else header.classList.remove('shrink');
    });
  }

  // ===== FORM INVIO =====
  const forms = document.querySelectorAll('form[name="preventivo"], form#contact-form');
  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameInput = form.querySelector('[name="name"]');
      const emailInput = form.querySelector('[name="email"]');
      const phoneInput = form.querySelector('[name="phone"]');
      const addressInput = form.querySelector('[name="address"]');
      const messageInput = form.querySelector('[name="message"]');
      const privacyInput = form.querySelector('[name="privacy"]');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const address = addressInput ? addressInput.value.trim() : '';
      const message = messageInput ? messageInput.value.trim() : '';
      const privacyChecked = privacyInput ? privacyInput.checked : false;

      if (!name || !email) {
        alert('Per favore inserisci nome e email.');
        return;
      }

      if (!privacyChecked) {
        alert('Devi accettare il trattamento dei dati personali per inviare la richiesta.');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Invio in corso...';

      try {
        // ⚙️ ATTENZIONE: meglio gestire questo endpoint lato server (Netlify Function)
        const response = await fetch('https://cwaelzoaglaaymwltsvx.supabase.co/functions/v1/send-contact-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, email, phone, address, message })
        });

        const result = await response.json();

        if (response.ok) {
          alert('Richiesta inviata con successo! Ti contatteremo presto.');
          form.reset();
        } else {
          console.error('Errore backend:', result);
          alert('Errore nell\'invio. Riprova o contattaci telefonicamente.');
        }
      } catch (error) {
        console.error('Errore di rete:', error);
        alert('Errore di connessione. Riprova o contattaci telefonicamente.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  });
});

// ====== GOOGLE REVIEWS ======
async function loadGoogleReviews() {
  const container = document.getElementById('reviews-container');
  const ratingDiv = document.getElementById('google-rating');
  if (!container) return;

  const CACHE_KEY = 'google_reviews_cache';
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 ore

  let cachedData = null;
  try {
    cachedData = localStorage.getItem(CACHE_KEY);
  } catch (e) {
    console.warn('localStorage non disponibile:', e);
  }

  if (cachedData) {
    try {
      const { data, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < CACHE_DURATION) {
        displayReviews(data, container, ratingDiv);
        return;
      }
    } catch {
      localStorage.removeItem(CACHE_KEY);
    }
  }

  try {
    const response = await fetch('https://cwaelzoaglaaymwltsvx.supabase.co/functions/v1/get-google-reviews');
    const data = await response.json();

    if (!data || data.error) throw new Error(data?.error || 'Errore sconosciuto');

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch {}

    displayReviews(data, container, ratingDiv);
  } catch (error) {
    console.error('Errore nel caricamento recensioni:', error);
    container.innerHTML = '<p style="text-align:center;color:#888;">Impossibile caricare le recensioni al momento.</p>';
    if (ratingDiv) ratingDiv.innerHTML = '';
  }
}

function displayReviews(data, container, ratingDiv) {
  if (!data || !Array.isArray(data.reviews)) {
    container.innerHTML = '<p style="text-align:center;color:#888;">Nessuna recensione disponibile.</p>';
    return;
  }

  if (ratingDiv) {
    const stars = '⭐'.repeat(Math.round(data.rating || 5));
    ratingDiv.innerHTML = `
      <div class="rating-summary">
        <div class="stars">${stars}</div>
        <div class="rating-text">
          <strong>${data.rating || '5.0'}</strong> su 5 — ${data.total_reviews || 0} recensioni Google
        </div>
      </div>
    `;
  }

  const reviewsHTML = data.reviews.map(review => {
    const stars = '⭐'.repeat(review.rating || 5);
    const date = new Date((review.time || Date.now() / 1000) * 1000).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long'
    });

    return `
      <div class="review-card">
        <div class="review-header">
          <img src="${review.profile_photo_url || '/default-avatar.png'}" alt="${review.author_name}" class="review-avatar">
          <div>
            <div class="review-author">${review.author_name}</div>
            <div class="review-date">${date}</div>
          </div>
        </div>
        <div class="review-stars">${stars}</div>
        <p class="review-text">${review.text || 'Ottima esperienza!'}</p>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div class="reviews-track">${reviewsHTML}${reviewsHTML}</div>`;
}

// ====== SLIDER IMMAGINI ======
function loadBeforeAfterImages() {
  const images = [
    'https://images.pexels.com/photos/5824488/pexels-photo-5824488.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4119832/pexels-photo-4119832.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1910472/pexels-photo-1910472.jpeg?auto=compress&cs=tinysrgb&w=800'
  ];

  const sliderImg = document.getElementById('slider-img');
  if (!sliderImg) return;

  let currentIndex = 0;
  sliderImg.src = images[0];

  setInterval(() => {
    currentIndex = (currentIndex + 1) % images.length;
    sliderImg.src = images[currentIndex];
  }, 3000);
}

// ====== SCROLL FUNZIONI ======
function scrollToProjects() {
  const section = document.getElementById('projects-section');
  if (section) section.scrollIntoView({ behavior: 'smooth' });
}

function scrollToContact() {
  const section = document.getElementById('contatti');
  if (section) section.scrollIntoView({ behavior: 'smooth' });
}

// ====== FAQ ======
function initFAQ() {
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const item = question.parentElement;
      const isActive = item.classList.contains('active');

      document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('active'));
      if (!isActive) item.classList.add('active');
    });
  });
}
