<?php
if ( ! function_exists( 'clotya_sidebar_menu' ) ) {
	function clotya_sidebar_menu(){
	?>
		<?php $sidebarmenu = get_theme_mod('clotya_header_sidebar','0'); ?>
		<?php if($sidebarmenu == '1'){ ?>
			<div class="site-departments dropdown">
				<a href="#" class="dropdown-toggle">
					<div class="departments-text"><?php esc_html_e('All Categories','clotya'); ?></div>
					<?php $total_products = wp_count_posts( 'product' ); ?>
					<?php $total_count = $total_products->publish; ?>
					
					<div class="departments-count"><?php echo esc_html($total_count); ?></div>
					<div class="departments-arrow"><i class="klbth-icon-down-open-big"></i></div>
				</a>

				<?php if(clotya_page_settings('enable_sidebar_collapse') == 'yes'){ ?>
					<?php $menu_collapse = 'collapse show'; ?>
				<?php } else { ?>
					<?php $menu_collapse = is_front_page() && !get_theme_mod('clotya_header_sidebar_collapse') ? 'collapse show' : 'collapse'; ?>
				<?php } ?>

				<div class="departments-menu dropdown-menu <?php echo esc_attr($menu_collapse); ?>">
					<?php
					wp_nav_menu(array(
					'theme_location' => 'sidebar-menu',
					'container' => '',
					'fallback_cb' => 'show_top_menu',
					'menu_id' => '',
					'menu_class' => 'menu ',
					'echo' => true,
					"walker" => '',
					'depth' => 0 
					));
					?>
				</div><!-- dropdown-menu -->

			</div><!-- site-departments -->
	  
		<?php  }
	}
}