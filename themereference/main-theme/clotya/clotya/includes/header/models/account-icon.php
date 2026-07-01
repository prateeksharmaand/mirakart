<?php

if ( ! function_exists( 'clotya_account_icon' ) ) {
	function clotya_account_icon(){
		$headersearch = get_theme_mod('clotya_header_account','0');
		if($headersearch == 1){
		?>
            <div class="header-button">
              <a href="<?php echo wc_get_page_permalink( 'myaccount' ); ?>" class="login-button">
                <i class="klbth-icon-usert"></i>
              </a>
            </div><!-- header-button -->
	<?php  }
	}
}
