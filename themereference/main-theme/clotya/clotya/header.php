<?php
/**
 * header.php
 * @package WordPress
 * @subpackage Clotya
 * @since Clotya 1.0
 * 
 */
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( "charset" ); ?>">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">

	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

	<?php if (get_theme_mod( 'clotya_preloader' )) { ?>
		<div class="site-loading">
			<div class="preloading">
				<svg class="circular" viewBox="25 25 50 50">
					<circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/>
				</svg>
			</div>
		</div>
	<?php } ?>

	<?php clotya_do_action( 'clotya_before_main_header'); ?>

	<?php if ( ! function_exists( 'elementor_theme_do_location' ) || ! elementor_theme_do_location( 'header' ) ) { ?>
		<?php
        /**
        * Hook: clotya_main_header
        *
        * @hooked clotya_canvas_menu - 10
        * @hooked clotya_main_header_function - 20
        */
        do_action( 'clotya_main_header' );
	
		?>
	<?php } ?>

	<?php clotya_do_action( 'clotya_after_main_header'); ?>

	<main id="main" class="site-primary">
		<div class="site-content">