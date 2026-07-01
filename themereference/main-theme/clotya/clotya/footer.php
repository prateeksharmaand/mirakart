<?php
/**
 * footer.php
 * @package WordPress
 * @subpackage Clotya
 * @since Clotya 1.0
 * 
 */
 ?>

		</div><!-- site-content -->
	</main><!-- site-primary -->

	<?php clotya_do_action( 'clotya_before_main_footer'); ?>

	<?php if ( ! function_exists( 'elementor_theme_do_location' ) || ! elementor_theme_do_location( 'footer' ) ) { ?>
	
		<?php
        /**
        * Hook: clotya_main_footer
        *
        * @hooked clotya_main_footer_function - 10
        */
        do_action( 'clotya_main_footer' );
	
		?>
		
	<?php } ?>
	
	<?php clotya_do_action( 'clotya_after_main_footer'); ?>

	<div class="site-mask"></div>
  
	<?php wp_footer(); ?>
	</body>
</html>