(function ($) {
  "use strict";

	$(document).on('clotyaShopPageInit', function () {
		clotyaThemeModule.hoverslider();
	});

	clotyaThemeModule.hoverslider = function() {
      window['hoverSliderOptions'] = {
        touch: 'end',
        preloadImages: true
      };
      hoverSlider.init({});
      hoverSlider.prepareMarkup();
	}
	$(document).ready(function() {
		clotyaThemeModule.hoverslider();
	});

})(jQuery);
