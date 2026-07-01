<?php

/*************************************************
## Woocommerce 
*************************************************/

function clotya_product_image(){
	if (  (function_exists('has_post_thumbnail')) && (has_post_thumbnail())  ) {
		$att=get_post_thumbnail_id();
		$image_src = wp_get_attachment_image_src( $att, 'full' );
		$image_src = $image_src[0];

		$size = get_theme_mod( 'clotya_product_image_size', array( 'width' => '', 'height' => '') );

		if($size['width'] && $size['height']){
			$image = clotya_resize( $image_src, $size['width'], $size['height'], true, true, true );  
		} else {
			$image = $image_src;
		}
		
		return esc_url($image);
	} else {
		return wc_placeholder_img_src('');
	}
}

function clotya_product_second_image(){
	global $product;
	
	$product_image_ids = $product->get_gallery_image_ids();
	
	if($product_image_ids && get_theme_mod('clotya_product_box_gallery') == 1){
		
		echo '<img src="'.clotya_product_image().'"';
		echo ' data-hover-slides="';
		
		$total_count = count($product_image_ids);
		$count = 1;
		foreach( $product_image_ids as $product_image_id ){
			if($count == $total_count){
				$size = get_theme_mod( 'clotya_product_image_size', array( 'width' => '', 'height' => '') );

				if($size['width'] && $size['height']){
					$image = clotya_resize( wp_get_attachment_url( $product_image_id ), $size['width'], $size['height'], true, true, true );  
				} else {
					$image = wp_get_attachment_url( $product_image_id ); //comma removed for the latest item
				}
		
				echo clotya_sanitize_data($image);

			} else {
				$size = get_theme_mod( 'clotya_product_image_size', array( 'width' => '', 'height' => '') );

				if($size['width'] && $size['height']){
					$image = ''.clotya_resize( wp_get_attachment_url( $product_image_id ), $size['width'], $size['height'], true, true, true ).',';
				} else {
					$image = ''.wp_get_attachment_url( $product_image_id ).','; //comma added for each item
				}
		
				echo clotya_sanitize_data($image);
			}
			$count++;
		}
		
		echo '"';
		echo ' data-options=\'{"touch": "end", "preloadImages": true }\' alt="'.the_title_attribute( 'echo=0' ).'">';

	} else {
		echo '<img src="'.clotya_product_image().'" alt="'.the_title_attribute( 'echo=0' ).'">';
	}

}

function clotya_sale_percentage(){
	global $product;

	$output = '';

	if(get_theme_mod('clotya_product_badge_tab', 0) == 1){
		
		$product = wc_get_product(get_the_ID());
		$badgetext = $product->get_meta('_klb_product_badge_text');
		$badgetype = $product->get_meta('_klb_product_badge_type');
		$badgebg = $product->get_meta('_klb_product_badge_bg_color');
		$badgecolor = $product->get_meta('_klb_product_badge_text_color');
		$percentagecheck = $product->get_meta('_klb_product_percentage_check');
		$percentagetype = $product->get_meta('_klb_product_percentage_type');
		$percentagebg = $product->get_meta('_klb_product_percentage_bg_color');
		$percentagecolor = $product->get_meta('_klb_product_percentage_text_color');

		$badgecss = '';
		if($badgebg || $badgecolor){
			$badgecss .= 'style="';
			if($badgebg){
				$badgecss .= 'background-color: '.esc_attr($badgebg).';';
			}
			if($badgecolor){
				$badgecss .= 'color: '.esc_attr($badgecolor).';';
			}
			$badgecss .= '"';
		}
		
		$percentagecss = '';
		if($percentagebg || $percentagecolor){
			$percentagecss .= 'style="';
			if($percentagebg){
				$percentagecss .= 'background-color: '.esc_attr($percentagebg).';';
			}
			if($percentagecolor){
				$percentagecss .= 'color: '.esc_attr($percentagecolor).';';
			}
			$percentagecss .= '"';
		}
		
		if ( $product->is_on_sale() || $badgetext ){
			$output .= '<div class="product-badges">';
			if ( !$percentagecheck && $product->is_on_sale() && $product->is_type( 'variable' ) ) {
				$percentage = ceil(100 - ($product->get_variation_sale_price() / $product->get_variation_regular_price( 'min' )) * 100);
				$output .= '<span class="badge '.esc_attr($percentagetype).' onsale" '.$percentagecss.'>'.$percentage.'%</span>';
			} elseif( !$percentagecheck && $product->is_on_sale() && $product->get_regular_price()  && !$product->is_type( 'grouped' )) {
				$percentage = ceil(100 - ($product->get_sale_price() / $product->get_regular_price()) * 100);
				$output .= '<span class="badge '.esc_attr($percentagetype).' onsale" '.$percentagecss.'>'.$percentage.'%</span>';
			}
			
			if($badgetext){
				$output .= '<span class="badge '.esc_attr($badgetype).' trending" '.$badgecss.'>'.esc_html($badgetext).'</span>';
			}
			
			$output .= '</div>';
		}
	}
	
	return $output;

}

function clotya_vendor_name(){
	if (function_exists('get_wcmp_vendor_settings')) {
		global $post;
		$vendor = get_mvx_product_vendors($post->ID);
		if (isset($vendor->page_title)) {
			$store_name = $vendor->page_title;
			
			return '<div class="product-store"><span>'.esc_html__('Store:', 'clotya').'</span><a href="'.esc_url($vendor->permalink).'"> '.esc_html($store_name).'</a></div>';
		}
	}elseif(class_exists('WeDevs_Dokan')){
		// Get the author ID (the vendor ID)
		$vendor_id = get_post_field( 'post_author', get_the_id() );
		
		$vendor                   = dokan()->vendor->get( $vendor_id );	
		$user_description 		  = get_the_author_meta( 'description', $vendor_id );
		$store_banner_id          = $vendor->get_banner_id();
		$store_name               = $vendor->get_shop_name();
		$store_url                = $vendor->get_shop_url();
		$store_rating             = $vendor->get_rating();			
		$is_store_featured        = $vendor->is_featured();
		
		if (isset($store_name) && $store_name) {
			$output = '';			
			return '<div class="product-store"><span>'.esc_html__('Store:', 'clotya').'</span><a href="'.esc_url($store_url).'"> '.esc_html($store_name).'</a></div>';
		}
	}
}

if ( class_exists( 'woocommerce' ) ) {
add_theme_support( 'woocommerce' );
add_image_size('clotya-woo-product', 450, 450, true);

// Remove woocommerce defauly styles
add_filter( 'woocommerce_enqueue_styles', '__return_false' );

// hide default shop title anasayfadaki title gizlemek için
add_filter('woocommerce_show_page_title', 'clotya_override_page_title');
function clotya_override_page_title() {
return false;
}

remove_action( 'woocommerce_before_shop_loop', 'woocommerce_result_count', 20 ); /*remove result count above products*/
remove_action( 'woocommerce_after_shop_loop_item', 'woocommerce_template_loop_add_to_cart', 10);
remove_action( 'woocommerce_after_shop_loop_item_title', 'woocommerce_template_loop_rating', 5 ); //remove rating
remove_action( 'woocommerce_before_shop_loop_item_title', 'woocommerce_show_product_loop_sale_flash', 10 ); //remove rating
remove_action( 'woocommerce_before_shop_loop_item_title', 'woocommerce_template_loop_product_thumbnail', 10);
remove_action( 'woocommerce_after_shop_loop_item_title', 'woocommerce_template_loop_price', 10);
remove_action( 'woocommerce_before_single_product_summary', 'woocommerce_show_product_sale_flash', 10);
remove_action( 'woocommerce_shop_loop_item_title', 'woocommerce_template_loop_product_title',10);

add_action( 'woocommerce_before_shop_loop_item', 'clotya_shop_box', 10);
remove_action( 'woocommerce_before_shop_loop_item', 'woocommerce_template_loop_product_link_open', 10 );
remove_action( 'woocommerce_after_shop_loop_item', 'woocommerce_template_loop_product_link_close', 5 );
remove_action( 'woocommerce_before_main_content', 'woocommerce_breadcrumb', 20 ); /*remove breadcrumb*/



remove_action( 'woocommerce_after_single_product_summary', 'woocommerce_output_related_products',20);
remove_action( 'woocommerce_after_single_product', 'woocommerce_output_related_products',10);
add_action( 'woocommerce_after_single_product_summary', 'clotya_related_products', 20);
function clotya_related_products(){
	$related_column = get_theme_mod('clotya_shop_related_post_column') ? get_theme_mod('clotya_shop_related_post_column') : '4';
    woocommerce_related_products( array('posts_per_page' => $related_column, 'columns' => $related_column));
}

/*----------------------------
  Cross Sells Columns
 ----------------------------*/
remove_action( 'woocommerce_cart_collaterals', 'woocommerce_cross_sell_display');
add_action( 'woocommerce_after_cart', 'clotya_change_cross_sells_columns', 20);
if(!function_exists('clotya_change_cross_sells_columns')){
	function clotya_change_cross_sells_columns() {
		$crosssells = get_theme_mod('clotya_cross_sells_column') ? get_theme_mod('clotya_cross_sells_column') : '4';
		woocommerce_cross_sell_display($crosssells, $crosssells);
	}
}

/*----------------------------
  Upsell Columns
 ----------------------------*/
add_filter( 'woocommerce_upsell_display_args', 'clotya_change_number_related_products', 20 );
if(!function_exists('clotya_change_number_related_products')){
	function clotya_change_number_related_products( $args ) {
		$args['posts_per_page'] = get_theme_mod('clotya_upsell_column');
		$args['columns'] = get_theme_mod('clotya_upsell_column');
		return $args;
	}
}

/*************************************************
## Single Gallery Columns
*************************************************/

add_filter ( 'woocommerce_product_thumbnails_columns', 'clotya_product_thumbnails_columns', 10, 1 );
function clotya_product_thumbnails_columns( $columns ) {
    return get_theme_mod('clotya_shop_single_gallery_columns', 6);
}

/*************************************************
## Wishlist Shortcode
*************************************************/
function clotya_wishlist_shortcode(){
	$output = '';
	
	$wishlist = get_theme_mod( 'clotya_wishlist_button', '0' );
	
	if($wishlist == '1' && function_exists('run_tinv_wishlist')){
	$output .= do_shortcode('[ti_wishlists_addtowishlist]');
	}

	return $output;
}

/*************************************************
## Compare Shortcode
*************************************************/
function clotya_compare_shortcode(){
	$output = '';
	
	$compare = get_theme_mod( 'clotya_compare_button', '0' );
	
	if($compare == '1' && function_exists('woosc_init')){
	$output .= do_shortcode('[woosc type="link"]');
	}

	echo $output;
}

add_action('clotya_compare_action', 'clotya_compare_shortcode');

/*************************************************
## Product Box SKU 
*************************************************/
function clotya_product_box_sku($product_sku = ''){

	if($product_sku != 'true'){
		return;
	}
	
	global $product;

	if ( wc_product_sku_enabled() && ( $product->get_sku() || $product->is_type( 'variable' ) ) ){
		echo '<span class="sku_wrapper">'.esc_html__( 'SKU:', 'clotya' ).'<span class="sku">'.esc_html($product->get_sku()).'</span></span>';
	}
}
add_action('clotya_product_box_footer', 'clotya_product_box_sku', 10, 1);

/*************************************************
## Product Attributes
*************************************************/
function clotya_product_attributes($product_sku = '', $productattributes = ''){
	if($productattributes != 'true'){
		return;
	}
	
	global $product;
	
	echo '<div class="klb-product-attributes">';
	wc_display_product_attributes( $product );
	echo '</div>';
}
add_action('clotya_product_box_footer', 'clotya_product_attributes', 10, 2);

/*************************************************
## Re-order WooCommerce Single Product Summary
*************************************************/
if(class_exists('Clotya_Elementor_Addons')){
	$reorder_single = get_theme_mod( 'clotya_shop_single_reorder', 
		array( 
			'woocommerce_template_single_title', 
			'woocommerce_template_single_rating',
			'woocommerce_template_single_price', 
			'woocommerce_template_single_excerpt',		
			'woocommerce_template_single_add_to_cart', 
			'clotya_single_extra_buttons',
			'woocommerce_template_single_meta',
		) 
	);

	if($reorder_single){
		remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_title', 5 );
		remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_rating', 10 );
		remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_price', 10 );
		remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_excerpt', 20 );
		remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_add_to_cart', 30 );
		remove_action( 'woocommerce_single_product_summary', 'clotya_single_extra_buttons', 38);
		remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_meta', 40 );
		
		$count = 8;
		
		foreach ( $reorder_single as $single_part ) {
			
			add_action( 'woocommerce_single_product_summary', $single_part, $count );
			
			$count+=8;
		}
	}
}

function clotya_product_countdown(){
	global $product;
	global $post;
	global $woocommerce;
	$id = get_the_ID();
	$output = '';
	
	if( $product->is_type('variable') ) {
		$variation_ids = $product->get_visible_children();

		if(isset($variation_ids[0])){
			$variation = wc_get_product( $variation_ids[0] );
	
			$sale_price_dates_to = ( $date = get_post_meta( $variation_ids[0], '_sale_price_dates_to', true ) ) ? date_i18n( 'Y/m/d', $date ) : '';
		} else {
			$sale_price_dates_to = '';
		}
	} else {
		$sale_price_dates_to = ( $date = get_post_meta( $id, '_sale_price_dates_to', true ) ) ? date_i18n( 'Y/m/d', $date ) : '';
	}
	
	if($sale_price_dates_to){
		$output .= '<div class="product-countdown">';
		$output .= '<div class="countdown" data-date="'.esc_attr($sale_price_dates_to).'" data-text="'.esc_attr__('Expired','clotya').'">';
		$output .= '<div class="count-item">';
		$output .= '<div class="days">00</div>';
		$output .= '<div class="count-label">'.esc_html('d','clotya').'</div>';
		$output .= '</div><!-- count-item -->';
		$output .= '<span>:</span>';
		$output .= '<div class="count-item">';
		$output .= '<div class="hours">00</div>';
		$output .= '<div class="count-label">'.esc_html('h','clotya').'</div>';
		$output .= '</div><!-- count-item -->';
		$output .= '<span>:</span>';
		$output .= '<div class="count-item">';
		$output .= '<div class="minutes">00</div>';
		$output .= '<div class="count-label">'.esc_html('m','clotya').'</div>';
		$output .= '</div><!-- count-item -->';
		$output .= '<span>:</span>';
		$output .= '<div class="count-item">';
		$output .= '<div class="second">00</div>';
		$output .= '<div class="count-label">'.esc_html('s','clotya').'</div>';
		$output .= '</div><!-- count-item -->';
		$output .= '</div><!-- countdown -->';
		$output .= '</div><!-- product-countdown -->';
	}
	
	return $output;
}

/*----------------------------
  Product Type 1
 ----------------------------*/
function clotya_product_type1($countdown = null, $product_sku = '', $productattributes = ''){
	global $product;
	global $post;
	global $woocommerce;
	
	$output = '';
	
	$id = get_the_ID();
	$allproduct = wc_get_product( get_the_ID() );

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

	$postview  = isset( $_POST['shop_view'] ) ? $_POST['shop_view'] : '';

	if(clotya_shop_view() == 'list_view' || $postview == 'list_view') {
		$output .= '<div class="product-content">';
		$output .= '<div class="thumbnail-wrapper">';
		$output .= '<div class="product-buttons style-1">';
					  
		ob_start();
		do_action('clotya_wishlist_action');
		$output .= ob_get_clean();
		
		ob_start();
		$output .= do_action('clotya_compare_action');
		$output .= ob_get_clean();
		
		if($quickview == '1'){
		$output .= '<a href="'.$product->get_id().'" class="detail-bnt quick-view-button"><i class="klbth-icon-resize"></i></a>';
		}
		
		$output .= '</div><!-- product-buttons -->';
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
		$output .= '<div class="entry-description">';
		$output .= '<p>'.clotya_limit_words(get_the_excerpt(), '20').'</p>';
		$output .= '</div><!-- entry-description -->';
		$output .= '<div class="product-list-buttons">';
		
		ob_start();
		woocommerce_template_loop_add_to_cart();
		$output .= ob_get_clean();
		
		$output .= '</div><!-- product-list-buttons -->';

		ob_start();
		woocommerce_template_single_meta();
		$output .= ob_get_clean();
		
		$output .= '</div><!-- content-wrapper -->';
		$output .= '</div><!-- product-content -->';
	} else {
		$output .= '<div class="product-content">';
		$output .= '<div class="thumbnail-wrapper '.esc_attr($gallery).'">';
		$output .= clotya_sale_percentage();
		$output .= '<div class="product-buttons style-1">';
		
		ob_start();
		do_action('clotya_wishlist_action');
		$output .= ob_get_clean();
		
		if($quickview == '1'){
		$output .= '<a href="'.$product->get_id().'" class="detail-bnt quick-view-button"><i class="klbth-icon-resize"></i></a>';
		}
		
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
		
		ob_start();
		do_action('clotya_after_shop_loop_item_image');
		$output .= ob_get_clean();
		
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
		
		ob_start();
		do_action('clotya_product_box_footer', $product_sku, $productattributes);
		$output .= ob_get_clean();
		
		$output .= '</div><!-- content-wrapper -->';
		$output .= '</div><!-- product-content -->';


	}
	
	return $output;
}


/*----------------------------
  Product Type 2
 ----------------------------*/
function clotya_product_type2($countdown = null, $product_sku = '', $productattributes = ''){
	global $product;
	global $post;
	global $woocommerce;
	
	$output = '';
	
	$id = get_the_ID();
	$allproduct = wc_get_product( get_the_ID() );

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

	$postview  = isset( $_POST['shop_view'] ) ? $_POST['shop_view'] : '';

	if(clotya_shop_view() == 'list_view' || $postview == 'list_view') {
		$output .= '<div class="product-content product-type2">';
		$output .= '<div class="thumbnail-wrapper">';
		$output .= '<div class="product-buttons style-1">';
					  
		ob_start();
		do_action('clotya_wishlist_action');
		$output .= ob_get_clean();
		
		ob_start();
		$output .= do_action('clotya_compare_action');
		$output .= ob_get_clean();
		
		if($quickview == '1'){
		$output .= '<a href="'.$product->get_id().'" class="detail-bnt quick-view-button"><i class="klbth-icon-resize"></i></a>';
		}
		
		$output .= '</div><!-- product-buttons -->';
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
		$output .= '<div class="entry-description">';
		$output .= '<p>'.clotya_limit_words(get_the_excerpt(), '20').'</p>';
		$output .= '</div><!-- entry-description -->';
		$output .= '<div class="product-list-buttons">';
		
		ob_start();
		woocommerce_template_loop_add_to_cart();
		$output .= ob_get_clean();
		
		$output .= '</div><!-- product-list-buttons -->';

		ob_start();
		woocommerce_template_single_meta();
		$output .= ob_get_clean();
		
		$output .= '</div><!-- content-wrapper -->';
		$output .= '</div><!-- product-content -->';
	} else {
		$output .= '<div class="product-content product-type2">';
		$output .= '<div class="thumbnail-wrapper '.esc_attr($gallery).'">';
		$output .= clotya_sale_percentage();
		$output .= '<div class="product-buttons style-1">';
		
		ob_start();
		do_action('clotya_wishlist_action');
		$output .= ob_get_clean();
		
		if($quickview == '1'){
		$output .= '<a href="'.$product->get_id().'" class="detail-bnt quick-view-button"><i class="klbth-icon-resize"></i></a>';
		}
		
		ob_start();
		$output .= do_action('clotya_compare_action');
		$output .= ob_get_clean();
		
		$output .= '</div><!-- product-buttons -->';
		
		ob_start();
		woocommerce_template_loop_add_to_cart();
		$output .= ob_get_clean();
		
		$output .= clotya_product_countdown();
		
		$output .= '<a href="'.get_permalink().'" class="product-images">';
		ob_start();
		$output .= clotya_product_second_image();
		$output .= ob_get_clean();
		$output .= '</a>';
		$output .= '</div><!-- thumbnail-wrapper -->';
		
		ob_start();
		do_action('clotya_after_shop_loop_item_image');
		$output .= ob_get_clean();
		
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
		
		ob_start();
		do_action('clotya_product_box_footer', $product_sku, $productattributes);
		$output .= ob_get_clean();
		
		$output .= '</div><!-- content-wrapper -->';
		$output .= '</div><!-- product-content -->';


	}
	
	return $output;
}

/*----------------------------------
  Product Type 3 with progress bar
 -----------------------------------*/
function clotya_product_type3($product_sku = '', $productattributes = ''){
	global $product;
	global $post;
	global $woocommerce;
	
	$output = '';
	
	$id = get_the_ID();
	$allproduct = wc_get_product( get_the_ID() );

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

	$managestock = $product->managing_stock();
	$stock_quantity = $product->get_stock_quantity();
	$stock_format = esc_html__('Only %s left in stock','clotya');
	$stock_poor = '';
	if($managestock && $stock_quantity < 10) {
		$stock_poor .= '<div class="product-message color-danger">'.sprintf($stock_format, $stock_quantity).'</div>';
	}
	
	$total_sales = $product->get_total_sales();
	$total_stock = $total_sales + $stock_quantity;
	
	if($managestock && $stock_quantity > 0) {
	$progress_percentage = floor($total_sales / (($total_sales + $stock_quantity) / 100)); // yuvarlama
	}

	$gallery = get_theme_mod('clotya_product_box_gallery') == 1 ? 'with-gallery' : '';

	$postview  = isset( $_POST['shop_view'] ) ? $_POST['shop_view'] : '';

	if(clotya_shop_view() == 'list_view' || $postview == 'list_view') {
		$output .= '<div class="product-content">';
		$output .= '<div class="thumbnail-wrapper">';
		$output .= '<div class="product-buttons style-1">';
					  
		ob_start();
		do_action('clotya_wishlist_action');
		$output .= ob_get_clean();
		
		ob_start();
		$output .= do_action('clotya_compare_action');
		$output .= ob_get_clean();
		
		if($quickview == '1'){
		$output .= '<a href="'.$product->get_id().'" class="detail-bnt quick-view-button"><i class="klbth-icon-resize"></i></a>';
		}
		
		$output .= '</div><!-- product-buttons -->';
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
		$output .= '<div class="entry-description">';
		$output .= '<p>'.clotya_limit_words(get_the_excerpt(), '20').'</p>';
		$output .= '</div><!-- entry-description -->';
		$output .= '<div class="product-list-buttons">';
		
		ob_start();
		woocommerce_template_loop_add_to_cart();
		$output .= ob_get_clean();
		
		$output .= '</div><!-- product-list-buttons -->';

		ob_start();
		woocommerce_template_single_meta();
		$output .= ob_get_clean();
		
		$output .= '</div><!-- content-wrapper -->';
		$output .= '</div><!-- product-content -->';
	} else {
		$output .= '<div class="product-content product-type-3">';
		$output .= '<div class="thumbnail-wrapper '.esc_attr($gallery).'">';
		$output .= clotya_sale_percentage();
		$output .= '<div class="product-buttons style-1">';
		
		ob_start();
		do_action('clotya_wishlist_action');
		$output .= ob_get_clean();
		
		if($quickview == '1'){
		$output .= '<a href="'.$product->get_id().'" class="detail-bnt quick-view-button"><i class="klbth-icon-resize"></i></a>';
		}

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
		$output .= '<img src="'.clotya_product_image().'">';
		$output .= ob_get_clean();
		$output .= '</a>';
		$output .= '</div><!-- thumbnail-wrapper -->';
		
		ob_start();
		do_action('clotya_after_shop_loop_item_image');
		$output .= ob_get_clean();
		
		$output .= '<div class="content-wrapper">';

		$output .= '<h3 class="product-title"><a href="'.get_permalink().'">'.get_the_title().'</a></h3>';
		$output .= '<span class="price">';
		$output .= $price;
		$output .= '</span><!-- price -->';
		
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
		
		if($managestock && $stock_quantity > 0) {
			$output .= '<div class="product-progress">';
			$output .= '<div class="progressbar"><span style="width: '.esc_attr($progress_percentage).'%;"></span></div>';
			$output .= '<div class="progress-info">';
			$output .= '<div class="available">'.esc_html__('Available:','clotya').' '.esc_html($stock_quantity).'</div>';
			$output .= '<div class="sold">'.esc_html__('Sold:', 'clotya').' <strong>'.esc_html($total_sales).'</strong></div>';
			$output .= '</div><!-- progress-info -->';
			$output .= '</div><!-- product-progress -->';
		}
		
		ob_start();
		do_action('clotya_product_box_footer', $product_sku, $productattributes);
		$output .= ob_get_clean();
		
		$output .= '</div><!-- content-wrapper -->';
		$output .= '</div><!-- product-content -->';


	}
	
	return $output;
}

/*----------------------------
  Product Type 4
 ----------------------------*/
function clotya_product_type4($countdown = null, $product_sku = '', $productattributes = ''){
	global $product;
	global $post;
	global $woocommerce;
	
	$output = '';
	
	$id = get_the_ID();
	$allproduct = wc_get_product( get_the_ID() );

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

	$postview  = isset( $_POST['shop_view'] ) ? $_POST['shop_view'] : '';

	if(clotya_shop_view() == 'list_view' || $postview == 'list_view') {
		$output .= '<div class="product-content">';
		$output .= '<div class="thumbnail-wrapper">';
		$output .= '<div class="product-buttons style-1">';
					  
		ob_start();
		do_action('clotya_wishlist_action');
		$output .= ob_get_clean();
		
		ob_start();
		$output .= do_action('clotya_compare_action');
		$output .= ob_get_clean();
		
		if($quickview == '1'){
		$output .= '<a href="'.$product->get_id().'" class="detail-bnt quick-view-button"><i class="klbth-icon-resize"></i></a>';
		}
		
		$output .= '</div><!-- product-buttons -->';
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
		$output .= '<div class="entry-description">';
		$output .= '<p>'.clotya_limit_words(get_the_excerpt(), '20').'</p>';
		$output .= '</div><!-- entry-description -->';
		$output .= '<div class="product-list-buttons">';
		
		ob_start();
		woocommerce_template_loop_add_to_cart();
		$output .= ob_get_clean();
		
		$output .= '</div><!-- product-list-buttons -->';

		ob_start();
		woocommerce_template_single_meta();
		$output .= ob_get_clean();
		
		$output .= '</div><!-- content-wrapper -->';
		$output .= '</div><!-- product-content -->';
	} else {
		$output .= '<div class="product-content product-type4">';
		$output .= '<div class="thumbnail-wrapper '.esc_attr($gallery).'">';
		$output .= clotya_sale_percentage();
		$output .= '<div class="product-buttons style-2">';
		
		ob_start();
		do_action('clotya_wishlist_action');
		$output .= ob_get_clean();
		
		if($quickview == '1'){
		$output .= '<a href="'.$product->get_id().'" class="detail-bnt quick-view-button"><i class="klbth-icon-resize"></i></a>';
		}
		
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
		
		ob_start();
		do_action('clotya_after_shop_loop_item_image');
		$output .= ob_get_clean();
		
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
		
		ob_start();
		do_action('clotya_product_box_footer', $product_sku, $productattributes);
		$output .= ob_get_clean();
		
		$output .= '</div><!-- content-wrapper -->';
		$output .= '</div><!-- product-content -->';


	}
	
	return $output;
}

/*----------------------------
  Add my owns Product Box
 ----------------------------*/
function clotya_shop_box() {
	$product_sku = get_theme_mod('clotya_product_box_sku') == 1 || clotya_ft() == 'box_sku' ? 'true' : '';
	$productattributes = get_theme_mod('clotya_product_box_attributes') == 1 || clotya_ft() == 'product_attributes' ? 'true' : '';
	
	if(get_theme_mod('clotya_product_box_type') == 'type4'){
		echo clotya_product_type4(get_theme_mod('clotya_product_box_countdown'), $product_sku, $productattributes);
	}elseif(get_theme_mod('clotya_product_box_type') == 'type3'){
		echo clotya_product_type3($product_sku, $productattributes);
	}elseif(get_theme_mod('clotya_product_box_type') == 'type2'){
		echo clotya_product_type2(get_theme_mod('clotya_product_box_countdown'), $product_sku, $productattributes);
	} else {
		echo clotya_product_type1(get_theme_mod('clotya_product_box_countdown'), $product_sku, $productattributes);
	}
}

/*************************************************
## Woo Cart Ajax
*************************************************/ 

add_filter('woocommerce_add_to_cart_fragments', 'clotya_header_add_to_cart_fragment');
function clotya_header_add_to_cart_fragment( $fragments ) {
	global $woocommerce;
	ob_start();
	?>
	
	<span class="cart-count count"><?php echo sprintf(_n('%d', '%d', $woocommerce->cart->cart_contents_count, 'clotya'), $woocommerce->cart->cart_contents_count);?></span>
	

	<?php
	$fragments['span.cart-count'] = ob_get_clean();

	return $fragments;
}

add_filter( 'woocommerce_add_to_cart_fragments', function($fragments) {

    ob_start();
    ?>

    <div class="fl-mini-cart-content">
        <?php woocommerce_mini_cart(); ?>
    </div>

    <?php $fragments['div.fl-mini-cart-content'] = ob_get_clean();

    return $fragments;

} );

add_filter('woocommerce_add_to_cart_fragments', 'clotya_header_add_to_cart_fragment_subtotal');
function clotya_header_add_to_cart_fragment_subtotal( $fragments ) {
	global $woocommerce;
	ob_start();
	?>
	
    <div class="cart-price button-text price"><?php echo WC()->cart->get_cart_subtotal(); ?></div>

    <?php $fragments['.cart-price'] = ob_get_clean();

	return $fragments;
}



/*************************************************
## Clotya Woo Search Form
*************************************************/ 
add_filter( 'get_product_search_form' , 'clotya_custom_product_searchform' );
function clotya_custom_product_searchform( $form ) {

	$form = '<form class="product-search-form" action="' . esc_url( home_url( '/'  ) ) . '" role="search" method="get" id="searchform">
				<input type="text" value="' . get_search_query() . '" name="s" id="s" placeholder="'.esc_attr__('Search','clotya').'">
				<button type="submit"><i class="klb-right"></i></button>
                <input type="hidden" name="post_type" value="product" />
			</form>';

	return $form;
}

function clotya_header_product_search() {
	$terms = get_terms( array(
		'taxonomy' => 'product_cat',
		'hide_empty' => true,
		'parent'    => 0,
	) );

	$form = '';

	if(class_exists( 'DGWT_WC_Ajax_Search' )){
		$form .= do_shortcode('[wcas-search-form]');
	} else {
		$form .= '<form action="' . esc_url( home_url( '/'  ) ) . '" class="search-form search-item" role="search" method="get">';
		$form .= '<input type="search" value="' . get_search_query() . '" name="s" class="form-control line" autocomplete="off" placeholder="'.esc_attr__('Search your favorite product...','clotya').'">';
		$form .= '<select name="product_cat" id="categories">';
		$form .= '<option class="select-value" value="" selected="selected">'.esc_html__('Select Category','clotya').'</option>';
		foreach ( $terms as $term ) {
			if($term->count >= 1){
				$form .= '<option value="'.esc_attr($term->slug).'">'.esc_html($term->name).'</option>';
			}
		}
		$form .= '</select>';
		
		$form .= '<button type="submit" class="btn"><i class="klbth-icon-search"></i></button>';
		$form .= '<input type="hidden" name="post_type" value="product" />';
		$form .= '</form><!-- search-form -->';
	}

	return $form;
}

/*************************************************
## Clotya Gallery Thumbnail Size
*************************************************/ 
add_filter( 'woocommerce_get_image_size_gallery_thumbnail', function( $size ) {
    return array(
        'width' => 90,
        'height' => 54,
        'crop' => 0,
    );
} );


/*************************************************
## Quick View Scripts
*************************************************/ 

function clotya_quick_view_scripts() {
  	wp_enqueue_script( 'clotya-quick-ajax', get_template_directory_uri() . '/assets/js/custom/quick_ajax.js', array('jquery'), '1.0.0', true );
  	wp_enqueue_script( 'clotya-tab-ajax', get_template_directory_uri() . '/assets/js/custom/tab-ajax.js', array('jquery'), '1.0.0', true );
	wp_localize_script( 'clotya-quick-ajax', 'MyAjax', array(
		'ajaxurl' => esc_url(admin_url( 'admin-ajax.php' )),
	));
  	wp_enqueue_script( 'clotya-variationform', get_template_directory_uri() . '/assets/js/custom/variationform.js', array('jquery'), '1.0.0', true );
	wp_enqueue_script( 'wc-add-to-cart-variation' );
}
add_action( 'wp_enqueue_scripts', 'clotya_quick_view_scripts' );

/*************************************************
## Quick View CallBack
*************************************************/
add_action( 'wp_ajax_nopriv_quick_view', 'clotya_quick_view_callback' );
add_action( 'wp_ajax_quick_view', 'clotya_quick_view_callback' );
function clotya_quick_view_callback() {

	$id = intval( $_POST['id'] );
	$loop = new WP_Query( array(
		'post_type' => 'product',
		'p' => $id,
	  )
	);
	
	while ( $loop->have_posts() ) : $loop->the_post(); 
	$product = new WC_Product(get_the_ID());
	
	$rating = wc_get_rating_html($product->get_average_rating());
	$price = $product->get_price_html();
	$rating_count = $product->get_rating_count();
	$review_count = $product->get_review_count();
	$average      = $product->get_average_rating();
	$product_image_ids = $product->get_gallery_attachment_ids();

	$output = '';
	
		$output .= '<div class="quickview-product single-product-wrapper product white-popup">';
		$output .= '<div class="quick-product-wrapper">';
		$output .= '<button title="'.esc_attr__('Close (Esc)', 'clotya').'" type="button" class="mfp-close">×</button>';
		
		$output .= '<article class="product single-product">';
		$output .= '<div class="row">';
		$output .= '<div class="col col-12 col-md-6">';
		$output .= '<div class="single-thumbnails">';
		
		if (  (function_exists('has_post_thumbnail')) && (has_post_thumbnail())  ) {
			$att=get_post_thumbnail_id();
			$image_src = wp_get_attachment_image_src( $att, 'full' );
			$image_src = $image_src[0];
			
			$output .= '<div id="product-gallery" class="site-slider owl-carousel" data-desktop="1" data-tablet="1" data-mobile="1" data-speed="600" data-loop="false" data-gutter="0" data-dots="true" data-nav="true" data-autoplay="false" data-autospeed="1000" data-autostop="true" data-dotsdata="true">';
			$output .= '<div class="gallery-item" data-dot="<button><img src='.esc_url($image_src).'></button>"><a href="'.esc_url($image_src).'"><img src="'.esc_url($image_src).'"></a></div>';
			
			foreach( $product_image_ids as $product_image_id ){
				$image_url = wp_get_attachment_url( $product_image_id );
				$output .= '<div class="gallery-item" data-dot="<button><img src='.esc_url($image_url).'></button>"><a href="'.esc_url($image_url).'"><img src="'.esc_url($image_url).'"></a></div>';
			}
			$output .= '</div><!-- product-gallery -->';
		}
		
		$output .= '</div><!-- single-thumbnails -->';
		$output .= '</div><!-- col -->';
		$output .= '<div class="col col-12 col-md-6">';
		$output .= '<div class="product-info">';
		
		ob_start();
		do_action( 'woocommerce_single_product_summary' );
		$output .= ob_get_clean();
		
		$output .= '</div><!-- single-details -->';
		$output .= '</div><!-- col -->';
		$output .= '</div><!-- row -->';
		$output .= '</article><!-- single-product -->';

		$output .= '</div><!-- quick-product-wrapper -->';

		$output .= '</div><!-- quickview-product -->';

		endwhile; 
		wp_reset_postdata();

	 	$output_escaped = $output;
	 	echo $output_escaped;
		
		wp_die();

}


/*************************************************
## Clotya Filter by Attribute
*************************************************/ 
function clotya_woocommerce_layered_nav_term_html( $term_html, $term, $link, $count ) { 

	$attribute_label_name = wc_attribute_label($term->taxonomy);;
	$attribute_id = wc_attribute_taxonomy_id_by_name($attribute_label_name);
	$attr  = wc_get_attribute($attribute_id);
	$array = json_decode(json_encode($attr), true);

	if(isset($array) && $array['type'] == 'color'){
		$color = get_term_meta( $term->term_id, 'product_attribute_color', true );
		$term_html = '<div class="type-color"><span class="color-box" style="background-color:'.esc_attr($color).';"></span>'.$term_html.'</div>';
	}
	
	if(isset($array) && $array['type'] == 'button'){
		$term_html = '<div class="type-button"><span class="button-box"></span>'.$term_html.'</div>';
	}

    return $term_html; 
}; 
         
add_filter( 'woocommerce_layered_nav_term_html', 'clotya_woocommerce_layered_nav_term_html', 10, 4 ); 


/*************************************************
## Shop Width Body Classes
*************************************************/

function clotya_body_classes( $classes ) {

	if( is_shop() && get_theme_mod('clotya_shop_width') == 'wide' || clotya_get_option() == 'wide') { 
		$classes[] = 'shop-wide';
	}elseif(is_product() &&  get_theme_mod('clotya_single_full_width') == 1 || clotya_get_option() == 'wide') { 
		$classes[] = 'shop-wide';
	} else {
		$classes[] = '';
	}
	
	return $classes;
}
add_filter( 'body_class', 'clotya_body_classes' );

/*************************************************
## Stock Availability Translation
*************************************************/ 
if(get_theme_mod('clotya_stock_quantity',0) != 1){
add_filter( 'woocommerce_get_availability', 'clotya_custom_get_availability', 1, 2);
function clotya_custom_get_availability( $availability, $_product ) {
    
    // Change In Stock Text
    if ( $_product->is_in_stock() ) {
        $availability['availability'] = esc_html__('In Stock', 'clotya');
    }
    // Change Out of Stock Text
    if ( ! $_product->is_in_stock() ) {
        $availability['availability'] = esc_html__('Out of stock', 'clotya');
    }
    return $availability;
}
}

/*************************************************
## Archive Description After Content
*************************************************/
if(get_theme_mod('clotya_category_description_after_content',0) == 1){
	remove_action('woocommerce_archive_description', 'woocommerce_taxonomy_archive_description', 10);
	remove_action('woocommerce_archive_description', 'woocommerce_product_archive_description', 10);
	add_action('clotya_after_main_shop', 'woocommerce_taxonomy_archive_description', 5);
	add_action('clotya_after_main_shop', 'woocommerce_product_archive_description', 5);
}

/*************************************************
## Catalog Mode - Disable Add to cart Button
*************************************************/
if(get_theme_mod('clotya_catalog_mode', 0) == 1|| clotya_get_option() == 'catalogmode'){ 
	add_filter( 'woocommerce_loop_add_to_cart_link', 'clotya_remove_add_to_cart_buttons', 1 );
	function clotya_remove_add_to_cart_buttons() {
		return false;
	}
	remove_action('woocommerce_single_product_summary', 'woocommerce_template_single_add_to_cart', 40);
}

/*************************************************
## Size Chart Modal
*************************************************/ 
function clotya_size_chart_modal(){
	$sizechart = get_post_meta( get_the_ID(), 'klb_product_size_chart', true );
	
	if($sizechart && is_product()){
		
		wp_enqueue_script( 'clotya-sizemodal');
		
		$chart  = '  <div class="size-box-holder">';
		$chart .= '<div class="size-box-inner">';
		$chart .= '<div class="size-box-close"><i class="klbth-icon-cancel"></i></div>';

		$chart .= $sizechart;
		
		$chart .= '</div><!-- size-box-inner -->';
		$chart .= '<div class="size-box-mask"></div>';
		$chart .= '</div><!-- size-box-holder -->';
		  
		echo clotya_sanitize_data($chart);
	}
}
add_action('wp_footer','clotya_size_chart_modal');

/*************************************************
## Related Products with Tags
*************************************************/
if(get_theme_mod('clotya_related_by_tags',0) == 1){
	add_filter( 'woocommerce_product_related_posts_relate_by_category', '__return_false' );
}

/*************************************************
## Woo Smart Compare Disable
*************************************************/ 
add_filter( 'woosc_button_position_archive', '__return_false' );
add_filter( 'woosc_button_position_single', '__return_false' );

} // is woocommerce activated

?>