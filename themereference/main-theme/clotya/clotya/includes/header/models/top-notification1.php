<?php
if ( ! function_exists( 'clotya_top_notification1' ) ) {
	function clotya_top_notification1(){
		$topnotification1 = get_theme_mod('clotya_top_notification1_toggle','0'); 
		if($topnotification1 == '1'){ ?>
	
			<div class="global-notification">
			  <div class="container">
				<p><?php echo clotya_sanitize_data(get_theme_mod('clotya_top_notification1_content')); ?></p>
			  </div><!-- container -->
			</div><!-- global-notification -->

		<?php  }
	}
}