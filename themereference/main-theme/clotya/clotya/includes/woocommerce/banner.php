<?php $categorybanner = get_theme_mod('clotya_shop_banner_each_category'); ?>
<?php if($categorybanner && is_product_category() && array_search(get_queried_object()->term_id, array_column($categorybanner, 'category_id')) !== false){ ?>
	<?php foreach($categorybanner as $c){ ?>
		<?php if($c['category_id'] == get_queried_object()->term_id){ ?>
			<div class="shop-page-banner">
				<div class="banner dark content-top content-middle">
					<div class="banner-content">
						<div class="banner-inner">
							<h2 class="entry-title"><?php echo esc_html($c['category_title']); ?></h2>
							<div class="entry-description">
								<p><?php echo clotya_sanitize_data($c['category_subtitle']); ?></p>
							</div><!-- entry-description -->
						</div><!-- banner-inner -->
					</div><!-- banner-content -->
					<?php if($c['category_image']){ ?>
					<div class="banner-image"><img src="<?php echo esc_url(clotya_get_image($c['category_image'])); ?>" alt="<?php echo esc_attr($c['category_title']); ?>"></div>
					<?php } ?>
					<a href="<?php echo esc_url($c['category_button_url']); ?>" class="overlay-link"></a>
				</div><!-- banner -->
			</div><!-- shop-page-banner -->
		<?php } ?>
	<?php } ?>
<?php } else { ?>
	<?php $banner = get_theme_mod('clotya_shop_banner_image'); ?>
	<?php $bannertitle = get_theme_mod('clotya_shop_banner_title'); ?>
	<?php $bannersubtitle = get_theme_mod('clotya_shop_banner_subtitle'); ?>
	<?php $bannerdesc = get_theme_mod('clotya_shop_banner_desc'); ?>
	<?php $bannerbuttonurl = get_theme_mod('clotya_shop_banner_button_url'); ?>
	<?php if($banner){ ?>
	
	<div class="shop-page-banner">
		<div class="banner dark content-top content-middle">
			<div class="banner-content">
				<div class="banner-inner">
					<h2 class="entry-title"><?php echo esc_html($bannertitle); ?></h2>
					<div class="entry-description">
						<p><?php echo clotya_sanitize_data($bannersubtitle); ?></p>
					</div><!-- entry-description -->
				</div><!-- banner-inner -->
			</div><!-- banner-content -->
			<?php if($banner){ ?>
			<div class="banner-image"><img src="<?php echo esc_url(wp_get_attachment_url($banner)); ?>" alt="<?php echo esc_attr($bannertitle); ?>"></div>
			<?php } ?>
			<a href="<?php echo esc_url($bannerbuttonurl); ?>" class="overlay-link"></a>
		</div><!-- banner -->
	</div><!-- shop-page-banner -->

	<?php } ?>
<?php } ?>