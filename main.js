// Import principale del foglio di stile
import './style.css';

// -------------------
// Il tuo codice originale
// -------------------

document.addEventListener('DOMContentLoaded', () => {
  // Selettore per il bottone del menu mobile
  const menuBtn = document.querySelector('#mobile-toggle');
  const nav = document.querySelector('.main-nav');

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
      nav.classList.toggle('open');
    });
  }

  // Scroll automatico alla sezione contatti
  const contattiLink = document.querySelector('a[href="#contatti"]');
  const contattiSection = document.querySelector('#contatti');

  if (contattiLink && contattiSection) {
    contattiLink.addEventListener('click', (e) => {
      e.preventDefault();
      contattiSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Esempio: log di conferma caricamento
  console.log('✅ Script principale caricato correttamente');
});
