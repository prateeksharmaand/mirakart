<?php
/**
 * functions.php
 * @package WordPress
 * @subpackage Clotya
 * @since Clotya 1.5.3
 * 
 */

/*************************************************
## Get Theme Info
*************************************************/ 
if ( ! function_exists( 'clotya_get_theme_info' ) ) {
	function clotya_get_theme_info( $parameter ) {
		
		$theme_info = wp_get_theme( get_template() )->get( $parameter );
		
		return $theme_info;
	}
}

define( 'CLOTYA_VERSION', clotya_get_theme_info( 'Version' ) );

/*************************************************
## Admin style and scripts  
*************************************************/ 
function clotya_admin_styles() {
	wp_enqueue_style('clotya-klbtheme',     get_template_directory_uri() .'/assets/css/admin/klbtheme.css');
	wp_enqueue_script('clotya-init', 	    get_template_directory_uri() .'/assets/js/init.js', array('jquery','media-upload','thickbox'));
    wp_enqueue_script('clotya-register',    get_template_directory_uri() .'/assets/js/admin/register.js', array('jquery'), CLOTYA_VERSION, true);
}
add_action('admin_enqueue_scripts', 'clotya_admin_styles');

 /*************************************************
## Clotya Fonts
*************************************************/
function clotya_fonts_url() {
	$fonts_url = '';

	$allfont = array();
	
	$jost 		= '"Jost", sans-serif';

	$allfont[] = isset(get_theme_mod('clotya_body_typography', [])['font-family']) ? get_theme_mod('clotya_body_typography', [])['font-family'] :'';
	$allfont[] = isset(get_theme_mod('clotya_heading_typography', [])['font-family']) ? get_theme_mod('clotya_heading_typography', [])['font-family'] :'';
	$allfont[] = isset(get_theme_mod('clotya_menu_typography', [])['font-family']) ? get_theme_mod('clotya_menu_typography', [])['font-family'] :'';
	$allfont[] = isset(get_theme_mod('clotya_form_typography', [])['font-family']) ? get_theme_mod('clotya_form_typography', [])['font-family'] :'';
	$allfont[] = isset(get_theme_mod('clotya_button_typography', [])['font-family']) ? get_theme_mod('clotya_button_typography', [])['font-family'] :'';
	$allfont[] = isset(get_theme_mod('clotya_price_typography', [])['font-family']) ? get_theme_mod('clotya_price_typography', [])['font-family'] :'';
	$allfont[] = isset(get_theme_mod('clotya_product_name_typography', [])['font-family']) ? get_theme_mod('clotya_product_name_typography', [])['font-family'] :'';
	$allfont[] = isset(get_theme_mod('clotya_topbar_typography', [])['font-family']) ? get_theme_mod('clotya_topbar_typography', [])['font-family'] :'';
	
	$font_families = array();
	
	
	if(in_array($jost, $allfont) || !array_filter($allfont)) {
		$font_families[] = 'Jost:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900';
	}
	
	if(in_array($jost, $allfont) || !array_filter($allfont)) {
		$query_args = array( 
			'family' => rawurldecode( implode( '&family=', $font_families ) ), 
			'subset' => rawurldecode( 'latin,latin-ext' ), 
		); 
		 
		$fonts_url = add_query_arg( $query_args, '//fonts.googleapis.com/css2' );
	}
	
	return esc_url_raw( $fonts_url );
}

/*************************************************
## Styles and Scripts
*************************************************/ 
define('CLOTYA_INDEX_CSS', 	  get_template_directory_uri()  . '/assets/css');
define('CLOTYA_INDEX_JS', 	  get_template_directory_uri()  . '/assets/js');

function clotya_scripts() {

	if ( is_admin_bar_showing() ) {
		wp_enqueue_style( 'clotya-klbtheme', CLOTYA_INDEX_CSS . '/admin/klbtheme.css', false, CLOTYA_VERSION);    
	}	

	if ( is_singular() ) wp_enqueue_script( 'comment-reply' );

	wp_enqueue_style( 'bootstrap', 				CLOTYA_INDEX_CSS . '/bootstrap.min.css', false, CLOTYA_VERSION);
	wp_enqueue_style( 'clotya-base', 			CLOTYA_INDEX_CSS . '/base.css', false, CLOTYA_VERSION);
	wp_style_add_data( 'clotya-base', 'rtl', 'replace' );
	wp_enqueue_style( 'clotya-font-url',  		clotya_fonts_url(), array(), null );
	wp_enqueue_style( 'clotya-style',         	get_stylesheet_uri() );
	wp_style_add_data( 'clotya-style', 'rtl', 'replace' );

	$mapkey = get_theme_mod('clotya_mapapi');

	if ( !wp_script_is('wc-cart-fragments', 'enqueued' ) && wp_script_is( 'wc-cart-fragments', 'registered' ) ) {
		wp_enqueue_script( 'wc-cart-fragments' );
	}

	wp_enqueue_script( 'imagesloaded');
	wp_enqueue_script( 'bootstrap-bundle',    	     CLOTYA_INDEX_JS . '/bootstrap.bundle.min.js', array('jquery'), CLOTYA_VERSION, true);
	wp_enqueue_script( 'gsap',    	    		     CLOTYA_INDEX_JS . '/vendor/gsap.min.js', array('jquery'), CLOTYA_VERSION, true);
	wp_enqueue_script( 'hover-slider',    	    	 CLOTYA_INDEX_JS . '/vendor/hover-slider.min.js', array('jquery'), CLOTYA_VERSION, true);
	wp_enqueue_script( 'jquery-magnific-popup',      CLOTYA_INDEX_JS . '/vendor/jquery.magnific-popup.min.js', array('jquery'), CLOTYA_VERSION, true);
	wp_enqueue_script( 'owl-carousel',      		 CLOTYA_INDEX_JS . '/vendor/owl.carousel.min.js', array('jquery'), CLOTYA_VERSION, true);
	wp_enqueue_script( 'perfect-scrolllbar',         CLOTYA_INDEX_JS . '/vendor/perfect-scrollbar.min.js', array('jquery'), CLOTYA_VERSION, true);
	wp_enqueue_script( 'theia-sticky-sidebar',       CLOTYA_INDEX_JS . '/vendor/theia-sticky-sidebar.min.js', array('jquery'), CLOTYA_VERSION, true);
	wp_enqueue_script( 'clotya-countdown',        	 CLOTYA_INDEX_JS . '/custom/countdown.js', array('jquery'), CLOTYA_VERSION, true);
	wp_enqueue_script( 'clotya-stickysidebar',       CLOTYA_INDEX_JS . '/custom/stickysidebar.js', array('jquery'), CLOTYA_VERSION, true);
	wp_enqueue_script( 'clotya-hoverslider',         CLOTYA_INDEX_JS . '/custom/hoverslider.js', array('jquery'), CLOTYA_VERSION, true);
	wp_enqueue_script( 'clotya-siteslider',          CLOTYA_INDEX_JS . '/custom/siteslider.js', array('jquery'), CLOTYA_VERSION, true);
	wp_enqueue_script( 'clotya-productquantity',     CLOTYA_INDEX_JS . '/custom/productquantity.js', array('jquery'), CLOTYA_VERSION, true);
	wp_enqueue_script( 'clotya-productshare',     	 CLOTYA_INDEX_JS . '/custom/productshare.js', array('jquery'), CLOTYA_VERSION, true);
	wp_enqueue_script( 'clotya-sidebarfilter',     	 CLOTYA_INDEX_JS . '/custom/sidebarfilter.js', array('jquery'), CLOTYA_VERSION, true);
	wp_enqueue_script( 'clotya-sitescroll',     	 CLOTYA_INDEX_JS . '/custom/sitescroll.js', array('jquery'), CLOTYA_VERSION, true);
	wp_register_script( 'clotya-sizemodal',          CLOTYA_INDEX_JS . '/custom/sizemodal.js', array('jquery'), CLOTYA_VERSION, true);
	wp_register_script( 'clotya-flex-thumbs',        CLOTYA_INDEX_JS . '/custom/flex-thumbs.js', array('jquery'), CLOTYA_VERSION, true);
	wp_register_script( 'clotya-mini-cart-scroll',   CLOTYA_INDEX_JS . '/custom/mini_cart_scroll.js', array('jquery'), CLOTYA_VERSION, true);
	wp_register_script( 'clotya-loginform',   	 	 CLOTYA_INDEX_JS . '/custom/loginform.js', array('jquery'), CLOTYA_VERSION, true);
	wp_register_script( 'clotya-googlemap',          '//maps.googleapis.com/maps/api/js?key='. $mapkey .'', array('jquery'), CLOTYA_VERSION, true);
	wp_enqueue_script( 'clotya-bundle',     	     CLOTYA_INDEX_JS . '/bundle.js', array('jquery'), CLOTYA_VERSION, true);
}
add_action( 'wp_enqueue_scripts', 'clotya_scripts' );

/*************************************************
## Theme Setup
*************************************************/ 

if ( ! isset( $content_width ) ) $content_width = 960;

function clotya_theme_setup() {
	
	add_theme_support( 'title-tag' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'custom-background' );
	add_theme_support( 'post-formats', array('gallery', 'audio', 'video'));
	add_theme_support( 'wc-product-gallery-lightbox' );
	add_theme_support( 'wc-product-gallery-slider' );
	load_theme_textdomain( 'clotya', get_template_directory() . '/languages' );
	remove_theme_support( 'widgets-block-editor' );
}
add_action( 'after_setup_theme', 'clotya_theme_setup' );


/*************************************************
## Include the TGM_Plugin_Activation class.
*************************************************/ 

require_once get_template_directory() . '/includes/class-tgm-plugin-activation.php';

add_action( 'tgmpa_register', 'clotya_register_required_plugins' );

function clotya_register_required_plugins() {

	$url = 'http://klbtheme.com/clotya/plugins/';
	$mainurl = 'http://klbtheme.com/plugins/';

	$plugins = array(
		
        array(
            'name'                  => esc_html__('Meta Box','clotya'),
            'slug'                  => 'meta-box',
        ),

        array(
            'name'                  => esc_html__('Contact Form 7','clotya'),
            'slug'                  => 'contact-form-7',
        ),
		
        array(
            'name'                  => esc_html__('Kirki','clotya'),
            'slug'                  => 'kirki',
        ),
		
		array(
            'name'                  => esc_html__('MailChimp Subscribe','clotya'),
            'slug'                  => 'mailchimp-for-wp',
        ),
		
        array(
            'name'                  => esc_html__('Elementor','clotya'),
            'slug'                  => 'elementor',
            'required'              => true,
        ),
		
        array(
            'name'                  => esc_html__('WooCommerce','clotya'),
            'slug'                  => 'woocommerce',
            'required'              => true,
        ),

        array(
            'name'                  => esc_html__('Clotya Core','clotya'),
            'slug'                  => 'clotya-core',
            'source'                => $url . 'clotya-core.zip',
            'required'              => true,
            'version'               => '1.5.0',
            'force_activation'      => false,
            'force_deactivation'    => false,
            'external_url'          => '',
        ),

        array(
            'name'                  => esc_html__('Envato Market','clotya'),
            'slug'                  => 'envato-market',
            'source'                => $mainurl . 'envato-market.zip',
            'required'              => true,
            'version'               => '2.0.12',
            'force_activation'      => false,
            'force_deactivation'    => false,
            'external_url'          => '',
        ),


	);

	$config = array(
		'id'           => 'clotya',                 // Unique ID for hashing notices for multiple instances of TGMPA.
		'default_path' => '',                      // Default absolute path to bundled plugins.
		'menu'         => 'tgmpa-install-plugins', // Menu slug.
		'parent_slug'  => 'themes.php',            // Parent menu slug.
		'capability'   => 'edit_theme_options',    // Capability needed to view plugin install page, should be a capability associated with the parent menu used.
		'has_notices'  => true,                    // Show admin notices or not.
		'dismissable'  => true,                    // If false, a user cannot dismiss the nag message.
		'dismiss_msg'  => '',                      // If 'dismissable' is false, this message will be output at top of nag.
		'is_automatic' => false,                   // Automatically activate plugins after installation or not.
		'message'      => '',                      // Message to output right before the plugins table.
	);

	tgmpa( $plugins, $config );
}

/*************************************************
## Clotya Register Menu 
*************************************************/

function clotya_register_menus() {
	register_nav_menus( array( 'main-menu' 	   => esc_html__('Primary Navigation Menu','clotya')) );
	
	$toprightmenu = get_theme_mod('clotya_top_right_menu','0');
	$sidebarmenu = get_theme_mod('clotya_header_sidebar','0');
	$footermenu = get_theme_mod('clotya_footer_menu','0');

	if($toprightmenu == '1'){
		register_nav_menus( array( 'top-right-menu'     => esc_html__('Top Right Menu','clotya')) );
	}

	if($sidebarmenu == '1'){
		register_nav_menus( array( 'sidebar-menu'       => esc_html__('Sidebar Menu','clotya')) );
	}
	
	if($footermenu == '1'){
		register_nav_menus( array( 'footer-menu'        => esc_html__('Footer Menu','clotya')) );
	}
}
add_action('init', 'clotya_register_menus');

/*************************************************
## Excerpt More
*************************************************/ 

function clotya_excerpt_more($more) {
  global $post;
  return '<div class="klb-readmore entry-button"><a class="btn link" href="'. esc_url(get_permalink($post->ID)) . '">' . esc_html__('Read More', 'clotya') . ' <i class="klbth-icon-right-arrow"></i></a></div>';
  }
 add_filter('excerpt_more', 'clotya_excerpt_more');
 
/*************************************************
## Word Limiter
*************************************************/ 
function clotya_limit_words($string, $limit) {
	$words = explode(' ', $string);
	return implode(' ', array_slice($words, 0, $limit));
}

/*************************************************
## Widgets
*************************************************/ 

function clotya_widgets_init() {
	register_sidebar( array(
	  'name' => esc_html__( 'Blog Sidebar', 'clotya' ),
	  'id' => 'blog-sidebar',
	  'description'   => esc_html__( 'These are widgets for the Blog page.','clotya' ),
	  'before_widget' => '<div class="widget %2$s">',
	  'after_widget'  => '</div>',
	  'before_title'  => '<h4 class="widget-title">',
	  'after_title'   => '</h4>'
	) );

	register_sidebar( array(
	  'name' => esc_html__( 'Shop Sidebar', 'clotya' ),
	  'id' => 'shop-sidebar',
	  'description'   => esc_html__( 'These are widgets for the Shop.','clotya' ),
	  'before_widget' => '<div class="widget %2$s">',
	  'after_widget'  => '</div>',
	  'before_title'  => '<h4 class="widget-title">',
	  'after_title'   => '</h4>'
	) );

	register_sidebar( array(
	  'name' => esc_html__( 'Footer First Column', 'clotya' ),
	  'id' => 'footer-1',
	  'description'   => esc_html__( 'These are widgets for the Footer.','clotya' ),
	  'before_widget' => '<div class="klbfooterwidget widget %2$s">',
	  'after_widget'  => '</div>',
	  'before_title'  => '<h4 class="widget-title">',
	  'after_title'   => '</h4>'
	) );

	register_sidebar( array(
	  'name' => esc_html__( 'Footer Second Column', 'clotya' ),
	  'id' => 'footer-2',
	  'description'   => esc_html__( 'These are widgets for the Footer.','clotya' ),
	  'before_widget' => '<div class="klbfooterwidget widget %2$s">',
	  'after_widget'  => '</div>',
	  'before_title'  => '<h4 class="widget-title">',
	  'after_title'   => '</h4>'
	) );

	register_sidebar( array(
	  'name' => esc_html__( 'Footer Third Column', 'clotya' ),
	  'id' => 'footer-3',
	  'description'   => esc_html__( 'These are widgets for the Footer.','clotya' ),
	  'before_widget' => '<div class="klbfooterwidget widget %2$s">',
	  'after_widget'  => '</div>',
	  'before_title'  => '<h4 class="widget-title">',
	  'after_title'   => '</h4>'
	) );

	register_sidebar( array(
	  'name' => esc_html__( 'Footer Fourth Column', 'clotya' ),
	  'id' => 'footer-4',
	  'description'   => esc_html__( 'These are widgets for the Footer.','clotya' ),
	  'before_widget' => '<div class="klbfooterwidget widget %2$s">',
	  'after_widget'  => '</div>',
	  'before_title'  => '<h4 class="widget-title">',
	  'after_title'   => '</h4>'
	) );
	
	register_sidebar( array(
	  'name' => esc_html__( 'Footer Fifth Column', 'clotya' ),
	  'id' => 'footer-5',
	  'description'   => esc_html__( 'These are widgets for the Footer.','clotya' ),
	  'before_widget' => '<div class="klbfooterwidget widget %2$s">',
	  'after_widget'  => '</div>',
	  'before_title'  => '<h4 class="widget-title">',
	  'after_title'   => '</h4>'
	) );
}
add_action( 'widgets_init', 'clotya_widgets_init' );
 
/*************************************************
## Clotya Comment
*************************************************/

if ( ! function_exists( 'clotya_comment' ) ) :
 function clotya_comment( $comment, $args, $depth ) {
  $GLOBALS['comment'] = $comment;
  switch ( $comment->comment_type ) :
   case 'pingback' :
   case 'trackback' :
  ?>

   <article class="post pingback">
   <p><?php esc_html_e( 'Pingback:', 'clotya' ); ?> <?php comment_author_link(); ?><?php edit_comment_link( esc_html__( '(Edit)', 'clotya' ), ' ' ); ?></p>
  <?php
    break;
   default :
  ?>
  
	<li <?php comment_class(); ?> id="comment-<?php comment_ID(); ?>">
		<div id="div-comment-<?php comment_ID(); ?>" class="comment-body">
		  <article class="comment-body klb-comment-body">
			  <div class="vcard">
				<img src="<?php echo get_avatar_url( $comment, 90 ); ?>" alt="<?php comment_author(); ?>" class="avatar">
			  </div>
			<div class="comment-right-side comment-meta">
				<div class="comment-author">
				<b class="fn"><a class="url"><?php comment_author(); ?></a></b>
				</div>
				<div class="comment-metadata">
				  <time><?php comment_date(); ?></time>
				</div><!-- comment-metadata -->
			
				<div class="comment-content">
					<div class="klb-post">
						<?php comment_text(); ?>
						<?php if ( $comment->comment_approved == '0' ) : ?>
						<em><?php esc_html_e( 'Your comment is awaiting moderation.', 'clotya' ); ?></em>
						<?php endif; ?>
					</div>
				</div><!-- comment-content -->
				<div class="reply">
				  <?php comment_reply_link( array_merge( $args, array( 'depth' => $depth, 'max_depth' => $args['max_depth'] ) ) ); ?>
				</div><!-- reply -->
			</div><!-- comment-right-side -->

		  </article>
	    </div>
	</li>



  <?php
    break;
  endswitch;
 }
endif;

/*************************************************
## Clotya Widget Count Filter
 *************************************************/

function clotya_cat_count_span($links) {
  $links = str_replace('</a> (', '</a> <span class="catcount">(', $links);
  $links = str_replace(')', ')</span>', $links);
  return clotya_sanitize_data($links);
}
add_filter('wp_list_categories', 'clotya_cat_count_span');
 
function clotya_archive_count_span( $links ) {
	$links = str_replace( '</a>&nbsp;(', '</a><span class="catcount">(', $links );
	$links = str_replace( ')', ')</span>', $links );
	return clotya_sanitize_data($links);
}
add_filter( 'get_archives_link', 'clotya_archive_count_span' );


/*************************************************
## Pingback url auto-discovery header for single posts, pages, or attachments
 *************************************************/
function clotya_pingback_header() {
	if ( is_singular() && pings_open() ) {
		echo '<link rel="pingback" href="', esc_url( get_bloginfo( 'pingback_url' ) ), '">';
	}
}
add_action( 'wp_head', 'clotya_pingback_header' );

/*************************************************
## Nav Description
 *************************************************/
function clotya_nav_description( $item_output, $item, $depth, $args ) {
    if ( !empty( $item->description ) ) {
        $item_output = str_replace( $args->link_after . '</a>', '<span class="menu-item-description">' . $item->description . '</span>' . $args->link_after . '</a>', $item_output );
    }
 
    return clotya_sanitize_data($item_output);
}
add_filter( 'walker_nav_menu_start_el', 'clotya_nav_description', 10, 4 );

/************************************************************
## DATA CONTROL FROM PAGE METABOX OR ELEMENTOR PAGE SETTINGS
*************************************************************/
function clotya_page_settings( $opt_id){
	
	if ( class_exists( '\Elementor\Core\Settings\Manager' ) ) {
		// Get the current post id
		$post_id = get_the_ID();

		// Get the page settings manager
		$page_settings_manager = \Elementor\Core\Settings\Manager::get_settings_managers( 'page' );

		// Get the settings model for current post
		$page_settings_model = $page_settings_manager->get_model( $post_id )->get_data('settings');

		// Retrieve the color we added before
		return isset($page_settings_model['clotya_elementor_'.$opt_id]) ? $page_settings_model['clotya_elementor_'.$opt_id] : false;
	}
}

/************************************************************
## Elementor Register Location
*************************************************************/
function clotya_register_elementor_locations( $elementor_theme_manager ) {

    $elementor_theme_manager->register_location( 'header' );
    $elementor_theme_manager->register_location( 'footer' );
    $elementor_theme_manager->register_location( 'single' );
	$elementor_theme_manager->register_location( 'archive' );

}
add_action( 'elementor/theme/register_locations', 'clotya_register_elementor_locations' );

/************************************************************
## Elementor Get Templates
*************************************************************/
function clotya_get_elementor_template($template_id){
	if($template_id){

	    $frontend = new \Elementor\Frontend;
	    printf( '<div class="clotya-elementor-template template-'.esc_attr($template_id).'">%1$s</div>', $frontend->get_builder_content_for_display( $template_id, true ) );
	
	    if ( class_exists( '\Elementor\Plugin' ) ) {
	        $elementor = \Elementor\Plugin::instance();
	        $elementor->frontend->enqueue_styles();
			$elementor->frontend->enqueue_scripts();
	    }
	
	    if ( class_exists( '\ElementorPro\Plugin' ) ) {
	        $elementor_pro = \ElementorPro\Plugin::instance();

	    }

	}

}
add_action( 'clotya_before_main_shop', 'clotya_get_elementor_template', 10);
add_action( 'clotya_after_main_shop', 'clotya_get_elementor_template', 10);
add_action( 'clotya_before_main_footer', 'clotya_get_elementor_template', 10);
add_action( 'clotya_after_main_footer', 'clotya_get_elementor_template', 10);
add_action( 'clotya_before_main_header', 'clotya_get_elementor_template', 10);
add_action( 'clotya_after_main_header', 'clotya_get_elementor_template', 10);

/************************************************************
## Do Action for Templates and Product Categories
*************************************************************/
function clotya_do_action($hook){
	
	if ( !class_exists( 'woocommerce' ) ) {
		return;
	}

	$categorytemplate = get_theme_mod('clotya_elementor_template_each_shop_category');
	if(is_product_category()){
		if($categorytemplate && array_search(get_queried_object()->term_id, array_column($categorytemplate, 'category_id')) !== false){
			foreach($categorytemplate as $c){
				if($c['category_id'] == get_queried_object()->term_id){
					do_action( $hook, $c[$hook.'_elementor_template_category']);
				}
			}
		} else {
			do_action( $hook, get_theme_mod($hook.'_elementor_template'));
		}
	} else {
		do_action( $hook, get_theme_mod($hook.'_elementor_template'));
	}
	
}

/*************************************************
## Clotya Get Image
*************************************************/
function clotya_get_image($image){
	$app_image = ! wp_attachment_is_image($image) ? $image : wp_get_attachment_url($image);
	
	return esc_html($app_image);
}

/*************************************************
## Clotya Get options
*************************************************/
function clotya_get_option(){	
	$getopt  = isset( $_GET['opt'] ) ? $_GET['opt'] : '';

	return esc_html($getopt);
}

/*************************************************
## Blonwe Custom 404 Page
*************************************************/ 
if ( ! function_exists( 'clotya_custom_404_page' ) ) {
	function clotya_custom_404_page( $template ) {
		global $wp_query;
		$custom_404 = get_theme_mod('clotya_404_page');

		if ( $custom_404 === 'default' || empty( $custom_404 ) ) {
			return $template;
		}

		$wp_query->query( 'page_id=' . $custom_404 );
		$wp_query->the_post();
		$template = get_page_template();
		rewind_posts();

		return $template;
	}

	add_filter( '404_template', 'clotya_custom_404_page', 999 );
}


/*************************************************
## Clotya Subscribe Form
*************************************************/ 
if ( ! function_exists( 'clotya_subscribe_form' ) ) {
	function clotya_subscribe_form($formid = '') {
		echo do_shortcode('[mc4wp_form id="'.$formid.'"]');
	}
}	

/*************************************************
## Blonwe FT
*************************************************/ 
if ( ! function_exists( 'clotya_ft' ) ) {
	function clotya_ft() {
		return;
	}
}

/*************************************************
## Clotya Theme options
*************************************************/

	require_once get_template_directory() . '/includes/metaboxes.php';
	require_once get_template_directory() . '/includes/woocommerce.php';
	require_once get_template_directory() . '/includes/woocommerce-filter.php';
	require_once get_template_directory() . '/includes/pjax/filter-functions.php';
	require_once get_template_directory() . '/includes/sanitize.php';
	require_once get_template_directory() . '/includes/merlin/theme-register.php';
	require_once get_template_directory() . '/includes/merlin/setup-wizard.php';
	require_once get_template_directory() . '/includes/header/main-header.php';
	require_once get_template_directory() . '/includes/footer/main_footer.php';
	require_once get_template_directory() . '/includes/woocommerce/tab-ajax.php';
