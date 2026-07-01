<?php
/**
 * 404.php
 * @package WordPress
 * @subpackage Clotya
 * @since Clotya 1.0
 */
?>

<?php get_header(); ?>

<?php if ( ! function_exists( 'elementor_theme_do_location' ) || ! elementor_theme_do_location( 'single' ) ) { ?>

<div class="page-not-found" style="background-image: url(<?php echo get_template_directory_uri(); ?>/assets/images/404.jpg);">
	<h1 class="entry-title"><?php esc_html_e('404','clotya'); ?></h1>
	<h2 class="entry-subtitle"><?php esc_html_e('Page Not Found','clotya'); ?></h2>
	<div class="entry-content">
		<p><?php esc_html_e('It looks like nothing was found at this location. Maybe try to search for what you are looking for?','clotya'); ?></p>
	</div><!-- entry-content -->
	<a href="<?php echo esc_url( home_url('/') ); ?>" class="button btn-primary mt-30"><?php esc_html_e('Go To Homepage','clotya'); ?></a>
</div><!-- page-not-found -->

<?php } ?>

<?php get_footer(); ?>