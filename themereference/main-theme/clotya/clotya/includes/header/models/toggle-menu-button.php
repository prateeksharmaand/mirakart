<?php

if ( ! function_exists( 'clotya_toggle_menu_button' ) ) {
	function clotya_toggle_menu_button(){
		$togglemenubutton = get_theme_mod('clotya_toggle_menu_button','0');
		if($togglemenubutton == 1){
		?>
			<div class="header-button">
				<a href="#" class="toggle-menu">
					<i class="klbth-icon-source_icons_menu"></i>
				</a>
			</div><!-- header-button -->
	<?php  }
	}
}
