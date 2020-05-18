(function () {
  const instructionSlides = {
    instructions: document.querySelector('.instructions'),
    goTo: function (id) {
      const activeSlide = this.slides.find(slide => slide.classList.contains('active'));
      const activeStep = this.steps.find(step => step.classList.contains('active'));
      const currentSlide = document.getElementById(id);
      const currentStep = this.steps.find(step => step.href.includes(id));

      // Remove classList active on active slide and step:
      activeSlide.classList.remove('active');
      activeStep.classList.remove('active');

      // Add classList active on current slide and step:
      currentSlide.classList.add('active');
      currentStep.classList.add('active');
    },
    init: function () {
      this.slides = Array.from(this.instructions.querySelectorAll('.slide'));
      this.slideLinks = Array.from(this.instructions.querySelectorAll('.slide-link'));
      this.steps = Array.from(this.instructions.querySelectorAll('.steps .slide-link'));
      this.instructionBtn = this.instructions.querySelector('.action-btn');

      this.slideLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          const href = link.href.slice(link.href.indexOf('#') + 1);
          this.goTo(href);
          e.preventDefault();
        });
      });
    }
  };

  instructionSlides.init();
}) ();
