const nav = document.querySelector("#header nav");
const toggle = document.querySelectorAll("nav .toggle");
const links = document.querySelectorAll("nav ul li a");

function toggleDropdown() {
  nav.classList.toggle("show");
}

function closeDropdown() {
  nav.classList.remove("show");
}

for (const element of toggle) {
  element.addEventListener("click", toggleDropdown);
}

if (window.innerWidth < 1200) {
  for (const link of links) {
    link.addEventListener("click", toggleDropdown);
    event.preventDefault();
  }
} else {
  for (const link of links) {
    link.addEventListener("click", closeDropdown);
  }
}

// Slider Swiper (Carrousel)
const swiper = new Swiper(".swiper-container", {
  slidesPerView: 1,
  pagination: {
    el: ".swiper-pagination",
  },
  mousewhell: true,
  keyboard: true,
  breakpoints: {
    767: {
      slidesPerView: 1,
      setWrapperSize: true,
    },
  },
});

// Scroll Reveal
const scrollReveal = ScrollReveal({
  origin: "top",
  distance: "30px",
  duration: 700,
  reset: true,
});
// Setando os IDs e classes da página
scrollReveal.reveal(
  `#home .image, #home .text,
  #about .image, #about .text,
  #services header, #services .card,
  #testimonials header, #testimonials .testimonials,
  #contact .text, #contact .links,
  footer .brand, footer .social
  `,
  {
    interval: 100,
  }
);

const header = document.querySelector("#header");
const navHeight = header.offsetHeight;
function changeHeaderWhenScroll() {
  if (window.scrollY >= navHeight) {
    header.classList.add("scroll");
  } else {
    header.classList.remove("scroll");
  }
}

const backToTopButton = document.querySelector(".back-to-top");
function backtoTop() {
  if (window.scrollY >= 560) {
    backToTopButton.classList.add("show");
  } else {
    backToTopButton.classList.remove("show");
  }
}

window.addEventListener("scroll", function () {
  changeHeaderWhenScroll();
  backtoTop();
  activateMenuAtCurrentSection();
});

const sections = document.querySelectorAll("main section[id]");

function activateMenuAtCurrentSection() {
  const checkpoint = window.pageYOffset + (window.innerHeight / 8) * 4;

  for (const section of sections) {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute("id");

    const checkpointStart = checkpoint >= sectionTop;
    const checkpointEnd = checkpoint <= sectionTop + sectionHeight;

  }
}



sanity()



function sanity() {
  fetch('https://0baeu33z.api.sanity.io/v2022-03-07/data/query/production?query=*%5B_type+%3D%3D+%22testimonialDocument%22+%5D%0A')
    .then(response => response.json())
    .then(data => {
      console.log(data); // Affiche les données récupérées depuis Sanity
      const testimonialsContainer = document.querySelector('.testimonials .swiper-wrapper');


      data.result.forEach(testimonial => {
        const testimonialDiv = document.createElement('div');
        testimonialDiv.classList.add('testimonial', 'swiper-slide');

        testimonialDiv.innerHTML = `
          <blockquote>
            <p> <span>&ldquo;</span>
            ${testimonial.quote}</p>
            <cite>
              <img src="assets/images/image (3).png" alt="${testimonial.author}">
              ${testimonial.author}
            </cite>
          </blockquote>
        `;

        // Ajouter le témoignage au conteneur des témoignages
        testimonialsContainer.appendChild(testimonialDiv);
      });

      // Initialiser le carousel Swiper après avoir ajouté les témoignages
      const swiper = new Swiper('.swiper-container', {
        slidesPerView: 1,
        pagination: {
          el: '.swiper-pagination',
        },
        mousewheel: true,
        keyboard: true,
        breakpoints: {
          767: {
            slidesPerView: 2,
            setWrapperSize: true,
          },
        },
      });
    })

    .catch(error => {
      console.error('Erreur lors de la récupération des données depuis l\'API de Sanity:', error);
    });

}

