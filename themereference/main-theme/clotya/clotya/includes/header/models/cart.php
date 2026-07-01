<?php
if ( ! function_exists( 'clotya_cart_icon' ) ) {
	function clotya_cart_icon(){
		$headercart = get_theme_mod('clotya_header_cart','0');
		if($headercart == '1'){
			global $woocommerce;
			$carturl = wc_get_cart_url(); 
			?>
			
			<div class="header-button">
				<a href="<?php echo esc_url($carturl); ?>" class="cart-button">
					<div class="cart-price button-text price"><?php echo WC()->cart->get_cart_subtotal(); ?></div>
					<div class="button-icon">
						<i class="klbth-icon-shopping-bag-ft"></i>
						<span class="cart-count count"><?php echo sprintf(_n('%d', '%d', $woocommerce->cart->cart_contents_count, 'clotya'), $woocommerce->cart->cart_contents_count);?></span>
					</div><!-- button-icon -->
				</a>
				<div class="cart-dropdown hide">
					<div class="cart-dropdown-wrapper">
						<div class="fl-mini-cart-content">
							<?php woocommerce_mini_cart(); ?>
						</div>
					</div><!-- cart-dropdown-wrapper -->
				</div><!-- cart-dropdown -->
			</div><!-- header-button -->
		<?php }
	}
}