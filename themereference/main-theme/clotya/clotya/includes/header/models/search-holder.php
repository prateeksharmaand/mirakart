<?php

if ( ! function_exists( 'clotya_search_icon_holder' ) ) {
	function clotya_search_icon_holder(){
		$headersearch = get_theme_mod('clotya_header_search','0');
		if($headersearch == 1){
		?>

		<div class="header-button">
			<a href="#" class="search-button">
				<i class="klbth-icon-search"></i>
			</a>
		</div><!-- header-button -->

	<?php  }
	}
}


if ( ! function_exists( 'clotya_search_holder' ) ) {
	function clotya_search_holder(){
		$headersearch = get_theme_mod('clotya_header_search','0');
		if($headersearch == 1){
		
		?>
	
		<div class="search-holder">
			<div class="search-holder-inner">
				<div class="container">
					<div class="search-holder-header search-item">
						<span><?php esc_html_e('What are you looking for?', 'clotya'); ?></span>
						<div class="search-holder-close search-item"><i class="klbth-icon-cancel"></i></div>
					</div>
					
					<?php echo clotya_header_product_search(); ?>
					
					<div class="search-holder-message search-item"><span><?php esc_html_e('Please type the word you want to search and press "enter"', 'clotya'); ?></span></div>
				</div><!-- container -->
			</div><!-- search-holder-inner -->
		</div><!-- search-holder -->
	  
		<?php  }
	}
}
add_action('wp_footer', 'clotya_search_holder');