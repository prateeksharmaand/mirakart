(function ($) {
  "use strict";

	$(document).on('clotyaShopPageInit', function () {
		clotyaThemeModule.productshare();
	});

	clotyaThemeModule.productshare = function() {
      const button = document.querySelector('.product-extra-buttons .share-product');
      const close = document.querySelector( '.product-share-holder .share-close' );
      const container = document.querySelector( '.product-share-holder' );
      const shareInput = document.querySelector( '.share-link-input' );
      const value = document.querySelector( '.copy-link .link-value' );
      const copied = document.querySelector( '.copy-link p .copied' );

      if ( button !== null ) {
        button.addEventListener( 'click', function(e) {
          e.preventDefault();
          container.classList.add( 'active' );
        });

        if (close !== null) {
          close.addEventListener( 'click', function(e) {
            e.preventDefault();
            container.classList.remove( 'active' );
          });
        }

        if ( shareInput !== null ) {
          const copyUrl = () => {
            console.log( 'copy' );
            shareInput.select();
            shareInput.setSelectionRange(0, 99999); /* For mobile devices */

            /* Copy the text inside the text field */
            navigator.clipboard.writeText(shareInput.value);
            copied.classList.add('active');
          }

          value.addEventListener( 'click', copyUrl);
        }
      }
	}
	$(document).ready(function() {
		clotyaThemeModule.productshare();
	});

})(jQuery);
