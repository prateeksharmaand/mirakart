<?php
/*************************************************
## Tab View
*************************************************/ 

add_action( 'wp_ajax_nopriv_tab_view', 'clotya_tab_view_callback' );
add_action( 'wp_ajax_tab_view', 'clotya_tab_view_callback' );
function clotya_tab_view_callback() {
	
	global $product;
	global $woocommerce;
	$catid = intval( $_POST['catid'] );
	$desktop = intval( $_POST['desktop'] );
	$mobile = intval( $_POST['mobile'] );
	$speed = intval( $_POST['speed'] );
	$dots = $_POST['dots'];
	$nav = $_POST['nav'];
	$autoplay = $_POST['autoplay'];
	$autospeed = intval( $_POST['autospeed'] );
	
	$output = '';
		
	$output .= '<div id="'.esc_attr($catid).'" class="site-slider carousel owl-carousel products" data-desktop="'.esc_attr($desktop).'" data-tablet="3" data-mobile="'.esc_attr($mobile).'" data-speed="'.esc_attr($speed).'" data-loop="true" data-gutter="30" data-dots="'.esc_attr($dots).'" data-nav="'.esc_attr($nav).'" data-autoplay="'.esc_attr($autoplay).'" data-autospeed="'.esc_attr($autospeed).'" data-autostop="true">';

	$loop = array(
		'post_type' => 'product',
		'posts_per_page'         => 8,
		'order'          => 'DESC',
		'orderby'        => 'date',
		'post_status'    => 'publish',
	);

	$loop['tax_query'][] = array(
		'taxonomy' 	=> 'product_cat',
		'field' 	=> 'term_id',
		'terms' 	=> $catid,
	);
	
    query_posts( $loop );

	while ( have_posts() ) : the_post(); 
	
		$id = get_the_ID();
		$allproduct = wc_get_product( get_the_ID() );
		
		$product = new WC_Product(get_the_ID());
		$cart_url = wc_get_cart_url();
		$price = $allproduct->get_price_html();
		$weight = $product->get_weight();
		$stock_status = $product->get_stock_status();
		$stock_text = $product->get_availability();
		$short_desc = $product->get_short_description();
		$rating = wc_get_rating_html($product->get_average_rating());
		$ratingcount = $product->get_review_count();
		$wishlist = get_theme_mod( 'clotya_wishlist_button', '0' );
		$compare = get_theme_mod( 'clotya_compare_button', '0' );
		$quickview = get_theme_mod( 'clotya_quick_view_button', '0' );
		$sale_price_dates_to    = ( $date = get_post_meta( $id, '_sale_price_dates_to', true ) ) ? date_i18n( 'Y-m-d', $date ) : '';

		$managestock = $product->managing_stock();
		$stock_quantity = $product->get_stock_quantity();
		$stock_format = esc_html__('Only %s left in stock','clotya');
		$stock_poor = '';
		
		if($managestock && $stock_quantity < 10) {
			$stock_poor .= '<div class="product-message color-danger">'.sprintf($stock_format, $stock_quantity).'</div>';
		}
		
		$gallery = get_theme_mod('clotya_product_box_gallery') == 1 ? 'with-gallery' : '';


		$output .= '<div class="product product-type-'.esc_attr($product->get_type()).'">';
		$output .= '<div class="product-content">';
		$output .= '<div class="thumbnail-wrapper '.esc_attr($gallery).'">';
		$output .= clotya_sale_percentage();
		$output .= '<div class="product-buttons style-1">';
		
		ob_start();
		do_action('clotya_wishlist_action');
		$output .= ob_get_clean();
		
		$output .= '<a href="#" class="quick-view-button"><i class="klbth-icon-resize"></i></a>';
		
		ob_start();
		$output .= do_action('clotya_compare_action');
		$output .= ob_get_clean();

		ob_start();
		woocommerce_template_loop_add_to_cart();
		$output .= ob_get_clean();
		
		$output .= '</div><!-- product-buttons -->';
		
		$output .= clotya_product_countdown();
		
		$output .= '<a href="'.get_permalink().'" class="product-images">';
		ob_start();
		$output .= clotya_product_second_image();
		$output .= ob_get_clean();
		$output .= '</a>';
		$output .= '</div><!-- thumbnail-wrapper -->';
		$output .= '<div class="content-wrapper">';
		
		if(clotya_vendor_name()){
			$output .= '<div class="content-switcher">';
			$output .= '<div class="switcher-wrapper">';
			
			$output .= clotya_vendor_name();
						  
			if($ratingcount){
				$output .= '<div class="product-swatches">';
				$output .= '<div class="product-review">';
				$output .= '<div class="star">';
				$output .= '<i class="klbth-icon-star"></i>';
				$output .= '</div><!-- star -->';
				$output .= '<span>'.sprintf(_n('%d review', '%d reviews', $ratingcount, 'clotya'), $ratingcount).'</span>';
				$output .= '</div><!-- product-review -->';
				$output .= '</div><!-- product-swatches -->';
			}
			$output .= '</div><!-- switcher-wrapper -->';
			$output .= '</div><!-- content-switcher -->';
		} elseif($ratingcount){
			$output .= '<div class="content-switcher">';
			if($ratingcount){
			$output .= '<div class="product-swatches">';
			$output .= '<div class="product-review">';
			$output .= '<div class="star">';
			$output .= '<i class="klbth-icon-star"></i>';
			$output .= '</div><!-- star -->';
			$output .= '<span>'.sprintf(_n('%d review', '%d reviews', $ratingcount, 'clotya'), $ratingcount).'</span>';
			$output .= '</div><!-- product-review -->';
			$output .= '</div><!-- product-swatches -->';
			}
			$output .= '</div><!-- content-switcher -->';
		}

		$output .= '<h3 class="product-title"><a href="'.get_permalink().'">'.get_the_title().'</a></h3>';
		$output .= '<span class="price">';
		$output .= $price;
		$output .= '</span><!-- price -->';
		$output .= '</div><!-- content-wrapper -->';
		$output .= '</div><!-- product-content -->';
		$output .= '</div><!-- product -->';
		
		endwhile; 
		wp_reset_query();

		$output .= '</div>';
			
	 	$output_escaped = $output;
	 	echo $output_escaped;

	
		wp_die();

}