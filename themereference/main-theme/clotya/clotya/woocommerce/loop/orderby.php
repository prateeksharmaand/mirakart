<?php
/**
 * Show options for ordering
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/loop/orderby.php.
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

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$id_suffix = wp_unique_id();

?>
<?php if(!class_exists('clotya_Elementor_Addons')){ ?>
	<div class="before-shop-loop">
		<?php add_action( 'clotya_result_count', 'woocommerce_result_count', 20 ); ?>
		<?php do_action('clotya_result_count'); ?>
<?php } ?>
	
	<div class="sorting-products">
		<form class="woocommerce-ordering" method="get">
			<?php if ( $use_label ) : ?>
				<label for="woocommerce-orderby-<?php echo esc_attr( $id_suffix ); ?>"><?php echo esc_html__( 'Sort by', 'clotya' ); ?></label>
			<?php endif; ?>
			<select
				name="orderby"
				class="orderby"
				<?php if ( $use_label ) : ?>
					id="woocommerce-orderby-<?php echo esc_attr( $id_suffix ); ?>"
				<?php else : ?>
					aria-label="<?php esc_attr_e( 'Shop order', 'clotya' ); ?>"
				<?php endif; ?>
			>

				<?php foreach ( $catalog_orderby_options as $id => $name ) : ?>
					<option value="<?php echo esc_attr( $id ); ?>" <?php selected( $orderby, $id ); ?>><?php echo esc_html( $name ); ?></option>
				<?php endforeach; ?>
			</select>
			<input type="hidden" name="paged" value="1" />
			<?php wc_query_string_form_fields( null, array( 'orderby', 'submit', 'paged', 'product-page' ) ); ?>
		</form>
	</div>
	
<?php if(!class_exists('clotya_Elementor_Addons')){ ?>
	</div>
<?php } ?>