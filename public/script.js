document.addEventListener('DOMContentLoaded', function(){
  loadGoogleReviews();
  loadBeforeAfterImages();
  initFAQ();

  const toggle = document.getElementById('mobile-toggle');
  const header = document.querySelector('.site-header');

  if(toggle){
    toggle.addEventListener('click', ()=> {
      const open = document.body.classList.toggle('mobile-nav-open');
      toggle.setAttribute('aria-expanded', open? 'true' : 'false');

      let drawer = document.getElementById('temp-mobile-drawer');
      if(open && !drawer){
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
        closeBtn.addEventListener('click', ()=> {
          drawer.remove();
          document.body.classList.remove('mobile-nav-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      } else if(!open && drawer){
        drawer.remove();
      }
    });
  }

  if(header){
    window.addEventListener('scroll', ()=> {
      if(window.scrollY > 60) header.classList.add('shrink');
      else header.classList.remove('shrink');
    });
  }

  const forms = document.querySelectorAll('form[name="preventivo"], form#contact-form');
  forms.forEach(form=>{
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();

      const name = form.querySelector('[name="name"]')?.value.trim() || '';
      const email = form.querySelector('[name="email"]')?.value.trim() || '';
      const phone = form.querySelector('[name="phone"]')?.value.trim() || '';
      const address = form.querySelector('[name="address"]')?.value.trim() || '';
      const message = form.querySelector('[name="message"]')?.value.trim() || '';
      const privacyChecked = form.querySelector('[name="privacy"]')?.checked || false;

      if(!name || !email){
        alert('Per favore inserisci nome e email.');
        return;
      }

      if(!privacyChecked){
        alert('Devi accettare il trattamento dei dati personali per inviare la richiesta.');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Invio in corso...';

      try {
        const supabaseUrl = 'https://cwaelzoaglaaymwltsvx.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3YWVsem9hZ2xhYXltd2x0c3Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMTA5NDksImV4cCI6MjA3NzY4Njk0OX0.TtDXdIlVyRbvrVNAgHFFbXgrbg__EyKQe4Td2-UawUA';

        const response = await fetch(`${supabaseUrl}/functions/v1/send-contact-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, phone, address, message })
        });

        const result = await response.json();

        if (response.ok) {
          alert('Richiesta inviata con successo! Ti contatteremo presto.');
          form.reset();
        } else {
          alert('Errore nell\'invio. Riprova o contattaci telefonicamente.');
        }
      } catch (error) {
        console.error('Errore:', error);
        alert('Errore nell\'invio. Riprova o contattaci telefonicamente.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  });
});

async function loadGoogleReviews() {
  const container = document.getElementById('reviews-container');
  const ratingDiv = document.getElementById('google-rating');

  if (!container) return;

  const CACHE_KEY = 'google_reviews_cache';
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 ore in millisecondi

  // Controlla se ci sono dati in cache
  const cachedData = localStorage.getItem(CACHE_KEY);
  if (cachedData) {
    try {
      const { data, timestamp } = JSON.parse(cachedData);
      const now = Date.now();

      // Se la cache è valida (meno di 24 ore), usa i dati cached
      if (now - timestamp < CACHE_DURATION) {
        displayReviews(data, container, ratingDiv);
        return;
      }
    } catch (e) {
      // Se c'è un errore nel parsing, continua con il fetch
      localStorage.removeItem(CACHE_KEY);
    }
  }

  // Carica i nuovi dati
  try {
    const supabaseUrl = 'https://cwaelzoaglaaymwltsvx.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3YWVsem9hZ2xhYXltd2x0c3Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMTA5NDksImV4cCI6MjA3NzY4Njk0OX0.TtDXdIlVyRbvrVNAgHFFbXgrbg__EyKQe4Td2-UawUA';

    const response = await fetch(`${supabaseUrl}/functions/v1/get-google-reviews`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Salva i nuovi dati in cache
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: data,
      timestamp: Date.now()
    }));

    displayReviews(data, container, ratingDiv);
  } catch (error) {
    console.error('Errore nel caricamento recensioni:', error);
    container.innerHTML = '<p style="text-align:center;color:var(--muted);">Impossibile caricare le recensioni al momento.</p>';
    if (ratingDiv) {
      ratingDiv.innerHTML = '';
    }
  }
}

function displayReviews(data, container, ratingDiv) {
  if (ratingDiv) {
    const stars = '⭐'.repeat(Math.round(data.rating));
    ratingDiv.innerHTML = `
      <div class="rating-summary">
        <div class="stars">${stars}</div>
        <div class="rating-text">
          <strong>${data.rating}</strong> su 5 — ${data.total_reviews} recensioni Google
        </div>
      </div>
    `;
  }

  if (data.reviews && data.reviews.length > 0) {
    const reviewsHTML = data.reviews.map(review => {
      const stars = '⭐'.repeat(review.rating);
      const date = new Date(review.time * 1000).toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'long'
      });

      return `
        <div class="review-card">
          <div class="review-header">
            <img src="${review.profile_photo_url}" alt="${review.author_name}" class="review-avatar">
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

    container.innerHTML = `
      <div class="reviews-track">
        ${reviewsHTML}
        ${reviewsHTML}
      </div>
    `;
  } else {
    container.innerHTML = '<p style="text-align:center;color:var(--muted);">Nessuna recensione disponibile al momento.</p>';
  }
}

async function loadBeforeAfterImages() {
  const images = [
    'https://images.pexels.com/photos/5824488/pexels-photo-5824488.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4119832/pexels-photo-4119832.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1910472/pexels-photo-1910472.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/6969785/pexels-photo-6969785.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/7031622/pexels-photo-7031622.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/5998120/pexels-photo-5998120.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800'
  ];

  let currentIndex = 0;

  const sliderImg = document.getElementById('slider-img');

  if (!sliderImg) return;

  function updateImage() {
    sliderImg.src = images[currentIndex];
  }

  function nextImage() {
    currentIndex = (currentIndex + 1) % images.length;
    updateImage();
  }

  updateImage();
  setInterval(nextImage, 3000);
}

function scrollToProjects() {
  const projectsSection = document.getElementById('projects-section');
  if (projectsSection) {
    projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function scrollToContact() {
  const contactSection = document.getElementById('contatti');
  if (contactSection) {
    contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function initFAQ() {
  const faqQuestions = document.querySelectorAll('.faq-question');

  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const faqItem = question.parentElement;
      const isActive = faqItem.classList.contains('active');

      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
      });

      if (!isActive) {
        faqItem.classList.add('active');
      }
    });
  });
}
