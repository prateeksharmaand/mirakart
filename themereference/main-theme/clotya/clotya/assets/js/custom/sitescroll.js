(function ($) {
  "use strict";

	$(document).on('clotyaShopPageInit', function () {
		clotyaThemeModule.sitescroll();
	});

	clotyaThemeModule.sitescroll = function() {
      var siteScroll = $( '.site-scroll' );
      siteScroll.each( function() {
        const ps = new PerfectScrollbar( $( this )[0], {
          suppressScrollX: true,
        });
      });
		
		
      this.overlay = document.querySelector( '.site-mask' );
	}
	$(document).ready(function() {
		clotyaThemeModule.sitescroll();
	});

})(jQuery);
