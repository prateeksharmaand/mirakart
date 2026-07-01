jQuery(document).ready(function($) {
	"use strict";

	$(document).on('click', 'a.detail-bnt', function(event){
		event.preventDefault(); 
        var data = {
			cache: false,
            action: 'quick_view',
			beforeSend: function() {
				$('body').append('<svg class="loader-image preloader quick-view" width="65px" height="65px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg"><circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle></svg></div>');
			},
			'id': $(this).attr('href'),
        };

        // since 2.8 ajaxurl is always defined in the admin header and points to admin-ajax.php
		$.post(MyAjax.ajaxurl, data, function(response) {
            $.magnificPopup.open({
                type: 'inline',
                items: {
                    src: response
                }
            })


			clotyaThemeModule.countdown();

			clotyaThemeModule.siteslider();

			clotyaThemeModule.productquantity();

			  
			$("form.cart.grouped_form .input-text.qty").attr("value", "0");

			$( document.body ).trigger( 'clotyaSinglePageInit' );

			$(".loader-image").remove();
        });
    });	

});