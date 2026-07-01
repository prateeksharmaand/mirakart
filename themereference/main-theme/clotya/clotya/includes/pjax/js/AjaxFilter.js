(function($) {

	clotyaThemeModule.ajaxLinks = '.widget_klb_product_categories a, .widget_product_status a, .remove-filter a, .widget_layered_nav a, .product-views-buttons a, .woocommerce-pagination a';

	clotyaThemeModule.ajaxFilters = function() {

		clotyaThemeModule.$document.pjax(clotyaThemeModule.ajaxLinks, '.site-content', {
			timeout       : 5000,
			scrollTo      : false,
			renderCallback: function(context, html, afterRender) {
				context.html(html);
				afterRender();
			}
		});

		clotyaThemeModule.$document.on('submit', '.widget_price_filter form', function(event) {
			$.pjax.submit(event, '.site-content');
			clotyaThemeModule.$document.trigger('clotyaShopPageInit');
		});



		clotyaThemeModule.$document.on('pjax:error', function(xhr, textStatus, error) {
			console.log('pjax error ' + error);
		});

		clotyaThemeModule.$document.on('pjax:start', function() {

			scrollToTop(false);

			var $siteContent = $('.site-content');

			$siteContent.removeClass('ajax-loaded');
			$siteContent.addClass('ajax-loading');
			$(".site-content .content-primary .products, nav.woocommerce-pagination").hide();
			$('.site-content .content-primary .products').before('<svg class="loader-image preloader" width="65px" height="65px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg"><circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle></svg></div>');
		});

		clotyaThemeModule.$document.on('pjax:complete', function() {

			$('.site-content').removeClass('ajax-loading');

			$('.loader-image.preloader').remove();
			
			clotyaThemeModule.$document.trigger('clotyaShopPageInit');
			
			$('.site-mask').removeClass('active');
			$(".site-mask").css({"opacity": "0", "visibility": "hidden"});

		});


		clotyaThemeModule.$document.on('pjax:end', function() {

			scrollToTop(false);

			var $siteContent = $('.site-content');

			$siteContent.removeClass('ajax-loading');
			$siteContent.addClass('ajax-loaded');
			
		});

		var scrollToTop = function(type) {
			if (clotya_settings.ajax_scroll === 'no' && type === false) {
				return false;
			}

			var $scrollTo = $(clotya_settings.ajax_scroll_class),
			    scrollTo  = $scrollTo.offset().top - clotya_settings.ajax_scroll_offset;

			$('html, body').stop().animate({
				scrollTop: scrollTo
			}, 400);
		};
	};

	$(document).ready(function() {
		clotyaThemeModule.ajaxFilters();
	});
})(jQuery);
