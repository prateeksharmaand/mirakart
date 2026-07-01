<?php
if ( ! function_exists( 'clotya_top_notification2' ) ) {
	function clotya_top_notification2(){
		$topnotification2 = get_theme_mod('clotya_top_notification2_toggle','0'); 
		if($topnotification2 == '1'){ ?>
	
            <div class="header-message">
				<p><?php echo clotya_sanitize_data(get_theme_mod('clotya_top_notification2_content')); ?></p>
            </div><!-- header-message -->

		<?php  }
	}
}