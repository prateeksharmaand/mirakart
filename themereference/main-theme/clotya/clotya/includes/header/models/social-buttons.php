<?php
if ( ! function_exists( 'clotya_header_social_buttons' ) ) {
	function clotya_header_social_buttons(){
		$headersocial = get_theme_mod('clotya_header_social_toggle','0'); 
		if($headersocial == '1'){ ?>
	
            <div class="social-buttons dropdown show">
              <a href="#" class="dropdown-toggle" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i class="klbth-icon-instagram"></i>
                <span><?php echo esc_html(get_theme_mod('clotya_header_social_title')); ?></span>
              </a>
              <div class="dropdown-menu">
                <div class="social-holder">
				  <?php $sociallist = get_theme_mod('clotya_header_social_list'); ?>
				  <?php if($sociallist){ ?>
				  
                  <ul>
				    <?php foreach($sociallist as $s){ ?>
                    <li><a href="<?php echo esc_url($s['social_url']); ?>" class="facebook"><i class="klbth-icon-<?php echo esc_attr($s['social_icon']); ?>"></i><span class="label"><?php echo esc_html($s['social_text']); ?></span></a></li>
					<?php } ?>
                  </ul>
				  <?php } ?>
                  <div class="social-description">
                    <p><?php echo esc_html(get_theme_mod('clotya_header_social_content')); ?></p>
                  </div><!-- social-description -->
                </div><!-- social-holder -->
              </div><!-- dropdown-menu -->
            </div><!-- social-buttons -->

		<?php  }
	}
}