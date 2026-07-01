(function ($) {
  "use strict";
	
	$(document).ready(function() {
      const button = document.querySelector('.size-box');
      const container = document.querySelector('.size-box-holder');
      const close = document.querySelector( '.size-box-holder .size-box-close' );
      const mask = document.querySelector( '.size-box-holder .size-box-mask' );

      if (container !== null) {
        if (button !== null) {
          button.addEventListener('click', function(e) {
            e.preventDefault();
            container.classList.add('active');
          });
        }

        close.addEventListener('click', function(e) {
          e.preventDefault();
          container.classList.remove('active');
        });

        mask.addEventListener('click', function(e) {
          e.preventDefault();
          container.classList.remove('active');
        });
      }
	});

})(jQuery);
