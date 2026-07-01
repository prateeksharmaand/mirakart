<?php

if ( ! function_exists( 'clotya_search_icon' ) ) {
	function clotya_search_icon(){
		$headersearch = get_theme_mod('clotya_header_search','0');
		if($headersearch == 1){
		?>

		<div class="header-search-form">
			<?php echo clotya_header_product_search(); ?>
		</div><!-- header-search-form -->
	  
	<?php  }
	}
}
