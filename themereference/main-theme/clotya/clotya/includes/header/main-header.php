<?php

/*************************************************
## Clotya Theme options
*************************************************/

require_once get_template_directory() . '/includes/header/models/canvas-menu.php';
require_once get_template_directory() . '/includes/header/models/top-notification1.php';
require_once get_template_directory() . '/includes/header/models/top-notification2.php';
require_once get_template_directory() . '/includes/header/models/social-buttons.php';
require_once get_template_directory() . '/includes/header/models/sidebar-menu.php';
require_once get_template_directory() . '/includes/header/models/search.php';
require_once get_template_directory() . '/includes/header/models/search-holder.php';
require_once get_template_directory() . '/includes/header/models/account-icon.php';
require_once get_template_directory() . '/includes/header/models/cart.php';
require_once get_template_directory() . '/includes/header/models/wishlist-icon.php';
require_once get_template_directory() . '/includes/header/models/toggle-menu-button.php';


/*************************************************
## Main Header Function
*************************************************/

add_action('clotya_main_header','clotya_main_header_function',20);

if ( ! function_exists( 'clotya_main_header_function' ) ) {
	function clotya_main_header_function(){

		if(clotya_page_settings('page_header_type') == 'type5') {
			
			get_template_part( 'includes/header/header-type5' );

		}elseif(clotya_page_settings('page_header_type') == 'type4') {
			
			get_template_part( 'includes/header/header-type4' );
		
		}elseif(clotya_page_settings('page_header_type') == 'type3') {
			
			get_template_part( 'includes/header/header-type3' );
			
		}elseif(clotya_page_settings('page_header_type') == 'type2') {
			
			get_template_part( 'includes/header/header-type2' );
			
		} elseif(clotya_page_settings('page_header_type') == 'type1') {
			
			get_template_part( 'includes/header/header-type1' );
		} elseif(get_theme_mod('clotya_header_type') == 'type5'){
			
			get_template_part( 'includes/header/header-type5' );
			
		} elseif(get_theme_mod('clotya_header_type') == 'type4'){
			
			get_template_part( 'includes/header/header-type4' );
			
		} elseif(get_theme_mod('clotya_header_type') == 'type3'){
			
			get_template_part( 'includes/header/header-type3' );
			
		} elseif(get_theme_mod('clotya_header_type') == 'type2'){
			
			get_template_part( 'includes/header/header-type2' );
			
		} else {
			
			get_template_part( 'includes/header/header-type1' );
			
		}
		
	}
}
