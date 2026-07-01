(function ($) {
  "use strict";

	$(document).on('clotyaShopPageInit', function () {
		clotyaThemeModule.countdown();
	});

	clotyaThemeModule.countdown = function() {
      const countdown = document.querySelectorAll( '.countdown' );

      if ( countdown !== null ) {
        for ( var i = 0; i < countdown.length; i++ ) {
          const self = countdown[i];

          const countDate = self.dataset.date;
          const expired = self.dataset.text;
          let countDownDate = new Date( countDate ).getTime();

          const d = self.querySelector( '.days' );
          const h = self.querySelector( '.hours' );
          const m = self.querySelector( '.minutes' );
          const s = self.querySelector( '.second' );

          var x = setInterval(function() {

            var now = new Date().getTime();
  
            var distance = countDownDate - now;
  
            var days = Math.floor(distance / (1000 * 60 * 60 * 24));
            var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((distance % (1000 * 60)) / 1000);

            d.innerHTML = ( '0' + days ).slice(-2);
            h.innerHTML = ( '0' + hours ).slice(-2);
            m.innerHTML = ( '0' + minutes ).slice(-2);
            s.innerHTML = ( '0' + seconds ).slice(-2);
  
            if (distance < 0) {
              clearInterval(x);
              console.log( 'expired' );
              self.innerHTML = '<div class="expired">' + expired + '</div>'
              /* document.getElementById("demo").innerHTML = expired; */
            }
          }, 1000);
        }
      }

	}
	
	$(document).ready(function() {
		clotyaThemeModule.countdown();
	});

})(jQuery);
