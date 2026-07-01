jQuery(document).ready(function($) {
	"use strict";

	$(document).on('click', '.tab-header li:not(active) a', function(event){
		event.preventDefault(); 
		
		var $thisbutton = $(this);
		
        var data = {
			cache: false,
            action: 'tab_view',
			beforeSend: function() {
				$('.tab-view').append('<svg class="tab-ajax loader-image preloader quick-view" width="65px" height="65px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg"><circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle></svg></div>');
			},
			'catid': $(this).attr('id'),
			'desktop': $('.tab-view .products').data('desktop'),
			'mobile': $('.tab-view .products').data('mobile'),
			'speed': $('.tab-view .products').data('speed'),
			'dots': $('.tab-view .products').data('dots'),
			'nav': $('.tab-view .products').data('nav'),
			'autoplay': $('.tab-view .products').data('autoplay'),
			'autospeed': $('.tab-view .products').data('autospeed'),
        };

        // since 2.8 ajaxurl is always defined in the admin header and points to admin-ajax.php
		$.post(MyAjax.ajaxurl, data, function(response) {
			$('.tab-view').html(response);
			

			  const slider = document.querySelectorAll( '.site-slider' );

			  $thisbutton.closest('.tab-header').find('li').removeClass('active');
			  $thisbutton.closest('li').addClass('active');


			  if ( slider !== null ) {
				for( var i = 0; i < slider.length; i++ ) {
				  const self = slider[i];

				  /* options */
				  const desktop = parseInt( self.dataset.desktop );
				  const tablet = parseInt( self.dataset.tablet );
				  const mobile = parseInt( self.dataset.mobile );
				  const speed = parseInt( self.dataset.speed );
				  const loop = self.dataset.loop === 'true' ? true : false;
				  const gutter = parseInt( self.dataset.gutter );

				  const autoplay = self.dataset.autoplay === 'true' ? true : false;
				  const autospeed = parseInt( self.dataset.autospeed );
				  const autostop = self.dataset.autostop === 'true' ? true : false;

				  const nav = self.dataset.nav === 'true' ? true : false;
				  const dots = self.dataset.dots === 'true' ? true : false;
				  const dotsData = self.dataset.dotsdata === 'true' ? true : false;

				  $( self ).owlCarousel({
					loop: loop,
					dots: dots,
					dotsData: dotsData,
					nav: nav,
					smartSpeed: speed,
					margin: gutter,
					responsiveClass:true,
					autoplay: autoplay,
					autoplayTimeout: autospeed,
					navText: ['<i class="klbth-icon-left-open-big"></i>','<i class="klbth-icon-right-open-big"></i>'],
					responsive : {
					  0 : {
						items: mobile,
						nav:false
					  },
					  480 : {
						items: mobile,
						nav:false
					  },
					  768 : {
						items: tablet
					  },
					  1024 : {
						items: tablet
					  },
					  1200 : {
						items: desktop
					  }
					}
				  });

				  if ( nav === true ) {
					const images = self.querySelectorAll( 'img' );

					imagesLoaded( images, () => {
					  self.classList.add( 'images-loaded' );

					  for( var i = 0; i < images.length; i++ ) {
						const img = images[i];
						const imageHeight = img.clientHeight;

						const prevButton = self.querySelector( '.owl-prev' );
						const nextButton = self.querySelector( '.owl-next' );

						prevButton.style.top = `${imageHeight / 2 - 12}px`;
						nextButton.style.top = `${imageHeight / 2 - 12}px`;

					  }
					});
				  }
				}
			  }
			  
			  // Hover Slider
			  window['hoverSliderOptions'] = {
				touch: 'end',
				preloadImages: true
			  };
			  hoverSlider.init({});
			  hoverSlider.prepareMarkup();
			  

			  // Countdown
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


			

        });
    });	

});