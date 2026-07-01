<?php
if ( ! function_exists( 'clotya_main_footer_function' ) ) {
	function clotya_main_footer_function(){
	?>
		<footer class="site-footer">
			<?php $subscribe = get_theme_mod('clotya_footer_subscribe_area',0); ?>
			<?php if($subscribe == 1){ ?>
				<div class="footer-row subscribe-row style-1 black">
					<div class="container">
						<div class="footer-row-wrapper">
							<div class="footer-subscribe-wrapper">
								<h3 class="entry-title"><?php echo clotya_sanitize_data(get_theme_mod('clotya_footer_subscribe_title')); ?></h3>
								<div class="entry-description">
									<p><?php echo clotya_sanitize_data(get_theme_mod('clotya_footer_subscribe_subtitle')); ?></p>
								</div><!-- entry-description -->
								<div class="newsletter-form">
									<?php clotya_subscribe_form(get_theme_mod('clotya_footer_subscribe_formid')); ?>
								</div><!-- newsletter-form -->
							</div><!-- footer-subscribe-wrapper -->
							<?php if(get_theme_mod('clotya_footer_contact_title')){ ?>
								<div class="footer-contact-wrapper">
									<h3 class="entry-title"><?php echo clotya_sanitize_data(get_theme_mod('clotya_footer_contact_title')); ?></h3>
									<div class="entry-description">
										<p><?php echo clotya_sanitize_data(get_theme_mod('clotya_footer_contact_subtitle')); ?></p>
									</div><!-- entry-description -->
									<?php $appimg = get_theme_mod('clotya_footer_subscribe_app_image'); ?>
									<?php if($appimg ){ ?>
										<div class="download-app">
											<?php foreach($appimg as $a){ ?>
												<a href="<?php echo esc_url($a['app_url']); ?>"><img src="<?php echo esc_url(clotya_get_image($a['app_image'])); ?>" alt="<?php esc_attr_e('app','clotya'); ?>"></a>
											<?php } ?>
										</div><!-- download-app -->
									<?php } ?>
									<span><?php echo clotya_sanitize_data(get_theme_mod('clotya_footer_contact_desc')); ?></span>
								</div><!-- footer-contact-wrapper -->
							<?php } ?>
						</div><!-- footer-row-wrapper -->
					</div><!-- container -->
				</div><!-- footer-row -->
			<?php } ?>


			<?php if ( is_active_sidebar( 'footer-1' ) || is_active_sidebar( 'footer-2' ) || is_active_sidebar( 'footer-3' ) || is_active_sidebar( 'footer-4' ) || is_active_sidebar( 'footer-4' )) { ?>
				<div class="footer-row widgets-row border-boxed">
					<div class="container">
						<div class="footer-row-wrapper">
							<div class="row">

								<?php if(get_theme_mod('clotya_footer_column') == '1column1'){ ?>
									<div class="col col-12 col-lg-12">
										<?php dynamic_sidebar( 'footer-1' ); ?>
									</div><!-- col -->
								<?php } elseif(get_theme_mod('clotya_footer_column') == '2columns'){ ?>
									<div class="col col-12 col-lg-6">
										<?php dynamic_sidebar( 'footer-1' ); ?>
									</div><!-- col -->
									<div class="col col-12 col-lg-6">
										<?php dynamic_sidebar( 'footer-2' ); ?>
									</div><!-- col -->
								<?php } elseif(get_theme_mod('clotya_footer_column') == '3columns'){ ?>
									<div class="col col-12 col-lg-4">
										<?php dynamic_sidebar( 'footer-1' ); ?>
									</div><!-- col -->
									<div class="col col-12 col-lg-4">
										<?php dynamic_sidebar( 'footer-2' ); ?>
									</div><!-- col -->
									<div class="col col-12 col-lg-4">
										<?php dynamic_sidebar( 'footer-3' ); ?>
									</div><!-- col -->
								<?php } elseif(get_theme_mod('clotya_footer_column') == '4columns'){ ?>
									<div class="col col-12 col-lg-3">
										<?php dynamic_sidebar( 'footer-1' ); ?>
									</div><!-- col -->
									<div class="col col-12 col-lg-3">
										<?php dynamic_sidebar( 'footer-2' ); ?>
									</div><!-- col -->
									<div class="col col-12 col-lg-3">
										<?php dynamic_sidebar( 'footer-3' ); ?>
									</div><!-- col -->
									<div class="col col-12 col-lg-3">
										<?php dynamic_sidebar( 'footer-4' ); ?>
									</div><!-- col -->
								<?php } else { ?>
									<div class="col col-12 col-lg-4">
										<?php dynamic_sidebar( 'footer-1' ); ?>
									</div><!-- col -->
									<div class="col col-12 col-lg-2">
										<?php dynamic_sidebar( 'footer-2' ); ?>
									</div><!-- col -->
									<div class="col col-12 col-lg-2">
										<?php dynamic_sidebar( 'footer-3' ); ?>
									</div><!-- col -->
									<div class="col col-12 col-lg-2">
										<?php dynamic_sidebar( 'footer-4' ); ?>
									</div><!-- col -->
									<div class="col col-12 col-lg-2">
										<?php dynamic_sidebar( 'footer-5' ); ?>
									</div><!-- col -->
								<?php } ?>

							</div><!-- row -->
						</div><!-- footer-row-wrapper -->
					</div><!-- container -->
				</div><!-- footer-row -->
			<?php } ?>
			<div class="footer-row footer-copyright">
				<div class="container">
					<div class="footer-row-wrapper">
						<div class="site-copyright">
							<?php if(get_theme_mod( 'clotya_copyright' )){ ?>
								<p><?php echo clotya_sanitize_data(str_replace( '[year]', date('Y'), get_theme_mod( 'clotya_copyright' ) )); ?></p>
							<?php } else { ?>
								<p><?php esc_html_e('Copyright 2025.KlbTheme . All rights reserved','clotya'); ?></p>
							<?php } ?>
						</div><!-- site-copyright -->
						<?php if(get_theme_mod('clotya_footer_payment_image')){ ?>
							<a href="<?php echo esc_url(get_theme_mod('clotya_footer_payment_image_url')); ?>">
								<img src="<?php echo esc_url( wp_get_attachment_url(get_theme_mod('clotya_footer_payment_image'))); ?>" alt="<?php esc_attr_e('payment','clotya'); ?>">
							</a>
						<?php } ?>
						<nav class="footer-menu">
							<?php 
							wp_nav_menu(array(
							'theme_location' => 'footer-menu',
							'container' => '',
							'fallback_cb' => 'show_top_menu',
							'menu_id' => '',
							'menu_class' => 'menu',
							'echo' => true,
							"walker" => '',
							'depth' => 0 
							));
							?>
						</nav><!-- footer-menu -->
					</div><!-- footer-row-wrapper -->
				</div><!-- container -->
			</div><!-- footer-row -->
		</footer><!-- site-footer -->
	<?php }
}

add_action('clotya_main_footer','clotya_main_footer_function', 10);