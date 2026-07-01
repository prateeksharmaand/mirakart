<?php

/**
* The template for displaying all single posts
*
* @link https://developer.wordpress.org/themes/basics/template-hierarchy/#single-post
*
* @package WordPress
* @subpackage Clotya
* @since 1.0.0
*/

	remove_action( 'clotya_main_header', 'clotya_main_header_function', 10 );
	remove_action( 'clotya_main_footer', 'clotya_main_footer_function', 10 );

    get_header();

    while ( have_posts() ) : the_post();
        the_content();
    endwhile;

    get_footer();
?>
