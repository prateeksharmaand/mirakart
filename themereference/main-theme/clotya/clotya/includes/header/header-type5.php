<header class="site-header header-type5">

	<?php clotya_top_notification1(); ?>

	<div class="header-row header-main hide-mobile border-container full-width">
		<div class="container">
			<div class="header-wrapper d-inline-flex align-items-center justify-content-between">
				<div class="column left">
				
					<?php clotya_toggle_menu_button(); ?>
					
					<div class="site-nav horizontal primary">
						<?php 
						wp_nav_menu(array(
						'theme_location' => 'main-menu',
						'container' => '',
						'fallback_cb' => 'show_top_menu',
						'menu_id' => '',
						'menu_class' => 'menu',
						'echo' => true,
						"walker" => '',
						'depth' => 0 
						));
						?>
					</div><!-- site-nav -->
				</div><!-- column -->
				<div class="column center">
					<div class="site-brand">
						<a href="<?php echo esc_url( home_url( "/" ) ); ?>" title="<?php bloginfo("name"); ?>">
							<?php $elementor_page = get_post_meta( get_the_ID(), '_elementor_edit_mode', true ); ?> 
							<?php if($elementor_page){ ?>
								<?php if(clotya_page_settings('logo')['url']){ ?>
									<img src="<?php echo esc_url( clotya_page_settings('logo')['url'] ); ?>" alt="<?php bloginfo("name"); ?>">
								<?php } elseif (get_theme_mod( 'clotya_logo' )) { ?>
									<img src="<?php echo esc_url( wp_get_attachment_url(get_theme_mod( 'clotya_logo' )) ); ?>" alt="<?php bloginfo("name"); ?>">
								<?php } elseif (get_theme_mod( 'clotya_logo_text' )) { ?>
									<span class="brand-text"><?php echo esc_html(get_theme_mod( 'clotya_logo_text' )); ?></span>
								<?php } else { ?>
									<img src="<?php echo get_template_directory_uri(); ?>/assets/images/logo.png" alt="<?php bloginfo("name"); ?>">
								<?php } ?>
							<?php } else { ?>
								<?php if (get_theme_mod( 'clotya_logo' )) { ?>
									<img src="<?php echo esc_url( wp_get_attachment_url(get_theme_mod( 'clotya_logo' )) ); ?>" alt="<?php bloginfo("name"); ?>">
								<?php } elseif (get_theme_mod( 'clotya_logo_text' )) { ?>
									<span class="brand-text"><?php echo esc_html(get_theme_mod( 'clotya_logo_text' )); ?></span>
								<?php } else { ?>
									<img src="<?php echo get_template_directory_uri(); ?>/assets/images/logo.png" alt="<?php bloginfo("name"); ?>">
								<?php } ?>
							<?php } ?>
						</a>
					</div><!-- site-brand -->
				</div><!-- column -->
				<div class="column right">
					<?php clotya_account_icon(); ?>

					<?php clotya_search_icon_holder(); ?>

					<?php clotya_wishlist_icon(); ?>

					<?php clotya_cart_icon(); ?>
				</div><!-- column -->
			</div><!-- header-wrapper -->
		</div><!-- container -->
	</div><!-- header-main -->
	<div class="header-row header-mobile hide-desktop">
		<div class="container">
			<div class="header-wrapper">
				<div class="column left">
					<div class="header-button">
						<a href="#" class="toggle-menu">
							<i class="klbth-icon-source_icons_menu"></i>
						</a>
					</div><!-- header-button -->
				</div><!-- column -->
				<div class="column center">
					<div class="site-brand">
						<a href="<?php echo esc_url( home_url( "/" ) ); ?>" title="<?php bloginfo("name"); ?>">
							<?php if (get_theme_mod( 'clotya_mobile_logo' )) { ?>
								<img src="<?php echo esc_url( wp_get_attachment_url(get_theme_mod( 'clotya_mobile_logo' )) ); ?>" alt="<?php bloginfo("name"); ?>">
							<?php } elseif (get_theme_mod( 'clotya_logo_text' )) { ?>
								<span><?php echo esc_html(get_theme_mod( 'clotya_logo_text' )); ?></span>
							<?php } else { ?>
								<img src="<?php echo get_template_directory_uri(); ?>/assets/images/logo.png" alt="<?php bloginfo("name"); ?>">   
							<?php } ?>
						</a>
					</div><!-- site-brand -->
				</div><!-- column -->
				<div class="column right">
					<?php clotya_cart_icon(); ?>
				</div><!-- column -->
			</div><!-- header-wrapper -->
		</div><!-- container -->
		
		<?php if(get_theme_mod('clotya_mobile_header_search','0') == 1){ ?>
			<div class="container">
				<div class="mobile-search-column">
					<?php clotya_search_icon(); ?>
				</div>
			</div>
		<?php } ?>
	</div><!-- header-mobile -->
</header><!-- site-header -->