<?php
/**
 * Empty cart page
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/cart/cart-empty.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see     https://woocommerce.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 7.0.1
 */

defined( 'ABSPATH' ) || exit;

if ( wc_get_page_id( 'shop' ) > 0 ) : ?>
	<div class="woocommerce-cart-wrapper">
		<div class="cart-wrapper">
		
			<div class="cart-empty-page">	
					
				<div class="empty-icon">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44.36 48.82"><g data-name="Layer 2"><g data-name="Layer 1"><path fill="#ff491f" d="M37.17,48.82H0L3.77,12.5H33.4L34,18.56Z"></path><path fill="#ed3618" d="M19.09,24.24H39.68L42.3,48.82H16.47Z"></path><path fill="#ffe14d" d="M21.15,24.24H41.74l2.62,24.58H18.53Z"></path><path fill="#3c3f4d" d="M26.58 16.79a.74.74 0 0 1-.74-.74V8.73a7.26 7.26 0 1 0-14.51 0v7.33a.74.74 0 1 1-1.47 0V8.73a8.73 8.73 0 0 1 17.46 0v7.33A.74.74 0 0 1 26.58 16.79zM31.45 39a5.51 5.51 0 0 1-5.51-5.51V28.73a.74.74 0 1 1 1.47 0V33.5a4 4 0 0 0 8.07 0V28.73a.74.74 0 0 1 1.47 0V33.5A5.51 5.51 0 0 1 31.45 39z"></path></g></g></svg>
				</div><!-- empty-icon -->
				
				<?php 
					/*
					 * @hooked wc_empty_cart_message - 10
					 */
					do_action( 'woocommerce_cart_is_empty' );
				?>

				<p class="return-to-shop">
					<a class="button wc-backward<?php echo esc_attr( wc_wp_theme_get_element_class_name( 'button' ) ? ' ' . wc_wp_theme_get_element_class_name( 'button' ) : '' ); ?>" href="<?php echo esc_url( apply_filters( 'woocommerce_return_to_shop_redirect', wc_get_page_permalink( 'shop' ) ) ); ?>">
						<?php
							/**
							 * Filter "Return To Shop" text.
							 *
							 * @since 4.6.0
							 * @param string $default_text Default text.
							 */
							echo esc_html( apply_filters( 'woocommerce_return_to_shop_text', esc_html__( 'Return to shop', 'clotya' ) ) );
						?>
					</a>
				</p>
				
			</div>
			
		</div>
	</div>
<?php endif; ?>
