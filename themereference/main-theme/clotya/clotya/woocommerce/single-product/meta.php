<?php
/**
 * Single Product Meta
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/single-product/meta.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see         https://docs.woocommerce.com/document/template-structure/
 * @package     WooCommerce\Templates
 * @version     9.7.0
 */

use Automattic\WooCommerce\Enums\ProductType;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

global $product;
?>
<div class="product_meta product-meta">

	<?php do_action( 'woocommerce_product_meta_start' ); ?>

	<?php if ( wc_product_sku_enabled() && ( $product->get_sku() || $product->is_type( ProductType::VARIABLE ) ) ) : ?>
		<div class="product-sku">
			<span><?php esc_html_e( 'SKU:', 'clotya' ); ?></span>
			<span class="sku"><?php echo ( clotya_sanitize_data($sku = $product->get_sku() )) ? $sku : esc_html__( 'N/A', 'clotya' ); ?></span>
		</div>

	<?php endif; ?>

	<?php echo wc_get_product_category_list( $product->get_id(), ', ', '<div class="product-categories posted_in">' . _n( '<span>Category:</span>', '<span>Categories:</span>', count( $product->get_category_ids() ), 'clotya' ) . ' ', '</div>' ); ?>

	<?php echo wc_get_product_tag_list( $product->get_id(), ', ', '<div class="product-tags">' . _n( '<span>Tag:</span>', '<span>Tags:</span>', count( $product->get_tag_ids() ), 'clotya' ) . ' ', '</div>' ); ?>

	<?php do_action( 'woocommerce_product_meta_end' ); ?>

</div>
